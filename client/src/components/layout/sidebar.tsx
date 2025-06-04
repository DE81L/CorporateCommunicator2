import { useAuth } from "@/hooks/use-auth"; // импортируем useAuth
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  MessageSquareIcon,
  ClipboardCheckIcon,
  ContactIcon,
  SettingsIcon,
  XIcon,
  WifiIcon,
  WifiOffIcon,
  LucideIcon,
  BookOpenIcon,
  InfoIcon,
  LogOutIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type SectionType } from "@/types/sections";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  activeSection: SectionType;
  setActiveSection: (section: SectionType) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  connectionStatus: string;
}

export default function Sidebar({
  activeSection,
  setActiveSection,
  isOpen,
  setIsOpen,
  connectionStatus,
}: SidebarProps) {
  const { user, logout } = useAuth(); // используем useAuth здесь
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  if (!user) return null;

  const displayName =
    `${(user.firstName || '').trim()} ${(user.lastName || '').trim()}`.trim() ||
    user.username ||
    '';

  const nameParts = displayName.split(' ');
  const initials =
    (nameParts[0]?.[0] || '') +
    (nameParts[1]?.[0] || '');

  const handleLogout = async () => {
    await logout();
    setLocation("/auth");
  };

  const handleNavItemClick = (id: SectionType) => {
    setActiveSection(id);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const navItems: { id: SectionType; icon: LucideIcon; label: string; badge?: number }[] = [
    { id: "messages", icon: MessageSquareIcon, label: t("sidebar.nav.messages") },
    { id: "groups", icon: UsersIcon, label: t("sidebar.nav.groups") },
    { id: "explanations", icon: InfoIcon, label: t("sidebar.nav.explanations") },
    { id: "requests", icon: ClipboardCheckIcon, label: t("sidebar.nav.requests"), badge: 2 },
    { id: "contacts", icon: ContactIcon, label: t("sidebar.nav.contacts") },
    { id: "wiki", icon: BookOpenIcon, label: t("sidebar.nav.wiki") || "Wiki" },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={cn(
          "fixed inset-0 bg-black/80 z-20 md:hidden transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 bg-sidebar text-sidebar-foreground border-sidebar-border z-30 transition-transform duration-200 ease-in-out",
          "fixed left-0 top-0 bottom-0 md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-end p-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <XIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Connection status indicator */}
        <div className="px-4 py-2 flex items-center text-xs border-b border-border">
          {connectionStatus === "online" ? (
            <div className="flex items-center text-green-600">
              <WifiIcon className="h-3 w-3 mr-1" />
              <span>{t("connection.connected")}</span>
            </div>
          ) : connectionStatus === "offline" ? (
            <div className="flex items-center text-blue-600">
              <WifiOffIcon className="h-3 w-3 mr-1" />
              <span>{t("connection.offlineMode")}</span>
            </div>
          ) : connectionStatus === "connecting" ? (
            <div className="flex items-center text-yellow-600">
              <WifiIcon className="h-3 w-3 mr-1 animate-pulse" />
              <span>{t("connection.connecting")}</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <WifiOffIcon className="h-3 w-3 mr-1" />
              <span>{t("connection.disconnected")}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-50",
                activeSection === item.id &&
                  "bg-primary-50 text-primary-600 hover:bg-primary-50 hover:text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/20 dark:hover:text-primary-400",
              )}
              onClick={() => handleNavItemClick(item.id)}
            >
              <item.icon className="mr-3 h-5 w-5" />

              <span>{item.label}</span>
              {item.badge ? (
                <Badge className="ml-auto" variant="destructive">
                  {item.badge}
                </Badge>
              ) : null}
            </Button>
          ))}
        </nav>
        {/* Profile dropdown section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex w-full items-center justify-start gap-3">
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{displayName}</p>
                  {user.jobTitle && (
                    <p className="text-xs text-gray-500 truncate">{user.jobTitle}</p>
                  )}
                  <p className="text-xs text-gray-500 truncate">
                    {user.email || user.username}
                  </p>
                  <p className="text-xs mt-1">
                    {user.isOnline ? t('profile.online') : t('profile.offline')}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background border-border" align="start">
              <DropdownMenuLabel className="font-normal text-sm">
                <p className="text-sm font-medium">{displayName}</p>
                {user.jobTitle && (
                  <p className="text-xs text-gray-500 truncate">{user.jobTitle}</p>
                )}
                <p className="text-xs text-gray-500 truncate">
                  {user.email || user.username}
                </p>
                <p className="text-xs mt-1">
                  {user.isOnline ? t('profile.online') : t('profile.offline')}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* <LanguageSwitcher />          reuse existing component */}
              <DropdownMenuItem onClick={() => setLocation("/settings")}>
                <SettingsIcon className="mr-2 h-4 w-4" />
                {t("sidebar.nav.settings")}
              </DropdownMenuItem>

              {user.isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation('/admin')}>
                    <ShieldIcon className="mr-2 h-4 w-4" />
                    {t('nav.admin')}
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOutIcon className="mr-2 h-4 w-4" />
                {t("auth.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
