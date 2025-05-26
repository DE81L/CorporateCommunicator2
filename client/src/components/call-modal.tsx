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
import { PhoneOffIcon, UserIcon } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
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
  const { t } = useTranslations();
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setCallDuration((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

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

          <Button
            variant="destructive"
            size="icon"
            className="rounded-full mt-6"
            onClick={onClose}
          >
            <PhoneOffIcon className="h-5 w-5" />
          </Button>
        </div>

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
        <DialogFooter>
          <Button variant="destructive" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

