import React, { useState, useRef } from 'react';
import { User } from '../types';
import { Camera, Save, User as UserIcon, Mail, Phone, Building, Shield, Upload } from 'lucide-react';

interface Props {
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
}

const SettingsView: React.FC<Props> = ({ currentUser, onUpdateUser }) => {
  const [formData, setFormData] = useState<User>(currentUser);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof User, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdateUser(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">个人中心</h2>
        <p className="text-slate-500 text-sm">管理您的账户信息、头像与安全偏好</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-900 relative">
           <div className="absolute bottom-4 right-6 text-white/20">
              <Shield className="w-24 h-24" />
           </div>
        </div>

        <div className="px-8 pb-8">
           {/* Avatar Section */}
           <div className="relative -mt-12 mb-6 inline-block group">
             <div className="w-24 h-24 rounded-full bg-white p-1 border border-slate-200 shadow-md relative overflow-hidden">
                {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-2xl uppercase">
                        {formData.username.substring(0,2)}
                    </div>
                )}
                {/* Hover Overlay */}
                <div 
                  onClick={handleAvatarClick}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                    <Upload className="w-6 h-6 text-white" />
                </div>
             </div>
             
             <button 
               onClick={handleAvatarClick}
               className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors border-2 border-white"
             >
                <Camera className="w-4 h-4" />
             </button>
             
             {/* Hidden Input */}
             <input 
               type="file" 
               ref={fileInputRef}
               className="hidden"
               accept="image/*"
               onChange={handleFileChange}
             />
           </div>

           {/* Form Fields */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="col-span-1 md:col-span-2">
                 <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">基本信息</h3>
              </div>

              <div>
                 <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">显示名称</label>
                 <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">用户名 (Identity ID)</label>
                 <div className="relative">
                    <Shield className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={formData.username}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-500 cursor-not-allowed"
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">电子邮箱</label>
                 <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="email" 
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="user@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">联系电话</label>
                 <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={formData.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+86 1XX XXXX XXXX"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                 </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                 <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">所属部门 / 组织</label>
                 <div className="relative">
                    <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={formData.department || ''}
                      onChange={(e) => handleChange('department', e.target.value)}
                      placeholder="研发中心 / 安全部"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                 </div>
              </div>

           </div>

           <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleSave}
                className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg transition-all transform active:scale-95 ${
                    isSaved ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/10'
                }`}
              >
                {isSaved ? '保存成功' : '保存更改'}
                {isSaved ? <Save className="w-4 h-4 ml-2" /> : <Save className="w-4 h-4 ml-2" />}
              </button>
           </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsView;