import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MicOffIcon, VideoOffIcon, PhoneOffIcon, UserIcon } from "lucide-react";

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType: "video" | "audio";
  recipient: {
    id: number;
    name: string;
  };
}

export default function CallModal({ isOpen, onClose, callType, recipient }: CallModalProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Start call timer when modal opens
  useEffect(() => {
    if (!isOpen) {
      setCallDuration(0);
      return;
    }

    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Format call duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-primary-800 text-white border-none">
        <div className="p-6 text-center">
          <Avatar className="h-24 w-24 mx-auto bg-primary-700">
            <AvatarFallback className="text-3xl">
              <UserIcon className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          
          <h3 className="text-xl font-medium mt-4">{recipient.name}</h3>
          <p className="text-primary-300">{callType === 'video' ? 'Video call' : 'Voice call'} in progress...</p>
          
          <div className="mt-8 flex justify-center space-x-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full bg-primary-700 border-primary-600 hover:bg-primary-600"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOffIcon className="h-5 w-5" /> : <span className="material-icons">mic</span>}
            </Button>
            
            {callType === 'video' && (
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-primary-700 border-primary-600 hover:bg-primary-600"
                onClick={() => setIsVideoOff(!isVideoOff)}
              >
                {isVideoOff ? <VideoOffIcon className="h-5 w-5" /> : <span className="material-icons">videocam</span>}
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
          
          <p className="text-primary-300 mt-6">{formatDuration(callDuration)}</p>
        </div>

        {/* Video placeholder - in a real app this would connect to WebRTC */}
        {callType === 'video' && !isVideoOff && (
          <div className="relative">
            <div className="w-full h-40 bg-primary-900 flex items-center justify-center">
              <UserIcon className="h-12 w-12 text-primary-700" />
            </div>
            <div className="absolute bottom-2 right-2 w-20 h-20 bg-primary-700 rounded border border-primary-600 flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-primary-500" />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
