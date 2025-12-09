import React, { useState } from 'react';
import { Settings2, Layers, Hash, Save, CheckSquare, RefreshCw, Thermometer } from 'lucide-react';
import { GlobalAlgoConfig, LogEntry } from '../types';

interface Props {
  config: GlobalAlgoConfig;
  onSave: (config: GlobalAlgoConfig) => void;
  onLog: (msg: string, level?: LogEntry['level'], detail?: string, type?: LogEntry['actionType']) => void;
}

const AlgoConfigView: React.FC<Props> = ({ config, onSave, onLog }) => {
  const [localConfig, setLocalConfig] = useState<GlobalAlgoConfig>(config);
  const [saved, setSaved] = useState(false);

  // Expanded Algorithm List (Translated)
  const availableCiphers = [
    { id: 'AES-256-GCM', name: 'AES-256-GCM', desc: '工业标准 / 极速 (支持 AES-NI 硬件加速)', category: '工业标准' },
    { id: 'ChaCha20-Poly1305', name: 'ChaCha20-Poly1305', desc: 'Google 标准 / 移动端优化 (无 AES 指令集时更强)', category: '高性能' },
    { id: 'XChaCha20-Poly1305', name: 'XChaCha20-Poly1305', desc: '扩展随机数 (抗 Nonce 重用/重放攻击)', category: '高性能' },
    { id: 'Serpent-256-GCM', name: 'Serpent-256-GCM', desc: '最高安全边际 / 结构复杂 (军用级/速度较慢)', category: '军用级' },
    { id: 'Twofish-256-GCM', name: 'Twofish-256-GCM', desc: '复杂密钥编排 (Bruce Schneier 设计)', category: '传统强加密' },
    { id: 'Camellia-256-GCM', name: 'Camellia-256-GCM', desc: '欧盟/日本推荐标准 (结构类似 AES)', category: '国际标准' },
  ];

  const toggleCipher = (cipher: string) => {
    setLocalConfig(prev => {
      const exists = prev.allowedCiphers.includes(cipher);
      const newCiphers = exists 
        ? prev.allowedCiphers.filter(c => c !== cipher)
        : [...prev.allowedCiphers, cipher];
      if (newCiphers.length === 0) return prev;
      return { ...prev, allowedCiphers: newCiphers };
    });
    setSaved(false);
  };

  const toggleHash = (hash: string) => {
    setLocalConfig(prev => {
      const exists = prev.allowedHashes.includes(hash);
      const newHashes = exists 
        ? prev.allowedHashes.filter(h => h !== hash)
        : [...prev.allowedHashes, hash];
      if (newHashes.length === 0) return prev;
      return { ...prev, allowedHashes: newHashes };
    });
    setSaved(false);
  };

  const handleSave = () => {
    onSave(localConfig);
    onLog('管理员更新了全局加密策略', 'warning', `Algorithms: ${localConfig.allowedCiphers.length} active | Rotation: ${localConfig.keyRotationInterval}h`, 'CONFIG');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">加密算法策略配置</h2>
          <p className="text-slate-500 text-sm">定义前端用户可用的加密原语白名单 (Allowlist) 及密钥生命周期</p>
        </div>
        <button 
          onClick={handleSave}
          className={`flex items-center px-6 py-2.5 text-white rounded-lg text-sm font-medium shadow-lg transition-all ${saved ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/10'}`}
        >
          {saved ? <CheckSquare className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saved ? '策略已更新' : '保存全局策略'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cipher Allowlist */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
             <div className="p-2 bg-blue-50 rounded-lg">
                <Layers className="w-5 h-5 text-blue-600" />
             </div>
             <div>
               <h3 className="text-base font-bold text-slate-800">允许的对称加密算法</h3>
               <p className="text-xs text-slate-500">用户在上传时将从以下勾选项中选择算法</p>
             </div>
          </div>
          
          <div className="space-y-3 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {availableCiphers.map((algo) => (
              <div 
                key={algo.id}
                onClick={() => toggleCipher(algo.id)}
                className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                  localConfig.allowedCiphers.includes(algo.id) 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-slate-50 border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`mt-1 w-5 h-5 rounded border mr-3 flex items-center justify-center shrink-0 ${
                   localConfig.allowedCiphers.includes(algo.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-400 bg-white'
                }`}>
                  {localConfig.allowedCiphers.includes(algo.id) && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-slate-800">{algo.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded uppercase font-bold">{algo.category}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {algo.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Hashes & Advanced */}
        <div className="space-y-6">
           {/* Advanced Settings */}
           <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
             <div className="flex items-center space-x-3 mb-6">
               <div className="p-2 bg-purple-50 rounded-lg">
                  <Settings2 className="w-5 h-5 text-purple-600" />
               </div>
               <div>
                 <h3 className="text-base font-bold text-slate-800">高级安全参数</h3>
                 <p className="text-xs text-slate-500">密钥生命周期与熵源阈值</p>
               </div>
             </div>

             <div className="space-y-5">
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center">
                   <RefreshCw className="w-3 h-3 mr-1" />
                   Session 密钥强制轮换 (小时)
                 </label>
                 <div className="flex items-center space-x-4">
                   <input 
                     type="range" 
                     min="1" max="72" 
                     value={localConfig.keyRotationInterval} 
                     onChange={(e) => {
                       setLocalConfig(p => ({...p, keyRotationInterval: parseInt(e.target.value)}));
                       setSaved(false);
                     }}
                     className="flex-1 accent-purple-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                   />
                   <span className="font-mono text-sm font-bold text-purple-600 w-12 text-right">{localConfig.keyRotationInterval} h</span>
                 </div>
               </div>

               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center">
                   <Thermometer className="w-3 h-3 mr-1" />
                   QRNG 最小熵阈值 (Entropy Floor)
                 </label>
                 <div className="flex items-center space-x-4">
                   <input 
                     type="range" 
                     min="10" max="100" 
                     value={localConfig.entropyThreshold} 
                     onChange={(e) => {
                       setLocalConfig(p => ({...p, entropyThreshold: parseInt(e.target.value)}));
                       setSaved(false);
                     }}
                     className="flex-1 accent-orange-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                   />
                   <span className="font-mono text-sm font-bold text-orange-600 w-12 text-right">{localConfig.entropyThreshold}M</span>
                 </div>
               </div>
             </div>
           </div>

           {/* Hash Allowlist */}
           <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
               <div className="p-2 bg-emerald-50 rounded-lg">
                  <Hash className="w-5 h-5 text-emerald-600" />
               </div>
               <div>
                 <h3 className="text-base font-bold text-slate-800">允许的哈希摘要算法</h3>
               </div>
            </div>
            
            <div className="space-y-3">
              {['SHA-256', 'SHA-512', 'BLAKE2b', 'SHA-3 (Keccak)'].map((hash) => (
                <div 
                  key={hash}
                  onClick={() => toggleHash(hash)}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    localConfig.allowedHashes.includes(hash) 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-slate-50 border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${
                     localConfig.allowedHashes.includes(hash) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-400 bg-white'
                  }`}>
                    {localConfig.allowedHashes.includes(hash) && <CheckSquare className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-mono text-xs font-bold text-slate-800">{hash}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AlgoConfigView;