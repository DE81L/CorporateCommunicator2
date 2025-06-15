import { useEffect, useRef } from 'react'

interface Props {
  track: any
  type: 'video' | 'audio'
}

export default function VideoTile({ track, type }: Props) {
  const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null)

  useEffect(() => {
    if (!track || !ref.current) return
    track.attach(ref.current)
    return () => {
      try {
        track.detach(ref.current)
      } catch {}
    }
  }, [track])

  if (type === 'video') {
    return <video ref={ref} autoPlay playsInline className="w-full h-full" />
  }
  return <audio ref={ref} autoPlay />
}
