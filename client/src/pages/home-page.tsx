import { useState, useEffect, useRef } from "react";
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
import CallRequestDialog from "@/components/call-request-dialog";
import { useWebSocket } from "@/hooks/useWebSocket";
import ConnectionBanner from "@/components/connection-banner";
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
  const [incomingCall, setIncomingCall] = useState<{
    from: number;
    name: string;
    callType: "video" | "audio";
  } | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<"video" | "audio">("video");
  const [callRecipient, setCallRecipient] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const callSignalQueueRef = useRef<Map<number, any[]>>(new Map());
  const [callIncomingSignal, setCallIncomingSignal] = useState<any>(null);
  const { user } = useAuth();
  const { connectionStatus, sendRaw, lastRawMessage, retriesLeft, reconnect } = useWebSocket();
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
    setIsCalling(true);
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

  const acceptCall = () => {
    if (!incomingCall) return;
    sendRaw({ type: "call-accept", payload: { to: incomingCall.from } });
    setCallRecipient({ id: incomingCall.from, name: incomingCall.name });
    setCallType(incomingCall.callType);
    setIncomingCall(null);
    setIsCallModalOpen(true);
  };

  const declineCall = () => {
    if (!incomingCall) return;
    sendRaw({ type: "call-reject", payload: { to: incomingCall.from } });
    setIncomingCall(null);
  };

  const cancelOutgoingCall = () => {
    if (!callRecipient) return;
    sendRaw({ type: "call-reject", payload: { to: callRecipient.id } });
    setIsCalling(false);
    setCallRecipient(null);
  };

  useEffect(() => {
    if (isCallModalOpen && callRecipient) {
      const q = callSignalQueueRef.current.get(callRecipient.id);
      if (q && q.length > 0) {
        setCallIncomingSignal(q.shift()!);
      }
    }
  }, [isCallModalOpen, callRecipient]);

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
      setIncomingCall({
        from: payload.from,
        name: payload.fromName,
        callType: payload.callType,
      });
    }

    if (lastRawMessage.type === 'p2p-signal') {
      const payload = lastRawMessage.payload as { from: number; signal: any };
      const q = callSignalQueueRef.current.get(payload.from) || [];
      q.push(payload.signal);
      callSignalQueueRef.current.set(payload.from, q);
      if (isCallModalOpen && callRecipient?.id === payload.from) {
        const sig = q.shift();
        if (sig) setCallIncomingSignal(sig);
      }
    }

    if (
      lastRawMessage.type === 'call-accept' &&
      callRecipient &&
      lastRawMessage.payload.from === callRecipient.id
    ) {
      setIsCalling(false);
      setIsCallModalOpen(true);
    }

    if (
      lastRawMessage.type === 'call-reject' &&
      callRecipient &&
      lastRawMessage.payload.from === callRecipient.id
    ) {
      setIsCalling(false);
      setCallRecipient(null);
      toast({ title: t('call.rejected') });
    }
  }, [lastRawMessage, chatUser, user, toast, t, callRecipient]);

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

          {activeSection === "groups" && <GroupsSection />}

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
          incomingSignal={callIncomingSignal}
        />
      )}

      {incomingCall && (
        <CallRequestDialog
          isOpen={true}
          incoming={true}
          callType={incomingCall.callType}
          participant={{ name: incomingCall.name }}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}

      {isCalling && callRecipient && (
        <CallRequestDialog
          isOpen={true}
          incoming={false}
          callType={callType}
          participant={{ name: callRecipient.name }}
          onDecline={cancelOutgoingCall}
        />
      )}

      {retriesLeft === 0 && connectionStatus !== 'open' && (
        <ConnectionBanner onReconnect={reconnect} />
      )}
    </div>
  );
}

