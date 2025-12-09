import { EncryptionStep, MockFile, MockDevice, MockUser, ComplianceReport } from './types';

export const INITIAL_STEPS: EncryptionStep[] = [
  { id: 'hash', title: '文件哈希与签名', status: 'pending', description: 'SHA-256 哈希计算 & FSK 签名' },
  { id: 'check', title: '服务端去重校验', status: 'pending', description: '验证文件是否存在 (API)' },
  { id: 'negotiate', title: '密钥协商 (ECC)', status: 'pending', description: '生成会话密钥 (nk)' },
  { id: 'qrng', title: 'QRNG 随机数生成', status: 'pending', description: '获取 Father IV (FIV)' },
  { id: 'encrypt', title: 'AES-GCM 分片加密', status: 'pending', description: 'HKDF 生成 Child IV (CIV)' },
  { id: 'transmit', title: '传输与存储', status: 'pending', description: '分片上传至 KMS/Storage' },
];

export const MOCK_FILES: MockFile[] = [
  { name: 'confidential_report_q3.pdf', size: '4.2 MB', date: '2023-10-24', encrypted: true, hasPwd: true },
  { name: 'project_blue_schematics.dwg', size: '128.5 MB', date: '2023-10-22', encrypted: true, hasPwd: false },
  { name: 'hr_employee_data_backup.sql', size: '450.1 MB', date: '2023-10-20', encrypted: true, hasPwd: true },
];

export const MOCK_KEYS = {
  fpk: '0x04A1...B7C2 (Front Public)',
  fsk: '****** (Front Secret)',
  bpk: '0x04F9...99A1 (Back Public)',
};

export const MOCK_DEVICES: MockDevice[] = [
  { id: 'DEV-001', name: 'Admin Workstation Alpha', ip: '10.0.4.15', fingerprint: 'a1:b2:c3:d4', lastActive: 'Online', status: 'trusted', type: 'desktop' },
  { id: 'DEV-002', name: 'Mobile Node 7', ip: '192.168.1.104', fingerprint: 'f9:e8:d7:c6', lastActive: '2m ago', status: 'trusted', type: 'mobile' },
  { id: 'DEV-003', name: 'Backup Server NY', ip: '10.2.1.5', fingerprint: '00:11:22:33', lastActive: 'Online', status: 'pending', type: 'server' },
];

export const MOCK_USERS: MockUser[] = [
  { id: 'USR-001', username: 'sarah', name: 'Sarah Chen', role: 'user', department: 'Sales', status: 'active', lastLogin: '2023-10-25 09:30' },
  { id: 'USR-002', username: 'mike', name: 'Mike Ross', role: 'user', department: 'Legal', status: 'active', lastLogin: '2023-10-24 14:22' },
  { id: 'USR-003', username: 'audit', name: 'Audit Bot', role: 'admin', department: 'Security', status: 'locked', lastLogin: 'Never' },
];

export const MOCK_REPORTS: ComplianceReport[] = [
  { id: 'RPT-2023-10', name: 'Monthly Security Audit', standard: 'ISO27001', date: '2023-10-01', status: 'generated', score: 98 },
  { id: 'RPT-2023-09', name: 'Q3 GDPR Compliance', standard: 'GDPR', date: '2023-09-15', status: 'archived', score: 100 },
];