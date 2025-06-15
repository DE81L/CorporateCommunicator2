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
import { useTranslations } from "@/hooks/use-translations";
import { useEffect, useRef } from "react";
import { Ringtone } from "@/lib/ringtone";

interface Props {
  isOpen: boolean;
  incoming: boolean;
  callType: "video" | "audio";
  participant: { name: string; avatarUrl?: string };
  onAccept?: () => void;
  onDecline: () => void;
}

export default function CallRequestDialog({
  isOpen,
  incoming,
  callType,
  participant,
  onAccept,
  onDecline,
}: Props) {
  const { t } = useTranslations();

  const ringRef = useRef<Ringtone | null>(null);

  useEffect(() => {
    if (!(isOpen && incoming)) return;
    ringRef.current = new Ringtone();
    ringRef.current.start();
    return () => {
      ringRef.current?.dispose();
      ringRef.current = null;
    };
  }, [isOpen, incoming]);

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
    <Dialog open={isOpen} onOpenChange={onDecline}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-primary-800 text-white border-none">
        <DialogHeader>
          <DialogTitle>
            {incoming ? t("call.incoming") : t(`call.${callType}`)} {t("call.calling")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {incoming ? t("call.incoming") : t("call.calling")}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 text-center">
          <Avatar className="h-24 w-24 mx-auto bg-primary-700">
            {participant.avatarUrl ? (
              <AvatarImage src={participant.avatarUrl} alt={participant.name} />
            ) : (
              <AvatarFallback className="text-3xl">{getInitials(participant.name)}</AvatarFallback>
            )}
          </Avatar>
          <h3 className="text-xl font-medium mt-4">{participant.name}</h3>
          {incoming ? (
            <div className="mt-8 flex justify-center space-x-4">
              <Button onClick={onAccept}>{t("call.accept")}</Button>
              <Button variant="destructive" onClick={onDecline}>
                {t("call.decline")}
              </Button>
            </div>
          ) : (
            <div className="mt-8 flex justify-center">
              <Button variant="destructive" onClick={onDecline}>
                {t("common.cancel")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

