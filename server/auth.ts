import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Express, NextFunction, Request, Response } from 'express';
import session from 'express-session';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { User as SelectUser } from '../shared/electron-shared/schema';
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

import { storage } from "./storage";

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await promisify(scrypt)(password, salt, 64) as Buffer;
  return `${derivedKey.toString('hex')}.${salt}`;
}

export async function comparePasswords(plain: string, stored: string) {
  const [hashedPassword, salt] = stored.split('.');
  const derivedKey = await promisify(scrypt)(plain, salt, 64) as Buffer;
  return timingSafeEqual(Buffer.from(hashedPassword, 'hex'), derivedKey);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'nexus-corporate-messenger-secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  };

  app.set('trust proxy', 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Attempting to authenticate user: ${username}`);
        const user = await storage.getUserByUsername(username);
        console.log('LocalStrategy — пользователь из БД:', user);
        if (!user) {
          console.log('No user found');
          return done(null, false, { message: 'Invalid credentials' });
        }
        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          console.log(`Password comparison failed for user: ${user.username || user.email}`);
          console.log(`Stored password hash: ${user.password}`);
          console.log(`Provided password: ${password}`);
          return done(null, false, { message: 'Invalid credentials' });
        }
        return done(null, user);
      } catch (error) {
        console.error('Error during authentication:', error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    console.log('serializeUser');
    done(null, (user as SelectUser).id);
  });

  passport.deserializeUser(async (id: any, done) => {
    console.log('deserializeUser');
    try {
      const user = await storage.getUser(id);
      done(null, user!);
    } catch (error) {
      console.error('Error during deserialization:', error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      const { password, ...userWithoutPassword } = user;
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      res.status(400).json({ message: "Registration failed", error });
    }
  });

  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err: Error | null, user: Express.User | false | null, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.get('/api/user', (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        console.log("not authenticated");
        return res.status(200).json(null);
      }
      if (!req.user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (req.user) {
        const { password: _, ...userWithoutPassword } = (req.user as Express.User);
        return res.status(200).json(userWithoutPassword);
      }
    } finally {
      console.log('/api/user');
    }
  });

  app.post('/api/logout', (req, res, next) => {
    try {
      req.logout((err) => {
        if (err) return next(err);
        res.sendStatus(200);
      });
      console.log("/api/logout");
    } catch (error) {
      next(error);
    }
  });
}
