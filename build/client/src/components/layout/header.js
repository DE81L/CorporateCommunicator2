"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Header;
const react_1 = require("react");
const react_i18next_1 = require("react-i18next");
const use_auth_1 = require("../../hooks/use-auth"); // Import useAuth from hooks
const NotificationsPane_1 = require("../NotificationsPane");
const wouter_1 = require("wouter");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button"); // Updated import
function Header({ toggleSidebar }) {
    const { user, logout } = (0, use_auth_1.useAuth)();
    const [, setLocation] = (0, wouter_1.useLocation)();
    const { t } = (0, react_i18next_1.useTranslation)();
    if (!user)
        return null;
    const handleLogout = (0, react_1.useCallback)(async () => {
        try {
            await logout();
            setLocation("/auth");
        }
        catch (error) {
            console.error("Logout failed:", error);
        }
    }, [logout, setLocation]);
    const [open, setOpen] = (0, react_1.useState)(false);
    return (<header className="h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-primary-600">
        {t("common.appName")}
      </h1>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <button_1.Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden text-gray-500 hover:text-gray-700">
            <lucide_react_1.MenuIcon className="h-5 w-5"/>
          </button_1.Button>
        </div>

          <button_1.Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
              <lucide_react_1.BellIcon className="h-5 w-5"/>
              
          </button_1.Button>
          <NotificationsPane_1.NotificationsPane open={open} onOpenChange={setOpen}/>
      </div>
    </header>);
}
