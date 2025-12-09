export enum AppMode {
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD'
}

export type UserRole = 'admin' | 'user';

export interface User {
  username: string;
  role: UserRole;
  name: string;
  department?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  lastLogin?: string;
  status?: 'active' | 'locked'; 
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'system';
  message: string;
  detail?: string;
  user?: string; 
  actionType?: 'ENCRYPT' | 'DECRYPT' | 'LOGIN' | 'SYSTEM' | 'CONFIG' | 'USER_MGMT';
}

export interface AuthSession {
  id: string;
  username: string;
  timestamp: string;
  ip: string;
  device: string; 
  method: 'PASSWORD' | 'MFA' | 'SSO';
  status: 'SUCCESS' | 'FAILED';
}

export interface EncryptionStep {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  description: string;
  technicalDetail?: string; 
}

export interface GlobalAlgoConfig {
  allowedCiphers: string[]; 
  allowedHashes: string[]; 
  compressionEnabled: boolean;
  forceDigitalSignature: boolean;
  keyRotationInterval: number;
  entropyThreshold: number;
}

// New: Detailed usage log for a single key
export interface KeyUsageLog {
  user: string;
  timestamp: string;
  action: 'DECRYPT_SUCCESS' | 'DECRYPT_FAILED';
  ip: string;
}

export interface KeyRecord {
  id: string;
  owner: string; 
  fileName: string;
  fileSize: string;
  algorithm: string;
  keyType: 'QRNG-Auto' | 'Custom-Seed';
  createdAt: string;
  keyFingerprint: string; 
  status: 'active' | 'revoked' | 'expired';
  decryptCount: number; 
  usageLogs: KeyUsageLog[]; // New field
}

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'error';
  timestamp: string;
  source: 'SYSTEM_MONITOR' | 'ADMIN_BROADCAST';
}

export interface MockDevice {
  id: string;
  name: string;
  ip: string;
  fingerprint: string;
  lastActive: string;
  status: 'trusted' | 'revoked' | 'pending';
  type: 'desktop' | 'mobile' | 'server';
}

export interface MockUser {
  id: string;
  username: string; 
  name: string;
  role: UserRole;
  department: string;
  status: 'active' | 'locked';
  lastLogin: string;
  avatar?: string;
}

export interface ComplianceReport {
  id: string;
  name: string;
  standard: 'GDPR' | 'ISO27001' | 'FIPS-140-2';
  date: string;
  status: 'generated' | 'archived';
  score?: number;
}

export interface MockFile {
  name: string;
  size: string;
  date: string;
  encrypted: boolean;
  hasPwd: boolean;
}