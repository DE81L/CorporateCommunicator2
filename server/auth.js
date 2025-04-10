"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuth = setupAuth;
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const express_session_1 = __importDefault(require("express-session"));
const crypto_1 = require("crypto");
const util_1 = require("util");
const storage_1 = require("./storage");
const scryptAsync = (0, util_1.promisify)(crypto_1.scrypt);
async function hashPassword(password) {
    const salt = (0, crypto_1.randomBytes)(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64));
    return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64));
    return (0, crypto_1.timingSafeEqual)(hashedBuf, suppliedBuf);
}
function setupAuth(app) {
    const sessionSettings = {
        secret: process.env.SESSION_SECRET || "nexus-corporate-messenger-secret",
        resave: false,
        saveUninitialized: false,
        store: storage_1.storage.sessionStore,
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        },
    };
    app.set("trust proxy", 1);
    app.use((0, express_session_1.default)(sessionSettings));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    passport_1.default.use(new passport_local_1.Strategy(async (username, password, done) => {
        try {
            // Try to find user by username first
            let user = await storage_1.storage.getUserByUsername(username);
            // If not found, try by email
            if (!user) {
                user = await storage_1.storage.getUserByEmail(username);
            }
            if (!user || !(await comparePasswords(password, user.password))) {
                return done(null, false);
            }
            else {
                return done(null, user);
            }
        }
        catch (error) {
            return done(error);
        }
    }));
    passport_1.default.serializeUser((user, done) => done(null, user.id));
    passport_1.default.deserializeUser(async (id, done) => {
        try {
            const user = await storage_1.storage.getUser(id);
            done(null, user);
        }
        catch (error) {
            done(error);
        }
    });
    app.post("/api/register", async (req, res, next) => {
        try {
            // Check if username exists
            const existingUserByUsername = await storage_1.storage.getUserByUsername(req.body.username);
            if (existingUserByUsername) {
                return res.status(400).json({ message: "Username already exists" });
            }
            // Check if email exists
            const existingUserByEmail = await storage_1.storage.getUserByEmail(req.body.email);
            if (existingUserByEmail) {
                return res.status(400).json({ message: "Email already exists" });
            }
            const hashedPassword = await hashPassword(req.body.password);
            const user = await storage_1.storage.createUser({
                ...req.body,
                password: hashedPassword,
            });
            // Remove password from response
            const { password, ...userWithoutPassword } = user;
            req.login(user, (err) => {
                if (err)
                    return next(err);
                res.status(201).json(userWithoutPassword);
            });
        }
        catch (error) {
            res.status(400).json({ message: "Registration failed", error });
        }
    });
    app.post("/api/login", (req, res, next) => {
        passport_1.default.authenticate("local", (err, user, info) => {
            if (err)
                return next(err);
            if (!user)
                return res.status(401).json({ message: "Invalid credentials" });
            req.login(user, (err) => {
                if (err)
                    return next(err);
                const { password, ...userWithoutPassword } = user;
                return res.status(200).json(userWithoutPassword);
            });
        })(req, res, next);
    });
    app.post("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err)
                return next(err);
            res.sendStatus(200);
        });
    });
    app.get("/api/user", (req, res) => {
        if (!req.isAuthenticated())
            return res.sendStatus(401);
        // Remove password from response
        const { password, ...userWithoutPassword } = req.user;
        res.json(userWithoutPassword);
    });
    app.get("/api/random-user", async (req, res) => {
        try {
            const users = Array.from(storage_1.storage.users.values());
            if (users.length === 0) {
                return res.status(404).json({ message: "No users found" });
            }
            const randomIndex = Math.floor(Math.random() * users.length);
            const randomUser = users[randomIndex];
            // Remove password from response
            const { password, ...userWithoutPassword } = randomUser;
            res.json(userWithoutPassword);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to get random user", error });
        }
    });
}
