import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MessagesSection from "@/pages/messages-section";
import { GroupsSection } from "@/pages/groups-section";
import AnnouncementsSection from "@/pages/announcements-section";
import RequestsSection from "@/pages/requests-section";
import ContactsSection from "@/pages/contacts-section";
import SettingsSection from "@/pages/settings-section";
import WikiSection from "@/pages/wiki-section";
import CallModal from "@/components/call-modal";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { SectionType } from "@/types/sections";
import { useChat } from "@/context/ChatContext";
import { useMessageSync } from "@/hooks/useMessageSync";

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<SectionType>("messages");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<"video" | "audio">("video");
  const [callRecipient, setCallRecipient] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const { user } = useAuth();
  const { connectionStatus, sendRaw, lastRawMessage } = useWebSocket();
  const { chatUser, setChatUser } = useChat();
  const { toast } = useToast();
  const { t } = useTranslation();
  useMessageSync();

  const handleStartCall = (
    type: "video" | "audio",
    recipient: { id: number; name: string },
  ) => {
    setCallType(type);
    setCallRecipient(recipient);
    setIsCallModalOpen(true);
    sendRaw({
      type: "call-request",
      payload: {
        to: recipient.id,
        callType: type,
        fromName:
          user?.firstName || user?.lastName
            ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
            : user?.username,
      },
    });
  };

  const handleOpenChat = (contact: any) => {
    setChatUser({
      id: Number(contact.id),
      firstName: contact.firstName,
      lastName: contact.lastName,
      avatarUrl: contact.avatarUrl,
      isonline: contact.isonline,
    });
    setActiveSection("messages");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    if (!lastRawMessage) return;

    if (lastRawMessage.type === 'chat') {
      const msg = lastRawMessage.payload as {
        senderId: number;
        content: string;
      };
      if (!user) return;
      if (msg.senderId === user.id) return;
      if (chatUser && msg.senderId === chatUser.id) return;
      toast({ title: t('messages.newMessage'), description: msg.content });
      return;
    }

    if (lastRawMessage.type === 'call-request') {
      const payload = lastRawMessage.payload as {
        from: number;
        fromName: string;
        callType: 'video' | 'audio';
      };
      setCallType(payload.callType);
      setCallRecipient({ id: payload.from, name: payload.fromName });
      setIsCallModalOpen(true);
    }
  }, [lastRawMessage, chatUser, user, toast, t]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          connectionStatus={
            connectionStatus === "open" ? "online" :
            connectionStatus === "closing" || connectionStatus === "closed" ? "disconnected" :
            connectionStatus
          }
        />

        <main className="flex-1 overflow-hidden flex flex-col">
          {activeSection === "messages" && (
            <MessagesSection onStartCall={handleStartCall} />
          )}

          {activeSection === "groups" && <GroupsSection groupId={0} />}

          {activeSection === "announcements" && <AnnouncementsSection />}

          {activeSection === "requests" && <RequestsSection />}

          {activeSection === "contacts" && (
            <ContactsSection onStartCall={handleStartCall} onOpenChat={handleOpenChat} />
          )}

          {activeSection === "settings" && <SettingsSection />}

          {activeSection === "wiki" && <WikiSection />}
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

