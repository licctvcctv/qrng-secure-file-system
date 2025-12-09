import React from 'react';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Settings2, 
  Key, 
  FileText, 
  ShieldCheck,
  LogOut,
  Laptop2,
  Users,
  FileBadge,
  ChevronRight
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  currentUser: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, currentUser, onLogout }) => {
  const allMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: '系统概览', category: '监控中心', roles: ['admin', 'user'] },
    // Only Users see Transfer
    { id: 'transfer', icon: ArrowRightLeft, label: '安全传输', category: '核心业务', roles: ['user'] },
    { id: 'keys', icon: Key, label: '密钥管理', category: '核心业务', roles: ['admin', 'user'] },
    // Only Admins see Management
    { id: 'devices', icon: Laptop2, label: '设备鉴权', category: '安全运维', roles: ['admin'] },
    { id: 'iam', icon: Users, label: '用户管理', category: '安全运维', roles: ['admin'] },
    { id: 'algorithms', icon: Settings2, label: '算法配置', category: '系统配置', roles: ['admin'] },
    { id: 'audit', icon: FileText, label: '审计日志', category: '合规审查', roles: ['admin'] },
    { id: 'compliance', icon: FileBadge, label: '合规体检', category: '合规审查', roles: ['admin'] },
    // Settings moved to footer profile click
  ];

  // Filter based on role
  const allowedItems = allMenuItems.filter(item => item.roles.includes(currentUser.role));

  const groupedItems = allowedItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof allowedItems>);

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-40 shadow-xl shadow-slate-200/50">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-slate-50/50">
        <div className="bg-slate-900 p-1.5 rounded-lg mr-3 shadow-lg shadow-slate-900/10">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-slate-800 tracking-tight block leading-none">QRNG Vault</span>
          <span className="text-[10px] text-slate-500 font-medium">Enterprise Edition</span>
        </div>
      </div>

      {/* Scrollable Menu */}
      <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto custom-scrollbar">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category}>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-2"></span>
              {category}
            </div>
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onChangeView(item.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group relative ${
                    currentView === item.id 
                      ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className={`w-4 h-4 mr-3 transition-colors ${
                    currentView === item.id ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-600'
                  }`} />
                  {item.label}
                  {currentView === item.id && (
                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer - Clickable for Profile */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div 
           onClick={() => onChangeView('settings')}
           className={`bg-white rounded-lg p-3 border border-slate-200 flex items-center space-x-3 mb-3 shadow-sm cursor-pointer transition-all hover:border-blue-300 hover:shadow-md group ${currentView === 'settings' ? 'ring-2 ring-blue-500/20 border-blue-400' : ''}`}
           title="点击进入个人中心"
        >
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600 font-bold text-xs uppercase">
              {currentUser.username.substring(0, 2)}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-bold text-slate-800 truncate capitalize">{currentUser.name || currentUser.username}</div>
            <div className="text-[10px] text-slate-500 truncate font-mono uppercase border border-slate-200 rounded px-1 w-fit mt-0.5 bg-slate-50">
              {currentUser.role === 'admin' ? '系统管理员' : '普通用户'}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center px-3 py-2 text-xs text-slate-500 hover:text-red-600 transition-colors border border-transparent hover:bg-red-50 rounded-lg font-medium"
        >
          <LogOut className="w-3 h-3 mr-2" />
          安全登出
        </button>
      </div>
    </div>
  );
};

export default Sidebar;