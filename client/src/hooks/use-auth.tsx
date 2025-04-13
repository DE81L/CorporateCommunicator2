export const useAuth = () => {
  return {
    user: { username: "User1", id: "1" }, // fake logged-in user
    isAuthenticated: true,
    login: () => {},
    logout: () => {},
  };
};
