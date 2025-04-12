import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
// import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);//this is not used

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "nexus-corporate-messenger-secret",
    resave: false,
    saveUninitialized: false,
    // store: storage.sessionStore, // Commenting out the session store interaction
    store: undefined, // temporary fix, should be fully removed later
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Commenting out database interaction for user lookup
        // let user = await storage.getUserByUsername(username);

        // // If not found, try by email
        // if (!user) {
        //   user = await storage.getUserByEmail(username);
        // }
          const user = { id: 1, username };

        // Commenting out password comparison
        // if (!user || !(await comparePasswords(password, user.password))) {
        if (!user) {

          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: any, done) => { // any, instead of number
    try {
      // const user = await storage.getUser(id);
      const user = {id, username: "temporary-username"}; // temporary fix, remove this
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Commenting out database interaction for checking existing username
      // const existingUserByUsername = await storage.getUserByUsername(
      //   req.body.username,
      // );
      // if (existingUserByUsername) {
      //   return res.status(400).json({ message: "Username already exists" });
      // }

      // Instead of creating a user in the database, create a temporary user object
      const user = {
        id: Math.floor(Math.random() * 100000), // Generate a temporary ID
        username: req.body.username,
        // Add any other necessary properties here...
      };
        req.login(user, (err) => {
          if (err) return next(err);
          // Respond with the temporary user object
          res.status(201).json(user);
        });
    
    } catch (error) {
      res.status(400).json({ message: "Registration failed", error });
    }
  });

    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user)
        return res.status(401).json({ message: "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password , ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
      if (!req.isAuthenticated()) {
          return res.sendStatus(401);
      }
    // Mocked user data since we're not using a database
    // if (!req.user) {
    //     return res.status(404).json({ message: "User not found" });
    // }
    const mockedUser = {
      id: req.user.id,
      username: req.user.username,
    };
      res.json(mockedUser);
  });

  app.get("/api/random-user", async (req, res) => {
    try {
      // const users = Array.from(storage.users.values());
      const users = []; //Commented to remove db interaction if (users.length === 0) {
        return res.status(404).json({ message: "No users found" });
      }

      const randomIndex = Math.floor(Math.random() * users.length);
      const randomUser = users[randomIndex];

      // Remove password from response
      const { password , ...userWithoutPassword } = randomUser;

      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get random user", error });
    }
  });
