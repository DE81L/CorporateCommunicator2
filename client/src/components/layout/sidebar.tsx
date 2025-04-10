import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  MessageSquareIcon,
  UsersIcon,
  MegaphoneIcon,
  ClipboardCheckIcon,
  ContactIcon,
  SettingsIcon,
  XIcon,
  WifiIcon,
  WifiOffIcon,
  LucideIcon,
  BookOpenIcon,
  sendIPC
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type SectionType } from "@/types/sections";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SidebarProps {
  activeSection: SectionType;
  setActiveSection: (section: SectionType) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  connectionStatus: "connecting" | "online" | "offline" | "disconnected";
}

export default function Sidebar({
  activeSection,
  setActiveSection,
  isOpen,
  setIsOpen,
  connectionStatus,
}: SidebarProps) {
  const { user, sendIPC } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  const handleNavItemClick = (id: SectionType) => {
    setActiveSection(id);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const navItems: Array<{
    id: SectionType;
    icon: LucideIcon;
    label: string;
    badge?: number;
  }> = [
    {
      id: "messages",
      icon: MessageSquareIcon,
      label: t("nav.messages"),
    },
    { id: "groups", icon: UsersIcon, label: t("nav.groups") },
    {
      id: "announcements",
      icon: MegaphoneIcon,
      label: t("nav.announcements"),
    },
    {
      id: "requests",
      icon: ClipboardCheckIcon,
      label: t("nav.requests"),
      badge: 2,
    },
    { id: "contacts", icon: ContactIcon, label: t("nav.users") },
    { id: "wiki", icon: BookOpenIcon, label: t("nav.wiki") || "Wiki" },
    { id: "settings", icon: SettingsIcon, label: t("nav.settings") },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 z-20 md:hidden transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 bg-white border-r border-gray-200 z-30 transition-transform duration-200 ease-in-out",
          "fixed left-0 top-0 bottom-0 md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 md:hidden">
          <h2 className="text-xl font-semibold text-primary-600">Nexus</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <XIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Connection status indicator */}
        <div className="px-4 py-2 flex items-center text-xs border-b border-gray-100">
          {connectionStatus === "online" ? (
            <div className="flex items-center text-green-600">
              <WifiIcon className="h-3 w-3 mr-1" />
              <span>Connected</span>
            </div>
          ) : connectionStatus === "offline" ? (
            <div className="flex items-center text-blue-600">
              <WifiOffIcon className="h-3 w-3 mr-1" />
              <span>Offline Mode</span>
            </div>
          ) : connectionStatus === "connecting" ? (
            <div className="flex items-center text-yellow-600">
              <WifiIcon className="h-3 w-3 mr-1 animate-pulse" />
              <span>Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              
              <WifiOffIcon className="h-3 w-3 mr-1" />
              <span>Disconnected</span>
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
                "w-full justify-start text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                activeSection === item.id &&
                  "bg-primary-50 text-primary-600 hover:bg-primary-50 hover:text-primary-600",
              )}
              onClick={() => handleNavItemClick(item.id)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              
              <span>{item.label}</span>
              {item.badge && (
                <Badge className="ml-auto" variant="destructive">
                  {item.badge}
                </Badge>
              )}
            </Button>
          ))}
        </nav>

        {/* User profile section - Could be added at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                {user.firstName.charAt(0)}
                {user.lastName.charAt(0)}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

const handleClick = (event: any) => {

}



