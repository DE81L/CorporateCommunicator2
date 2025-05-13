import { Router, Request, Response } from "express";
import { logger } from "../util/logger";
import { z } from "zod";

const authRouter = Router();

// Define request body schema
const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

type LoginRequest = z.infer<typeof loginSchema>;

authRouter.post("/login", (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: "Invalid credentials format",
        errors: result.error.errors 
      });
    }

    const { username, password } = result.data;
    logger.info(`Stub login for user ${username}`);
    
    // Return user data
    return res.json({
      id: 1,
      username,
      email: `${username}@example.com`,
      firstName: "Demo",
      lastName: "User",
      isOnline: true,
      isAdmin: 1,
      avatarUrl: null,
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.post("/logout", (_req, res) => {
  try {
    res.status(204).end();
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ message: "Failed to logout" });
  }
});

export default authRouter;
