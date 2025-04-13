export function useAuth() {
  return { user: { name: 'stub' } };
}
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return children;
}