import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, User, Mail } from 'lucide-react';
import { UserRole } from '../types';

interface AuthProps {
  onLogin: (username: string, role: UserRole) => void;
}

export const LoginView: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState<UserRole>('admin');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate simple auth logic
    if (isRegistering) {
       // Registration simulation
       onLogin(username, 'user'); // New users default to user
    } else {
       // Login simulation
       onLogin(username, role);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">QRNG Enterprise Vault</h1>
          <p className="text-blue-100 text-sm mt-2">量子安全级文件传输系统</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            {isRegistering ? '注册新账户' : '安全登录'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {isRegistering && (
               <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">企业邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input 
                    type="email" 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isRegistering && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <label className="block text-xs font-semibold text-blue-600 uppercase mb-2">模拟角色 (仅供演示)</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={role === 'admin'} 
                      onChange={() => setRole('admin')}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">管理员</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={role === 'user'} 
                      onChange={() => setRole('user')}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">普通用户</span>
                  </label>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg shadow-lg shadow-slate-900/10 flex items-center justify-center transition-all mt-6"
            >
              {isRegistering ? '立即注册' : '登录系统'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              {isRegistering ? '已有账号? ' : '没有账号? '}
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-blue-600 font-semibold hover:underline"
              >
                {isRegistering ? '直接登录' : '申请注册'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};