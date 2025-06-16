import { useEffect, useRef, useState } from 'react'
import { useTranslations } from '@/hooks/use-translations'

interface Props {
  room: string
  displayName: string
}

export default function VideoCall({ room, displayName }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [api, setApi] = useState<any>(null)
  const { t } = useTranslations()

  useEffect(() => {
    // динамически загружаем скрипт Jitsi при необходимости
    if (!document.getElementById('jitsi-script')) {
      const s = document.createElement('script')
      s.id = 'jitsi-script'
      s.src = 'https://meet.jit.si/external_api.js'
      s.async = true
      s.onload = () => init()
      document.body.appendChild(s)
    } else init()

    function init() {
      if (api || !ref.current) return
      const _api = new (window as any).JitsiMeetExternalAPI('meet.jit.si', {
        roomName: room,
        parentNode: ref.current,
        height: 500,
        interfaceConfigOverwrite: { TOOLBAR_BUTTONS: [] },
        userInfo: { displayName }
      })
      setApi(_api)
    }

    return () => {
      api && api.dispose()
    }
  }, [api, room, displayName])

  return (
    <section>
      <div ref={ref} />
      <footer style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => api?.executeCommand('toggleAudio')}>
          {t('call.muteToggle')}
        </button>
        <button onClick={() => api?.executeCommand('hangup')}>
          {t('call.leave')}
        </button>
      </footer>
    </section>
  )
}
