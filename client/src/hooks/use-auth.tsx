// import { createContext, useContext } from "react";
//
// const AuthContext = createContext<any>(undefined);
//
// export const AuthProvider = ({ children, value }: { children: React.ReactNode; value: any }) => {
//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };
//
// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     // 🚑  No provider? fake a logged‑in user so the UI stops exploding
//     return {
//       user: { id: 1, username: window.electronUser || "user1", firstName: "Demo", lastName: "User", isOnline: 1 },
//       isLoading: false,
//       error: null,
//       login: async () => Promise.resolve(),
//       logout: async () => Promise.resolve(),
//       register: async () => Promise.resolve(),
//     };
//   }
//   return context;
// };
