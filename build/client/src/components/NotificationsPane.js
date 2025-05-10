"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsPane = NotificationsPane;
const dialog_1 = require("@/components/ui/dialog");
const sheet_1 = require("@/components/ui/sheet");
const use_mobile_1 = require("@/hooks/use-mobile");
function NotificationsPane({ open, onOpenChange, }) {
    const isMobile = (0, use_mobile_1.useIsMobile)();
    if (isMobile) {
        return (<dialog_1.Dialog open={open} onOpenChange={onOpenChange}>
        <dialog_1.DialogContent>
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>Notifications</dialog_1.DialogTitle>
            <dialog_1.DialogDescription>
              No notifications yet.
            </dialog_1.DialogDescription>
          </dialog_1.DialogHeader>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>);
    }
    else {
        return (<sheet_1.Sheet open={open} onOpenChange={onOpenChange}>
        <sheet_1.SheetContent side="right">
          <sheet_1.SheetHeader>
            <sheet_1.SheetTitle>Notifications</sheet_1.SheetTitle>
            <sheet_1.SheetDescription>
              No notifications yet.
            </sheet_1.SheetDescription>
          </sheet_1.SheetHeader>
        </sheet_1.SheetContent>
      </sheet_1.Sheet>);
    }
}
