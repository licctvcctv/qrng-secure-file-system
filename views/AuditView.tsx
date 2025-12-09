import React from 'react';
import TerminalLog from '../components/TerminalLog';
import { LogEntry } from '../types';
import { Filter, Search } from 'lucide-react';

interface Props {
  logs?: LogEntry[];
}

const AuditView: React.FC<Props> = ({ logs = [] }) => {
  return (
    <div className="h-[calc(100vh-100px)] animate-in fade-in duration-500 flex flex-col">
       <div className="mb-4 shrink-0 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">安全审计日志</h2>
          <p className="text-slate-500 text-sm">完整系统操作与安全事件记录 (Real-time Sync)</p>
        </div>
        
        <div className="flex space-x-3">
           <div className="relative">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="筛选日志..." 
               className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
             />
           </div>
           <button className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
             <Filter className="w-4 h-4 mr-2" />
             过滤
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden border border-slate-200 rounded-xl shadow-sm bg-white flex flex-col">
         {/* Custom header for the log table appearance inside TerminalLog logic, or just wrap it */}
         <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-slate-500">GLOBAL_AUDIT_TRAIL.LOG</span>
            <span className="text-xs text-slate-400 font-mono">LIVE CONNECTION</span>
         </div>
         <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2 font-mono text-xs">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300 border-b border-slate-50 pb-2 last:border-0 hover:bg-slate-50 p-1 rounded">
                  <span className="text-slate-400 shrink-0 select-none w-20">[{log.timestamp}]</span>
                  
                  <div className="shrink-0 w-24">
                     {log.actionType && (
                       <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                         log.actionType === 'ENCRYPT' ? 'bg-blue-100 text-blue-700' :
                         log.actionType === 'DECRYPT' ? 'bg-purple-100 text-purple-700' :
                         log.actionType === 'LOGIN' ? 'bg-orange-100 text-orange-700' :
                         'bg-slate-100 text-slate-600'
                       }`}>
                         {log.actionType}
                       </span>
                     )}
                  </div>

                  <div className="flex flex-col flex-1">
                    <div className="flex items-center">
                       <span className="font-bold text-slate-700 mr-2">{log.user}:</span>
                       <span className={`${
                          log.level === 'error' ? 'text-red-600' : 
                          log.level === 'warning' ? 'text-orange-600' : 
                          log.level === 'success' ? 'text-emerald-600' : 'text-slate-700'
                       }`}>
                         {log.message}
                       </span>
                    </div>
                    {log.detail && (
                      <span className="text-slate-500 mt-0.5 block break-all opacity-80">
                        Details: {log.detail}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default AuditView;