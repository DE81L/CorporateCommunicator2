import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import {
  insertMessageSchema,
  insertGroupSchema,
  insertGroupMemberSchema,
  insertRequestSchema,
  insertWikiEntrySchema,
  insertWikiCategorySchema,
  convertHelpers
} from "../shared/electron-shared/schema";
import { z } from "zod";
import { pool, connectToDb } from "./db";

interface WebSocketClient extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

interface ChatMessage {
  type: string;
  senderId: number;
  receiverId?: number;
  groupId?: number;
  content: string;
}

export interface User {
  id: number;
  username: string;
  password: string; // Required in full User
  firstName: string;
  lastName: string;
  email: string;
  isOnline: number; // Store as number (0 or 1) for database compatibility
  isAdmin?: number; // 0 or 1 for boolean values
  avatarUrl: string | null;
}

export type UserWithoutPassword = Omit<User, "password">;

export async function registerRoutes(app: Express): Promise<Server> {
  console.log(`registerRoutes`);
  const httpServer = createServer(app);
  setupAuth(app);
  
  // Add Wiki routes
  addWikiRoutes(app);

  // WebSocket setup
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws",
    port: undefined, // Let it use the HTTP server's port
  });

  wss.on("error", (error) => {
    console.error("WebSocket Server Error:", error);
  });

  const clients = new Map<number, WebSocketClient>();

  wss.on("connection", (ws: WebSocketClient) => {
    console.log(`wss.on("connection")`);
    ws.isAlive = true;

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "auth" && !isNaN(parseInt(data.userId))) {
          ws.userId = parseInt(data.userId);
          clients.set(ws.userId, ws);
          await storage.updateUserOnlineStatus(ws.userId, true);
          broadcastUserStatus(ws.userId, true);
        }
      } catch (error) {
        ws.send(
          JSON.stringify({ type: "error", message: "Invalid message format" }),
        );
      }
    });

    ws.on("close", async () => {
      console.log(`ws.on("close")`);
      if (ws.userId) {
        await storage.updateUserOnlineStatus(ws.userId, false);
        clients.delete(ws.userId);
        broadcastUserStatus(ws.userId, false);
      }
    });
  });

  // API Routes

  // Users API
  app.get("/api/users", async (req, res) => {
    console.log(`app.get("/api/users")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      if (!pool) {
        return res
          .status(500)
          .json({ message: "Database connection not initialized" });
      }
      const users = await getUsers();

      // Don't send password hash
      const safeUsers = users.map((user) => {
        const { password, ...safeUser} = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users from SQL Server:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // User API - Get current user
  app.get("/api/user", async (req, res) => {
    console.log(`[API] GET /api/user`);

    try {
      console.log(`[API] /api/user: Attempting database connection`);
      await connectToDb(); // Ensure database connection
      console.log(`[API] /api/user: Database connection successful`);

      if (req.isAuthenticated()) {
        console.log(`[API] /api/user: User is authenticated`);
        // Exclude password from the user data
        const { password, ...userWithoutPassword } = req.user as User;
        console.log(`[API] /api/user: User data fetched successfully`);
        return res.json(userWithoutPassword);
      } else {
        console.log(`[API] /api/user: User is not authenticated`);
        return res.status(401).json({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error(`[API] /api/user: An error occurred:`, error);
      return res.status(500).json({
        message: "An error occurred while processing your request",
        error: (error as Error).message
      });
    }
  });


  // Messages API
  app.get("/api/messages/:userId", async (req, res) => {
    console.log(`app.get("/api/messages/:userId")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const currentUserId = req.user?.id;
      const otherUserId = parseInt(req.params.userId);

      if (!currentUserId || isNaN(otherUserId)) {
        return res.status(400).json({ message: "Invalid user IDs" });
      }

      const messages = await storage.getDirectMessages(currentUserId, otherUserId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

  // Group Messages API
  app.get("/api/groups/:groupId/messages", async (req, res) => {
    console.log(`app.get("/api/groups/:groupId/messages")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const groupId = parseInt(req.params.groupId);

      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }

      // Check if user is in the group
      const isInGroup = await storage.isUserInGroup(req.user!.id, groupId);
      if (!isInGroup) {
        return res.status(403).json({ message: "Not a member of this group" });
      }

      const messages = await storage.getMessages(groupId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching group messages" });
    }
  });

  // Groups API
  app.get("/api/groups", async (req, res) => {
    console.log(`app.get("/api/groups")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const groups = await storage.getGroupsByUserId(req.user!.id);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Error fetching groups" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    console.log(`app.post("/api/groups")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const groupData = {
        ...req.body,
        creatorId: req.user!.id,
        isAnnouncement: convertHelpers.toDbBoolean(req.body.isAnnouncement),
      };

      const parsedGroup = insertGroupSchema.parse(groupData);
      const group = await storage.createGroup(parsedGroup);

      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid group data" });
    }
  });

  app.post("/api/groups/:groupId/members", async (req, res) => {
    console.log(`app.post("/api/groups/:groupId/members")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const groupId = parseInt(req.params.groupId);

      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }

      // Check if current user is group admin
      const groupMembers = await storage.getGroupMembers(groupId);
      const isAdmin = groupMembers.some(
        (member) => member.userId === req.user!.id && member.isAdmin,
      );

      if (!isAdmin) {
        return res
          .status(403)
          .json({ message: "Only group admins can add members" });
      }

      const memberData = {
        groupId,
        userId: req.body.userId,
        isAdmin: req.body.isAdmin || false,
      };

      // Check if user is already in the group
      const isAlreadyMember = await storage.isUserInGroup(
        req.body.userId,
        groupId,
      );
      if (isAlreadyMember) {
        return res
          .status(400)
          .json({ message: "User is already a member of this group" });
      }

      const parsedMember = insertGroupMemberSchema.parse(memberData);
      const member = await storage.addGroupMember(parsedMember);

      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ message: "Invalid member data" });
    }
  });

  app.get("/api/groups/:groupId/members", async (req, res) => {
    console.log(`app.get("/api/groups/:groupId/members")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const groupId = parseInt(req.params.groupId);

      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }

      // Check if user is in the group
      const isInGroup = await storage.isUserInGroup(req.user!.id, groupId);
      if (!isInGroup) {
        return res.status(403).json({ message: "Not a member of this group" });
      }

      const members = await storage.getGroupMembers(groupId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Error fetching group members" });
    }
  });

  // Announcements API
  app.get("/api/announcements", async (req, res) => {
    console.log(`app.get("/api/announcements")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const announcements = await storage.getAnnouncementGroups();
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Error fetching announcements" });
    }
  });

  // Requests API with enhanced error handling
  app.post("/api/requests", async (req, res) => {
    console.log(`app.post("/api/requests")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const requestData = {
        ...req.body,
        creatorId: req.user!.id,
      };

      const parsedRequest = insertRequestSchema.parse(requestData);
      const request = await storage.createRequest(parsedRequest);

      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.get("/api/requests", async (req, res) => {
    console.log(`app.get("/api/requests")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const requests = await storage.getUserRequests(req.user!.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Error fetching requests" });
    }
  });

  app.patch("/api/requests/:requestId/complete", async (req, res) => {
    console.log(`app.patch("/api/requests/:requestId/complete")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const requestId = parseInt(req.params.requestId);
      const { grade, reviewText } = req.body;

      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }

      if (grade !== undefined && (grade < 1 || grade > 5)) {
        return res
          .status(400)
          .json({ message: "Grade must be between 1 and 5" });
      }

      if (
        grade !== undefined &&
        grade < 5 &&
        (!reviewText || reviewText.trim().length === 0)
      ) {
        return res
          .status(400)
          .json({ message: "Review text required for grades below 5" });
      }

      const request = await storage.getRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (
        request.creatorId !== req.user!.id &&
        request.assigneeId !== req.user!.id
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this request" });
      }

      const updatedRequest = await storage.updateRequestComplete(requestId, {
        status: "completed",
        grade,
        reviewText: grade < 5 ? reviewText : null,
      });

      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Error completing request" });
    }
  });

  // Helper function to broadcast user status
  function broadcastUserStatus(userId: number, isOnline: boolean) {
    console.log(`broadcastUserStatus`);
    const statusUpdate = JSON.stringify({
      type: "user_status",
      userId: userId,
      isOnline: isOnline,
    });

    wss.clients.forEach((client: WebSocketClient) => {
      if (client.readyState === WebSocket.OPEN && client.userId !== userId) {
        client.send(statusUpdate);
      }
    });
  }

  return httpServer;
}

const getUsers = async () => {
  console.log(`getUsers`);
  const result = await pool.query(`
    SELECT 
      id, 
      username, 
      email, 
      password, 
      firstname as "firstName", 
      lastname as "lastName", 
      isonline as "isOnline", 
      avatarurl as "avatarUrl" FROM users`);
  return result.rows;
};

// Add explicit type annotations
const handleUserUpdate = async (user: UserWithoutPassword) => {
  console.log(`handleUserUpdate`);
  // ... implementation
};

// Wiki API Routes - Add after existing routes
function addWikiRoutes(app: Express) {
  // Wiki entries
  app.get("/api/wiki", async (req, res) => {
    console.log(`app.get("/api/wiki")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const entries = await storage.listWikiEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Error fetching wiki entries" });
    }
  });

  app.get("/api/wiki/:id", async (req, res) => {
    console.log(`app.get("/api/wiki/:id")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const entryId = parseInt(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid entry ID" });
      }

      const entry = await storage.getWikiEntry(entryId);
      if (!entry) {
        return res.status(404).json({ message: "Wiki entry not found" });
      }

      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Error fetching wiki entry" });
    }
  });

  app.post("/api/wiki", async (req, res) => {
    console.log(`app.post("/api/wiki")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      // Only admins can create wiki entries
      const user = req.user as User;
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin privileges required" });
      }

      const entryData = {
        ...req.body,
        creatorId: user.id,
        lastEditorId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const parsedEntry = insertWikiEntrySchema.parse(entryData);
      const entry = await storage.createWikiEntry(parsedEntry);

      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      res.status(400).json({ message: "Invalid wiki entry data" });
    }
  });

  app.put("/api/wiki/:id", async (req, res) => {
    console.log(`app.put("/api/wiki/:id")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      // Only admins can update wiki entries
      const user = req.user as User;
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin privileges required" });
      }

      const entryId = parseInt(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid entry ID" });
      }

      const existingEntry = await storage.getWikiEntry(entryId);
      if (!existingEntry) {
        return res.status(404).json({ message: "Wiki entry not found" });
      }

      const updateData = {
        ...req.body,
        lastEditorId: user.id,
        updatedAt: new Date().toISOString(),
      };

      const updatedEntry = await storage.updateWikiEntry(entryId, updateData);
      res.json(updatedEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      res.status(500).json({ message: "Error updating wiki entry" });
    }
  });

  app.delete("/api/wiki/:id", async (req, res) => {
    console.log(`app.delete("/api/wiki/:id")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      // Only admins can delete wiki entries
      const user = req.user as User;
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin privileges required" });
      }

      const entryId = parseInt(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid entry ID" });
      }

      const existingEntry = await storage.getWikiEntry(entryId);
      if (!existingEntry) {
        return res.status(404).json({ message: "Wiki entry not found" });
      }

      await storage.deleteWikiEntry(entryId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting wiki entry" });
    }
  });

  // Wiki categories
  app.get("/api/wiki/categories", async (req, res) => {
    console.log(`app.get("/api/wiki/categories")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const categories = await storage.listWikiCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching wiki categories" });
    }
  });

  app.get("/api/wiki/categories/:id", async (req, res) => {
    console.log(`app.get("/api/wiki/categories/:id")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const category = await storage.getWikiCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Wiki category not found" });
      }

      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Error fetching wiki category" });
    }
  });

  app.get("/api/wiki/categories/:id/entries", async (req, res) => {
    console.log(`app.get("/api/wiki/categories/:id/entries")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const category = await storage.getWikiCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Wiki category not found" });
      }

      const entries = await storage.getWikiEntriesByCategory(category.name);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Error fetching category entries" });
    }
  });

  app.post("/api/wiki/categories", async (req, res) => {
    console.log(`app.post("/api/wiki/categories")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      // Only admins can create wiki categories
      const user = req.user as User;
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin privileges required" });
      }

      const categoryData = {
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const parsedCategory = insertWikiCategorySchema.parse(categoryData);
      const category = await storage.createWikiCategory(parsedCategory);

      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      res.status(400).json({ message: "Invalid wiki category data" });
    }
  });

  app.put("/api/wiki/categories/:id", async (req, res) => {
    console.log(`app.put("/api/wiki/categories/:id")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      // Only admins can update wiki categories
      const user = req.user as User;
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin privileges required" });
      }

      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const existingCategory = await storage.getWikiCategory(categoryId);
      if (!existingCategory) {
        return res.status(404).json({ message: "Wiki category not found" });
      }

      const updateData = {
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      const updatedCategory = await storage.updateWikiCategory(categoryId, updateData);
      res.json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      res.status(500).json({ message: "Error updating wiki category" });
    }
  });

  app.delete("/api/wiki/categories/:id", async (req, res) => {
    console.log(`app.delete("/api/wiki/categories/:id")`);
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      // Only admins can delete wiki categories
      const user = req.user as User;
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin privileges required" });
      }

      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const existingCategory = await storage.getWikiCategory(categoryId);
      if (!existingCategory) {
        return res.status(404).json({ message: "Wiki category not found" });
      }

      await storage.deleteWikiCategory(categoryId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting wiki category" });
    }
  });
}
