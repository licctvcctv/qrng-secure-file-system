import React from 'react';
import SystemDashboard from '../components/SystemDashboard';
import ActivityList from '../components/ActivityList';
import { Activity, ShieldAlert, ArrowUpRight, Megaphone, Plus } from 'lucide-react';
import { KeyRecord, GlobalAlgoConfig, AuthSession, SystemAlert } from '../types';

interface Props {
  stats: {
    totalKeys: number;
    activeKeys: number;
    totalStorageBytes: number;
  };
  recentKeys: KeyRecord[];
  recentLogins: AuthSession[];
  systemAlerts: SystemAlert[];
  globalConfig: GlobalAlgoConfig;
  onAddAlert?: (title: string, message: string) => void;
  isAdmin?: boolean;
}

const DashboardView: React.FC<Props> = ({ stats, recentKeys, recentLogins, systemAlerts, globalConfig, onAddAlert, isAdmin }) => {
  
  const handleCreateAlert = () => {
    if (onAddAlert) {
      onAddAlert("手动维护公告", "系统将于本周日凌晨 02:00 进行固件升级，预计中断 15 分钟。");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">系统运行概览</h2>
        <p className="text-slate-500 text-sm">实时监控加密链路与量子熵源状态</p>
      </div>

      {/* Connected Real Data Dashboard */}
      <SystemDashboard 
        config={globalConfig} 
        totalFiles={stats.totalKeys} 
        totalStorageBytes={stats.totalStorageBytes}
      />

      {/* Real Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs uppercase font-bold">总操作次数 (Ops)</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{stats.totalKeys}</div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs uppercase font-bold">活跃密钥数 (Active)</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{stats.activeKeys}</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Activity Feeds */}
        <div className="space-y-6">
           {/* 1. File Activity */}
           <ActivityList 
              title="最近传输活动 (实时)" 
              type="files" 
              data={recentKeys} 
              emptyMessage="暂无加密记录"
           />

           {/* 2. Login Activity */}
           <ActivityList 
              title="我的登录日志 (Session)" 
              type="logins" 
              data={recentLogins} 
              emptyMessage="无登录记录"
           />
        </div>

        {/* RIGHT COLUMN: Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
              <ShieldAlert className="w-4 h-4 mr-2 text-orange-500" />
              系统消息与警报
            </h3>
            {isAdmin && (
              <button 
                onClick={handleCreateAlert}
                className="text-xs flex items-center bg-slate-900 text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                title="模拟发布公告"
              >
                <Plus className="w-3 h-3 mr-1" />
                发布公告
              </button>
            )}
          </div>

          <div className="space-y-3">
            {systemAlerts.length === 0 ? (
               <div className="text-slate-400 text-sm text-center py-4">系统运行正常，暂无警报</div>
            ) : (
              systemAlerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg flex items-start space-x-3 border ${
                   alert.type === 'error' ? 'bg-red-50 border-red-100' :
                   alert.type === 'warning' ? 'bg-orange-50 border-orange-100' :
                   'bg-blue-50 border-blue-100'
                }`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    alert.type === 'error' ? 'bg-red-500' :
                    alert.type === 'warning' ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div>
                     <div className={`text-sm font-bold mb-1 ${
                        alert.type === 'error' ? 'text-red-800' :
                        alert.type === 'warning' ? 'text-orange-800' :
                        'text-blue-800'
                     }`}>{alert.title}</div>
                     <p className={`text-xs leading-relaxed ${
                        alert.type === 'error' ? 'text-red-700/80' :
                        alert.type === 'warning' ? 'text-orange-700/80' :
                        'text-blue-700/80'
                     }`}>{alert.message}</p>
                     <div className="mt-2 text-[10px] opacity-60 flex items-center font-mono">
                        {alert.timestamp} • {alert.source}
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;