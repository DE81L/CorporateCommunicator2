import { useState, useCallback } from "react";
import { showError } from "@/lib/error-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/use-auth"; // импортируем useAuth из хуков
import {NotificationsPane} from "../NotificationsPane";
import { useLocation } from "wouter";
import {
  BellIcon,
  MenuIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button"; // обновлённый импорт
import { Badge } from "@/components/ui/badge"; // обновлённый импорт

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
      showError(error, "Logout failed");
    }
  }, [logout, setLocation]);

    const [open, setOpen] = useState(false);

  
  return (
    <header className="h-14 border-b border-border bg-primary-100 dark:bg-primary-900 px-4 flex items-center justify-between">
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
