import { eq, and, desc, asc } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import { Store } from "express-session";

import * as schema from "../shared/electron-shared/schema"; import { checkColumnExists } from "./db";
import { hashPassword } from "./auth"; 
import { db } from "./db"; // Updated import

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<schema.User | undefined>;
  getUserByUsername(username: string): Promise<schema.User | undefined>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  createUser(user: schema.InsertUser): Promise<schema.User>;
  updateUserOnlineStatus(
    id: number,
    isOnline: boolean,
  ): Promise<schema.User | undefined>;
  listUsers(): Promise<schema.User[]>;

  // Message operations
  getMessage(id: number): Promise<schema.Message | undefined>;
  getDirectMessages(senderId: number, receiverId: number): Promise<schema.Message[]>;
  getMessages(groupId: number): Promise<schema.Message[]>;
  createMessage(message: schema.InsertMessage): Promise<schema.Message>;
  deleteMessage(id: number): Promise<void>;

  // Group operations
  getGroup(id: number): Promise<schema.Group | undefined>;
  createGroup(group: schema.InsertGroup): Promise<schema.Group>;
  listGroups(): Promise<schema.Group[]>;
  getGroupsByUserId(userId: number): Promise<schema.Group[]>;
  getAnnouncementGroups(): Promise<schema.Group[]>;

  // Group member operations
  addGroupMember(member: schema.InsertGroupMember): Promise<schema.GroupMember>;
  getGroupMembers(groupId: number): Promise<schema.GroupMember[]>;
  isUserInGroup(userId: number, groupId: number): Promise<boolean>;

  // Request operations
  getRequest(id: number): Promise<schema.Request | undefined>;
  createRequest(request: schema.InsertRequest): Promise<schema.Request>;
  updateRequestStatus(id: number, status: string): Promise<schema.Request | undefined>;
  getUserRequests(userId: number): Promise<schema.Request[]>;
  getAssignedRequests(userId: number): Promise<schema.Request[]>;
  listRequests(): Promise<schema.Request[]>;
  updateRequestComplete(
    id: number,
    updateFields: Partial<schema.Request>,
  ): Promise<schema.Request>;
  
  // Wiki operations
  getWikiEntry(id: number): Promise<schema.WikiEntry | undefined>;
  getWikiEntryByTitle(title: string): Promise<schema.WikiEntry | undefined>;
  createWikiEntry(entry: schema.InsertWikiEntry): Promise<schema.WikiEntry>;
  updateWikiEntry(id: number, entry: Partial<schema.WikiEntry>): Promise<schema.WikiEntry>;
  deleteWikiEntry(id: number): Promise<void>;
  listWikiEntries(): Promise<schema.WikiEntry[]>;
  getWikiEntriesByCategory(category: string): Promise<schema.WikiEntry[]>;
  
  // Wiki category operations
  getWikiCategory(id: number): Promise<schema.WikiCategory | undefined>;
  createWikiCategory(category: schema.InsertWikiCategory): Promise<schema.WikiCategory>;
  updateWikiCategory(id: number, category: Partial<schema.WikiCategory>): Promise<schema.WikiCategory>;
  deleteWikiCategory(id: number): Promise<void>;
  listWikiCategories(): Promise<schema.WikiCategory[]>;
  getWikiCategoriesByParent(parentId: number): Promise<schema.WikiCategory[]>;

  // Session store
  sessionStore: Store;
}

export class PgStorage implements IStorage {
  sessionStore: Store = new MemoryStore({ checkPeriod: 86400000 });

  // User operations
  async getUser(id: number) {
        // Check if the 'lastname' column exists in the 'users' table
    const columnExists = await checkColumnExists("users", "lastname");
    if (!columnExists) {
      throw new Error(
        "The 'lastname' column is missing from the 'users' table.",
      );
    }
    const result = await db.select().from(schema.users)
      .where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string) {
    const result = await db.select().from(schema.users)
      .where(eq(schema.users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string) {
    const result = await db.select().from(schema.users)
      .where(eq(schema.users.email, email));
    return result[0];
  }

  async createUser(insertUser: schema.InsertUser) {
    const hashedPassword = await hashPassword(insertUser.password);
    const userToInsert = { ...insertUser, password: hashedPassword };
    const result = await db.insert(schema.users)
      
      .values(userToInsert)
      .returning();
    return result[0];
  }

  async updateUserOnlineStatus(userId: number, isOnline: boolean) {
    const result = await db.update(schema.users)
      .set({ isOnline: schema.convertHelpers.toDbBoolean(isOnline) })
      .where(eq(schema.users.id, userId))
      .returning();
    return result[0];
  }

  async listUsers() {
    return await db.select().from(schema.users);
  }

  // Message operations
  async getMessage(id: number) {
    const result = await db.select().from(schema.messages)
      .where(eq(schema.messages.id, id));
    return result[0];
  }

  async getDirectMessages(senderId: number, receiverId: number) {
    return await db.select().from(schema.messages)
      .where(
        and(
          eq(schema.messages.senderId, senderId),
          eq(schema.messages.receiverId, receiverId)
        )
      )
      .orderBy(desc(schema.messages.timestamp));
  }

  async createMessage(insertMessage: schema.InsertMessage) {
    const result = await db.insert(schema.messages)
      .values({
        ...insertMessage,
        timestamp: schema.convertHelpers.toDbDate(new Date(insertMessage.timestamp))
      })
      .returning();
    return result[0];
  }

  async deleteMessage(id: number) {
    await db.delete(schema.messages)
      .where(eq(schema.messages.id, id));
  }

  // Group operations
  async getGroup(id: number) {
      const result = await db.select().from(schema.groups)
      .where(eq(schema.groups.id, id));
    return result[0];
  }

  async createGroup(insertGroup: schema.InsertGroup) {
    log("createGroup");
    const result = await db.insert(schema.groups)
      .values({
        ...insertGroup,
        isAnnouncement: schema.convertHelpers.toDbBoolean(!!insertGroup.isAnnouncement)
      })
      .returning();
    return result[0];
  }

  async listGroups() {
    return await db.select().from(schema.groups);
  }

  async getGroupsByUserId(userId: number) {
    log("getGroupsByUserId");
    const members = await db.select().from(schema.groupMembers)
      .where(eq(schema.groupMembers.userId, userId));
    
    const groupIds = members.map(m => m.groupId);
    return await db.select().from(schema.groups)
      .where(schema.groups.id.in(groupIds));
  }

  async getAnnouncementGroups() {
    log("getAnnouncementGroups");
    return await db.select().from(schema.groups)
      .where(eq(schema.groups.isAnnouncement, true));
  }

  // Group member operations
  async addGroupMember(insertMember: schema.InsertGroupMember) {
    const result = await db.insert(schema.groupMembers)
      .values({
        ...insertMember,
        isAdmin: schema.convertHelpers.toDbBoolean(!!insertMember.isAdmin)
      })
      .returning();
    return result[0];
  }

  async getGroupMembers(groupId: number) {
    return await db.select().from(schema.groupMembers)
      .where(eq(schema.groupMembers.groupId, groupId));
  }

  async isUserInGroup(userId: number, groupId: number) {
    const result = await db.select().from(schema.groupMembers)
      .where(
        and(
          eq(schema.groupMembers.userId, userId),
          eq(schema.groupMembers.groupId, groupId)
        )
      );
    return result.length > 0;
  }

  // Request operations
  async getRequest(id: number): Promise<schema.Request | undefined> {
    const result = await db.select().from(schema.requests)
      .where(eq(schema.requests.id, id));
    return result[0];
  }

  async createRequest(insertRequest: schema.InsertRequest): Promise<schema.Request> {
    const result = await db.insert(schema.requests)
      .values(insertRequest)
      .returning();
    return result[0];
  }

  async updateRequestStatus(id: number, status: string): Promise<schema.Request | undefined> {
    const result = await db.update(schema.requests)
      .set({ requestStatus: status })
      .where(eq(schema.requests.id, id))
      .returning();
    return result[0];
  }

  async getUserRequests(userId: number): Promise<schema.Request[]> {
    return await db.select().from(schema.requests)
      .where(eq(schema.requests.creatorId, userId))
      .orderBy(desc(schema.requests.createdAt));
  }

  async getAssignedRequests(userId: number): Promise<schema.Request[]> {
    log("getAssignedRequests");
    return await db.select().from(schema.requests)
      .where(eq(schema.requests.assigneeId, userId))
      .orderBy(desc(schema.requests.createdAt));
  }

  async listRequests(): Promise<schema.Request[]> {
    return await db.select().from(schema.requests)
      .orderBy(desc(schema.requests.createdAt));
  }

  async updateRequestComplete(
    requestId: number,
    updateFields: Partial<schema.Request>,
  ): Promise<schema.Request> {
    const result = await db.update(schema.requests)
      .set(updateFields)
      .where(eq(schema.requests.id, requestId))
      .returning();
    return result[0];
  }

  // Wiki operations
  async getWikiEntry(id: number) {
    const result = await db.select().from(schema.wikiEntries)
      .where(eq(schema.wikiEntries.id, id));
    return result[0];
  }

  async createWikiEntry(insertEntry: schema.InsertWikiEntry) {
    log("createWikiEntry");
    const now = schema.convertHelpers.toDbDate(new Date());
    const result = await db.insert(schema.wikiEntries)
      .values({
        ...insertEntry,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return result[0];
  }

  async updateWikiEntry(id: number, updateFields: Partial<schema.WikiEntry>) {
    const result = await db.update(schema.wikiEntries)
      .set({
        ...updateFields,
        updatedAt: schema.convertHelpers.toDbDate(new Date())
      })
      .where(eq(schema.wikiEntries.id, id))
      .returning();
    return result[0];
  }

  async deleteWikiEntry(id: number) {
    await db.delete(schema.wikiEntries)
      .where(eq(schema.wikiEntries.id, id));
  }

  async listWikiEntries() {
    return await db.select().from(schema.wikiEntries)
      .orderBy(asc(schema.wikiEntries.title));
  }

  async getWikiEntriesByCategory(category: string) {
    log("getWikiEntriesByCategory");
    return await db.select().from(schema.wikiEntries)
      .where(eq(schema.wikiEntries.category, category))
      .orderBy(asc(schema.wikiEntries.title));
  }

  // Wiki category operations
  async getWikiCategory(id: number): Promise<schema.WikiCategory | undefined> {
    const result = await db.select().from(schema.wikiCategories)
      .where(eq(schema.wikiCategories.id, id));
    return result[0];
  }

  async createWikiCategory(insertCategory: schema.InsertWikiCategory): Promise<schema.WikiCategory> {
    const result = await db.insert(schema.wikiCategories)
      .values(insertCategory)
      .returning();
    return result[0];
  }

  async updateWikiCategory(id: number, updateFields: Partial<schema.WikiCategory>): Promise<schema.WikiCategory> {
    const result = await db.update(schema.wikiCategories)
      .set(updateFields)
      .where(eq(schema.wikiCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteWikiCategory(id: number): Promise<void> {
    await db.delete(schema.wikiCategories)
      .where(eq(schema.wikiCategories.id, id));
  }

  async listWikiCategories(): Promise<schema.WikiCategory[]> {
    return await db.select().from(schema.wikiCategories)
      .orderBy(asc(schema.wikiCategories.name));
  }

  async getWikiCategoriesByParent(parentId: number): Promise<schema.WikiCategory[]> {
      log("getWikiCategoriesByParent");
    return await db.select().from(schema.wikiCategories)
      .where(eq(schema.wikiCategories.parentId, parentId))
      .orderBy(asc(schema.wikiCategories.name));
  }
}

export const storage = new PgStorage();
