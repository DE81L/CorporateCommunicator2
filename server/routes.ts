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
} from "@shared/schema";
import { z } from "zod";
import { convertHelpers } from "@shared/schema";
import { pool } from "./db"; // Updated import

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
  isOnline: boolean;
  avatarUrl: string | null;
}

export type UserWithoutPassword = Omit<User, "password">;

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  setupAuth(app);

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
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users from SQL Server:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.get("/api/random-user", async (req, res) => {
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

  // Messages API
  app.get("/api/messages/:userId", async (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {
      const currentUserId = req.user?.id;
      const otherUserId = parseInt(req.params.userId);

      if (!currentUserId || isNaN(otherUserId)) {
        return res.status(400).json({ message: "Invalid user IDs" });
      }

      const messages = await storage.getMessages(currentUserId, otherUserId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

  // Group Messages API
  app.get("/api/groups/:groupId/messages", async (req, res) => {
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

      const messages = await storage.getGroupMessages(groupId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching group messages" });
    }
  });

  // Groups API
  app.get("/api/groups", async (req, res) => {
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
  const result = await pool.query("SELECT * FROM users");
  return result.rows;
};

// Add explicit type annotations
const handleUserUpdate = async (user: UserWithoutPassword) => {
  // ... implementation
};
