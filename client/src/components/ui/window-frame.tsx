import { X, Minimize, Maximize, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useElectron } from '@/hooks/use-electron';
import { useAuth } from '@/hooks/use-auth';

export const WindowFrame = () => {
  const { api, isElectron } = useElectron();
  const { logout } = useAuth();

  const handleMinimize = () => api?.app?.minimize?.() ?? window.scrollTo({ top: 0, behavior: 'smooth' });
  const handleMaximize = () => api?.app?.maximize?.() ?? window.open(window.location.href, '_blank');
  const handleClose = () => api?.app?.quit?.() ?? window.close();
  const handleRefresh = () => window.location.reload();
  const handleLogout = () => logout();

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh}>
        <RefreshCw className="h-4 w-4"/>
      </Button>
      {isElectron && (
        <>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleMinimize}>
            <Minimize className="h-4 w-4"/>
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleMaximize}>
            <Maximize className="h-4 w-4"/>
          </Button>
        </>
      )}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleLogout}>
        <LogOut className="h-4 w-4"/>
      </Button>
      {isElectron && (
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500 hover:text-white" onClick={handleClose}>
          <X className="h-4 w-4"/>
        </Button>
      )}
    </div>
  );
};

export const WindowFrameHeader = ({ title = 'Корпоративный Мессенджер' }: { title?: string }) => (
  <div className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur h-9 flex items-center justify-between px-4 select-none">
    <span className="text-sm font-medium truncate">{title}</span>
    <WindowFrame/>
  </div>
);