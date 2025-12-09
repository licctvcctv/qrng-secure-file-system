import React, { useState } from 'react';
import { FileBadge, FileCheck, Calendar, Download, AlertCircle, FileText, ShieldCheck, Activity } from 'lucide-react';
import { MOCK_REPORTS } from '../constants';
import { ComplianceReport } from '../types';

const ComplianceView = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [reports, setReports] = useState<ComplianceReport[]>(MOCK_REPORTS);

  const handleRunAudit = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      const newReport: ComplianceReport = {
        id: `RPT-${new Date().toISOString().split('T')[0]}`,
        name: '即时安全合规体检报告',
        standard: 'ISO27001',
        date: new Date().toLocaleDateString(),
        status: 'generated',
        score: Math.floor(Math.random() * (100 - 85) + 85)
      };
      setReports([newReport, ...reports]);
    }, 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">安全合规体检</h2>
          <p className="text-slate-500 text-sm">自动扫描系统配置、日志与密钥状态，生成审计报告</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
         <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
           {isChecking ? <Activity className="w-10 h-10 text-blue-600 animate-pulse" /> : <ShieldCheck className="w-10 h-10 text-emerald-600" />}
         </div>
         <h3 className="text-xl font-bold text-slate-800 mb-2">
           {isChecking ? '正在全盘扫描系统...' : '系统状态良好'}
         </h3>
         <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
           {isChecking 
             ? '正在分析加密算法强度、检查弱口令用户、校验 QRNG 熵源质量以及审计未授权设备...' 
             : '上一次全面体检是在 2 小时前。所有加密模块均符合 FIPS 140-2 标准。'}
         </p>
         
         <button 
           onClick={handleRunAudit}
           disabled={isChecking}
           className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all transform active:scale-95 ${
             isChecking ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
           }`}
         >
           {isChecking ? '扫描进行中 (45%)...' : '开始全面体检'}
         </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
             <h3 className="text-sm font-bold text-slate-700">历史报告归档</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                 <div className="flex items-center space-x-4">
                   <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                     <FileText className="w-5 h-5" />
                   </div>
                   <div>
                     <div className="text-sm font-bold text-slate-800">{report.name}</div>
                     <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {report.id} • {report.date}</div>
                   </div>
                 </div>
                 
                 <div className="flex items-center space-x-6">
                   {report.score && (
                     <div className="text-right">
                       <div className="text-xs text-slate-400 uppercase font-bold">Health Score</div>
                       <div className="text-lg font-bold text-emerald-600">{report.score}/100</div>
                     </div>
                   )}
                   <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                     <Download className="w-5 h-5" />
                   </button>
                 </div>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
};

export default ComplianceView;