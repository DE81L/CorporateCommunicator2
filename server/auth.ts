import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Express, NextFunction, Request, Response } from 'express';
import session from 'express-session';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { User as SelectUser } from '@shared/electron-shared/schema';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

import { storage } from "./storage";
import { promisify } from 'util';

const scryptAsync = promisify(scrypt); //this is not used

async function hashPassword(password: string) {
  console.log('hashPassword');

  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  console.log('comparePasswords');
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'nexus-corporate-messenger-secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore, 
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week,
    },
  };

  app.set('trust proxy', 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log('LocalStrategy');
      try {
        let user = await storage.getUserByUsername(username);

        // If not found, try by email
        if (!user) {
          user = await storage.getUserByEmail(username);
        }

        if (!user || !(await comparePasswords(password, user.password))) {
          console.log('LocalStrategy: no user');
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    console.log('serializeUser');
    done(null, user.id);
  });
  passport.deserializeUser(async (id: any, done) => {
    // any, instead of number
    console.log('deserializeUser');
    try {
      const user = await storage.getUser(id);
      done(null, user!);
    } catch (error) {
      done(error);
    }
  });

  app.post('/api/register', async (req, res, next) => {
    try {
      const existingUserByUsername = await storage.getUserByUsername(
        req.body.username,
      );
      if (existingUserByUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const newUser = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      req.login(newUser, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      res.status(400).json({ message: 'Registration failed', error });
      console.log('Registration failed');
    } finally {
      console.log('/api/register');
    }
  });

  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user)
        return res.status(401).json({ message: 'Invalid credentials' });
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
        return res.sendStatus(401);
      }
      if (!req.user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (req.user) {
        const { password, ...userWithoutPassword } = req.user;
        res.json(userWithoutPassword);
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
    } finally {
      console.log("/api/logout");
    }
  });
}
