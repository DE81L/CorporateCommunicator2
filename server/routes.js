Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const http_1 = require("http");
const storage_1 = require("./storage");
const ws_1 = require("ws");
const auth_1 = require("./auth");
const schema_1 = require("../shared/electron-shared/schema");
const zod_1 = require("zod");
const db_1 = require("./db"); // Updated import
async function registerRoutes(app) {
    const httpServer = (0, http_1.createServer)(app);
    (0, auth_1.setupAuth)(app);
    // Add Wiki routes
    addWikiRoutes(app);
    // WebSocket setup
    const wss = new ws_1.WebSocketServer({
        server: httpServer,
        path: "/ws",
        port: undefined, // Let it use the HTTP server's port
    });
    wss.on("error", (error) => {
        console.error("WebSocket Server Error:", error);
    });
    const clients = new Map();
    wss.on("connection", (ws) => {
        ws.isAlive = true;
        ws.on("message", async (message) => {
            try {
                const data = JSON.parse(message.toString());
                if (data.type === "auth" && !isNaN(parseInt(data.userId))) {
                    ws.userId = parseInt(data.userId);
                    clients.set(ws.userId, ws);
                    await storage_1.storage.updateUserOnlineStatus(ws.userId, true);
                    broadcastUserStatus(ws.userId, true);
                }
            }
            catch (error) {
                ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
            }
        });
        ws.on("close", async () => {
            if (ws.userId) {
                await storage_1.storage.updateUserOnlineStatus(ws.userId, false);
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
            if (!db_1.pool) {
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
        }
        catch (error) {
            console.error("Error fetching users from SQL Server:", error);
            res.status(500).json({ message: "Error fetching users" });
        }
    });
    app.get("/api/random-user", async (req, res) => {
        try {
            const users = await storage_1.storage.listUsers();
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
        }
        catch (error) {
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
            const messages = await storage_1.storage.getDirectMessages(currentUserId, otherUserId);
            res.json(messages);
        }
        catch (error) {
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
            const isInGroup = await storage_1.storage.isUserInGroup(req.user.id, groupId);
            if (!isInGroup) {
                return res.status(403).json({ message: "Not a member of this group" });
            }
            const messages = await storage_1.storage.getMessages(groupId);
            res.json(messages);
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching group messages" });
        }
    });
    // Groups API
    app.get("/api/groups", async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).json({ message: "Unauthorized" });
        try {
            const groups = await storage_1.storage.getGroupsByUserId(req.user.id);
            res.json(groups);
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching groups" });
        }
    });
    app.post("/api/groups", async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).json({ message: "Unauthorized" });
        try {
            const groupData = {
                ...req.body,
                creatorId: req.user.id,
                isAnnouncement: schema_1.convertHelpers.toDbBoolean(req.body.isAnnouncement),
            };
            const parsedGroup = schema_1.insertGroupSchema.parse(groupData);
            const group = await storage_1.storage.createGroup(parsedGroup);
            res.status(201).json(group);
        }
        catch (error) {
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
            const groupMembers = await storage_1.storage.getGroupMembers(groupId);
            const isAdmin = groupMembers.some((member) => member.userId === req.user.id && member.isAdmin);
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
            const isAlreadyMember = await storage_1.storage.isUserInGroup(req.body.userId, groupId);
            if (isAlreadyMember) {
                return res
                    .status(400)
                    .json({ message: "User is already a member of this group" });
            }
            const parsedMember = schema_1.insertGroupMemberSchema.parse(memberData);
            const member = await storage_1.storage.addGroupMember(parsedMember);
            res.status(201).json(member);
        }
        catch (error) {
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
            const isInGroup = await storage_1.storage.isUserInGroup(req.user.id, groupId);
            if (!isInGroup) {
                return res.status(403).json({ message: "Not a member of this group" });
            }
            const members = await storage_1.storage.getGroupMembers(groupId);
            res.json(members);
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching group members" });
        }
    });
    // Announcements API
    app.get("/api/announcements", async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).json({ message: "Unauthorized" });
        try {
            const announcements = await storage_1.storage.getAnnouncementGroups();
            res.json(announcements);
        }
        catch (error) {
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
                creatorId: req.user.id,
            };
            const parsedRequest = schema_1.insertRequestSchema.parse(requestData);
            const request = await storage_1.storage.createRequest(parsedRequest);
            res.status(201).json(request);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: error.issues });
            }
            res.status(400).json({ message: "Invalid request data" });
        }
    });
    app.get("/api/requests", async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).json({ message: "Unauthorized" });
        try {
            const requests = await storage_1.storage.getUserRequests(req.user.id);
            res.json(requests);
        }
        catch (error) {
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
            if (grade !== undefined &&
                grade < 5 &&
                (!reviewText || reviewText.trim().length === 0)) {
                return res
                    .status(400)
                    .json({ message: "Review text required for grades below 5" });
            }
            const request = await storage_1.storage.getRequest(requestId);
            if (!request) {
                return res.status(404).json({ message: "Request not found" });
            }
            if (request.creatorId !== req.user.id &&
                request.assigneeId !== req.user.id) {
                return res
                    .status(403)
                    .json({ message: "Not authorized to update this request" });
            }
            const updatedRequest = await storage_1.storage.updateRequestComplete(requestId, {
                status: "completed",
                grade,
                reviewText: grade < 5 ? reviewText : null,
            });
            res.json(updatedRequest);
        }
        catch (error) {
            res.status(500).json({ message: "Error completing request" });
        }
    });
    // Helper function to broadcast user status
    function broadcastUserStatus(userId, isOnline) {
        const statusUpdate = JSON.stringify({
            type: "user_status",
            userId: userId,
            isOnline: isOnline,
        });
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN && client.userId !== userId) {
                client.send(statusUpdate);
            }
        });
    }
    return httpServer;
}
const getUsers = async () => {
    const result = await db_1.pool.query("SELECT * FROM users");
    return result.rows;
};
// Add explicit type annotations
const handleUserUpdate = async (user) => {
    // ... implementation
};
// Wiki API Routes - Add after existing routes
function addWikiRoutes(app) {
    // Wiki entries
    app.get("/api/wiki", async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).json({ message: "Unauthorized" });
        try {
            const entries = await storage_1.storage.listWikiEntries();
            res.json(entries);
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching wiki entries" });
        }
    });
    app.get("/api/wiki/:id", async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).json({ message: "Unauthorized" });
        try {
            const entryId = parseInt(req.params.id);
            if (isNaN(entryId)) {
                return res.status(400).json({ message: "Invalid entry ID" });
            }
            const entry = await storage_1.storage.getWikiEntry(entryId);
            if (!entry) {
                return res.status(404).json({ message: "Wiki entry not found" });
            }
            res.json(entry);
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching wiki entry" });
        }
    });
    app.post("/api/wiki", async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).json({ message: "Unauthorized" });
        try {
            // Only admins can create wiki entries
            const user = req.user;
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
            const parsedEntry = schema_1.insertWikiEntrySchema.parse(entryData);
            const entry = await storage_1.storage.createWikiEntry(parsedEntry);
            res.status(201).json(entry);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: error.issues });
            }
            res.status(400).json({ message: "Invalid wiki entry data" });
        }
    });
    app.put("/api/wiki/:id", async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).json({ message: "Unauthorized" });
        try {
            // Only admins can update wiki entries
            const user = req.user;
            if (!user || user.isAdmin !== 1) {
                return res.status(403).json({ message: "Admin privileges required" });
            }
            const entryId = parseInt(req.params.id);
            if (isNaN(entryId)) {
                return res.status(400).json({ message: "Invalid entry ID" });
            }
            const existingEntry = await storage_1.storage.getWikiEntry(entryId);
            if (!existingEntry) {
                return res.status(404).json({ message: "Wiki entry not found" });
            }
            const updateData = {
                ...req.body,
                lastEditorId: user.id,
                updatedAt: new Date().toISOString(),
            };
            const updatedEntry = await storage_1.storage.updateWikiEntry(entryId, updateData);
            res.json(updatedEntry);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: error.issues });
            }
            res.status(500).json({ message: "Error updating wiki entry" });
        }
    });
    app.delete("/api/wiki/:id", async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).json({ message: "Unauthorized" });
        try {
            // Only admins can delete wiki entries
            const user = req.user;
            if (!user || user.isAdmin !== 1) {
                return res.status(403).json({ message: "Admin privileges required" });
            }
            const entryId = parseInt(req.params.id);
            if (isNaN(entryId)) {
                return res.status(400).json({ message: "Invalid entry ID" });
            }
            const existingEntry = await storage_1.storage.getWikiEntry(entryId);
            if (!existingEntry) {
                return res.status(404).json({ message: "Wiki entry not found" });
            }
            await storage_1.storage.deleteWikiEntry(entryId);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ message: "Error deleting wiki entry" });
        }
    });
    // Wiki categories
    app.get("/api/wiki/categories", async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).json({ message: "Unauthorized" });
        try {
            const categories = await storage_1.storage.listWikiCategories();
            res.json(categories);
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching wiki categories" });
        }
    });
    app.get("/api/wiki/categories/:id", async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).json({ message: "Unauthorized" });
        try {
            const categoryId = parseInt(req.params.id);
            if (isNaN(categoryId)) {
                return res.status(400).json({ message: "Invalid category ID" });
            }
            const category = await storage_1.storage.getWikiCategory(categoryId);
            if (!category) {
                return res.status(404).json({ message: "Wiki category not found" });
            }
            res.json(category);
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching wiki category" });
        }
    });
    app.get("/api/wiki/categories/:id/entries", async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).json({ message: "Unauthorized" });
        try {
            const categoryId = parseInt(req.params.id);
            if (isNaN(categoryId)) {
                return res.status(400).json({ message: "Invalid category ID" });
            }
            const category = await storage_1.storage.getWikiCategory(categoryId);
            if (!category) {
                return res.status(404).json({ message: "Wiki category not found" });
            }
            const entries = await storage_1.storage.getWikiEntriesByCategory(category.name);
            res.json(entries);
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching category entries" });
        }
    });
    app.post("/api/wiki/categories", async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).json({ message: "Unauthorized" });
        try {
            // Only admins can create wiki categories
            const user = req.user;
            if (!user || user.isAdmin !== 1) {
                return res.status(403).json({ message: "Admin privileges required" });
            }
            const categoryData = {
                ...req.body,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const parsedCategory = schema_1.insertWikiCategorySchema.parse(categoryData);
            const category = await storage_1.storage.createWikiCategory(parsedCategory);
            res.status(201).json(category);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: error.issues });
            }
            res.status(400).json({ message: "Invalid wiki category data" });
        }
    });
    app.put("/api/wiki/categories/:id", async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).json({ message: "Unauthorized" });
        try {
            // Only admins can update wiki categories
            const user = req.user;
            if (!user || user.isAdmin !== 1) {
                return res.status(403).json({ message: "Admin privileges required" });
            }
            const categoryId = parseInt(req.params.id);
            if (isNaN(categoryId)) {
                return res.status(400).json({ message: "Invalid category ID" });
            }
            const existingCategory = await storage_1.storage.getWikiCategory(categoryId);
            if (!existingCategory) {
                return res.status(404).json({ message: "Wiki category not found" });
            }
            const updateData = {
                ...req.body,
                updatedAt: new Date().toISOString(),
            };
            const updatedCategory = await storage_1.storage.updateWikiCategory(categoryId, updateData);
            res.json(updatedCategory);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: error.issues });
            }
            res.status(500).json({ message: "Error updating wiki category" });
        }
    });
    app.delete("/api/wiki/categories/:id", async (req, res) => {
        if (!req.isAuthenticated())
            return res.status(401).json({ message: "Unauthorized" });
        try {
            // Only admins can delete wiki categories
            const user = req.user;
            if (!user || user.isAdmin !== 1) {
                return res.status(403).json({ message: "Admin privileges required" });
            }
            const categoryId = parseInt(req.params.id);
            if (isNaN(categoryId)) {
                return res.status(400).json({ message: "Invalid category ID" });
            }
            const existingCategory = await storage_1.storage.getWikiCategory(categoryId);
            if (!existingCategory) {
                return res.status(404).json({ message: "Wiki category not found" });
            }
            await storage_1.storage.deleteWikiCategory(categoryId);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ message: "Error deleting wiki category" });
        }
    });
}
