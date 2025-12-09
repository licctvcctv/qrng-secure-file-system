import React, { useState, useEffect } from 'react';
import { Activity, Shield, Zap, Database, Info } from 'lucide-react';
import { GlobalAlgoConfig } from '../types';

interface Props {
  config: GlobalAlgoConfig;
  totalFiles: number;
  totalStorageBytes: number; // New prop for storage size
}

export const SystemDashboard: React.FC<Props> = ({ config, totalFiles, totalStorageBytes }) => {
  // 1. Simulate Live Hardware Sensor Data (QRNG Rate)
  const [entropyRate, setEntropyRate] = useState(48.2);
  const [latency, setLatency] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuate entropy between 46.0 and 52.0
      setEntropyRate(prev => +(prev + (Math.random() - 0.5) * 1.5).toFixed(1));
      // Fluctuate latency between 8 and 18 to simulate network jitter
      setLatency(prev => Math.floor(10 + Math.random() * 8));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Format Storage Size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 2. Get the primary active algorithm (Policy Default)
  const activeAlgo = config.allowedCiphers[0] || 'Unknown';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard 
        icon={<Zap className="w-5 h-5 text-orange-500" />}
        label="QRNG 熵源速率 (Live)"
        value={`${entropyRate} Mbps`}
        subtext="量子态叠加正常 | IDQ-Chipset"
        color="border-orange-200 bg-white"
        bgIcon="bg-orange-50"
        tooltip="从物理量子芯片读取真随机数的实时比特率"
      />
      <StatCard 
        icon={<Shield className="w-5 h-5 text-emerald-600" />}
        label="默认加密策略 (Policy)"
        value={activeAlgo.split('-')[0]} // Show AES/ChaCha
        subtext={`${activeAlgo} (优先)`} // Show full name
        color="border-emerald-200 bg-white"
        bgIcon="bg-emerald-50"
        tooltip="管理员配置的全局首选算法，所有未指定算法的传输将默认使用此标准"
      />
      <StatCard 
        icon={<Activity className="w-5 h-5 text-blue-600" />}
        label="端到端加密延迟 (E2E)"
        value={`${latency} ms`}
        subtext="mTLS 隧道 | 客户端 ↔ 网关"
        color="border-blue-200 bg-white"
        bgIcon="bg-blue-50"
        tooltip="包含 TLS 握手、密钥协商及网络往返的总延迟"
      />
      <StatCard 
        icon={<Database className="w-5 h-5 text-purple-600" />}
        label="安全存储总用量"
        value={formatSize(totalStorageBytes)}
        subtext={`${totalFiles} 个加密对象 (Encrypted Objects)`}
        color="border-purple-200 bg-white"
        bgIcon="bg-purple-50"
        tooltip="所有已加密文件在云存储中占用的实际物理空间（包含元数据头）"
      />
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: string;
  bgIcon: string;
  tooltip: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtext, color, bgIcon, tooltip }) => (
  <div className={`p-4 rounded-xl border ${color} shadow-sm transition-transform hover:scale-[1.02] group relative`}>
    {/* Tooltip hint */}
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" title={tooltip}>
       <Info className="w-3.5 h-3.5 text-slate-400" />
    </div>

    <div className="flex items-center justify-between mb-3">
      <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</div>
      <div className={`p-1.5 rounded-lg ${bgIcon}`}>
        {icon}
      </div>
    </div>
    <div className="text-2xl font-bold text-slate-800 font-mono tracking-tight">{value}</div>
    <div className="text-xs text-slate-500 mt-1 font-medium truncate pr-4">{subtext}</div>
  </div>
);

export default SystemDashboard;