export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export interface OrgSummary {
  _id: string;
  name: string;
  slug: string;
  plan: string;
}

export interface Membership {
  membershipId: string;
  role: Role;
  org: OrgSummary;
}

export interface Me {
  id: string;
  email: string;
  name: string;
  organizations: Membership[];
}

export interface Project {
  _id: string;
  name: string;
  key: string;
  description?: string;
  archived: boolean;
  createdAt: string;
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  _id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string;
  order: number;
  labels: string[];
}
