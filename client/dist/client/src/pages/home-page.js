import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MessagesSection from "@/pages/messages-section";
import GroupsSection from "@/pages/groups-section";
import AnnouncementsSection from "@/pages/announcements-section";
import RequestsSection from "@/pages/requests-section";
import ContactsSection from "@/pages/contacts-section";
import SettingsSection from "@/pages/settings-section";
import WikiSection from "@/pages/wiki-section";
import CallModal from "@/components/call-modal";
import { useWebSocket } from "@/hooks/useWebSocket";
export default function HomePage() {
    const [activeSection, setActiveSection] = useState("messages");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const [callType, setCallType] = useState("video");
    const [callRecipient, setCallRecipient] = useState(null);
    const { connectionStatus } = useWebSocket();
    const handleStartCall = (type, recipient) => {
        setCallType(type);
        setCallRecipient(recipient);
        setIsCallModalOpen(true);
    };
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    return (_jsxs("div", { className: "h-screen flex flex-col overflow-hidden", children: [_jsx(Header, { toggleSidebar: toggleSidebar }), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx(Sidebar, { activeSection: activeSection, setActiveSection: setActiveSection, isOpen: isSidebarOpen, setIsOpen: setIsSidebarOpen, connectionStatus: connectionStatus === "open" ? "online" :
                            connectionStatus === "closing" || connectionStatus === "closed" ? "disconnected" :
                                connectionStatus }), _jsxs("main", { className: "flex-1 overflow-hidden flex flex-col", children: [activeSection === "messages" && (_jsx(MessagesSection, { onStartCall: handleStartCall })), activeSection === "groups" && _jsx(GroupsSection, {}), activeSection === "announcements" && _jsx(AnnouncementsSection, {}), activeSection === "requests" && _jsx(RequestsSection, {}), activeSection === "contacts" && (_jsx(ContactsSection, { onStartCall: handleStartCall })), activeSection === "settings" && _jsx(SettingsSection, {}), activeSection === "wiki" && _jsx(WikiSection, {})] })] }), isCallModalOpen && callRecipient && (_jsx(CallModal, { isOpen: isCallModalOpen, onClose: () => setIsCallModalOpen(false), callType: callType, recipient: callRecipient }))] }));
}
