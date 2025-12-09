import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';

interface TerminalLogProps {
  logs: LogEntry[];
}

const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-inner flex flex-col h-full overflow-hidden font-mono">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500">SYSTEM LOG</span>
        <div className="flex space-x-1.5 opacity-50">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 text-xs space-y-2 bg-white">
        {logs.length === 0 && (
          <div className="text-slate-400 italic">等待任务启动...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300 border-b border-slate-50 pb-1 last:border-0">
            <span className="text-slate-400 shrink-0 select-none">[{log.timestamp}]</span>
            <div className="flex flex-col">
              <span className={`${getColor(log.level)} font-medium`}>
                {log.level === 'system' ? '>>' : ''} {log.message}
              </span>
              {log.detail && (
                <span className="text-slate-500 pl-2 border-l-2 border-slate-100 mt-0.5 block ml-1">
                  {log.detail}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

function getColor(level: LogEntry['level']) {
  switch (level) {
    case 'info': return 'text-slate-700';
    case 'success': return 'text-emerald-600';
    case 'warning': return 'text-orange-600';
    case 'error': return 'text-red-600';
    case 'system': return 'text-blue-600';
    default: return 'text-slate-700';
  }
}

export default TerminalLog;