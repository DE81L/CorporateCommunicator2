import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogFooter, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import { MicOffIcon, VideoOffIcon, PhoneOffIcon, UserIcon } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
export default function CallModal({ isOpen, onClose, callType, recipient, }) {
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const { t } = useTranslations();
    // Start call timer when modal opens
    useEffect(() => {
        if (!isOpen) {
            setCallDuration(0);
            return;
        }
        const timer = setInterval(() => {
            setCallDuration((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen]);
    // Format call duration as MM:SS
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };
    // Get initials for avatar
    const getInitials = (name) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "sm:max-w-md p-0 overflow-hidden bg-primary-800 text-white border-none", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { children: [t(`call.${callType}`), " ", t("call.in_progress")] }) }), _jsxs("div", { className: "p-6 text-center", children: [_jsx(Avatar, { className: "h-24 w-24 mx-auto bg-primary-700", children: recipient.avatarUrl ? (_jsx(AvatarImage, { src: recipient.avatarUrl, alt: recipient.name })) : (_jsx(AvatarFallback, { className: "text-3xl", children: getInitials(recipient.name) })) }), _jsx("h3", { className: "text-xl font-medium mt-4", children: recipient.name }), _jsxs("p", { className: "text-primary-300", children: [callType === "video" ? "Video call" : "Voice call", " in progress..."] }), _jsxs("div", { className: "mt-8 flex justify-center space-x-4", children: [_jsx(Button, { variant: "outline", size: "icon", className: "rounded-full bg-primary-700 border-primary-600 hover:bg-primary-600", onClick: () => setIsMuted(!isMuted), children: isMuted ? (_jsx(MicOffIcon, { className: "h-5 w-5" })) : (_jsx("span", { className: "material-icons", children: "mic" })) }), callType === "video" && (_jsx(Button, { variant: "outline", size: "icon", className: "rounded-full bg-primary-700 border-primary-600 hover:bg-primary-600", onClick: () => setIsVideoOff(!isVideoOff), children: isVideoOff ? (_jsx(VideoOffIcon, { className: "h-5 w-5" })) : (_jsx("span", { className: "material-icons", children: "videocam" })) })), _jsx(Button, { variant: "destructive", size: "icon", className: "rounded-full", onClick: onClose, children: _jsx(PhoneOffIcon, { className: "h-5 w-5" }) })] }), _jsx("p", { className: "text-primary-300 mt-6", children: formatDuration(callDuration) })] }), callType === "video" && !isVideoOff && (_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-full h-40 bg-primary-900 flex items-center justify-center", children: _jsx(UserIcon, { className: "h-12 w-12 text-primary-700" }) }), _jsx("div", { className: "absolute bottom-2 right-2 w-20 h-20 bg-primary-700 rounded border border-primary-600 flex items-center justify-center", children: _jsx(UserIcon, { className: "h-8 w-8 text-primary-500" }) })] })), _jsx(DialogFooter, { children: _jsx(Button, { variant: "destructive", onClick: onClose, children: t("common.cancel") }) })] }) }));
}
