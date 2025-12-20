export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole; // Global role (System Admin vs User)
}

export interface Group {
  id: string;
  name: string;
  code: string; // Invite code
  adminId: string; // The creator of the group
  encargadoId: string; // The current "Encargado"
  currentFineAmount: number;
  createdAt: string;
}

export enum EvidenceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface Participant {
  userId: string;
  groupId: string;
  username: string; // Denormalized for ease
  accumulatedFine: number;
  currentObjective: string;
  hasWildcard: boolean; // Comodín semestral
}

export interface Evidence {
  id: string;
  userId: string;
  groupId: string;
  username: string;
  weekId: string; // e.g., "2023-W48"
  description: string;
  imageUrl?: string;
  status: EvidenceStatus;
  timestamp: string;
}

export interface Challenge {
  id: string;
  groupId: string;
  challengerId: string;
  challengerName: string;
  challengedId: string;
  challengedName: string;
  description: string;
  fineAmount: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED_CHALLENGER_WON' | 'COMPLETED_CHALLENGED_WON';
}

export interface LogEntry {
  id: string;
  groupId: string;
  message: string;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER';
}

// Helper for UI state
export interface CurrentWeekInfo {
  label: string;
  weekId: string;
}