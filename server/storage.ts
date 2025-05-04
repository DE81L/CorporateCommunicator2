// server/storage.ts

import { eq, and, desc, asc, inArray } from 'drizzle-orm';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { Store } from 'express-session';

import * as schema from "../shared/electron-shared/schema";
import { db, pool } from './db';

const MemoryStore = createMemoryStore(session);

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */

export interface IStorage {
  // ─── Users ────────────────────────────────────────────────────────────────
  getUser(id: number): Promise<schema.User | undefined>;
  getUserByUsername(username: string): Promise<schema.User | undefined>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  createUser(user: schema.InsertUser): Promise<schema.User>;
  updateUserOnlineStatus(id: number, isOnline: boolean): Promise<schema.User>;
  listUsers(): Promise<schema.User[]>;

  // ─── Messages ─────────────────────────────────────────────────────────────
  getMessage(id: number): Promise<schema.Message | undefined>;
  getDirectMessages(senderId: number, receiverId: number): Promise<schema.Message[]>;
  createMessage(message: schema.InsertMessage): Promise<schema.Message>;
  deleteMessage(id: number): Promise<void>;
  markDelivered(messageId: number): Promise<void>;
  markDeliveredBulk(messageIds: number[]): Promise<void>;
  getUndelivered(userId: number): Promise<schema.Message[]>;

  // ─── Groups ───────────────────────────────────────────────────────────────
  getGroup(id: number): Promise<schema.Group | undefined>;
  createGroup(group: schema.InsertGroup): Promise<schema.Group>;
  listGroups(): Promise<schema.Group[]>;
  getGroupsByUserId(userId: number): Promise<schema.Group[]>;

  // ─── Group members ────────────────────────────────────────────────────────
  addGroupMember(member: schema.InsertGroupMember): Promise<schema.GroupMember>;
  getGroupMembers(groupId: number): Promise<schema.GroupMember[]>;
  isUserInGroup(userId: number, groupId: number): Promise<boolean>;

  // ─── Requests (help-desk) ─────────────────────────────────────────────────
  getRequest(id: number): Promise<schema.Request | undefined>;
  createRequest(request: schema.InsertRequest): Promise<schema.Request>;
  updateRequestStatus(id: number, status: string): Promise<schema.Request>;
  getUserRequests(userId: number): Promise<schema.Request[]>;

  // ─── Wiki ────────────────────────────────────────────────────────────────
  getWikiEntry(id: number): Promise<schema.WikiEntry | undefined>;
  createWikiEntry(entry: schema.InsertWikiEntry): Promise<schema.WikiEntry>;
  updateWikiEntry(id: number, entry: Partial<schema.WikiEntry>): Promise<schema.WikiEntry>;

  // ─── Subdivisions ────────────────────────────────────────────────────────
  listSubdivisions(): Promise<any[]>;
  getSubdivision(id: number): Promise<any | null>;

  /* session store for express-session */
  sessionStore: Store;
}

/* -------------------------------------------------------------------------- */
/*  IMPLEMENTATION                                                            */
/* -------------------------------------------------------------------------- */

export class PgStorage implements IStorage {
  /* express-session store (one day prune) */
  public sessionStore: Store = new MemoryStore({ checkPeriod: 86_400_000 });

  /* ───────────── Users ───────────────── */

  async getUser(id: number) {
    return (await db.select().from(schema.users).where(eq(schema.users.id, id)))[0];
  }

  async getUserByUsername(username: string) {
    return (await db.select().from(schema.users).where(eq(schema.users.username, username)))[0];
  }

  async getUserByEmail(email: string) {
    return (await db.select().from(schema.users).where(eq(schema.users.email, email)))[0];
  }

  async createUser(user: schema.InsertUser) {
    const [created] = await db.insert(schema.users)
      .values(user)
      .returning();
    return created;
  }

  async updateUserOnlineStatus(id: number, isOnline: boolean) {
    const [u] = await db.update(schema.users)
      .set({ isOnline: schema.convertHelpers.toDbBoolean(isOnline) })
      .where(eq(schema.users.id, id))
      .returning();
    return u;
  }

  listUsers() {
    return db.select().from(schema.users);
  }

  /* ───────────── Messages ────────────── */

  async getMessage(id: number) {
    return (await db.select().from(schema.messages).where(eq(schema.messages.id, id)))[0];
  }

  getDirectMessages(senderId: number, receiverId: number) {
    return db.select().from(schema.messages)
      .where(and(
        eq(schema.messages.senderId, senderId),
        eq(schema.messages.receiverId, receiverId),
      ))
      .orderBy(desc(schema.messages.timestamp));
  }

  async createMessage(message: schema.InsertMessage) {
    const [m] = await db.insert(schema.messages)
      .values({ ...message, timestamp: schema.convertHelpers.toDbDate(new Date()) })
      .returning();
    return m;
  }

  deleteMessage(id: number) {
    return db.delete(schema.messages).where(eq(schema.messages.id, id));
  }

  async markDelivered(messageId: number) {
    return db.update(schema.messages)
      .set({ status: 'delivered' })
      .where(eq(schema.messages.id, messageId));
  }

  async markDeliveredBulk(messageIds: number[]) {
    return db.update(schema.messages)
      .set({ status: 'delivered' })
      .where(inArray(schema.messages.id, messageIds));
  }

  async getUndelivered(userId: number) {
    return db.select()
      .from(schema.messages)
      .where(and(
        eq(schema.messages.receiverId, userId),
        eq(schema.messages.status, 'pending')
      ));
  }

  /* ───────────── Groups ──────────────── */

  async getGroup(id: number) {
    return (await db.select().from(schema.groups).where(eq(schema.groups.id, id)))[0];
  }

  async createGroup(group: schema.InsertGroup) {
    const [g] = await db.insert(schema.groups)
      .values({ ...group, isAnnouncement: schema.convertHelpers.toDbBoolean(!!group.isAnnouncement) })
      .returning();
    return g;
  }

  listGroups() {
    return db.select().from(schema.groups);
  }

  async getGroupsByUserId(userId: number) {
    const members = await db.select().from(schema.groupMembers)
      .where(eq(schema.groupMembers.userId, userId));

    return db.select().from(schema.groups)
      .where(inArray(schema.groups.id, members.map(m => m.groupId)));
  }

  /* ───────────── Group members ───────── */

  async addGroupMember(member: schema.InsertGroupMember) {
    const [gm] = await db.insert(schema.groupMembers)
      .values({ ...member, isAdmin: schema.convertHelpers.toDbBoolean(!!member.isAdmin) })
      .returning();
    return gm;
  }

  getGroupMembers(groupId: number) {
    return db.select().from(schema.groupMembers)
      .where(eq(schema.groupMembers.groupId, groupId));
  }

  async isUserInGroup(userId: number, groupId: number) {
    const found = await db.select().from(schema.groupMembers)
      .where(and(
        eq(schema.groupMembers.userId, userId),
        eq(schema.groupMembers.groupId, groupId),
      ));
    return found.length > 0;
  }

  /* ───────────── Requests ────────────── */

  async getRequest(id: number) {
    return (await db.select().from(schema.requests).where(eq(schema.requests.id, id)))[0];
  }

  async createRequest(r: schema.InsertRequest) {
    const [req] = await db.insert(schema.requests).values(r).returning();
   return req;
  }

  async updateRequestStatus(id: number, status: string) {
    const [req] = await db.update(schema.requests)
      .set({ requestStatus: status })
      .where(eq(schema.requests.id, id))
      .returning();
    return req;
  }

  async getUserRequests(userId: number) {
    return db.select().from(schema.requests).where(eq(schema.requests.senderId, userId));
  }

  /* ───────────── Wiki ────────────────── */

  async getWikiEntry(id: number) {
    return (await db.select().from(schema.wikiEntries).where(eq(schema.wikiEntries.id, id)))[0];
  }

  async createWikiEntry(entry: schema.InsertWikiEntry) {
    const now = new Date();
    const [e] = await db.insert(schema.wikiEntries)
      .values({ ...entry, createdAt: now, updatedAt: now })
      .returning();
    return e;
  }

  async updateWikiEntry(id: number, patch: Partial<schema.WikiEntry>) {
    const [e] = await db.update(schema.wikiEntries)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(schema.wikiEntries.id, id))
      .returning();
    return e;
  }

  /* ───────────── Subdivisions ────────── */

  async listSubdivisions() {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        parent_id as "parentId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM subdivisions
      ORDER BY name ASC
    `);
    return result.rows;
  }

  async getSubdivision(id: number) {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        parent_id as "parentId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM subdivisions 
      WHERE id = $1
    `, [id]);
    return result.rows[0] || null;
  }
}

/* singleton */
export const storage = new PgStorage();
