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
// import CallModal from "@/components/call-modal";
// import CallRequestDialog from "@/components/call-request-dialog";
import { useWebSocket } from "@/hooks/useWebSocket";
import ConnectionBanner from "@/components/connection-banner";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { SectionType } from "@/types/sections";
import { useChat } from "@/context/ChatContext";
import { useMessageSync } from "@/hooks/useMessageSync";
import { showDesktopNotification } from "@/lib/desktop-notify";

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<SectionType>("messages");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  // const [incomingCall, setIncomingCall] = useState<{
  //   from: number;
  //   name: string;
  //   callType: "video" | "audio";
  // } | null>(null);
  // const [isCalling, setIsCalling] = useState(false);
  // const [callType, setCallType] = useState<"video" | "audio">("video");
  // const [callRecipient, setCallRecipient] = useState<{
  //   id: number;
  //   name: string;
  // } | null>(null);
  const { user } = useAuth();
  const {
    connectionStatus,
    sendRaw,
    // sendCallRequest,
    // sendCallAccept,
    // sendCallReject,
    lastRawMessage,
    retriesLeft,
    reconnect,
  } = useWebSocket();
  const { chatUser, setChatUser } = useChat();
  const { toast } = useToast();
  const { t } = useTranslation();
  useMessageSync();

  type WSMsg = { type: string; payload: any };
  const lastProcessedRef = useRef<WSMsg | null>(null);

  // const handleStartCall = (
  //   type: "video" | "audio",
  //   recipient: { id: number; name: string },
  // ) => {
  //   setCallType(type);
  //   setCallRecipient(recipient);
  //   setIsCalling(true);
  //   sendCallRequest(
  //     recipient.id,
  //     type,
  //     user?.firstName || user?.lastName
  //       ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
  //       : user?.username || '',
  //   );
  // };

  // useEffect(() => {
  //   if (!isCalling) return;
  //   const timer = setTimeout(() => {
  //     if (isCalling) {
  //       cancelOutgoingCall();
  //       toast({ title: t("call.noAnswer") });
  //     }
  //   }, 30000);
  //   return () => clearTimeout(timer);
  // }, [isCalling]);

  // const acceptCall = () => {
  //   if (!incomingCall) return;
  //   sendCallAccept(incomingCall.from);
  //   setCallRecipient({ id: incomingCall.from, name: incomingCall.name });
  //   setCallType(incomingCall.callType);
  //   setIncomingCall(null);
  //   setIsCallModalOpen(true);
  // };

  // const declineCall = () => {
  //   if (!incomingCall) return;
  //   sendCallReject(incomingCall.from);
  //   setIncomingCall(null);
  // };

  // const cancelOutgoingCall = () => {
  //   if (!callRecipient) return;
  //   sendCallReject(callRecipient.id);
  //   setIsCalling(false);
  //   setCallRecipient(null);
  // };

  // const endCall = () => {
  //   setIsCallModalOpen(false);
  //   setCallRecipient(null);
  //   setIsCalling(false);
  //   toast({ title: t("call.ended") });
  // };

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
    if (lastProcessedRef.current === lastRawMessage) return;
    lastProcessedRef.current = lastRawMessage;

    if (lastRawMessage.type === 'chat') {
      const msg = lastRawMessage.payload as {
        senderId: number;
        content: string;
      };
      if (!user) return;
      if (msg.senderId === user.id) return;
      if (chatUser && msg.senderId === chatUser.id) return;
      toast({ title: t('messages.newMessage'), description: msg.content });
      if (!document.hasFocus()) {
        showDesktopNotification(t('messages.newMessage'), { body: msg.content });
      }
      return;
    }

    // if (lastRawMessage.type === 'call-request') {
    //   const payload = lastRawMessage.payload as {
    //     from: number;
    //     fromName: string;
    //     callType: 'video' | 'audio';
    //   };
    //   if (
    //     isCallModalOpen ||
    //     isCalling ||
    //     callRecipient ||
    //     incomingCall
    //   ) {
    //     return;
    //   }
    //   setIncomingCall({
    //     from: payload.from,
    //     name: payload.fromName,
    //     callType: payload.callType,
    //   });
    //   if (!document.hasFocus()) {
    //     showDesktopNotification(payload.fromName, {
    //       body: t(`call.${payload.callType}`),
    //     });
    //   }
    // }



    // if (
    //   lastRawMessage.type === 'call-accept' &&
    //   callRecipient &&
    //   lastRawMessage.payload.from === callRecipient.id
    // ) {
    //   setIsCalling(false);
    //   setIsCallModalOpen(true);
    // }

    // if (
    //   lastRawMessage.type === 'call-reject' &&
    //   callRecipient &&
    //   lastRawMessage.payload.from === callRecipient.id
    // ) {
    //   setIsCalling(false);
    //   setCallRecipient(null);
    //   toast({ title: t('call.rejected') });
    // }
  // }, [lastRawMessage, chatUser, user, toast, t, callRecipient]);
  }, []);

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
            <MessagesSection /* onStartCall={handleStartCall} */ />
          )}

          {activeSection === "groups" && <GroupsSection />}

          {activeSection === "announcements" && <AnnouncementsSection />}

          {activeSection === "requests" && <RequestsSection />}

          {activeSection === "contacts" && (
            <ContactsSection /* onStartCall={handleStartCall} */ onOpenChat={handleOpenChat} />
          )}

          {activeSection === "settings" && <SettingsSection />}

          {activeSection === "wiki" && <WikiSection />}
        </main>
      </div>



      {retriesLeft === 0 && connectionStatus !== 'open' && (
        <ConnectionBanner onReconnect={reconnect} />
      )}
    </div>
  );
}

