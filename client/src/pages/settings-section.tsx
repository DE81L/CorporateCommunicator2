import { useAuth } from "../hooks/use-auth";

export default function SettingsSection() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex-1 overflow-auto p-6">
      <h2>Settings</h2>
      <p>Nothing here yet – wire up your preferences UI later.</p>
    </div>
  );
}
