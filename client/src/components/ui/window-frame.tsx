import { X, Minimize, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useElectron } from '@/hooks/use-electron';
import { useEffect } from 'react';

export const WindowFrame = () => {
  const api = useElectron();
  if (!api?.isElectron) return null;

  const handleMinimize = () => {
    api?.app?.minimize();
  };

  const handleMaximize = () => {
    api?.app?.maximize();
  };

  const handleClose = () => {
    api?.app?.quit();
  };
  

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-md"
        onClick={handleMinimize}
      >
        <Minimize className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-md"
        onClick={handleMaximize}
      >
        <Maximize className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-md hover:bg-red-500 hover:text-white"
        onClick={handleClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const WindowFrameHeader = ({ title = 'Nexus Corporate Messaging' }: { title?: string }) => {
  const { api } = useElectron();
  if (!api?.isElectron) return null;
  return (
    <div className="bg-primary/5 h-9 flex items-center justify-between px-4 select-none draggable">
      <div className="flex items-center space-x-2">
        <img src="/electron/icons/icon.png" alt="App Logo" className="w-5 h-5" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <WindowFrame />
    </div>
  );
};