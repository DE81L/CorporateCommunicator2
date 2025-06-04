export interface User {
  /** Primary key from auth service – it's actually a string */
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  /** May be null or undefined if the user never uploaded one */
  avatarUrl?: string | null;
}

export interface Group {
  id: string;
  name: string;
  /** Optional blurb shown under the group name */
  description?: string;
  /** "Announcements‑only" channel, hides text‑input on the client */
  isAnnouncement?: boolean;
  /** Creator ID for permission checks */
  creatorId?: number;
  /** Read-only explanation channel */
  isExplanation?: boolean;
}
