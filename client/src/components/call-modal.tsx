import { useEffect, useState, useRef } from "react";
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
import { MicOffIcon, VideoOffIcon, PhoneOffIcon, UserIcon } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useSettings } from "@/context/SettingsContext";
import { useCallConnection } from "@/hooks/useCallConnection";
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
  incomingSignal?: any;
}

export default function CallModal({
  isOpen,
  onClose,
  callType,
  recipient,
  incomingSignal: initialSignal,
}: CallModalProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const { t } = useTranslations();
  const { user } = useAuth();
  const { sendRaw, lastRawMessage } = useWebSocket();
  const { audioInputId } = useSettings();
  const [incomingSignal, setIncomingSignal] = useState<any>(initialSignal);
  useEffect(() => {
    if (initialSignal) setIncomingSignal(initialSignal);
  }, [initialSignal]);
  useEffect(() => {
    (window as any).__CALL_TYPE = callType;
    return () => {
      delete (window as any).__CALL_TYPE;
    };
  }, [callType]);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [stage, setStage] = useState<'calling' | 'connecting' | 'connected' | 'in_call'>('calling');

  const isInitiator = user && recipient ? user.id < recipient.id : false;
  const { status, localStream, remoteStream } = useCallConnection(
    isInitiator,
    (signal) =>
      sendRaw({ type: "p2p-signal", payload: { to: recipient.id, signal } }),
    incomingSignal,
    audioInputId
  );

  useEffect(() => {
    if (status === 'init') setStage('calling');
    else if (status === 'connecting') setStage('connecting');
    else if (status === 'open') {
      setStage('connected');
      const t = setTimeout(() => setStage('in_call'), 1000);
      return () => clearTimeout(t);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'closed' || status === 'error') {
      onClose();
    }
  }, [status, onClose]);

  useEffect(() => {
    if (
      lastRawMessage?.type === "p2p-signal" &&
      (lastRawMessage as any).payload.from === recipient.id
    ) {
      setIncomingSignal((lastRawMessage as any).payload.signal);
    }
  }, [lastRawMessage, recipient]);

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(() => {});
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !isMuted));
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      localStream.getVideoTracks().forEach((t) => (t.enabled = !isVideoOff));
    }
  }, [isMuted, isVideoOff, localStream]);

  // Запускаем таймер, когда звонок активен
  useEffect(() => {
    if (stage !== 'in_call') {
      setCallDuration(0);
      return;
    }

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-primary-800 text-white border-none">
        <DialogHeader>
          <DialogTitle>
            {t(`call.${callType}`)} {t(`call.${stage}`)}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t(`call.${stage}`)}
          </DialogDescription>
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
          <p className="text-primary-300">{t(`call.${stage}`)}</p>

          <div className="mt-8 flex justify-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-primary-700 border-primary-600 hover:bg-primary-600"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <MicOffIcon className="h-5 w-5" />
              ) : (
                <span className="material-icons">mic</span>
              )}
            </Button>

            {callType === "video" && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-primary-700 border-primary-600 hover:bg-primary-600"
                onClick={() => setIsVideoOff(!isVideoOff)}
              >
                {isVideoOff ? (
                  <VideoOffIcon className="h-5 w-5" />
                ) : (
                  <span className="material-icons">videocam</span>
                )}
              </Button>
            )}

            <Button
              variant="destructive"
              size="icon"
              className="rounded-full"
              onClick={onClose}
            >
              <PhoneOffIcon className="h-5 w-5" />
            </Button>
          </div>

          {stage === 'in_call' && (
            <p className="text-primary-300 mt-6">{formatDuration(callDuration)}</p>
          )}
          <audio ref={audioRef} className="hidden" />
        </div>

        {stage === 'in_call' && (
          <JitsiFrame
            roomName={`cc2-${[user?.id, recipient.id].sort().join('-')}`}
            userName={
              user
                ? [user.firstName, user.lastName]
                    .filter(Boolean)
                    .join(' ') || user.username
                : undefined
            }
            video={callType === 'video'}
          />
        )}
        <DialogFooter>
          <Button variant="destructive" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

