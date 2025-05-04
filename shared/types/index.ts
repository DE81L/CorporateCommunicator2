export enum TranslationKey {
  // Move all translation keys here from client/src/types.ts
}

// Move user types and other shared interfaces here
export interface User {
  // ...existing user type...
}

// Add helper functions
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
};

// Add connection status types
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';
