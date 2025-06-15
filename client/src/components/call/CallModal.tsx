import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useJitsi } from './useJitsi'
import VideoTile from './VideoTile'
import { useTranslations } from '@/hooks/use-translations'

interface Props {
  roomId: string
  isOpen: boolean
  onClose: () => void
}

export default function CallModal({ roomId, isOpen, onClose }: Props) {
  const { startCall, endCall, localTracks, remoteTracks, status } = useJitsi(roomId)
  const { t } = useTranslations()

  useEffect(() => {
    if (isOpen) startCall()
    return () => endCall()
  }, [isOpen, startCall, endCall])

  const videoTracks = [...localTracks, ...Object.values(remoteTracks).flat()]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('call.in_call')}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 h-64">
          {videoTracks.map((tr, idx) => (
            <VideoTile key={idx} track={tr} type={tr.getType?.() || 'video'} />
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <Button onClick={() => localTracks[0]?.isMuted() ? localTracks[0].unmute() : localTracks[0].mute()}>
            {t('call.toggleMic')}
          </Button>
          <Button variant="destructive" onClick={onClose}>{t('call.leave')}</Button>
        </div>
        <div className="text-center text-sm mt-2">{status}</div>
      </DialogContent>
    </Dialog>
  )
}
