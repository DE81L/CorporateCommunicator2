import {
  users,
  type User,
  type InsertUser,
  messages,
  type Message,
  type InsertMessage,
  groups,
  type Group,
  type InsertGroup,
  groupMembers,
  type GroupMember,
  type InsertGroupMember,
  requests,
  type Request,
  type InsertRequest,
  wikiEntries,
  type WikiEntry,
  type InsertWikiEntry,
  wikiCategories,
  type WikiCategory,
  type InsertWikiCategory,
  convertHelpers,
  NULL_NUMBER,
  NULL_TEXT,
  NULL_DATE,
} from "../shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { Store } from "express-session";
import { v4 as uuidv4 } from "uuid";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnlineStatus(
    id: number,
    isOnline: boolean,
  ): Promise<User | undefined>;
  listUsers(): Promise<User[]>;

  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getDirectMessages(senderId: number, receiverId: number): Promise<Message[]>;
  getMessages(groupId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: number): Promise<void>;

  // Group operations
  getGroup(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  listGroups(): Promise<Group[]>;
  getGroupsByUserId(userId: number): Promise<Group[]>;
  getAnnouncementGroups(): Promise<Group[]>;

  // Group member operations
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  isUserInGroup(userId: number, groupId: number): Promise<boolean>;

  // Request operations
  getRequest(id: number): Promise<Request | undefined>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequestStatus(id: number, status: string): Promise<Request | undefined>;
  getUserRequests(userId: number): Promise<Request[]>;
  getAssignedRequests(userId: number): Promise<Request[]>;
  listRequests(): Promise<Request[]>;
  updateRequestComplete(
    id: number,
    updateFields: Partial<Request>,
  ): Promise<Request>;
  
  // Wiki operations
  getWikiEntry(id: number): Promise<WikiEntry | undefined>;
  getWikiEntryByTitle(title: string): Promise<WikiEntry | undefined>;
  createWikiEntry(entry: InsertWikiEntry): Promise<WikiEntry>;
  updateWikiEntry(id: number, entry: Partial<WikiEntry>): Promise<WikiEntry>;
  deleteWikiEntry(id: number): Promise<void>;
  listWikiEntries(): Promise<WikiEntry[]>;
  getWikiEntriesByCategory(category: string): Promise<WikiEntry[]>;
  
  // Wiki category operations
  getWikiCategory(id: number): Promise<WikiCategory | undefined>;
  createWikiCategory(category: InsertWikiCategory): Promise<WikiCategory>;
  updateWikiCategory(id: number, category: Partial<WikiCategory>): Promise<WikiCategory>;
  deleteWikiCategory(id: number): Promise<void>;
  listWikiCategories(): Promise<WikiCategory[]>;
  getWikiCategoriesByParent(parentId: number): Promise<WikiCategory[]>;

  // Session store
  sessionStore: Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private groups: Map<number, Group>;
  private groupMembers: Map<number, GroupMember>;
  private requests: Map<number, Request>;
  private wikiEntries: Map<number, WikiEntry>;
  private wikiCategories: Map<number, WikiCategory>;

  sessionStore: Store;
  currentUserId: number = 1;
  currentMessageId: number = 1;
  currentGroupId: number = 1;
  currentGroupMemberId: number = 1;
  currentRequestId: number = 1;
  currentWikiEntryId: number = 1;
  currentWikiCategoryId: number = 1;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.requests = new Map();
    this.wikiEntries = new Map();
    this.wikiCategories = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Create some default users for testing
    this.createUser({
      firstName: "John",
      lastName: "Doe",
      username: "johndoe",
      email: "john.doe@example.com",
      password: "password",
    });
    this.createUser({
      firstName: "Jane",
      lastName: "Smith",
      username: "janesmith",
      email: "jane.smith@example.com",
      password: "password",
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      isOnline: convertHelpers.toDbBoolean(false),
      avatarUrl: NULL_TEXT,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserOnlineStatus(
    userId: number,
    isOnline: boolean,
  ): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = {
      ...user,
      isOnline: convertHelpers.toDbBoolean(isOnline),
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getDirectMessages(senderId: number, receiverId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(
        (msg) =>
          (msg.senderId === senderId && msg.receiverId === receiverId) ||
          (msg.senderId === receiverId && msg.receiverId === senderId),
      )
      .sort((a, b) => convertHelpers.compareDates(a.timestamp, b.timestamp));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: convertHelpers.toDbDate(new Date(insertMessage.timestamp)),
      isRead: convertHelpers.toDbBoolean(!!insertMessage.isRead),
      receiverId: insertMessage.receiverId ?? null,
      groupId: insertMessage.groupId ?? null,
    };
    this.messages.set(id, message);
    return message;
  }

  async deleteMessage(id: number): Promise<void> {
    this.messages.delete(id);
  }

  // Group operations
  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.currentGroupId++;
    const group: Group = {
      ...insertGroup,
      id,
      description: insertGroup.description ?? NULL_TEXT,
      isAnnouncement: convertHelpers.toDbBoolean(!!insertGroup.isAnnouncement),
    };
    this.groups.set(id, group);
    return group;
  }

  async listGroups(): Promise<Group[]> {
    return Array.from(this.groups.values());
  }

  async getGroupsByUserId(userId: number): Promise<Group[]> {
    const userGroupIds = new Set(
      Array.from(this.groupMembers.values())
        .filter((member) => member.userId === userId)
        .map((member) => member.groupId),
    );

    return Array.from(this.groups.values()).filter((group) =>
      userGroupIds.has(group.id),
    );
  }

  async getAnnouncementGroups(): Promise<Group[]> {
    return Array.from(this.groups.values()).filter(
      (group) => group.isAnnouncement,
    );
  }

  // Group member operations
  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const id = this.currentGroupMemberId++;
    const member: GroupMember = {
      ...insertMember,
      id,
      isAdmin: convertHelpers.toDbBoolean(!!(insertMember.isAdmin ?? false)),
    };
    this.groupMembers.set(id, member);
    return member;
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values()).filter(
      (member) => member.groupId === groupId,
    );
  }

  async isUserInGroup(userId: number, groupId: number): Promise<boolean> {
    return Array.from(this.groupMembers.values()).some(
      (member) => member.userId === userId && member.groupId === groupId,
    );
  }

  // Request operations
  async getRequest(id: number): Promise<Request | undefined> {
    return this.requests.get(id);
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const id = this.currentRequestId++;
    const now = convertHelpers.toDbDate(new Date());

    const newRequest: Request = {
      ...insertRequest,
      id,
      createdAt: now,
      updatedAt: now,
      deadline: insertRequest.deadline ?? NULL_DATE,
      category: insertRequest.category ?? NULL_TEXT,
      requestStatus: insertRequest.requestStatus ?? "new",
      assigneeId: insertRequest.assigneeId ?? null,
      whoAccepted: insertRequest.whoAccepted ?? NULL_TEXT,
      subdivision: insertRequest.subdivision ?? NULL_TEXT,
      grade: insertRequest.grade ?? null,
      reviewText: insertRequest.reviewText ?? NULL_TEXT,
    };

    this.requests.set(id, newRequest);
    return newRequest;
  }

  async updateRequestStatus(
    id: number,
    status: string,
  ): Promise<Request | undefined> {
    const request = await this.getRequest(id);
    if (request) {
      const updatedRequest = {
        ...request,
        requestStatus: status,
        updatedAt: convertHelpers.toDbDate(new Date()),
      };
      this.requests.set(id, updatedRequest);
      return updatedRequest;
    }
    return undefined;
  }

  async getUserRequests(userId: number): Promise<Request[]> {
    return Array.from(this.requests.values())
      .filter((request) => request.creatorId === userId)
      .sort((a, b) => convertHelpers.compareDates(b.createdAt, a.createdAt));
  }

  async getAssignedRequests(userId: number): Promise<Request[]> {
    return Array.from(this.requests.values())
      .filter((request) => request.assigneeId === userId)
      .sort((a, b) => convertHelpers.compareDates(b.createdAt, a.createdAt));
  }

  async listRequests(): Promise<Request[]> {
    return Array.from(this.requests.values()).sort((a, b) =>
      convertHelpers.compareDates(b.createdAt, a.createdAt),
    );
  }

  async updateRequestComplete(
    requestId: number,
    updateFields: Partial<Request>,
  ): Promise<Request> {
    const request = await this.getRequest(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const updatedRequest = {
      ...request,
      ...updateFields,
      updatedAt: convertHelpers.toDbDate(new Date()),
    };

    this.requests.set(requestId, updatedRequest);
    return updatedRequest;
  }

  // Fix date comparisons
  private compareDates(a: string, b: string): number {
    return new Date(a).getTime() - new Date(b).getTime();
  }

  // Get messages for a group
  async getMessages(groupId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.groupId === groupId)
      .sort((a, b) => this.compareDates(a.timestamp, b.timestamp));
  }

  // Wiki Entry operations
  async getWikiEntry(id: number): Promise<WikiEntry | undefined> {
    return this.wikiEntries.get(id);
  }

  async getWikiEntryByTitle(title: string): Promise<WikiEntry | undefined> {
    return Array.from(this.wikiEntries.values()).find(
      (entry) => entry.title.toLowerCase() === title.toLowerCase()
    );
  }

  async createWikiEntry(insertEntry: InsertWikiEntry): Promise<WikiEntry> {
    const id = this.currentWikiEntryId++;
    const now = convertHelpers.toDbDate(new Date());
    
    const entry: WikiEntry = {
      ...insertEntry,
      id,
      createdAt: now,
      updatedAt: now,
      category: insertEntry.category ?? NULL_TEXT,
    };
    
    this.wikiEntries.set(id, entry);
    return entry;
  }

  async updateWikiEntry(id: number, updateFields: Partial<WikiEntry>): Promise<WikiEntry> {
    const entry = await this.getWikiEntry(id);
    if (!entry) {
      throw new Error("Wiki entry not found");
    }
    
    const updatedEntry = {
      ...entry,
      ...updateFields,
      updatedAt: convertHelpers.toDbDate(new Date()),
    };
    
    this.wikiEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteWikiEntry(id: number): Promise<void> {
    this.wikiEntries.delete(id);
  }

  async listWikiEntries(): Promise<WikiEntry[]> {
    return Array.from(this.wikiEntries.values()).sort((a, b) => 
      a.title.localeCompare(b.title)
    );
  }

  async getWikiEntriesByCategory(category: string): Promise<WikiEntry[]> {
    return Array.from(this.wikiEntries.values())
      .filter(entry => entry.category === category)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  // Wiki Category operations
  async getWikiCategory(id: number): Promise<WikiCategory | undefined> {
    return this.wikiCategories.get(id);
  }

  async createWikiCategory(insertCategory: InsertWikiCategory): Promise<WikiCategory> {
    const id = this.currentWikiCategoryId++;
    const now = convertHelpers.toDbDate(new Date());
    
    const category: WikiCategory = {
      ...insertCategory,
      id,
      createdAt: now,
      updatedAt: now,
      description: insertCategory.description ?? NULL_TEXT,
      parentId: insertCategory.parentId ?? NULL_NUMBER,
    };
    
    this.wikiCategories.set(id, category);
    return category;
  }

  async updateWikiCategory(id: number, updateFields: Partial<WikiCategory>): Promise<WikiCategory> {
    const category = await this.getWikiCategory(id);
    if (!category) {
      throw new Error("Wiki category not found");
    }
    
    const updatedCategory = {
      ...category,
      ...updateFields,
      updatedAt: convertHelpers.toDbDate(new Date()),
    };
    
    this.wikiCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteWikiCategory(id: number): Promise<void> {
    this.wikiCategories.delete(id);
  }

  async listWikiCategories(): Promise<WikiCategory[]> {
    return Array.from(this.wikiCategories.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  async getWikiCategoriesByParent(parentId: number): Promise<WikiCategory[]> {
    return Array.from(this.wikiCategories.values())
      .filter(category => category.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

export const storage = new MemStorage();
