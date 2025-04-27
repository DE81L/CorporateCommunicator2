import { Express, Request, Response } from 'express';
import { storage } from "./storage";




export function setupAutoAuth(app: Express) {
  app.get('/api/random-user', async (req: Request, res: Response) => {
     try {
      const users = await storage.listUsers();
      if (users.length === 0) {
        return res.status(404).json({ message: "No users found" });
      }
      const randomIndex = Math.floor(Math.random() * users.length);
      const randomUser = users[randomIndex];
      const { password, ...safeUser } = randomUser;


      // Fix: Add proper error handling for login
      req.login(randomUser, (err) => {
        // Note: Pass full user object for login
        if (err) {
          console.error("Error logging in user:", err);
          return res.status(500).json({ message: "Error logging in user" });
        }
        return res.json(safeUser); // Return user without password
      });
    } catch (error) {
      console.error("Error fetching random user:", error);
      res.status(500).json({ message: "Error fetching random user" });
    } 
  });
}