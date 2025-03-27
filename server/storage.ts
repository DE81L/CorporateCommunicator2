import { 
  users, type User, type InsertUser,
  messages, type Message, type InsertMessage,
  groups, type Group, type InsertGroup,
  groupMembers, type GroupMember, type InsertGroupMember,
  requests, type Request, type InsertRequest
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnlineStatus(id: number, isOnline: boolean): Promise<User | undefined>;
  listUsers(): Promise<User[]>;

  // Message operations
  getMessages(senderId: number, receiverId: number): Promise<Message[]>;
  getGroupMessages(groupId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

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
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private groups: Map<number, Group>;
  private groupMembers: Map<number, GroupMember>;
  private requests: Map<number, Request>;
  
  sessionStore: session.SessionStore;
  currentUserId: number = 1;
  currentMessageId: number = 1;
  currentGroupId: number = 1;
  currentGroupMemberId: number = 1;
  currentRequestId: number = 1;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.requests = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, isOnline: false };
    this.users.set(id, user);
    return user;
  }

  async updateUserOnlineStatus(id: number, isOnline: boolean): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (user) {
      const updatedUser = { ...user, isOnline };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Message operations
  async getMessages(senderId: number, receiverId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (msg) => 
        (msg.senderId === senderId && msg.receiverId === receiverId) ||
        (msg.senderId === receiverId && msg.receiverId === senderId)
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getGroupMessages(groupId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.groupId === groupId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      timestamp: new Date(),
      isRead: false 
    };
    this.messages.set(id, message);
    return message;
  }

  // Group operations
  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.currentGroupId++;
    const group: Group = { ...insertGroup, id };
    this.groups.set(id, group);
    return group;
  }

  async listGroups(): Promise<Group[]> {
    return Array.from(this.groups.values());
  }

  async getGroupsByUserId(userId: number): Promise<Group[]> {
    const userGroupIds = new Set(
      Array.from(this.groupMembers.values())
        .filter(member => member.userId === userId)
        .map(member => member.groupId)
    );
    
    return Array.from(this.groups.values())
      .filter(group => userGroupIds.has(group.id));
  }

  async getAnnouncementGroups(): Promise<Group[]> {
    return Array.from(this.groups.values())
      .filter(group => group.isAnnouncement);
  }

  // Group member operations
  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const id = this.currentGroupMemberId++;
    const member: GroupMember = { ...insertMember, id };
    this.groupMembers.set(id, member);
    return member;
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values())
      .filter(member => member.groupId === groupId);
  }

  async isUserInGroup(userId: number, groupId: number): Promise<boolean> {
    return Array.from(this.groupMembers.values())
      .some(member => member.userId === userId && member.groupId === groupId);
  }

  // Request operations
  async getRequest(id: number): Promise<Request | undefined> {
    return this.requests.get(id);
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const id = this.currentRequestId++;
    const now = new Date();
    const request: Request = { 
      ...insertRequest, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.requests.set(id, request);
    return request;
  }

  async updateRequestStatus(id: number, status: string): Promise<Request | undefined> {
    const request = await this.getRequest(id);
    if (request) {
      const updatedRequest = { 
        ...request, 
        status,
        updatedAt: new Date()
      };
      this.requests.set(id, updatedRequest);
      return updatedRequest;
    }
    return undefined;
  }

  async getUserRequests(userId: number): Promise<Request[]> {
    return Array.from(this.requests.values())
      .filter(request => request.creatorId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAssignedRequests(userId: number): Promise<Request[]> {
    return Array.from(this.requests.values())
      .filter(request => request.assigneeId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async listRequests(): Promise<Request[]> {
    return Array.from(this.requests.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
