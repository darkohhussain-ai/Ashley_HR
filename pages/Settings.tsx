import React, { useState, useRef, useEffect } from 'react';
import { doc, setDoc, collection, addDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseService';
import { AppConfig, DEFAULTS, User, UserRole } from '../types';
import { Card, Button, Input, Select } from '../components/UI';
import { Icon } from '../components/Icon';

interface SettingsProps {
  currentUser: User;
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
  adminUnlock: boolean;
  setAdminUnlock: (v: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
}

export const SettingsPage: React.FC<SettingsProps> = ({ currentUser, config, setConfig, adminUnlock, setAdminUnlock, isDarkMode, setIsDarkMode }) => {
  const [local, setLocal] = useState(config);
  const [tab, setTab] = useState<'profile' | 'general' | 'design' | 'users'>('profile');
  const logoRef = useRef<HTMLInputElement>(null);
  const fontRef = useRef<HTMLInputElement>(null);

  // Users Management State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'guest' as UserRole });

  // Profile State
  const [profileData, setProfileData] = useState({ username: currentUser.username, password: currentUser.password });

  useEffect(() => {
    if (tab === 'users' && currentUser.role === 'admin') {
      fetchUsers();
    }
  }, [tab, currentUser]);

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    setUsersList(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
  };

  const saveConfig = async () => {
    await setDoc(doc(db, 'settings', 'appConfig'), local, { merge: true });
    setConfig(local);
    alert('تۆمارکرا!');
  };

  const addUser = async () => {
    if(!newUser.username || !newUser.password) return;
    await addDoc(collection(db, 'users'), { ...newUser, createdAt: Date.now() });
    setNewUser({ username: '', password: '', role: 'guest' });
    fetchUsers();
  };

  const removeUser = async (id: string) => {
    if (confirm('دڵنیایت؟')) {
      await deleteDoc(doc(db, 'users', id));
      fetchUsers();
    }
  };

  const updateProfile = async () => {
    await updateDoc(doc(db, 'users', currentUser.id), {
      username: profileData.username,
      password: profileData.password
    });
    alert('زانیارییەکان نوێکرانەوە! تکایە دووبارە بچۆرە ژوورەوە بۆ بینینی گۆڕانکارییەکان.');
  };

  const uploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onload = () => setLocal({ ...local, logo: r.result as string });
      r.readAsDataURL(f);
    }
  };

  const uploadFont = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onload = () => setLocal({ ...local, customFontData: r.result as string, fontFamily: 'CustomUploadedFont' });
      r.readAsDataURL(f);
    }
  };

  const TabButton = ({ id, label }: { id: typeof tab, label: string }) => (
    <button 
      onClick={() => setTab(id)} 
      className={`pb-2 font-bold transition ${tab === id ? 'text-[var(--brand-color)] border-b-2 border-[var(--brand-color)]' : 'text-gray-500'}`}
    >
      {label}
    </button>
  );

  return (
    <Card className="max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b border-gray-200 dark:border-dark-border pb-2 overflow-x-auto">
        <TabButton id="profile" label="پرۆفایلی من" />
        {currentUser.role === 'admin' && (
          <>
            <TabButton id="general" label="گشتی" />
            <TabButton id="design" label="دیزاین" />
            <TabButton id="users" label="بەڕێوەبردنی ئەندامان" />
          </>
        )}
      </div>

      {/* Common: Theme Toggle */}
      <div className="mb-6 flex justify-between items-center bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-dark-border">
        <span className="font-bold text-gray-900 dark:text-white">دۆخی ڕوکار (Theme)</span>
        <Button variant="secondary" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? <><Icon name="sun" /> دۆخی ڕووناک</> : <><Icon name="moon" /> دۆخی تاریک</>}
        </Button>
      </div>

      {/* Admin Unlock (Only for Admin) */}
      {currentUser.role === 'admin' && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-4 rounded-xl flex justify-between items-center">
          <div>
            <h4 className="text-red-500 dark:text-red-400 font-bold">کردنەوەی قفڵی ئەرشیف</h4>
            <p className="text-xs text-gray-500">تەنها بۆ دەستکاریکردنی کاتی داتاکانی کۆن</p>
          </div>
          <button 
            onClick={() => setAdminUnlock(!adminUnlock)} 
            className={`px-4 py-2 rounded-lg font-bold transition ${adminUnlock ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}
          >
            {adminUnlock ? 'کرایەوە' : 'قفڵە'}
          </button>
        </div>
      )}

      {/* --- CONTENT BY TAB --- */}

      {tab === 'profile' && (
        <div className="space-y-4 max-w-md">
           <h3 className="font-bold text-lg mb-4">گۆڕینی زانیاری کەسی</h3>
           <div>
             <label className="text-xs text-gray-500 block mb-1">ناوی بەکارهێنەر</label>
             <Input value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})} />
           </div>
           <div>
             <label className="text-xs text-gray-500 block mb-1">وشەی نهێنی نوێ</label>
             <Input type="password" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} />
           </div>
           <Button onClick={updateProfile}>نوێکردنەوە</Button>
        </div>
      )}

      {tab === 'users' && currentUser.role === 'admin' && (
        <div className="space-y-6">
           <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
             <h4 className="font-bold mb-3">زیادکردنی ئەندام</h4>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
               <Input placeholder="ناو" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
               <Input placeholder="وشەی نهێنی" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
               <Select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                 <option value="guest">Guest (Viewer)</option>
                 <option value="admin">Admin</option>
               </Select>
               <Button onClick={addUser}><Icon name="plus"/> زیادکردن</Button>
             </div>
           </div>

           <div className="border rounded-xl overflow-hidden">
             <table className="w-full text-right bg-white dark:bg-dark-surface">
               <thead className="bg-gray-100 dark:bg-slate-800 text-xs text-gray-500">
                 <tr>
                    <th className="p-3">ناو</th>
                    <th className="p-3">ڕۆڵ (Rank)</th>
                    <th className="p-3">وشەی نهێنی</th>
                    <th className="p-3">کردار</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                 {usersList.map(user => (
                   <tr key={user.id}>
                     <td className="p-3 font-bold">{user.username} {user.id === currentUser.id && '(تۆ)'}</td>
                     <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{user.role}</span></td>
                     <td className="p-3 font-mono text-sm opacity-50">{user.password}</td>
                     <td className="p-3">
                       {user.id !== currentUser.id && (
                         <button onClick={() => removeUser(user.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Icon name="trash"/></button>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {tab === 'general' && currentUser.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-lg p-2 border border-gray-200 shadow-sm flex items-center justify-center">
                {local.logo ? <img src={local.logo} className="w-full h-full object-contain" /> : <span className="text-xs text-gray-400">No Logo</span>}
              </div>
              <div className="space-y-2">
                <Button variant="secondary" onClick={() => logoRef.current?.click()} type="button">گۆڕینی لۆگۆ</Button>
                <input type="file" ref={logoRef} onChange={uploadLogo} className="hidden" accept="image/*" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">ناوی سیستەم</label>
              <Input value={local.appName} onChange={e => setLocal({...local, appName: e.target.value})} />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">فۆنت</label>
              <div className="flex gap-2">
                 <Button variant="secondary" onClick={() => fontRef.current?.click()} type="button" className="w-full">ئەپلۆدکردنی فۆنت</Button>
                 <input type="file" ref={fontRef} onChange={uploadFont} className="hidden" accept=".ttf,.woff,.woff2" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">نرخی کاتژمێر (IQD)</label>
              <Input type="number" value={local.overtimeRate} onChange={e => setLocal({...local, overtimeRate: Number(e.target.value)})} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">نرخی بار (IQD)</label>
              <Input type="number" value={local.loadRate} onChange={e => setLocal({...local, loadRate: Number(e.target.value)})} />
            </div>
            <div className="pt-4">
                <Button onClick={saveConfig} className="w-full">{local.labels.btn_save}</Button>
            </div>
          </div>
        </div>
      )}

      {tab === 'design' && currentUser.role === 'admin' && (
        <div className="space-y-8 animate-fade-in">
          <div>
            <h4 className="font-bold mb-4 text-[var(--brand-color)]">ڕەنگەکان</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">ڕەنگی سەرەکی</label>
                <input 
                  type="color" 
                  value={local.colors.brand || DEFAULTS.colors.brand} 
                  onChange={e => setLocal({...local, colors: {...local.colors, brand: e.target.value}})} 
                  className="w-full h-10 rounded cursor-pointer border border-gray-300" 
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">ڕەنگی تەنیشت</label>
                <input 
                  type="color" 
                  value={local.colors.sidebar || DEFAULTS.colors.sidebar} 
                  onChange={e => setLocal({...local, colors: {...local.colors, sidebar: e.target.value}})} 
                  className="w-full h-10 rounded cursor-pointer border border-gray-300" 
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-[var(--brand-color)]">گۆڕینی ناوەکان</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(DEFAULTS.labels).map(key => (
                <div key={key}>
                  <label className="text-xs text-gray-500">{key.replace(/(nav_|stat_|th_|btn_)/g, '')}</label>
                  <Input 
                    value={local.labels[key] || ''} 
                    onChange={e => setLocal({...local, labels: {...local.labels, [key]: e.target.value}})} 
                  />
                </div>
              ))}
            </div>
          </div>
          <Button onClick={saveConfig} className="w-full mt-4">{local.labels.btn_save}</Button>
        </div>
      )}
    </Card>
  );
};