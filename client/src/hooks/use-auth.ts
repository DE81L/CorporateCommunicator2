ts
// client/src/hooks/use-auth.ts
export function useAuth() {
  // pick the username we injected from the main process (see step 5)
  const username = localStorage.getItem("username") ?? "user1";
  return {
    user: { id: username === "user1" ? 1 : 2, username },
    isLoading: false,
  };
}