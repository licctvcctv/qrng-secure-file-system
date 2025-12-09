import React from 'react';
import { FileKey, Shield, Clock, Smartphone, Globe, CheckCircle2, XCircle } from 'lucide-react';
import { KeyRecord, AuthSession } from '../types';

// Polymorphic props: Can accept either file keys OR auth sessions
interface ActivityListProps {
  title: string;
  type: 'files' | 'logins';
  data: (KeyRecord | AuthSession)[];
  emptyMessage?: string;
  limit?: number;
}

const ActivityList: React.FC<ActivityListProps> = ({ title, type, data, emptyMessage = "No records found", limit }) => {
  
  const displayData = limit ? data.slice(0, limit) : data;

  if (displayData.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">{title}</h3>
        <div className="text-center py-8 text-slate-400 text-sm italic">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
          {type === 'files' ? <FileKey className="w-4 h-4 mr-2 text-blue-600" /> : <Shield className="w-4 h-4 mr-2 text-purple-600" />}
          {title}
        </h3>
      </div>
      
      <div className="space-y-3">
        {displayData.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors group">
            
            {/* FILE RECORD RENDERER */}
            {type === 'files' && (
              <>
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <FileKey className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-slate-800 font-medium truncate">{item.fileName}</div>
                    <div className="text-xs text-slate-500 flex items-center space-x-2">
                       <span className="font-mono text-[10px] bg-slate-200 px-1 rounded">{item.algorithm}</span>
                       <span>{item.fileSize}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                   <div className="text-xs text-slate-400 font-mono">{item.createdAt.split(' ')[1]}</div>
                   <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 mt-1 inline-block">ENC</span>
                </div>
              </>
            )}

            {/* LOGIN RECORD RENDERER */}
            {type === 'logins' && (
              <>
                 <div className="flex items-center space-x-3 overflow-hidden">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.status === 'SUCCESS' ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`}>
                    {item.device.toLowerCase().includes('mobile') ? <Smartphone className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-slate-800 font-medium truncate">{item.ip}</div>
                    <div className="text-xs text-slate-500 truncate" title={item.device}>{item.device}</div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                   <div className="text-xs text-slate-400 font-mono">{item.timestamp.split(' ')[1]}</div>
                   {item.status === 'SUCCESS' ? (
                     <CheckCircle2 className="w-3 h-3 text-emerald-500 inline-block mt-1" />
                   ) : (
                     <XCircle className="w-3 h-3 text-red-500 inline-block mt-1" />
                   )}
                </div>
              </>
            )}

          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityList;