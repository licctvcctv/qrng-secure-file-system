import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, Download, FileKey, RefreshCw, File as FileIcon, 
  KeyRound, Lock, Server, Share2, CheckCircle2, Sliders, Shield, ArrowRight
} from 'lucide-react';
import TerminalLog from '../components/TerminalLog';
import EncryptionVisualizer from '../components/EncryptionVisualizer';
import { AppMode, EncryptionStep, LogEntry, GlobalAlgoConfig, KeyRecord, User } from '../types';
import { INITIAL_STEPS } from '../constants';

interface Props {
  globalConfig: GlobalAlgoConfig;
  currentUser: User;
  onEncryptionComplete: (record: KeyRecord) => void;
  onDecryptionComplete: (fileName: string, success: boolean) => void;
  onLog: (message: string, level?: LogEntry['level'], detail?: string, type?: 'ENCRYPT'|'DECRYPT') => void;
}

const TransferView: React.FC<Props> = ({ globalConfig, currentUser, onEncryptionComplete, onDecryptionComplete, onLog }) => {
  const [mode, setMode] = useState<AppMode>(AppMode.UPLOAD);
  const [file, setFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  // Local logs for the terminal UI
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [steps, setSteps] = useState<EncryptionStep[]>(INITIAL_STEPS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // USER SELECTIONS
  const [selectedCipher, setSelectedCipher] = useState(globalConfig.allowedCiphers[0] || 'AES-256-GCM');
  const [keyMode, setKeyMode] = useState<'auto' | 'custom'>('auto');
  const [customSecret, setCustomSecret] = useState('');

  // Refs for file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  // Helper to add logs locally AND globally
  const addLog = (message: string, level: LogEntry['level'] = 'info', detail?: string) => {
    // 1. Local Terminal
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      level,
      message,
      detail,
      user: currentUser.username
    };
    setLogs(prev => [...prev, entry]);

    // 2. Global Log (Pass type implicitly based on mode)
    const type = mode === AppMode.UPLOAD ? 'ENCRYPT' : 'DECRYPT';
    onLog(message, level, detail, type);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // 1. Encryption Simulation
  const startEncryptionProcess = useCallback(async () => {
    if (!file) return;
    if (keyMode === 'custom' && customSecret.length < 8) {
        addLog('错误: 自定义密码长度不足 (需 > 8 字符)', 'error');
        return;
    }

    setIsProcessing(true);
    setLogs([]);
    setSteps(INITIAL_STEPS.map(s => ({...s, status: 'pending', technicalDetail: undefined})));
    setProgress(0);
    setIsCompleted(false);

    const updateStep = (id: string, status: EncryptionStep['status'], detail?: string) => {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, status, technicalDetail: detail || s.technicalDetail } : s));
    };

    try {
      addLog(`任务初始化: ${file.name}`, 'system', `模式: ${keyMode === 'auto' ? '自动密钥 (QRNG)' : '手动密钥 (KDF)'}`);
      
      updateStep('hash', 'processing', '正在计算 SHA-256 哈希...');
      await wait(600);
      const mockHash = 'SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      addLog('计算文件哈希指纹', 'info', mockHash.substring(0, 20) + '...');
      updateStep('hash', 'completed', mockHash);

      updateStep('check', 'processing', '验证白名单策略...');
      await wait(400);
      addLog('验证管理员策略', 'system', `算法: ${selectedCipher} [允许]`);
      updateStep('check', 'completed', `PolicyID: POL-002 | Cipher: ${selectedCipher} | Sig: REQUIRED`);

      updateStep('negotiate', 'processing', 'ECDH 密钥协商...');
      await wait(600);
      let keyFingerprint = '';
      let negotiationDetail = '';
      if (keyMode === 'auto') {
          addLog('生成随机密钥对 (.qkey)', 'success', '使用 NIST P-256 曲线');
          keyFingerprint = 'rand-' + Math.random().toString(16).substring(2, 8);
          negotiationDetail = 'Curve: NIST P-256 | Ephemeral Public Key Generated';
      } else {
          addLog('密钥派生 (PBKDF2)', 'info', 'Input: 用户密码 + Salt (16 bytes)');
          addLog('派生主密钥 (Master Key)', 'success', 'Iterations: 100,000');
          keyFingerprint = 'kdf-' + Math.random().toString(16).substring(2, 8);
          negotiationDetail = 'KDF: PBKDF2-HMAC-SHA256 | Iter: 100000 | Salt: Random';
      }
      updateStep('negotiate', 'completed', negotiationDetail);

      updateStep('qrng', 'processing', '缓冲量子熵源 (Entropy)...');
      await wait(600);
      addLog('请求量子熵源 (QRNG)', 'system', '获取真随机 IV');
      updateStep('qrng', 'completed', 'Source: IDQ Quantum Chip | Rate: 48Mbps | IV: 0x8f2a...');

      updateStep('encrypt', 'processing', '初始化流加密...');
      addLog(`开始加密 (${selectedCipher})...`, 'system');
      
      const chunks = 5;
      for (let i = 1; i <= chunks; i++) {
        await wait(300);
        setProgress((i / chunks) * 100);
        addLog(`分块 Block ${i}/${chunks} 加密完成`, 'info');
      }
      updateStep('encrypt', 'completed', `Chunk Size: 4MB | AuthTag: 128-bit | Mode: GCM`);

      updateStep('transmit', 'processing', '上传至安全存储 Vault...');
      await wait(500);
      addLog('打包加密文件 (.enc)', 'success');
      if (keyMode === 'auto') {
        addLog('生成密钥文件 (.qkey)', 'success', '请下载保存');
      }
      updateStep('transmit', 'completed', `Storage Node: AWS-S3-Encrypted | ID: ${Date.now()}`);
      
      const newRecord: KeyRecord = {
          id: `KEY-${Date.now().toString().substring(6)}`,
          owner: currentUser.username,
          fileName: file.name,
          fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          algorithm: selectedCipher,
          keyType: keyMode === 'auto' ? 'QRNG-Auto' : 'Custom-Seed',
          createdAt: new Date().toLocaleString(),
          keyFingerprint: keyFingerprint,
          status: 'active',
          decryptCount: 0,
          usageLogs: [] // Init empty logs
      };
      onEncryptionComplete(newRecord);

      setIsProcessing(false);
      setIsCompleted(true);

    } catch (error) {
      addLog('加密任务失败', 'error');
      setIsProcessing(false);
    }
  }, [file, selectedCipher, keyMode, customSecret, onEncryptionComplete, onLog, currentUser]);

  // 2. Decryption Simulation
  const startDecryptionProcess = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);
    setLogs([]);
    setProgress(0);
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      addLog(`解密任务初始化: ${file.name}`, 'system', '准备解密环境');
      await wait(800);
      
      if (keyFile) {
        addLog('读取密钥文件 (.qkey)', 'info', '校验数字签名...');
        await wait(600);
        addLog('密钥匹配成功 (Key Match)', 'success', 'Session Key Restored');
      } else if (customSecret) {
        addLog('尝试 KDF 密钥派生', 'info', '使用提供的密码...');
        await wait(800);
        addLog('验证 HMAC 校验和', 'success', '密码正确');
      } else {
         throw new Error('Missing credentials');
      }

      addLog('正在解密内容...', 'system', 'Algorithm: AES-256-GCM');
      for (let i = 1; i <= 5; i++) {
        await wait(300);
        setProgress(i * 20);
      }

      addLog('解密成功!', 'success', '文件已还原');
      onDecryptionComplete(file.name, true);
      
      setIsProcessing(false);
      setIsCompleted(true);

    } catch (e) {
       addLog('解密失败: 凭证无效或文件损坏', 'error');
       onDecryptionComplete(file.name, false);
       setIsProcessing(false);
    }
  }, [file, keyFile, customSecret, onLog, onDecryptionComplete]);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">安全文件传输</h2>
        <p className="text-slate-500 text-sm">选择操作模式：加密打包或解密还原</p>
      </div>

       {/* Mode Toggle */}
       <div className="flex justify-center mb-8">
          <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm inline-flex">
            <button
              onClick={() => { setMode(AppMode.UPLOAD); setFile(null); setKeyFile(null); setLogs([]); setIsCompleted(false); }}
              className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                mode === AppMode.UPLOAD 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>加密 & 发送</span>
            </button>
            <button
              onClick={() => { setMode(AppMode.DOWNLOAD); setFile(null); setKeyFile(null); setLogs([]); setIsCompleted(false); }}
              className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                mode === AppMode.DOWNLOAD
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>接收 & 解密</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          
          {/* LEFT COLUMN: Input Area */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
               
               {/* STEP 1: FILE INPUT (Clean Layout) */}
               <div className="mb-8">
                 <div className="flex items-center mb-3">
                   <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold mr-2">1</div>
                   <label className="text-sm font-bold text-slate-700">
                     {mode === AppMode.UPLOAD ? '选择原始文件' : '选择加密数据包 (.enc, .aes)'}
                   </label>
                 </div>
                 
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/50 bg-slate-50 cursor-pointer group"
                 >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      onChange={(e) => e.target.files && setFile(e.target.files[0])}
                      disabled={isProcessing}
                    />
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${file ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500'}`}>
                        {file ? <FileIcon className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {file ? file.name : '点击上传文件'}
                      </span>
                      {file && <span className="text-xs text-slate-400 mt-1">{(file.size/1024/1024).toFixed(2)} MB</span>}
                    </div>
                 </div>
               </div>

               {/* STEP 2: CREDENTIALS (Two Column Layout for Better UX) */}
               <div className="mb-6">
                 <div className="flex items-center mb-3">
                   <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold mr-2">2</div>
                   <label className="text-sm font-bold text-slate-700">
                     {mode === AppMode.UPLOAD ? '加密配置' : '解密凭证'}
                   </label>
                 </div>

                 {mode === AppMode.UPLOAD ? (
                   // UPLOAD CONFIG
                   <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                               <label className="block text-xs font-bold text-slate-500 mb-2">加密算法 (Algorithm)</label>
                               <select 
                                 value={selectedCipher} 
                                 onChange={(e) => setSelectedCipher(e.target.value)}
                                 className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500"
                               >
                                   {globalConfig.allowedCiphers.map(c => (
                                       <option key={c} value={c}>{c}</option>
                                   ))}
                               </select>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 mb-2">密钥模式 (Key Mode)</label>
                               <div className="flex bg-white rounded-md border border-slate-300 overflow-hidden">
                                   <button 
                                      onClick={() => setKeyMode('auto')}
                                      className={`flex-1 py-2 text-xs font-bold transition-colors ${keyMode === 'auto' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                   >
                                       自动生成 (File)
                                   </button>
                                   <div className="w-px bg-slate-300"></div>
                                   <button 
                                      onClick={() => setKeyMode('custom')}
                                      className={`flex-1 py-2 text-xs font-bold transition-colors ${keyMode === 'custom' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                   >
                                       手动密码
                                   </button>
                               </div>
                           </div>
                      </div>
                      
                      {keyMode === 'custom' && (
                           <div className="mt-4 animate-in slide-in-from-top-2">
                               <label className="block text-xs font-semibold text-slate-500 mb-1.5">设置私钥密码</label>
                               <div className="relative">
                                   <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                   <input 
                                     type="password"
                                     value={customSecret}
                                     onChange={(e) => setCustomSecret(e.target.value)}
                                     placeholder="Enter a strong passphrase..."
                                     className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-md py-2 pl-9 pr-3 outline-none focus:ring-2 focus:ring-blue-500"
                                   />
                               </div>
                           </div>
                       )}
                   </div>
                 ) : (
                   // DOWNLOAD CONFIG - FIXED LAYOUT
                   <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {/* Option A: Key File */}
                           <div 
                              onClick={() => keyInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all flex flex-col items-center justify-center min-h-[100px] text-center ${
                                keyFile ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
                              }`}
                           >
                               <input 
                                 type="file" 
                                 ref={keyInputRef}
                                 className="hidden"
                                 accept=".qkey"
                                 onChange={(e) => {
                                    if(e.target.files) {
                                      setKeyFile(e.target.files[0]);
                                      setCustomSecret(''); // Clear password if file selected
                                    }
                                 }}
                               />
                               <FileKey className={`w-6 h-6 mb-2 ${keyFile ? 'text-emerald-600' : 'text-slate-400'}`} />
                               <span className={`text-xs font-bold ${keyFile ? 'text-emerald-700' : 'text-slate-600'}`}>
                                 {keyFile ? keyFile.name : '点击上传 .qkey 文件'}
                               </span>
                               {keyFile && <span className="text-[10px] text-emerald-600 mt-1">点击更换</span>}
                           </div>

                           {/* Option B: Password */}
                           <div className="flex flex-col justify-center">
                               <div className="relative h-full">
                                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                     <Lock className="h-4 w-4 text-slate-400" />
                                   </div>
                                   <textarea 
                                     value={customSecret}
                                     onChange={(e) => {
                                       setCustomSecret(e.target.value);
                                       setKeyFile(null); // Clear file if password typing
                                     }}
                                     placeholder="或在此输入密码..."
                                     className="w-full h-full min-h-[100px] bg-white border border-slate-300 text-slate-800 text-sm rounded-lg py-3 pl-9 pr-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                   />
                               </div>
                           </div>
                       </div>
                   </div>
                 )}
               </div>


               {/* Action Buttons */}
               <div className="mt-8 flex justify-end">
                  {mode === AppMode.UPLOAD ? (
                    <button
                      onClick={startEncryptionProcess}
                      disabled={!file || isProcessing || (keyMode === 'custom' && customSecret.length < 1)}
                      className={`px-6 py-2.5 rounded-lg font-medium text-sm flex items-center space-x-2 transition-all shadow-lg ${
                        !file || isProcessing
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                      }`}
                    >
                      {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      <span>{isProcessing ? '加密中...' : '执行加密'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={startDecryptionProcess}
                      disabled={!file || (!keyFile && !customSecret) || isProcessing}
                      className={`px-6 py-2.5 rounded-lg font-medium text-sm flex items-center space-x-2 transition-all shadow-lg ${
                        !file || isProcessing
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                      }`}
                    >
                      {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                      <span>{isProcessing ? '解密中...' : '验证并解密'}</span>
                    </button>
                  )}
               </div>

               {/* Progress Bar */}
               {isProcessing && (
                  <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>处理进度 (Processing)</span>
                        <span className="font-mono">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-900 transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                  </div>
               )}

               {/* Success State */}
               {isCompleted && (
                 <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex items-start space-x-3 animate-in zoom-in-95 duration-300">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-emerald-800">操作成功完成</h4>
                      <p className="text-xs text-emerald-600 mt-1">
                        {mode === AppMode.UPLOAD 
                          ? `文件已使用 ${selectedCipher} 加密。${keyMode === 'auto' ? '请务必下载 .qkey 密钥文件。' : '请记住您设置的密码。'}`
                          : '文件解密成功。原文已恢复并准备下载。'
                        }
                      </p>
                      <div className="mt-3 flex space-x-3">
                         <button className="text-xs bg-white border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-md hover:bg-emerald-100 font-medium">
                           下载结果文件
                         </button>
                         {mode === AppMode.UPLOAD && keyMode === 'auto' && (
                           <button className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 font-medium flex items-center">
                             <Share2 className="w-3 h-3 mr-1" />
                             下载私钥 (.qkey)
                           </button>
                         )}
                      </div>
                    </div>
                 </div>
               )}
            </div>

            {/* Visualizer - NOW HAS PURPOSE */}
            {mode === AppMode.UPLOAD && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100">
                  加密流水线审计 (Live Audit)
                </h3>
                <EncryptionVisualizer steps={steps} />
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Terminal */}
          <div className="col-span-12 lg:col-span-5 flex flex-col h-full">
            <div className="flex-1 min-h-[500px] bg-white border border-slate-200 rounded-xl p-1 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                 <span className="text-xs font-bold text-slate-500 flex items-center">
                   <Server className="w-3 h-3 mr-2" />
                   操作审计日志
                 </span>
              </div>
              <div className="flex-1 p-2">
                 <TerminalLog logs={logs} />
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default TransferView;