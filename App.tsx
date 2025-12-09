import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { LoginView } from './components/AuthViews';
import DashboardView from './views/DashboardView';
import TransferView from './views/TransferView';
import AlgoConfigView from './views/AlgoConfigView';
import KeyManagementView from './views/KeyManagementView';
import AuditView from './views/AuditView';
import DeviceManagerView from './views/DeviceManagerView';
import AccessControlView from './views/AccessControlView';
import ComplianceView from './views/ComplianceView';
import SettingsView from './views/SettingsView';
import { User, UserRole, GlobalAlgoConfig, KeyRecord, LogEntry, AuthSession, SystemAlert, MockDevice, MockUser, KeyUsageLog } from './types';
import { MOCK_DEVICES, MOCK_USERS } from './constants';

const App = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');

  // 1. GLOBAL CONFIG (Admin Rules)
  const [globalConfig, setGlobalConfig] = useState<GlobalAlgoConfig>({
    allowedCiphers: [
      'AES-256-GCM', 
      'ChaCha20-Poly1305', 
      'Serpent-256-GCM',
      'Twofish-256-GCM', 
      'Camellia-256-GCM'
    ],
    allowedHashes: ['SHA-256', 'SHA-512', 'BLAKE2b', 'SHA-3 (Keccak)'],
    compressionEnabled: true,
    forceDigitalSignature: true,
    keyRotationInterval: 24,
    entropyThreshold: 40
  });

  // 2. DATA STATES (Pseudo-Backend)
  const [keyHistory, setKeyHistory] = useState<KeyRecord[]>([
    {
      id: 'KEY-SAMPLE-01',
      owner: 'sarah',
      fileName: 'confidential_report.pdf',
      fileSize: '4.2 MB',
      algorithm: 'AES-256-GCM',
      keyType: 'QRNG-Auto',
      createdAt: new Date(Date.now() - 86400000).toLocaleString(),
      keyFingerprint: 'a1b2...sample',
      status: 'active',
      decryptCount: 3,
      usageLogs: [
        { user: 'sarah', timestamp: new Date(Date.now() - 3600000).toLocaleString(), action: 'DECRYPT_SUCCESS', ip: '192.168.1.10' }
      ]
    }
  ]);

  const [users, setUsers] = useState<MockUser[]>(MOCK_USERS);
  const [devices, setDevices] = useState<MockDevice[]>(MOCK_DEVICES);
  
  const [authHistory, setAuthHistory] = useState<AuthSession[]>([
    {
      id: 'sess-init-001',
      username: 'sarah', 
      timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString(),
      ip: '10.0.4.15',
      device: 'Chrome 120 (Windows 11)',
      method: 'MFA',
      status: 'SUCCESS'
    }
  ]);

  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([
    {
      id: 'alert-001',
      title: '熵源波动预警',
      message: '检测到 QRNG 模块输入流微小波动，已自动启用备用缓冲池 (Entropy Pool B)。不影响当前加密任务。',
      type: 'warning',
      timestamp: new Date().toLocaleTimeString(),
      source: 'SYSTEM_MONITOR'
    }
  ]);

  const [auditLogs, setAuditLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString('zh-CN'),
      level: 'system',
      message: 'System Boot Sequence Initiated',
      detail: 'Kernel: v5.14.0-generic',
      actionType: 'SYSTEM'
    }
  ]);

  // HELPER: Calculate Total Storage
  const calculateTotalStorage = (): number => {
    return keyHistory.reduce((acc, curr) => {
       const sizeStr = curr.fileSize.split(' ')[0]; 
       const unit = curr.fileSize.split(' ')[1];
       let bytes = parseFloat(sizeStr);
       if (unit === 'MB') bytes *= 1024 * 1024;
       if (unit === 'KB') bytes *= 1024;
       if (unit === 'GB') bytes *= 1024 * 1024 * 1024;
       return acc + bytes;
    }, 0);
  };

  const handleLogin = (username: string, role: UserRole) => {
    // Find existing mock user or create simpler profile
    const existingUser = users.find(u => u.username === username);
    
    const profile: User = {
      username,
      role,
      name: existingUser?.name || username.charAt(0).toUpperCase() + username.slice(1),
      department: existingUser?.department || (role === 'admin' ? 'IT Security Ops' : 'Sales Department'),
      email: `${username}@company.com`,
      phone: '+86 138 0000 0000',
      lastLogin: new Date().toLocaleString(),
      status: existingUser?.status || 'active',
      avatar: existingUser?.avatar
    };
    setCurrentUser(profile);

    const userAgent = navigator.userAgent;
    let simplifiedDevice = 'Unknown Device';
    if (userAgent.includes('Mac')) simplifiedDevice = 'macOS Desktop';
    else if (userAgent.includes('Win')) simplifiedDevice = 'Windows Desktop';
    else if (userAgent.includes('Linux')) simplifiedDevice = 'Linux Station';
    if (userAgent.includes('Chrome')) simplifiedDevice += ' (Chrome)';

    const newSession: AuthSession = {
      id: `sess-${Date.now()}`,
      username: username,
      timestamp: new Date().toLocaleString(),
      ip: '192.168.1.10 (Current)', 
      device: simplifiedDevice,
      method: 'PASSWORD',
      status: 'SUCCESS'
    };

    setAuthHistory(prev => [newSession, ...prev]);
    addGlobalLog(`用户登录: ${username}`, 'info', `IP: ${newSession.ip} | Role: ${role}`, 'LOGIN');
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    addGlobalLog(`用户登出: ${currentUser?.username}`, 'warning', undefined, 'LOGIN');
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    // Update the mock database as well so it persists in User Management
    setUsers(prev => prev.map(u => u.username === updatedUser.username ? { ...u, avatar: updatedUser.avatar, name: updatedUser.name } : u));
    addGlobalLog(`Profile Updated: ${updatedUser.username}`, 'info', 'User modified personal settings', 'SYSTEM');
  };

  const addKeyRecord = (record: KeyRecord) => {
    setKeyHistory(prev => [record, ...prev]);
  };

  const updateKeyUsage = (fileName: string, success: boolean) => {
    if (!currentUser) return;
    
    const newUsage: KeyUsageLog = {
      user: currentUser.username,
      timestamp: new Date().toLocaleString(),
      action: success ? 'DECRYPT_SUCCESS' : 'DECRYPT_FAILED',
      ip: '192.168.1.10' // Mock current IP
    };

    setKeyHistory(prev => prev.map(key => {
      // Simple string matching simulation
      if (key.fileName === fileName || fileName.includes(key.fileName)) {
        return { 
          ...key, 
          decryptCount: success ? (key.decryptCount || 0) + 1 : key.decryptCount,
          usageLogs: [newUsage, ...(key.usageLogs || [])]
        };
      }
      return key;
    }));
  };

  // Centralized Logging Logic
  const addGlobalLog = (message: string, level: LogEntry['level'] = 'info', detail?: string, type?: LogEntry['actionType']) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      level,
      message,
      detail,
      user: currentUser?.username || 'SYSTEM',
      actionType: type
    };
    setAuditLogs(prev => [entry, ...prev]);
  };

  const addSystemAlert = (title: string, message: string) => {
    const newAlert: SystemAlert = {
      id: `alert-${Date.now()}`,
      title,
      message,
      type: 'info',
      timestamp: new Date().toLocaleTimeString(),
      source: 'ADMIN_BROADCAST'
    };
    setSystemAlerts(prev => [newAlert, ...prev]);
    addGlobalLog(`Admin Posted Alert: ${title}`, 'warning', undefined, 'SYSTEM');
  };

  // Filter logs based on role: Admin sees all, User sees own
  const visibleLogs = currentUser?.role === 'admin' 
    ? auditLogs 
    : auditLogs.filter(log => log.user === currentUser?.username || log.level === 'system');

  const renderView = () => {
    if (!currentUser) return null;

    switch(currentView) {
      case 'dashboard': 
        return <DashboardView 
                  stats={{ 
                    totalKeys: keyHistory.length, 
                    activeKeys: keyHistory.filter(k=>k.status==='active').length,
                    totalStorageBytes: calculateTotalStorage()
                  }} 
                  recentKeys={
                    currentUser.role === 'admin' 
                      ? keyHistory.slice(0, 5) 
                      : keyHistory.filter(k => k.owner === currentUser.username).slice(0, 5)
                  } 
                  recentLogins={authHistory.filter(s => s.username === currentUser.username).slice(0, 3)} 
                  systemAlerts={systemAlerts}
                  globalConfig={globalConfig} 
                  onAddAlert={addSystemAlert}
                  isAdmin={currentUser.role === 'admin'}
               />;
      case 'transfer': 
        // Logic check: Admin shouldn't ideally be here via UI, but if they are, show message or redirect
        if (currentUser.role === 'admin') return <div className="text-center p-10 text-slate-500">管理员无法直接进行文件传输操作，请切换至普通用户账号。</div>;
        return <TransferView 
                  globalConfig={globalConfig} 
                  currentUser={currentUser}
                  onEncryptionComplete={addKeyRecord} 
                  onDecryptionComplete={updateKeyUsage}
                  onLog={addGlobalLog} 
               />;
      case 'devices': return <DeviceManagerView currentUser={currentUser} devices={devices} onUpdateDevices={setDevices} onLog={addGlobalLog} />;
      case 'iam': return <AccessControlView currentUser={currentUser} authHistory={authHistory} users={users} onUpdateUsers={setUsers} onLog={addGlobalLog} />; 
      case 'algorithms': 
        return <AlgoConfigView config={globalConfig} onSave={setGlobalConfig} onLog={addGlobalLog} />;
      case 'keys': 
        return <KeyManagementView keys={keyHistory} currentUser={currentUser} />;
      case 'audit': return <AuditView logs={visibleLogs} />;
      case 'compliance': return <ComplianceView />;
      case 'settings': return <SettingsView currentUser={currentUser} onUpdateUser={handleUpdateUser} />;
      default: return null;
    }
  };

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 flex text-slate-900">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <div className="flex-1 ml-64 p-8 overflow-y-auto h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default App;