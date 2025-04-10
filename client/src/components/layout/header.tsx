import { useState, useCallback } from "react";
import { useAuth } from "../../hooks/use-auth"; // Import useAuth from hooks
import { LanguageContext } from "@/lib/i18n/LanguageContext";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Updated import
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BellIcon,
  ChevronDownIcon,
  MenuIcon,
  SettingsIcon,
  LogOutIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button"; // Updated import
import { Badge } from "@/components/ui/badge"; // Updated import
import {DropdownMenuItem} from "@/components/ui/dropdown-menu";

interface HeaderProps {  
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [notificationCount] = useState(3); // In real app, this would come from API/state

  if (!user) return null;

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setLocation("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout, setLocation]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <header className="h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-primary-600">
        {t("common.appName")}
      </h1>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-primary-600">Nexus</h1>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-700 focus:ring-0"
            >
              <BellIcon className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button><DropdownMenu> <DropdownMenuTrigger asChild> <Button
                variant="ghost"
                className="flex items-center space-x-1 focus:ring-0"
              >
                <Avatar className="h-8 w-8">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                  ) : (
                    <AvatarFallback className="bg-primary-100 text-primary-600">
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="hidden md:block text-sm">
                  {user.firstName} {user.lastName}
                </span>
                <ChevronDownIcon className="h-4 w-4 text-gray-500" /></Button>
            </DropdownMenuTrigger>            
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                {user?.firstName} {user?.lastName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setLocation("/settings")}
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleLogout}
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
