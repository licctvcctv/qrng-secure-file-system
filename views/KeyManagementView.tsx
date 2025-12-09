import React, { useState } from 'react';
import { Key, RefreshCw, Zap, Download, Clock, Shield, User as UserIcon, Lock, Search, Eye, ChevronDown, ChevronUp, History, Activity } from 'lucide-react';
import { KeyRecord, User } from '../types';

interface Props {
  keys?: KeyRecord[];
  currentUser: User;
}

const KeyManagementView: React.FC<Props> = ({ keys = [], currentUser }) => {
  const [filter, setFilter] = useState('');
  const [expandedKeyId, setExpandedKeyId] = useState<string | null>(null);

  // FILTER LOGIC:
  // Admin sees ALL keys. User sees ONLY their keys.
  const authorizedKeys = currentUser.role === 'admin' 
    ? keys 
    : keys.filter(k => k.owner === currentUser.username);

  const displayKeys = authorizedKeys.filter(k => 
    k.fileName.toLowerCase().includes(filter.toLowerCase()) || 
    k.owner.toLowerCase().includes(filter.toLowerCase()) ||
    k.id.toLowerCase().includes(filter.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedKeyId(expandedKeyId === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {currentUser.role === 'admin' ? '全局密钥管理中心 (KMS)' : '我的密钥保险箱'}
          </h2>
          <p className="text-slate-500 text-sm">
            {currentUser.role === 'admin' 
              ? '审计全员加密资产，监控密钥生命周期（管理员视角：只读/审计）' 
              : '查看并管理您的个人加密密钥，追踪使用记录'}
          </p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索密钥 / 文件 / 用户..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm transition-colors">
            <RefreshCw className="w-4 h-4 mr-2" />
            同步状态
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Key List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
           <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center justify-between">
             <div className="flex items-center">
               <Clock className="w-4 h-4 mr-2 text-blue-600" />
               密钥索引库
             </div>
             <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">共 {displayKeys.length} 条</span>
           </h3>

           <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
             {displayKeys.length === 0 ? (
               <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                 <Key className="w-8 h-8 mx-auto mb-2 opacity-20" />
                 暂无相关密钥记录
               </div>
             ) : (
               displayKeys.map((key) => {
                 // Get last usage time
                 const lastUsedTime = key.usageLogs && key.usageLogs.length > 0 ? key.usageLogs[0].timestamp : null;

                 return (
                   <div key={key.id} className="border border-slate-100 rounded-lg bg-slate-50 hover:bg-white hover:border-slate-300 transition-all group overflow-hidden">
                      <div className="p-4 flex items-start justify-between">
                         <div className="flex items-start space-x-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${key.keyType === 'QRNG-Auto' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                               <Key className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800 flex items-center">
                                {key.fileName}
                                {currentUser.role === 'admin' && (
                                  <span className="ml-2 flex items-center text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-normal">
                                    <UserIcon className="w-3 h-3 mr-1" /> {key.owner}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 mt-1 flex items-center space-x-3 flex-wrap">
                                 <span>{key.fileSize}</span>
                                 <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                 <span className="font-mono">{key.algorithm}</span>
                                 <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                 <span>{key.createdAt}</span>
                              </div>
                              <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded px-2 py-1 w-fit flex items-center">
                                使用次数: <span className="font-bold text-slate-700 mx-1">{key.decryptCount}</span>
                                <span className="mx-2 text-slate-300">|</span>
                                最近: <span className="font-bold text-slate-700 ml-1">{lastUsedTime || '从未调用'}</span>
                              </div>
                            </div>
                         </div>
                         
                         <div className="flex flex-col items-end space-y-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">Active</span>
                            
                            <div className="flex items-center space-x-2">
                                {/* View Usage Log Button */}
                                <button 
                                  onClick={() => toggleExpand(key.id)}
                                  className={`text-xs flex items-center font-medium px-2 py-1.5 rounded transition-colors ${expandedKeyId === key.id ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                >
                                  {expandedKeyId === key.id ? '收起记录' : '查看使用记录'}
                                  {expandedKeyId === key.id ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                                </button>

                                {/* Download Button */}
                                {currentUser.role !== 'admin' && key.keyType === 'QRNG-Auto' ? (
                                  <button className="text-xs flex items-center text-blue-600 hover:text-blue-800 font-medium px-2 py-1.5 hover:bg-blue-50 rounded transition-colors border border-transparent hover:border-blue-100">
                                    <Download className="w-3 h-3 mr-1" /> 下载
                                  </button>
                                ) : (
                                  currentUser.role === 'admin' && (
                                    <div className="flex items-center text-[10px] text-slate-400 px-2 py-1.5 bg-slate-100 rounded border border-slate-200 cursor-not-allowed" title="管理员无权获取用户私钥">
                                      <Lock className="w-3 h-3 mr-1" /> 私钥保护
                                    </div>
                                  )
                                )}
                            </div>
                         </div>
                      </div>

                      {/* USAGE LOGS EXPANDABLE SECTION */}
                      {expandedKeyId === key.id && (
                         <div className="bg-slate-50/50 border-t border-slate-200 p-4 animate-in slide-in-from-top-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center">
                               <History className="w-3 h-3 mr-2" />
                               使用流水 (Usage History)
                            </h4>
                            <div className="space-y-2">
                               {(key.usageLogs && key.usageLogs.length > 0) ? (
                                  key.usageLogs.map((log, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white p-2.5 rounded border border-slate-200 shadow-sm">
                                       <div className="flex items-center space-x-3">
                                          <div className={`w-2 h-2 rounded-full ${log.action === 'DECRYPT_SUCCESS' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                          <div>
                                            <span className="font-bold text-slate-700 mr-2">{log.user}</span>
                                            <span className="text-slate-500">执行解密</span>
                                          </div>
                                       </div>
                                       <div className="flex items-center space-x-4 font-mono text-slate-500">
                                          <span className="text-[10px] bg-slate-100 px-1 rounded">{log.ip}</span>
                                          <span className="font-semibold text-slate-700">{log.timestamp}</span>
                                       </div>
                                    </div>
                                  ))
                               ) : (
                                  <div className="text-center py-4 text-slate-400 text-xs italic bg-white rounded border border-slate-100 border-dashed">
                                     <Activity className="w-4 h-4 mx-auto mb-1 opacity-50" />
                                     暂无该密钥的使用记录
                                  </div>
                               )}
                            </div>
                         </div>
                      )}
                   </div>
                 );
               })
             )}
           </div>
        </div>

        {/* Right: QRNG Status */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900 text-white rounded-xl p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap className="w-32 h-32 text-yellow-400" />
               </div>
               <h3 className="text-lg font-bold mb-4 flex items-center">
                 <Shield className="w-5 h-5 mr-2 text-emerald-400" />
                 系统主密钥 (Master)
               </h3>
               <div className="space-y-4 relative z-10">
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Root Key ID</label>
                   <div className="font-mono text-xs text-emerald-300 bg-slate-800/50 p-2 rounded border border-slate-700">
                     0x8F4A...B2C1
                   </div>
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Entropy Source</label>
                   <div className="text-xs text-slate-300">
                     ID Quantique QRNG @ 48Mbps
                   </div>
                 </div>
                 <div className="pt-4 border-t border-slate-800">
                    <div className="text-[10px] text-slate-500 mb-2">当前熵池容量</div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                       <div className="w-[92%] h-full bg-gradient-to-r from-yellow-600 to-yellow-400"></div>
                    </div>
                 </div>
               </div>
           </div>

           <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-2">安全提示</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                管理员拥有全局审计权限，可以查看所有密钥的元数据（如ID、指纹、归属人），但根据系统零信任架构，管理员无法下载或访问用户的实际私钥文件。
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                 如果您使用了“手动密码”模式加密文件，密钥将不会保存在系统中。如果您忘记密码，数据将永久丢失。
              </p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default KeyManagementView;