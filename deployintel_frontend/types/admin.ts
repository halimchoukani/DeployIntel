export type UserRole = "ADMIN" | "DEVELOPER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";
export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  status: UserStatus;
  role: UserRole;
  provider: string;
  avatarUrl: string | null;
  githubConnected: boolean;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProject {
  id: string;
  name: string;
  description: string | null;
  repositoryUrl: string;
  defaultBranch: string;
  language: string | null;
  status: ProjectStatus;
  ownerId: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserKpis {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  developerUsers: number;
  githubConnectedUsers: number;
  localUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
}

export interface ProjectKpis {
  totalProjects: number;
  activeProjects: number;
  archivedProjects: number;
  newProjectsLast7Days: number;
  newProjectsLast30Days: number;
  averageProjectsPerUser: number;
  projectsByLanguage: Record<string, number>;
}

export interface PlatformOverview {
  totalUsers: number;
  totalProjects: number;
  activeUsersRate: number;
  activeProjectsRate: number;
}

export interface TopContributor {
  userId: string;
  email: string;
  name: string;
  projectCount: number;
}

export interface AdminKpiData {
  userKpis: UserKpis;
  projectKpis: ProjectKpis;
  overview: PlatformOverview;
  topContributors: TopContributor[];
  generatedAt: string;
}

export interface AdminUserFilters {
  search?: string;
  status?: UserStatus | "";
  role?: UserRole | "";
}

export interface AdminProjectFilters {
  search?: string;
  status?: ProjectStatus | "";
  language?: string;
  ownerId?: string;
}
