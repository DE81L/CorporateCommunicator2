import 'express-session';

declare module 'express-session' {
  interface SessionData {
    // эти поля мы устанавливаем при входе в систему:
    userId: number;
    username: string;
  }
}