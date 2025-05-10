"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HomePage;
const react_1 = require("react");
const header_1 = __importDefault(require("@/components/layout/header"));
const sidebar_1 = __importDefault(require("@/components/layout/sidebar"));
const messages_section_1 = __importDefault(require("@/pages/messages-section"));
const groups_section_1 = __importDefault(require("@/pages/groups-section"));
const announcements_section_1 = __importDefault(require("@/pages/announcements-section"));
const requests_section_1 = __importDefault(require("@/pages/requests-section"));
const contacts_section_1 = __importDefault(require("@/pages/contacts-section"));
const settings_section_1 = __importDefault(require("@/pages/settings-section"));
const wiki_section_1 = __importDefault(require("@/pages/wiki-section"));
const call_modal_1 = __importDefault(require("@/components/call-modal"));
const useWebSocket_1 = require("@/hooks/useWebSocket");
function HomePage() {
    const [activeSection, setActiveSection] = (0, react_1.useState)("messages");
    const [isSidebarOpen, setIsSidebarOpen] = (0, react_1.useState)(false);
    const [isCallModalOpen, setIsCallModalOpen] = (0, react_1.useState)(false);
    const [callType, setCallType] = (0, react_1.useState)("video");
    const [callRecipient, setCallRecipient] = (0, react_1.useState)(null);
    const { connectionStatus } = (0, useWebSocket_1.useWebSocket)();
    const handleStartCall = (type, recipient) => {
        setCallType(type);
        setCallRecipient(recipient);
        setIsCallModalOpen(true);
    };
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    return (<div className="h-screen flex flex-col overflow-hidden">
      <header_1.default toggleSidebar={toggleSidebar}/>

      <div className="flex flex-1 overflow-hidden">
        <sidebar_1.default activeSection={activeSection} setActiveSection={setActiveSection} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} connectionStatus={connectionStatus === "open" ? "online" :
            connectionStatus === "closing" || connectionStatus === "closed" ? "disconnected" :
                connectionStatus}/>

        <main className="flex-1 overflow-hidden flex flex-col">
          {activeSection === "messages" && (<messages_section_1.default onStartCall={handleStartCall}/>)}

          {activeSection === "groups" && <groups_section_1.default />}

          {activeSection === "announcements" && <announcements_section_1.default />}

          {activeSection === "requests" && <requests_section_1.default />}

          {activeSection === "contacts" && (<contacts_section_1.default onStartCall={handleStartCall}/>)}

          {activeSection === "settings" && <settings_section_1.default />}

          {activeSection === "wiki" && <wiki_section_1.default />}
        </main>
      </div>

      {isCallModalOpen && callRecipient && (<call_modal_1.default isOpen={isCallModalOpen} onClose={() => setIsCallModalOpen(false)} callType={callType} recipient={callRecipient}/>)}
    </div>);
}
