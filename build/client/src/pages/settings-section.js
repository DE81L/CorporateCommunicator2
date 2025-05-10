"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsSection;
const use_auth_1 = require("../hooks/use-auth");
function SettingsSection() {
    const { user } = (0, use_auth_1.useAuth)();
    if (!user)
        return null;
    return (<div className="flex-1 overflow-auto p-6">
      <h2>Settings</h2>
      <p>Nothing here yet – wire up your preferences UI later.</p>
    </div>);
}
