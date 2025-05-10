"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
const react_1 = __importDefault(require("react"));
const react_hot_toast_1 = require("react-hot-toast");
const auth_page_1 = __importDefault(require("./pages/auth-page"));
const home_page_1 = __importDefault(require("./pages/home-page"));
const react_query_1 = require("@tanstack/react-query");
const use_auth_1 = require("./hooks/use-auth");
const window_frame_1 = require("./components/ui/window-frame");
const use_electron_1 = require("./hooks/use-electron");
const react_2 = require("react");
function AppContent() {
    const { user, isLoading } = (0, use_auth_1.useAuth)();
    const { isElectron } = (0, use_electron_1.useElectron)();
    (0, react_2.useEffect)(() => {
        if (isElectron) {
            document.body.classList.add('electron');
        }
    }, [isElectron]);
    // 1. Show a loading state while we check /api/user
    if (isLoading)
        return <div className="p-4">Loading…</div>;
    // 2. Not logged in? Show the AuthPage (no Redirect needed)
    if (!user)
        return <auth_page_1.default />;
    // 3. Logged in! Render your real app shell
    return (<div className="flex flex-col h-screen">
      {isElectron && <window_frame_1.WindowFrameHeader />}
      <react_hot_toast_1.Toaster />
      <div className="flex-1 overflow-auto">
        {/* Now rendering your real home screen */}
        <home_page_1.default />
      </div>
    </div>);
}
const queryClient_1 = require("./lib/queryClient");
function App() {
    const [status, setStatus] = (0, react_2.useState)('Loading...');
    const [message, setMessage] = (0, react_2.useState)('');
    (0, react_2.useEffect)(() => {
        // Check server health
        fetch('http://localhost:3000/api/health')
            .then(res => res.json())
            .then(data => setStatus(data.status))
            .catch(err => setStatus('error'));
        // Get hello message
        fetch('http://localhost:3000/api/hello')
            .then(res => res.json())
            .then(data => setMessage(data.message))
            .catch(err => console.error(err));
    }, []);
    return (<react_query_1.QueryClientProvider client={queryClient_1.queryClient}>
      <use_auth_1.AuthProvider>
        <AppContent />
        <div>
          <h1>Server Status: {status}</h1>
          <p>{message}</p>
        </div>
      </use_auth_1.AuthProvider>
    </react_query_1.QueryClientProvider>);
}
