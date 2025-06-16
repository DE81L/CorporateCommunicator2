import { useCallback, useEffect, useRef, useState } from 'react'

export type JitsiStatus = 'idle' | 'connecting' | 'connected'

/** Загружаем lib-jitsi-meet с хоста Jitsi */
async function loadJitsi(domain: string): Promise<void> {
  if ((window as any).JitsiMeetJS) return
  if ((window as any).__jitsiLoading) return (window as any).__jitsiLoading
  ;(window as any).__jitsiLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://${domain}/libs/lib-jitsi-meet.min.js`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('lib-jitsi-meet load failed'))
    document.body.appendChild(script)
  })
  return (window as any).__jitsiLoading
}

export function useJitsi(roomId: string) {
  const [status, setStatus] = useState<JitsiStatus>('idle')
  const connectionRef = useRef<any>(null)
  const conferenceRef = useRef<any>(null)
  const localTracksRef = useRef<any[]>([])
  const remoteTracksRef = useRef<Record<string, any[]>>({})
  const [localTracks, setLocalTracks] = useState<any[]>([])
  const [remoteTracks, setRemoteTracks] = useState<Record<string, any[]>>({})
  const [participants, setParticipants] = useState<string[]>([])

  const domain = import.meta.env.VITE_JITSI_DOMAIN || 'meet.local.company'

  const startCall = useCallback(async () => {
    setStatus('connecting')
    await loadJitsi(domain)
    const JitsiMeetJS = (window as any).JitsiMeetJS
    JitsiMeetJS.init()
    const connection = new JitsiMeetJS.JitsiConnection(null, null, {
      hosts: { domain, muc: `conference.${domain}` },
      serviceUrl: `wss://${domain}/xmpp-websocket`,
      clientNode: 'https://jitsi.org/jitsi-meet'
    })
    connectionRef.current = connection
    connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      onConnected
    )
    connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_FAILED,
      onConnectFailed
    )
    connection.connect()

    async function onConnected() {
      const conf = connection.initJitsiConference(roomId, {
        p2p: { enabled: false }
      })
      conferenceRef.current = conf
      conf.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack)
      // участник подключился
      conf.on(JitsiMeetJS.events.conference.USER_JOINED, (id: string) => {
        setParticipants(p => [...p, id])
      })
      // участник вышел
      conf.on(JitsiMeetJS.events.conference.USER_LEFT, (id: string) => {
        setParticipants(p => p.filter(pid => pid !== id))
        setRemoteTracks(t => {
          const copy = { ...t }
          delete copy[id]
          return copy
        })
      })
      const tracks = await JitsiMeetJS.createLocalTracks({ devices: ['audio', 'video'] })
      localTracksRef.current = tracks
      setLocalTracks(tracks)
      tracks.forEach((track: any) => conf.addTrack(track))
      conf.join()
      setStatus('connected')
    }

    function onConnectFailed() {
      setStatus('idle')
    }

    function onRemoteTrack(track: any) {
      if (track.isLocal()) return
      const id = track.getParticipantId()
      remoteTracksRef.current[id] = remoteTracksRef.current[id] || []
      remoteTracksRef.current[id].push(track)
      setRemoteTracks({ ...remoteTracksRef.current })
    }
  }, [domain, roomId])

  const endCall = useCallback(() => {
    conferenceRef.current?.leave()
    connectionRef.current?.disconnect()
    localTracksRef.current.forEach(t => t.dispose())
    localTracksRef.current = []
    remoteTracksRef.current = {}
    setLocalTracks([])
    setRemoteTracks({})
    setParticipants([])
    setStatus('idle')
  }, [])

  useEffect(() => () => endCall(), [endCall])

  return { startCall, endCall, localTracks, remoteTracks, participants, status }
}

export default useJitsi
