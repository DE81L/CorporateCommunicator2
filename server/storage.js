"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.PgStorage = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const express_session_1 = __importDefault(require("express-session"));
const memorystore_1 = __importDefault(require("memorystore"));
const schema = __importStar(require("../shared/electron-shared/schema"));
const db_1 = require("./db");
const MemoryStore = (0, memorystore_1.default)(express_session_1.default);
class PgStorage {
    constructor() {
        this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
    }
    // User operations
    async getUser(id) {
        const result = await db_1.db.select().from(schema.users)
            .where((0, drizzle_orm_1.eq)(schema.users.id, id));
        return result[0];
    }
    async getUserByUsername(username) {
        const result = await db_1.db.select().from(schema.users)
            .where((0, drizzle_orm_1.eq)(schema.users.username, username));
        return result[0];
    }
    async getUserByEmail(email) {
        const result = await db_1.db.select().from(schema.users)
            .where((0, drizzle_orm_1.eq)(schema.users.email, email));
        return result[0];
    }
    async createUser(insertUser) {
        const result = await db_1.db.insert(schema.users)
            .values(insertUser)
            .returning();
        return result[0];
    }
    async updateUserOnlineStatus(userId, isOnline) {
        const result = await db_1.db.update(schema.users)
            .set({ isOnline: schema.convertHelpers.toDbBoolean(isOnline) })
            .where((0, drizzle_orm_1.eq)(schema.users.id, userId))
            .returning();
        return result[0];
    }
    async listUsers() {
        return await db_1.db.select().from(schema.users);
    }
    // Message operations
    async getMessage(id) {
        const result = await db_1.db.select().from(schema.messages)
            .where((0, drizzle_orm_1.eq)(schema.messages.id, id));
        return result[0];
    }
    async getDirectMessages(senderId, receiverId) {
        return await db_1.db.select().from(schema.messages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.messages.senderId, senderId), (0, drizzle_orm_1.eq)(schema.messages.receiverId, receiverId)))
            .orderBy((0, drizzle_orm_1.desc)(schema.messages.timestamp));
    }
    async createMessage(insertMessage) {
        const result = await db_1.db.insert(schema.messages)
            .values({
            ...insertMessage,
            timestamp: schema.convertHelpers.toDbDate(new Date(insertMessage.timestamp))
        })
            .returning();
        return result[0];
    }
    async deleteMessage(id) {
        await db_1.db.delete(schema.messages)
            .where((0, drizzle_orm_1.eq)(schema.messages.id, id));
    }
    // Group operations
    async getGroup(id) {
        const result = await db_1.db.select().from(schema.groups)
            .where((0, drizzle_orm_1.eq)(schema.groups.id, id));
        return result[0];
    }
    async createGroup(insertGroup) {
        const result = await db_1.db.insert(schema.groups)
            .values({
            ...insertGroup,
            isAnnouncement: schema.convertHelpers.toDbBoolean(!!insertGroup.isAnnouncement)
        })
            .returning();
        return result[0];
    }
    async listGroups() {
        return await db_1.db.select().from(schema.groups);
    }
    async getGroupsByUserId(userId) {
        const members = await db_1.db.select().from(schema.groupMembers)
            .where((0, drizzle_orm_1.eq)(schema.groupMembers.userId, userId));
        const groupIds = members.map(m => m.groupId);
        return await db_1.db.select().from(schema.groups)
            .where(schema.groups.id.in(groupIds));
    }
    async getAnnouncementGroups() {
        return await db_1.db.select().from(schema.groups)
            .where((0, drizzle_orm_1.eq)(schema.groups.isAnnouncement, true));
    }
    // Group member operations
    async addGroupMember(insertMember) {
        const result = await db_1.db.insert(schema.groupMembers)
            .values({
            ...insertMember,
            isAdmin: schema.convertHelpers.toDbBoolean(!!insertMember.isAdmin)
        })
            .returning();
        return result[0];
    }
    async getGroupMembers(groupId) {
        return await db_1.db.select().from(schema.groupMembers)
            .where((0, drizzle_orm_1.eq)(schema.groupMembers.groupId, groupId));
    }
    async isUserInGroup(userId, groupId) {
        const result = await db_1.db.select().from(schema.groupMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.groupMembers.userId, userId), (0, drizzle_orm_1.eq)(schema.groupMembers.groupId, groupId)));
        return result.length > 0;
    }
    // Request operations
    async getRequest(id) {
        const result = await db_1.db.select().from(schema.requests)
            .where((0, drizzle_orm_1.eq)(schema.requests.id, id));
        return result[0];
    }
    async createRequest(insertRequest) {
        const result = await db_1.db.insert(schema.requests)
            .values(insertRequest)
            .returning();
        return result[0];
    }
    async updateRequestStatus(id, status) {
        const result = await db_1.db.update(schema.requests)
            .set({ requestStatus: status })
            .where((0, drizzle_orm_1.eq)(schema.requests.id, id))
            .returning();
        return result[0];
    }
    async getUserRequests(userId) {
        return await db_1.db.select().from(schema.requests)
            .where((0, drizzle_orm_1.eq)(schema.requests.creatorId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema.requests.createdAt));
    }
    async getAssignedRequests(userId) {
        return await db_1.db.select().from(schema.requests)
            .where((0, drizzle_orm_1.eq)(schema.requests.assigneeId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema.requests.createdAt));
    }
    async listRequests() {
        return await db_1.db.select().from(schema.requests)
            .orderBy((0, drizzle_orm_1.desc)(schema.requests.createdAt));
    }
    async updateRequestComplete(requestId, updateFields) {
        const result = await db_1.db.update(schema.requests)
            .set(updateFields)
            .where((0, drizzle_orm_1.eq)(schema.requests.id, requestId))
            .returning();
        return result[0];
    }
    // Wiki operations
    async getWikiEntry(id) {
        const result = await db_1.db.select().from(schema.wikiEntries)
            .where((0, drizzle_orm_1.eq)(schema.wikiEntries.id, id));
        return result[0];
    }
    async createWikiEntry(insertEntry) {
        const now = schema.convertHelpers.toDbDate(new Date());
        const result = await db_1.db.insert(schema.wikiEntries)
            .values({
            ...insertEntry,
            createdAt: now,
            updatedAt: now
        })
            .returning();
        return result[0];
    }
    async updateWikiEntry(id, updateFields) {
        const result = await db_1.db.update(schema.wikiEntries)
            .set({
            ...updateFields,
            updatedAt: schema.convertHelpers.toDbDate(new Date())
        })
            .where((0, drizzle_orm_1.eq)(schema.wikiEntries.id, id))
            .returning();
        return result[0];
    }
    async deleteWikiEntry(id) {
        await db_1.db.delete(schema.wikiEntries)
            .where((0, drizzle_orm_1.eq)(schema.wikiEntries.id, id));
    }
    async listWikiEntries() {
        return await db_1.db.select().from(schema.wikiEntries)
            .orderBy((0, drizzle_orm_1.asc)(schema.wikiEntries.title));
    }
    async getWikiEntriesByCategory(category) {
        return await db_1.db.select().from(schema.wikiEntries)
            .where((0, drizzle_orm_1.eq)(schema.wikiEntries.category, category))
            .orderBy((0, drizzle_orm_1.asc)(schema.wikiEntries.title));
    }
    // Wiki category operations
    async getWikiCategory(id) {
        const result = await db_1.db.select().from(schema.wikiCategories)
            .where((0, drizzle_orm_1.eq)(schema.wikiCategories.id, id));
        return result[0];
    }
    async createWikiCategory(insertCategory) {
        const result = await db_1.db.insert(schema.wikiCategories)
            .values(insertCategory)
            .returning();
        return result[0];
    }
    async updateWikiCategory(id, updateFields) {
        const result = await db_1.db.update(schema.wikiCategories)
            .set(updateFields)
            .where((0, drizzle_orm_1.eq)(schema.wikiCategories.id, id))
            .returning();
        return result[0];
    }
    async deleteWikiCategory(id) {
        await db_1.db.delete(schema.wikiCategories)
            .where((0, drizzle_orm_1.eq)(schema.wikiCategories.id, id));
    }
    async listWikiCategories() {
        return await db_1.db.select().from(schema.wikiCategories)
            .orderBy((0, drizzle_orm_1.asc)(schema.wikiCategories.name));
    }
    async getWikiCategoriesByParent(parentId) {
        return await db_1.db.select().from(schema.wikiCategories)
            .where((0, drizzle_orm_1.eq)(schema.wikiCategories.parentId, parentId))
            .orderBy((0, drizzle_orm_1.asc)(schema.wikiCategories.name));
    }
}
exports.PgStorage = PgStorage;
exports.storage = new PgStorage();
