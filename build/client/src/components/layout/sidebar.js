"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Sidebar;
const use_auth_1 = require("@/hooks/use-auth"); // Import useAuth
const wouter_1 = require("wouter");
const react_i18next_1 = require("react-i18next");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
const avatar_1 = require("@/components/ui/avatar");
function Sidebar({ activeSection, setActiveSection, isOpen, setIsOpen, connectionStatus, }) {
    const { user, logout } = (0, use_auth_1.useAuth)(); // Use useAuth here
    const { t } = (0, react_i18next_1.useTranslation)();
    const [, setLocation] = (0, wouter_1.useLocation)();
    const handleLogout = async () => {
        await logout();
        setLocation("/auth");
    };
    if (!user)
        return null;
    const handleNavItemClick = (id) => {
        setActiveSection(id);
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    };
    const navItems = [
        { id: "messages", icon: lucide_react_1.MessageSquareIcon, label: t("sidebar.nav.messages") },
        { id: "requests", icon: lucide_react_1.ClipboardCheckIcon, label: t("sidebar.nav.requests"), badge: 2 },
        { id: "contacts", icon: lucide_react_1.ContactIcon, label: t("sidebar.nav.contacts") },
        { id: "wiki", icon: lucide_react_1.BookOpenIcon, label: t("sidebar.nav.wiki") || "Wiki" },
    ];
    return (<>
      {/* Backdrop for mobile */}
      <div className={(0, utils_1.cn)("fixed inset-0 bg-black/30 z-20 md:hidden transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={() => setIsOpen(false)}/>

      {/* Sidebar */}
      <aside className={(0, utils_1.cn)("w-64 bg-white border-r border-gray-200 z-30 transition-transform duration-200 ease-in-out", "fixed left-0 top-0 bottom-0 md:relative md:translate-x-0", isOpen ? "translate-x-0" : "-translate-x-full")}>
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 md:hidden">
          <h2 className="text-xl font-semibold text-primary-600">Nexus</h2>
          <button_1.Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <lucide_react_1.XIcon className="h-5 w-5"/>
          </button_1.Button>
        </div>

        {/* Connection status indicator */}
        <div className="px-4 py-2 flex items-center text-xs border-b border-gray-100">
          {connectionStatus === "online" ? (<div className="flex items-center text-green-600">
              <lucide_react_1.WifiIcon className="h-3 w-3 mr-1"/>
              <span>Connected</span>
            </div>) : connectionStatus === "offline" ? (<div className="flex items-center text-blue-600">
              <lucide_react_1.WifiOffIcon className="h-3 w-3 mr-1"/>
              <span>Offline Mode</span>
            </div>) : connectionStatus === "connecting" ? (<div className="flex items-center text-yellow-600">
              <lucide_react_1.WifiIcon className="h-3 w-3 mr-1 animate-pulse"/>
              <span>Connecting...</span>
            </div>) : (<div className="flex items-center text-red-600">
              <lucide_react_1.WifiOffIcon className="h-3 w-3 mr-1"/>
              <span>Disconnected</span>
            </div>)}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (<button_1.Button key={item.id} variant="ghost" className={(0, utils_1.cn)("w-full justify-start text-gray-600 hover:bg-gray-100 hover:text-gray-900", activeSection === item.id &&
                "bg-primary-50 text-primary-600 hover:bg-primary-50 hover:text-primary-600")} onClick={() => handleNavItemClick(item.id)}>
              <item.icon className="mr-3 h-5 w-5"/>

              <span>{item.label}</span>
              {item.badge ? (<badge_1.Badge className="ml-auto" variant="destructive">
                  {item.badge}
                </badge_1.Badge>) : null}
            </button_1.Button>))}
        </nav>
        {/* Profile dropdown section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <dropdown_menu_1.DropdownMenu>
            <dropdown_menu_1.DropdownMenuTrigger asChild>
              <button_1.Button variant="ghost" className="flex w-full items-center justify-start gap-3">
                <avatar_1.Avatar>
                  <avatar_1.AvatarFallback>
                    {(user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")}
                  </avatar_1.AvatarFallback>
                </avatar_1.Avatar>
                <div className="flex-1 ">
                  <p className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </button_1.Button>
            </dropdown_menu_1.DropdownMenuTrigger>
            <dropdown_menu_1.DropdownMenuContent className="w-56 bg-white border" align="start">
              <dropdown_menu_1.DropdownMenuLabel className="font-normal text-sm">
                <p className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </dropdown_menu_1.DropdownMenuLabel>
              <dropdown_menu_1.DropdownMenuSeparator />
              {/* <LanguageSwitcher />          reuse existing component */}
              <dropdown_menu_1.DropdownMenuItem onClick={() => setLocation("/settings")}>
                <lucide_react_1.SettingsIcon className="mr-2 h-4 w-4"/>
                {t("sidebar.nav.settings")}
              </dropdown_menu_1.DropdownMenuItem>

              <dropdown_menu_1.DropdownMenuSeparator />

              <dropdown_menu_1.DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <lucide_react_1.LogOutIcon className="mr-2 h-4 w-4"/>
                {t("auth.logout")}
              </dropdown_menu_1.DropdownMenuItem>
            </dropdown_menu_1.DropdownMenuContent>
          </dropdown_menu_1.DropdownMenu>
        </div>
      </aside>
    </>);
}
