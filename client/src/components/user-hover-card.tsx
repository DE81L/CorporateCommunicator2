import { ReactNode } from 'react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone } from 'lucide-react';

export interface MiniProfileUser {
  firstName: string;
  lastName: string;
  email?: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  isonline?: boolean | number;
}

interface Props {
  user: MiniProfileUser;
  onMessage?: () => void;
  onCall?: () => void;
  children: ReactNode;
}

export default function UserHoverCard({ user, onMessage, onCall, children }: Props) {
  const initials = `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase();
  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-60">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <AvatarFallback>{initials}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">
              {user.firstName} {user.lastName}
            </p>
            {user.jobTitle && <p className="text-xs text-gray-500 truncate">{user.jobTitle}</p>}
            {user.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
            {user.isonline !== undefined && (
              <p className="text-xs mt-1">
                {user.isonline ? 'Online' : 'Offline'}
              </p>
            )}
          </div>
        </div>
        {(onMessage || onCall) && (
          <div className="mt-2 flex gap-2">
            {onMessage && (
              <Button size="sm" onClick={onMessage}>
                <MessageSquare className="h-4 w-4 mr-1" />
                Message
              </Button>
            )}
            {onCall && (
              <Button size="sm" onClick={onCall}>
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
            )}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
