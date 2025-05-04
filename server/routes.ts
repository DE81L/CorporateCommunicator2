import type { Express, Request, Response } from "express";
import { setupAuth } from "./auth";
import { insertRequestSchema } from "../shared/electron-shared/schema";
import { storage } from "./storage";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<void> {
  setupAuth(app);

  // Core API routes
  app.post("/api/requests", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const requestData = {
        ...req.body,
        creatorId: req.user!.id,
        dateOfRequest: new Date(),
        createdAt: new Date(), 
        updatedAt: new Date(),
        status: "pending",
        whoAccepted: null,
        localNumber: req.body.phone || null,
      };
      const parsed = insertRequestSchema.parse(requestData);
      const request = await storage.createRequest(parsed);
      return res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          details: error.issues.map(i => ({ field: i.path.join("."), message: i.message })),
        });
      }
      console.error("Error creating request:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/requests", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const requests = await storage.getUserRequests(req.user!.id);
      return res.json(requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      return res.status(500).json({ message: "Error fetching requests" });
    }
  });

  app.patch("/api/requests/:requestId/complete", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" }); 
    }
    try {
      const id = parseInt(req.params.requestId);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      const reqRecord = await storage.getRequest(id);
      if (!reqRecord) {
        return res.status(404).json({ message: "Request not found" });
      }
      if (reqRecord.creatorId !== req.user!.id && reqRecord.assigneeId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this request" });
      }
      const updated = await storage.updateRequestComplete(id, { status: "finished" });
      return res.json(updated);
    } catch (error) {
      console.error("Error completing request:", error);
      return res.status(500).json({ message: "Error completing request" });
    }
  });

  // Basic system routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
}

