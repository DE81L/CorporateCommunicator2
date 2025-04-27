import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/use-auth"; // Import useAuth from hooks
import {NotificationsPane} from "../NotificationsPane";
import { useLocation } from "wouter";
import {
  BellIcon,
  MenuIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button"; // Updated import
import { Badge } from "@/components/ui/badge"; // Updated import

interface HeaderProps {  
  toggleSidebar: () => void;
}
export default function Header({ toggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  if (!user) return null;

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setLocation("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout, setLocation]);

    const [open, setOpen] = useState(false);

  
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
        </div>

          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
              <BellIcon className="h-5 w-5" />
              
          </Button>
          <NotificationsPane open={open} onOpenChange={setOpen} />
      </div>
    </header>
  );
}
