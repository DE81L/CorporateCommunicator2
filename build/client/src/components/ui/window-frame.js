"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowFrameHeader = exports.WindowFrame = void 0;
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const use_electron_1 = require("@/hooks/use-electron");
const use_auth_1 = require("@/hooks/use-auth");
const WindowFrame = () => {
    const { api, isElectron } = (0, use_electron_1.useElectron)();
    const { logout } = (0, use_auth_1.useAuth)();
    const handleMinimize = () => api?.app?.minimize?.() ?? window.scrollTo({ top: 0, behavior: 'smooth' });
    const handleMaximize = () => api?.app?.maximize?.() ?? window.open(window.location.href, '_blank');
    const handleClose = () => api?.app?.quit?.() ?? window.close();
    const handleRefresh = () => window.location.reload();
    const handleLogout = () => logout();
    return (<div className="flex items-center gap-1">
      <button_1.Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh}>
        <lucide_react_1.RefreshCw className="h-4 w-4"/>
      </button_1.Button>
      {isElectron && (<>
          <button_1.Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleMinimize}>
            <lucide_react_1.Minimize className="h-4 w-4"/>
          </button_1.Button>
          <button_1.Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleMaximize}>
            <lucide_react_1.Maximize className="h-4 w-4"/>
          </button_1.Button>
        </>)}
      <button_1.Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleLogout}>
        <lucide_react_1.LogOut className="h-4 w-4"/>
      </button_1.Button>
      {isElectron && (<button_1.Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500 hover:text-white" onClick={handleClose}>
          <lucide_react_1.X className="h-4 w-4"/>
        </button_1.Button>)}
    </div>);
};
exports.WindowFrame = WindowFrame;
const WindowFrameHeader = ({ title = 'Корпоративный Мессенджер' }) => (<div className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur h-9 flex items-center justify-between px-4 select-none">
    <span className="text-sm font-medium truncate">{title}</span>
    <exports.WindowFrame />
  </div>);
exports.WindowFrameHeader = WindowFrameHeader;
