import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
export function NotificationsPane({ open, onOpenChange, }) {
    const isMobile = useIsMobile();
    if (isMobile) {
        return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsx(DialogContent, { children: _jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Notifications" }), _jsx(DialogDescription, { children: "No notifications yet." })] }) }) }));
    }
    else {
        return (_jsx(Sheet, { open: open, onOpenChange: onOpenChange, children: _jsx(SheetContent, { side: "right", children: _jsxs(SheetHeader, { children: [_jsx(SheetTitle, { children: "Notifications" }), _jsx(SheetDescription, { children: "No notifications yet." })] }) }) }));
    }
}
