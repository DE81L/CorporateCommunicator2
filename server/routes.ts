import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { insertMessageSchema, insertGroupSchema, insertGroupMemberSchema, insertRequestSchema } from "@shared/schema";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  const httpServer = createServer(app);
  
  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Map to track connected clients
  const clients = new Map<number, WebSocketClient>();
  
  // Setup WebSocket ping/pong to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocketClient) => {
      if (ws.isAlive === false) return ws.terminate();
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  wss.on('connection', (ws: WebSocketClient) => {
    ws.isAlive = true;
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === 'auth') {
          const userId = parseInt(data.userId);
          if (!isNaN(userId)) {
            ws.userId = userId;
            clients.set(userId, ws);
            await storage.updateUserOnlineStatus(userId, true);
            
            // Notify other clients that this user is now online
            broadcastUserStatus(userId, true);
          }
        }
        
        // Handle chat messages
        else if (data.type === 'chat' && ws.userId) {
          const chatMessage: ChatMessage = {
            type: 'chat',
            senderId: ws.userId,
            receiverId: data.receiverId,
            groupId: data.groupId,
            content: data.content
          };
          
          // Store the message in database
          const messageToSave = {
            senderId: ws.userId,
            receiverId: data.receiverId,
            groupId: data.groupId,
            content: data.content
          };
          
          try {
            const parsedMessage = insertMessageSchema.parse(messageToSave);
            const savedMessage = await storage.createMessage(parsedMessage);
            
            // For direct messages
            if (data.receiverId) {
              const receiverWs = clients.get(data.receiverId);
              if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
                receiverWs.send(JSON.stringify({
                  ...chatMessage,
                  id: savedMessage.id,
                  timestamp: savedMessage.timestamp
                }));
              }
            }
            // For group messages
            else if (data.groupId) {
              // Get all group members
              const groupMembers = await storage.getGroupMembers(data.groupId);
              
              // Send to all connected group members except sender
              groupMembers.forEach(member => {
                if (member.userId !== ws.userId) {
                  const memberWs = clients.get(member.userId);
                  if (memberWs && memberWs.readyState === WebSocket.OPEN) {
                    memberWs.send(JSON.stringify({
                      ...chatMessage,
                      id: savedMessage.id,
                      timestamp: savedMessage.timestamp
                    }));
                  }
                }
              });
            }
            
            // Send confirmation back to sender
            ws.send(JSON.stringify({
              type: 'message_sent',
              messageId: savedMessage.id,
              originalMessage: chatMessage
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid message format'
            }));
          }
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    ws.on('close', async () => {
      if (ws.userId) {
        await storage.updateUserOnlineStatus(ws.userId, false);
        clients.delete(ws.userId);
        
        // Notify other clients that this user is now offline
        broadcastUserStatus(ws.userId, false);
      }
    });
  });
  
  // Broadcasts a user's online status to all connected clients
  function broadcastUserStatus(userId: number, isOnline: boolean) {
    const statusUpdate = JSON.stringify({
      type: 'user_status',
      userId: userId,
      isOnline: isOnline
    });
    
    wss.clients.forEach((client: WebSocketClient) => {
      if (client.readyState === WebSocket.OPEN && client.userId !== userId) {
        client.send(statusUpdate);
      }
    });
  }
  
  // API routes
  
  // Users API
  app.get('/api/users', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
      const users = await storage.listUsers();
      // Don't send password hash
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users' });
    }
  });
  
  // Messages API
  app.get('/api/messages/:userId', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
      const currentUserId = req.user?.id;
      const otherUserId = parseInt(req.params.userId);
      
      if (!currentUserId || isNaN(otherUserId)) {
        return res.status(400).json({ message: 'Invalid user IDs' });
      }
      
      const messages = await storage.getMessages(currentUserId, otherUserId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching messages' });
    }
  });
  
  // Group Messages API
  app.get('/api/groups/:groupId/messages', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
      const groupId = parseInt(req.params.groupId);
      
      if (isNaN(groupId)) {
        return res.status(400).json({ message: 'Invalid group ID' });
      }
      
      // Check if user is in the group
      const isInGroup = await storage.isUserInGroup(req.user!.id, groupId);
      if (!isInGroup) {
        return res.status(403).json({ message: 'Not a member of this group' });
      }
      
      const messages = await storage.getGroupMessages(groupId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching group messages' });
    }
  });
  
  // Groups API
  app.get('/api/groups', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
      const groups = await storage.getGroupsByUserId(req.user!.id);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching groups' });
    }
  });
  
  app.post('/api/groups', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
      const groupData = {
        ...req.body,
        creatorId: req.user!.id
      };
      
      const parsedGroup = insertGroupSchema.parse(groupData);
      const group = await storage.createGroup(parsedGroup);
      
      // Add creator as group admin
      const groupMember = {
        groupId: group.id,
        userId: req.user!.id,
        isAdmin: true
      };
      await storage.addGroupMember(groupMember);
      
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ message: 'Invalid group data' });
    }
  });
  
  app.post('/api/groups/:groupId/members', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
      const groupId = parseInt(req.params.groupId);
      
      if (isNaN(groupId)) {
        return res.status(400).json({ message: 'Invalid group ID' });
      }
      
      // Check if current user is group admin
      const groupMembers = await storage.getGroupMembers(groupId);
      const isAdmin = groupMembers.some(member => 
        member.userId === req.user!.id && member.isAdmin
      );
      
      if (!isAdmin) {
        return res.status(403).json({ message: 'Only group admins can add members' });
      }
      
      const memberData = {
        groupId,
        userId: req.body.userId,
        isAdmin: req.body.isAdmin || false
      };
      
      // Check if user is already in the group
      const isAlreadyMember = await storage.isUserInGroup(req.body.userId, groupId);
      if (isAlreadyMember) {
        return res.status(400).json({ message: 'User is already a member of this group' });
      }
      
      const parsedMember = insertGroupMemberSchema.parse(memberData);
      const member = await storage.addGroupMember(parsedMember);
      
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ message: 'Invalid member data' });
    }
  });
  
  app.get('/api/groups/:groupId/members', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
      const groupId = parseInt(req.params.groupId);
      
      if (isNaN(groupId)) {
        return res.status(400).json({ message: 'Invalid group ID' });
      }
      
      // Check if user is in the group
      const isInGroup = await storage.isUserInGroup(req.user!.id, groupId);
      if (!isInGroup) {
        return res.status(403).json({ message: 'Not a member of this group' });
      }
      
      const members = await storage.getGroupMembers(groupId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching group members' });
    }
  });
  
  // Announcements API
  app.get('/api/announcements', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
      const announcements = await storage.getAnnouncementGroups();
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching announcements' });
    }
  });
  
  // Requests API
  app.get('/api/requests', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
      const requests = await storage.getUserRequests(req.user!.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching requests' });
    }
  });
  
  app.get('/api/requests/assigned', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
      const requests = await storage.getAssignedRequests(req.user!.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching assigned requests' });
    }
  });
  
  app.post('/api/requests', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
      const requestData = {
        ...req.body,
        creatorId: req.user!.id
      };
      
      const parsedRequest = insertRequestSchema.parse(requestData);
      const request = await storage.createRequest(parsedRequest);
      
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ message: 'Invalid request data' });
    }
  });
  
  app.patch('/api/requests/:requestId/status', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
      const requestId = parseInt(req.params.requestId);
      const { status } = req.body;
      
      if (isNaN(requestId) || !status) {
        return res.status(400).json({ message: 'Invalid request ID or status' });
      }
      
      // Check if status is valid
      if (!['pending', 'in-progress', 'completed', 'denied'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      const request = await storage.getRequest(requestId);
      
      // Check if request exists
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
      
      // Check if user is creator or assignee
      if (request.creatorId !== req.user!.id && request.assigneeId !== req.user!.id) {
        return res.status(403).json({ message: 'Not authorized to update this request' });
      }
      
      const updatedRequest = await storage.updateRequestStatus(requestId, status);
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: 'Error updating request status' });
    }
  });

  return httpServer;
}
