"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtectedRoute = ProtectedRoute;
const use_auth_1 = require("@/hooks/use-auth");
const lucide_react_1 = require("lucide-react");
const wouter_1 = require("wouter");
function ProtectedRoute({ path, component: Component }) {
    function AuthWrapper() {
        const { user, isLoading } = (0, use_auth_1.useAuth)();
        if (isLoading) {
            return (<div className="flex items-center justify-center min-h-screen">
          <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-primary"/>
        </div>);
        }
        if (!user) {
            return <wouter_1.Redirect to="/auth"/>;
        }
        return <Component />;
    }
    return (<wouter_1.Route path={path}>
      {() => <AuthWrapper />}
    </wouter_1.Route>);
}
