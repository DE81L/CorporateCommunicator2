import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

export interface MessageStatusProps {
  status?: 'pending' | 'delivered' | 'read' | 'p2p';
  transport?: 'server' | 'p2p';
  synced?: boolean;
  error?: boolean;
}

export function MessageStatusDot({ status, transport, synced, error }: MessageStatusProps) {
  const { t } = useTranslation();

  let color = 'bg-gray-400';
  let key: 'pending' | 'p2p' | 'delivered' | 'read' | 'error' = 'delivered';

  if (error) {
    color = 'bg-red-500';
    key = 'error';
  } else if (!synced || status === 'pending') {
    color = 'bg-yellow-500';
    key = 'pending';
  } else if (transport === 'p2p') {
    color = 'bg-blue-500';
    key = 'p2p';
  } else if (status === 'read') {
    color = 'bg-green-500';
    key = 'read';
  }

  const legend = [
    { color: 'bg-yellow-500', key: 'pending' },
    { color: 'bg-blue-500', key: 'p2p' },
    { color: 'bg-gray-400', key: 'delivered' },
    { color: 'bg-green-500', key: 'read' },
    { color: 'bg-red-500', key: 'error' },
  ] as const;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
        </TooltipTrigger>
        <TooltipContent className="space-y-1 bg-background">
          <div>{t(`messages.status.${key}`)}</div>
          <div className="flex flex-col space-y-1 mt-1">
            {legend.map(({ color, key }) => (
              <div key={key} className="flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs">{t(`messages.status.${key}`)}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default MessageStatusDot;
