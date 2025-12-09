import React from 'react';
import { Settings } from 'lucide-react';

export const ConfigPanel = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
        <Settings className="w-4 h-4 mr-2" />
        当前加密参数
      </h3>
      
      <div className="space-y-5">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-2">Algorithm</label>
          <div className="font-mono text-sm font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded border border-slate-100">
             AES-256-GCM
          </div>
        </div>

        <div>
           <div className="flex justify-between text-xs text-slate-500 mb-2">
             <label className="font-medium">Chunk Size</label>
             <span className="text-blue-600 font-mono">4 MB</span>
           </div>
           <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="w-[20%] h-full bg-blue-500"></div>
           </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-500">Zstd 压缩</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-500">双重校验</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;