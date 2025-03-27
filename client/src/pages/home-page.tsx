import { useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MessagesSection from "@/pages/messages-section";
import GroupsSection from "@/pages/groups-section";
import AnnouncementsSection from "@/pages/announcements-section";
import RequestsSection from "@/pages/requests-section";
import ContactsSection from "@/pages/contacts-section";
import SettingsSection from "@/pages/settings-section";
import CallModal from "@/components/call-modal";
import { useWebSocket } from "@/lib/useWebSocket";

type SectionType = "messages" | "groups" | "announcements" | "requests" | "contacts" | "settings";

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<SectionType>("messages");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<"video" | "audio">("video");
  const [callRecipient, setCallRecipient] = useState<{ id: number; name: string } | null>(null);
  const { connectionStatus } = useWebSocket();

  const handleStartCall = (type: "video" | "audio", recipient: { id: number; name: string }) => {
    setCallType(type);
    setCallRecipient(recipient);
    setIsCallModalOpen(true);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeSection={activeSection} 
          setActiveSection={setActiveSection} 
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          connectionStatus={connectionStatus}
        />
        
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeSection === "messages" && (
            <MessagesSection onStartCall={handleStartCall} />
          )}
          
          {activeSection === "groups" && (
            <GroupsSection />
          )}
          
          {activeSection === "announcements" && (
            <AnnouncementsSection />
          )}
          
          {activeSection === "requests" && (
            <RequestsSection />
          )}
          
          {activeSection === "contacts" && (
            <ContactsSection onStartCall={handleStartCall} />
          )}
          
          {activeSection === "settings" && (
            <SettingsSection />
          )}
        </main>
      </div>
      
      {isCallModalOpen && callRecipient && (
        <CallModal 
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          callType={callType}
          recipient={callRecipient}
        />
      )}
    </div>
  );
}
