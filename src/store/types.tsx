// src/types/types.tsx

export type Permission = 'view' | 'vote' | 'count' | 'manage' | 'admin';

export type Voter = {
  id: string;
  name: string;
  phone: string;
  email: string;
  isRestricted: boolean;
  roleId: number;
};

export type Candidate = {
  id: string;
  name: string;
  description: string;
  pledge: string;
  imageUrl: string;
};

export type Role = {
  createdAt?: any;
  id: number;
  name: string;
  permissions: Permission[];
  color?: string;
};

export type Election = {
  id: string;
  name: string;
  description: string;
  organizer: string;
  voters: string[];
  candidates: string[];
  status: string;
  startDate: string;
  endDate: string;
  date: string;
  imageUrl?: string;
};

export type Account = {
  username: string;
  password: string;
  phone?: string;
  email?: string;
  tenDangNhap?: string;
  hoTen?: string;
  soCCCD?: string;
  matKhau?: string;
};

export type User = {
  recentActivities?: any;
  status?: string;
  id: number;
  name: string;
  account: Account;
  roles: Role[];
  avatar: string;
  dateOfBirth?: Date;
  address?: string;
  gender?: string;
  bio?: string;
  socialLinks?: SocialLinks;
  twoFactorEnabled?: string;
  notifications?: Notifications;
};

export type SocialLinks = {
  linkedIn?: string;
  github?: string;
  twitter?: string;
};

export type Notifications = {
  email?: boolean;
  sms?: boolean;
  inApp?: boolean;
};

export type NewAccountData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;
  birthdate: string;
  gender: string;
};

export type NewElectionData = Election;

export type SavedElectionData = Election;

export type ElectionCard = Election;

export type VoterData = Voter;

export type CandidateData = Candidate;
