import React, { useState } from 'react';
import { Laptop2, Smartphone, Server, Wifi, MoreHorizontal, ShieldAlert, Plus, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { User, MockDevice, LogEntry } from '../types';

interface Props {
  currentUser: User;
  devices: MockDevice[];
  onUpdateDevices: (devices: MockDevice[]) => void;
  onLog: (msg: string, level?: LogEntry['level'], detail?: string, type?: LogEntry['actionType']) => void;
}

const DeviceManagerView: React.FC<Props> = ({ currentUser, devices, onUpdateDevices, onLog }) => {
  const [filter, setFilter] = useState('');

  // Actions
  const handleAction = (id: string, action: 'approve' | 'revoke' | 'delete') => {
    const device = devices.find(d => d.id === id);
    if (!device) return;

    if (action === 'delete') {
      const newDevices = devices.filter(d => d.id !== id);
      onUpdateDevices(newDevices);
      onLog(`管理员删除了设备: ${device.name}`, 'warning', `ID: ${id}`, 'SYSTEM');
      return;
    }

    const newStatus = action === 'approve' ? 'trusted' : 'revoked';
    const newDevices = devices.map(d => d.id === id ? { ...d, status: newStatus } : d);
    
    // Type coercion for status to match interface
    onUpdateDevices(newDevices as MockDevice[]); 
    
    if (action === 'approve') {
       onLog(`管理员批准了设备: ${device.name}`, 'success', `ID: ${id} | IP: ${device.ip}`, 'SYSTEM');
    } else {
       onLog(`管理员吊销了设备: ${device.name}`, 'error', `ID: ${id} | Reason: Manual Revocation`, 'SYSTEM');
    }
  };

  const handleAddDevice = () => {
    // Simulate adding a new pending device
    const newId = `DEV-${Math.floor(Math.random() * 9000) + 1000}`;
    const newDevice: MockDevice = {
      id: newId,
      name: 'New Unknown Device',
      ip: `10.0.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
      fingerprint: 'xx:xx:xx:xx (Generic)',
      lastActive: 'Just now',
      status: 'pending',
      type: 'mobile'
    };
    onUpdateDevices([newDevice, ...devices]);
    onLog(`新设备接入请求: ${newId}`, 'warning', 'Status: Pending Approval', 'SYSTEM');
  };

  const displayDevices = devices.filter(d => 
     d.name.toLowerCase().includes(filter.toLowerCase()) || 
     d.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">终端设备鉴权</h2>
          <p className="text-slate-500 text-sm">管理允许访问加密隧道的可信设备列表</p>
        </div>
        <button 
           onClick={handleAddDevice}
           className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-lg shadow-slate-900/20 transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          模拟新设备接入
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase mb-1">设备总数 (Total)</div>
          <div className="text-2xl font-mono text-slate-800 font-bold">{devices.length}</div>
          <div className="text-xs text-emerald-600 mt-2 flex items-center">
             <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
             {devices.filter(d => d.lastActive.includes('Online') || d.lastActive.includes('当前')).length} 台在线
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
           <div className="text-slate-500 text-xs font-bold uppercase mb-1">待审批 (Pending)</div>
           <div className="text-2xl font-mono text-slate-800 font-bold">{devices.filter(d => d.status === 'pending').length}</div>
           <div className="text-xs text-orange-600 mt-2">需要管理员签名</div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
           <div className="text-slate-500 text-xs font-bold uppercase mb-1">已吊销 (Revoked)</div>
           <div className="text-2xl font-mono text-slate-800 font-bold">{devices.filter(d => d.status === 'revoked').length}</div>
           <div className="text-xs text-red-600 mt-2">存在安全违规</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex space-x-2">
            <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></span>
            <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></span>
            <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></span>
          </div>
          <input 
             type="text" 
             placeholder="搜索设备..." 
             className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
             value={filter}
             onChange={e => setFilter(e.target.value)}
          />
        </div>
        
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">设备名称 / ID</th>
              <th className="px-6 py-4">IP 地址 & 硬件指纹</th>
              <th className="px-6 py-4">状态</th>
              <th className="px-6 py-4">类型</th>
              <th className="px-6 py-4 text-right">管理操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayDevices.map((device) => (
              <tr key={device.id} className={`hover:bg-slate-50 transition-colors group ${device.lastActive.includes('当前') ? 'bg-blue-50/30' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${device.status === 'trusted' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      {device.type === 'desktop' && <Laptop2 className="w-4 h-4" />}
                      {device.type === 'mobile' && <Smartphone className="w-4 h-4" />}
                      {device.type === 'server' && <Server className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-700 flex items-center">
                        {device.name}
                        {device.lastActive.includes('当前') && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700">本机</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">{device.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs">
                  <div className="text-slate-600 font-medium">{device.ip}</div>
                  <div className="text-slate-400">{device.fingerprint}</div>
                </td>
                <td className="px-6 py-4">
                  {device.status === 'trusted' && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Wifi className="w-3 h-3 mr-1" /> 已信任
                    </span>
                  )}
                  {device.status === 'pending' && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">
                      <ShieldAlert className="w-3 h-3 mr-1" /> 待审核
                    </span>
                  )}
                  {device.status === 'revoked' && (
                     <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                      <Ban className="w-3 h-3 mr-1" /> 已吊销
                     </span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-500 capitalize text-xs font-medium">
                  {device.type === 'desktop' ? '桌面终端' : device.type === 'mobile' ? '移动端' : '服务器'}
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {device.status === 'pending' && (
                         <button onClick={() => handleAction(device.id, 'approve')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="批准">
                           <CheckCircle className="w-4 h-4" />
                         </button>
                      )}
                      {device.status !== 'revoked' && (
                         <button onClick={() => handleAction(device.id, 'revoke')} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="吊销证书">
                           <Ban className="w-4 h-4" />
                         </button>
                      )}
                      <button onClick={() => handleAction(device.id, 'delete')} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="删除记录">
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeviceManagerView;