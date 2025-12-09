import React, { useState } from 'react';
import { Users, UserPlus, Shield, Lock, Trash2, RotateCcw, Search, Eye, X } from 'lucide-react';
import { MockUser, User, LogEntry, AuthSession } from '../types';

interface Props {
  currentUser: User;
  users: MockUser[];
  authHistory: AuthSession[];
  onUpdateUsers: (users: MockUser[]) => void;
  onLog: (msg: string, level?: LogEntry['level'], detail?: string, type?: LogEntry['actionType']) => void;
}

const AccessControlView: React.FC<Props> = ({ currentUser, users, authHistory, onUpdateUsers, onLog }) => {
  const [filter, setFilter] = useState('');
  const [selectedUserForLog, setSelectedUserForLog] = useState<string | null>(null);

  const handleStatusToggle = (id: string) => {
    const updatedUsers = users.map(u => 
      u.id === id ? { ...u, status: u.status === 'active' ? 'locked' : 'active' } : u
    );
    // Cast to ensure type safety
    onUpdateUsers(updatedUsers as MockUser[]);
    const user = users.find(u => u.id === id);
    onLog(`用户状态变更: ${user?.name}`, 'warning', `New Status: ${user?.status === 'active' ? 'LOCKED' : 'ACTIVE'}`, 'USER_MGMT');
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除该用户吗？此操作不可恢复。')) {
      const deletedUser = users.find(u => u.id === id);
      const updatedUsers = users.filter(u => u.id !== id);
      onUpdateUsers(updatedUsers);
      onLog(`删除用户: ${deletedUser?.name}`, 'error', `ID: ${id}`, 'USER_MGMT');
    }
  };

  const handleResetPassword = (name: string) => {
    onLog(`重置用户密码: ${name}`, 'success', 'Temporary password sent to email', 'USER_MGMT');
    alert(`密码重置邮件已发送至 ${name}@company.com`);
  };

  const handleAddUser = () => {
    const name = prompt("请输入新用户名:");
    if (!name) return;
    
    const newUser: MockUser = {
      id: `USR-${Math.floor(Math.random() * 10000)}`,
      username: name.toLowerCase().replace(/\s/g, ''),
      name: name,
      role: 'user', // Default
      department: 'General',
      status: 'active',
      lastLogin: 'Never'
    };
    onUpdateUsers([...users, newUser]);
    onLog(`新建用户: ${name}`, 'info', `Role: user`, 'USER_MGMT');
  };

  const displayUsers = users.filter(u => 
    u.name.toLowerCase().includes(filter.toLowerCase()) || 
    u.username.toLowerCase().includes(filter.toLowerCase())
  );

  // Get logs for the selected user
  const userLogs = selectedUserForLog 
    ? authHistory.filter(h => h.username === selectedUserForLog)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">用户管理中心</h2>
          <p className="text-slate-500 text-sm">管理企业成员账户、重置密码与权限冻结</p>
        </div>
        <button 
           onClick={handleAddUser}
           className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-lg shadow-slate-900/20 transition-all"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          添加新成员
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
         {/* Toolbar */}
         <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
             <div className="flex items-center space-x-2 text-slate-500">
               <Users className="w-4 h-4" />
               <span className="text-sm font-bold">总人数: {users.length}</span>
             </div>
             <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="搜索姓名或账号..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
             </div>
         </div>

         {/* List */}
         <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase bg-slate-50">
                  <th className="px-6 py-3">用户身份</th>
                  <th className="px-6 py-3">部门</th>
                  <th className="px-6 py-3">角色权限</th>
                  <th className="px-6 py-3">账户状态</th>
                  <th className="px-6 py-3">最后登录</th>
                  <th className="px-6 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                 {displayUsers.map((user) => (
                   <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                     <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                           <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                             {user.name.substring(0,2).toUpperCase()}
                           </div>
                           <div>
                             <div className="text-sm font-bold text-slate-800">{user.name}</div>
                             <div className="text-xs text-slate-400 font-mono">@{user.username}</div>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-sm text-slate-600">
                       {user.department || 'General Staff'}
                     </td>
                     <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                          user.role === 'admin' 
                            ? 'bg-purple-50 text-purple-700 border-purple-100' 
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {user.role}
                        </span>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          <span className={`text-sm font-medium ${user.status === 'active' ? 'text-slate-700' : 'text-red-600'}`}>
                            {user.status === 'active' ? '正常' : '已冻结'}
                          </span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        {user.lastLogin}
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2 opacity-60 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => setSelectedUserForLog(user.username)}
                             className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded" 
                             title="查看日志"
                           >
                             <Eye className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleResetPassword(user.username)}
                             className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded" 
                             title="重置密码"
                           >
                             <RotateCcw className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleStatusToggle(user.id)}
                             className={`p-1.5 hover:bg-slate-100 rounded ${user.status === 'active' ? 'text-slate-400 hover:text-orange-600' : 'text-emerald-500 hover:bg-emerald-50'}`}
                             title={user.status === 'active' ? "冻结账户" : "解冻账户"}
                           >
                             {user.status === 'active' ? <Lock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                           </button>
                           {user.username !== currentUser.username && (
                             <button 
                               onClick={() => handleDelete(user.id)}
                               className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded" 
                               title="删除用户"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           )}
                        </div>
                     </td>
                   </tr>
                 ))}
              </tbody>
            </table>
         </div>
      </div>

      {/* USER LOG MODAL */}
      {selectedUserForLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div>
                  <h3 className="text-lg font-bold text-slate-800">用户审计日志</h3>
                  <p className="text-xs text-slate-500">Target: @{selectedUserForLog}</p>
               </div>
               <button onClick={() => setSelectedUserForLog(null)} className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                  <X className="w-5 h-5" />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-0">
               {userLogs.length > 0 ? (
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 text-xs font-bold text-slate-500 border-b border-slate-100 sticky top-0">
                     <tr>
                       <th className="px-6 py-3">时间</th>
                       <th className="px-6 py-3">动作/设备</th>
                       <th className="px-6 py-3">IP 地址</th>
                       <th className="px-6 py-3">结果</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {userLogs.map((log) => (
                       <tr key={log.id} className="text-sm hover:bg-slate-50">
                         <td className="px-6 py-3 font-mono text-xs text-slate-600">{log.timestamp}</td>
                         <td className="px-6 py-3">
                           <div className="font-bold text-slate-700">登录尝试</div>
                           <div className="text-xs text-slate-500">{log.device}</div>
                         </td>
                         <td className="px-6 py-3 font-mono text-xs text-slate-600">{log.ip}</td>
                         <td className="px-6 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {log.status}
                            </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               ) : (
                 <div className="p-10 text-center text-slate-400">
                   <Shield className="w-10 h-10 mx-auto mb-2 opacity-20" />
                   暂无该用户的活动日志
                 </div>
               )}
             </div>
             <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
                <button onClick={() => setSelectedUserForLog(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium">
                  关闭
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessControlView;