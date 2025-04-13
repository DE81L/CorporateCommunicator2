import { useState } from "react";

/** 100 % fake – just enough to satisfy the UI */
export function useAuth() {
  /* The preload script injects the user id */
  const [user] = useState(() => ({
    id: (window as any).__USER_ID__ ?? "user1",
    name: ((window as any).__USER_ID__ ?? "user1").toUpperCase(),
  }));

  return { user, isAuthenticated: true };
}