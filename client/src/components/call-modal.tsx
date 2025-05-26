import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PhoneOffIcon,
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  ScreenShareIcon,
  ScreenShareOffIcon,
} from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { createApiClient } from "@/lib/api-client";
import { showError } from "@/lib/error-toast";
import JitsiFrame from "./jitsi-frame";

export type TranslationKey =
  | "call.video"
  | "call.audio"
  | "call.calling"
  | "call.connecting"
  | "call.connected"
  | "call.in_call"
  | "common.cancel";

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType: "video" | "audio";
  recipient: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
}

export default function CallModal({
  isOpen,
  onClose,
  callType,
  recipient,
}: CallModalProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [roomName, setRoomName] = useState('');
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(callType !== 'video');
  const [screenSharing, setScreenSharing] = useState(false);
  const [callLogId, setCallLogId] = useState<number | null>(null);
  const { t } = useTranslations();
  const { user } = useAuth();
  const apiClient = createApiClient();
  const startLog = async () => {
    try {
      const data = await apiClient.request<{ id: number }>('/call-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calleeId: recipient.id, callType }),
      });
      setCallLogId(data?.id ?? null);
    } catch (err) {
      showError(err, 'Failed to log call start');
    }
  };

  const endLog = async () => {
    if (!callLogId) return;
    try {
      await apiClient.request(`/call-logs/${callLogId}/end`, { method: 'POST' });
    } catch (err) {
      showError(err, 'Failed to log call end');
    } finally {
      setCallLogId(null);
    }
  };
  const handleHangup = () => {
    jitsiApi?.executeCommand('hangup');
    endLog();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const random = Math.random().toString(36).slice(2, 10);
    setRoomName(`cc2-${[user?.id, recipient.id].sort().join('-')}-${random}`);
    const timer = setInterval(() => setCallDuration((p) => p + 1), 1000);
    startLog();
    return () => clearInterval(timer);
  }, [isOpen, user?.id, recipient.id]);

  useEffect(() => {
    if (!jitsiApi) return;
    const handleAudio = (e: any) => setAudioMuted(e.muted);
    const handleVideo = (e: any) => setVideoMuted(e.muted);
    const handleScreen = (e: any) => setScreenSharing(e.on);
    jitsiApi.addEventListener('audioMuteStatusChanged', handleAudio);
    jitsiApi.addEventListener('videoMuteStatusChanged', handleVideo);
    jitsiApi.addEventListener('screenSharingStatusChanged', handleScreen);
    return () => {
      jitsiApi.removeEventListener('audioMuteStatusChanged', handleAudio);
      jitsiApi.removeEventListener('videoMuteStatusChanged', handleVideo);
      jitsiApi.removeEventListener('screenSharingStatusChanged', handleScreen);
    };
  }, [jitsiApi]);

  useEffect(() => {
    return () => {
      endLog();
    };
  }, []);

  // Форматируем длительность звонка как ММ:СС
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Получаем инициалы для аватара
  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleHangup}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-primary-800 text-white border-none">
        <DialogHeader>
          <DialogTitle>{t(`call.${callType}`)}</DialogTitle>
        </DialogHeader>
        <div className="p-6 text-center">
          <Avatar className="h-24 w-24 mx-auto bg-primary-700">
            {recipient.avatarUrl ? (
              <AvatarImage src={recipient.avatarUrl} alt={recipient.name} />
            ) : (
              <AvatarFallback className="text-3xl">
                {getInitials(recipient.name)}
              </AvatarFallback>
            )}
          </Avatar>

          <h3 className="text-xl font-medium mt-4">{recipient.name}</h3>
          <p className="text-primary-300 mt-2">
            {formatDuration(callDuration)}
          </p>

        </div>

        <JitsiFrame
          roomName={roomName}
          userName={
            user
              ? [user.firstName, user.lastName]
                  .filter(Boolean)
                  .join(' ') || user.username
              : undefined
          }
          video={callType === 'video'}
          onApiReady={setJitsiApi}
          interfaceConfig={{ DEFAULT_REMOTE_DISPLAY_NAME: recipient.name }}
        />
        <div className="flex justify-center space-x-4 my-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => jitsiApi?.executeCommand('toggleAudio')}
          >
            {audioMuted ? (
              <MicOffIcon className="h-5 w-5" />
            ) : (
              <MicIcon className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => jitsiApi?.executeCommand('toggleVideo')}
          >
            {videoMuted ? (
              <VideoOffIcon className="h-5 w-5" />
            ) : (
              <VideoIcon className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => jitsiApi?.executeCommand('toggleShareScreen')}
          >
            {screenSharing ? (
              <ScreenShareOffIcon className="h-5 w-5" />
            ) : (
              <ScreenShareIcon className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleHangup}
          >
            <PhoneOffIcon className="h-5 w-5" />
          </Button>
        </div>
        <DialogFooter>
          <Button variant="destructive" onClick={handleHangup}>
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

