import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface NotificationsPaneProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsPane({
  open,
  onOpenChange,
}: NotificationsPaneProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>
              No notifications yet.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  } else {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>
              No notifications yet.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }
}