"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CallModal;
const react_1 = require("react");
const dialog_1 = require("@/components/ui/dialog");
const button_1 = require("@/components/ui/button");
const avatar_1 = require("@/components/ui/avatar");
const dialog_2 = require("@/components/ui/dialog");
const lucide_react_1 = require("lucide-react");
const use_translations_1 = require("@/hooks/use-translations");
function CallModal({ isOpen, onClose, callType, recipient, }) {
    const [callDuration, setCallDuration] = (0, react_1.useState)(0);
    const [isMuted, setIsMuted] = (0, react_1.useState)(false);
    const [isVideoOff, setIsVideoOff] = (0, react_1.useState)(false);
    const { t } = (0, use_translations_1.useTranslations)();
    // Start call timer when modal opens
    (0, react_1.useEffect)(() => {
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
    return (<dialog_2.Dialog open={isOpen} onOpenChange={onClose}>
      <dialog_1.DialogContent className="sm:max-w-md p-0 overflow-hidden bg-primary-800 text-white border-none">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle> 
            {t(`call.${callType}`)} {t("call.in_progress")}
          </dialog_1.DialogTitle>
        </dialog_1.DialogHeader>
        <div className="p-6 text-center">
          <avatar_1.Avatar className="h-24 w-24 mx-auto bg-primary-700">
            {recipient.avatarUrl ? (<avatar_1.AvatarImage src={recipient.avatarUrl} alt={recipient.name}/>) : (<avatar_1.AvatarFallback className="text-3xl">
                {getInitials(recipient.name)}
              </avatar_1.AvatarFallback>)}
          </avatar_1.Avatar>

          <h3 className="text-xl font-medium mt-4">{recipient.name}</h3>
          <p className="text-primary-300">
            {callType === "video" ? "Video call" : "Voice call"} in progress...
          </p>

          <div className="mt-8 flex justify-center space-x-4">
            <button_1.Button variant="outline" size="icon" className="rounded-full bg-primary-700 border-primary-600 hover:bg-primary-600" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? (<lucide_react_1.MicOffIcon className="h-5 w-5"/>) : (<span className="material-icons">mic</span>)}
            </button_1.Button>

            {callType === "video" && (<button_1.Button variant="outline" size="icon" className="rounded-full bg-primary-700 border-primary-600 hover:bg-primary-600" onClick={() => setIsVideoOff(!isVideoOff)}>
                {isVideoOff ? (<lucide_react_1.VideoOffIcon className="h-5 w-5"/>) : (<span className="material-icons">videocam</span>)}
              </button_1.Button>)}

            <button_1.Button variant="destructive" size="icon" className="rounded-full" onClick={onClose}>
              <lucide_react_1.PhoneOffIcon className="h-5 w-5"/>
            </button_1.Button>
          </div>

          <p className="text-primary-300 mt-6">
            {formatDuration(callDuration)}
          </p>
        </div>

        {/* Video placeholder - in a real app this would connect to WebRTC */}
        {callType === "video" && !isVideoOff && (<div className="relative">
            <div className="w-full h-40 bg-primary-900 flex items-center justify-center">
              <lucide_react_1.UserIcon className="h-12 w-12 text-primary-700"/>
            </div>
            <div className="absolute bottom-2 right-2 w-20 h-20 bg-primary-700 rounded border border-primary-600 flex items-center justify-center">
              <lucide_react_1.UserIcon className="h-8 w-8 text-primary-500"/>
            </div>
          </div>)}
        <dialog_1.DialogFooter>
          <button_1.Button variant="destructive" onClick={onClose}>
            {t("common.cancel")}
          </button_1.Button>
        </dialog_1.DialogFooter>
      </dialog_1.DialogContent>
    </dialog_2.Dialog>);
}
