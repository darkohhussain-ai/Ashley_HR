import React, { useState, useRef, useEffect } from 'react';
import { doc, setDoc, collection, onSnapshot, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseService';
import { AppConfig, DEFAULTS, User } from '../types';
import { Card, Button, Input, Select } from '../components/UI';
import { Icon } from '../components/Icon';

interface SettingsProps {
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
  adminUnlock: boolean;
  setAdminUnlock: (v: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  currentUser: User;
}

export const SettingsPage: React.FC<SettingsProps> = ({ config, setConfig, adminUnlock, setAdminUnlock, isDarkMode, setIsDarkMode, currentUser }) => {
  const [local, setLocal] = useState(config);
  const [tab, setTab] = useState<'profile' | 'general' | 'design' | 'accounts'>(currentUser.role === 'admin' ? 'general' : 'profile');
  const logoRef = useRef<HTMLInputElement>(null);
  const fontRef = useRef<HTMLInputElement>(null);

  // Accounts State
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'guest' });
  
  // Profile State
  const [profileForm, setProfileForm] = useState({ username: currentUser.username, password: currentUser.password });

  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      const unsub = onSnapshot(collection(db, 'users'), (snap) => {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
      });
      return () => unsub();
    }
  }, [isAdmin]);

  const save = async () => {
    await setDoc(doc(db, 'settings', 'appConfig'), local, { merge: true });
    setConfig(local);
    alert('تۆمارکرا!');
  };

  const updateProfile = async () => {
    if (!profileForm.username || !profileForm.password) return alert('نابێت ناو یان وشەی نهێنی بەتاڵ بێت');
    if (currentUser.id === 'master') {
       alert('ناتوانیت هەژماری سەرەکی دەستکاری بکەیت');
       return;
    }
    
    await updateDoc(doc(db, 'users', currentUser.id), {
       username: profileForm.username,
       password: profileForm.password
    });
    alert('زانیارییەکان نوێکرانەوە. تکایە جارێکی تر بچۆ ژوورەوە');
  };

  const addUser = async () => {
    if (!newUser.username || !newUser.password) return alert('پڕکردنەوەی هەموو خانەکان پێویستە');
    await addDoc(collection(db, 'users'), {
      ...newUser,
      createdAt: Date.now()
    });
    setNewUser({ username: '', password: '', role: 'guest' });
  };

  const removeUser = async (id: string) => {
    if (confirm('ئایا دڵنیایت لە سڕینەوەی ئەم بەکارهێنەرە؟')) {
      await deleteDoc(doc(db, 'users', id));
    }
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

  return (
    <Card className="max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-dark-border pb-2 overflow-x-auto">
        <button 
          onClick={() => setTab('profile')} 
          className={`pb-2 font-bold transition whitespace-nowrap ${tab === 'profile' ? 'text-[var(--brand-color)] border-b-2 border-[var(--brand-color)]' : 'text-gray-500'}`}
        >
          پرۆفایل
        </button>
        {isAdmin && (
          <>
            <button 
              onClick={() => setTab('general')} 
              className={`pb-2 font-bold transition whitespace-nowrap ${tab === 'general' ? 'text-[var(--brand-color)] border-b-2 border-[var(--brand-color)]' : 'text-gray-500'}`}
            >
              گشتی
            </button>
            <button 
              onClick={() => setTab('design')} 
              className={`pb-2 font-bold transition whitespace-nowrap ${tab === 'design' ? 'text-[var(--brand-color)] border-b-2 border-[var(--brand-color)]' : 'text-gray-500'}`}
            >
              دیزاین
            </button>
            <button 
              onClick={() => setTab('accounts')} 
              className={`pb-2 font-bold transition whitespace-nowrap ${tab === 'accounts' ? 'text-[var(--brand-color)] border-b-2 border-[var(--brand-color)]' : 'text-gray-500'}`}
            >
              هەژمارەکان
            </button>
          </>
        )}
      </div>

      {/* Theme Toggle */}
      <div className="mb-6 flex justify-between items-center bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-dark-border">
        <span className="font-bold text-gray-900 dark:text-white">دۆخی ڕوکار (Theme)</span>
        <Button variant="secondary" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? <><Icon name="sun" /> دۆخی ڕووناک</> : <><Icon name="moon" /> دۆخی تاریک</>}
        </Button>
      </div>

      {/* Admin Unlock */}
      {isAdmin && (
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

      {tab === 'profile' && (
         <div className="space-y-6 animate-fade-in">
            <h4 className="font-bold mb-4 text-[var(--brand-color)]">زانیاری کەسی</h4>
            <div className="max-w-md">
               <div className="mb-4">
                  <label className="text-xs text-gray-500 block mb-1">ناوی بەکارهێنەر</label>
                  <Input value={profileForm.username} onChange={e => setProfileForm({...profileForm, username: e.target.value})} disabled={currentUser.id === 'master'} />
               </div>
               <div className="mb-6">
                  <label className="text-xs text-gray-500 block mb-1">وشەی نهێنی</label>
                  <Input value={profileForm.password} onChange={e => setProfileForm({...profileForm, password: e.target.value})} disabled={currentUser.id === 'master'} />
               </div>
               {currentUser.id !== 'master' && (
                  <Button onClick={updateProfile}>نوێکردنەوە</Button>
               )}
               {currentUser.id === 'master' && (
                  <p className="text-xs text-red-500 mt-2">ناتوانیت هەژماری سەرەکی لەم بەشە دەستکاری بکەیت</p>
               )}
            </div>
         </div>
      )}

      {tab === 'general' && isAdmin && (
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
          </div>
          
          <div className="md:col-span-2">
             <Button onClick={save} className="w-full mt-4">{local.labels.btn_save}</Button>
          </div>
        </div>
      )}

      {tab === 'design' && isAdmin && (
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

          <Button onClick={save} className="w-full mt-4">{local.labels.btn_save}</Button>
        </div>
      )}

      {tab === 'accounts' && isAdmin && (
        <div className="space-y-6 animate-fade-in">
           <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-dark-border">
              <h4 className="font-bold mb-4 text-[var(--brand-color)]">زیادکردنی بەکارهێنەر</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                 <div>
                    <label className="text-xs text-gray-500 mb-1 block">ناوی بەکارهێنەر</label>
                    <Input value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="User" />
                 </div>
                 <div>
                    <label className="text-xs text-gray-500 mb-1 block">وشەی نهێنی</label>
                    <Input value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Pass" type="text" />
                 </div>
                 <div>
                    <label className="text-xs text-gray-500 mb-1 block">ڕۆڵ</label>
                    <Select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}>
                       <option value="guest">میوان (Viewer)</option>
                       <option value="admin">بەڕێوەبەر (Admin)</option>
                    </Select>
                 </div>
                 <Button onClick={addUser} className="w-full"><Icon name="plus"/> زیادکردن</Button>
              </div>
           </div>

           <div className="border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
              <table className="w-full text-right">
                 <thead className="bg-gray-100 dark:bg-slate-800 text-xs text-gray-500">
                    <tr>
                       <th className="p-3">ناو</th>
                       <th className="p-3">ڕۆڵ</th>
                       <th className="p-3"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                    {users.map(u => (
                       <tr key={u.id}>
                          <td className="p-3 font-bold text-gray-900 dark:text-white">{u.username}</td>
                          <td className="p-3">
                             <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                {u.role === 'admin' ? 'Admin' : 'Guest'}
                             </span>
                          </td>
                          <td className="p-3 text-left">
                             <button onClick={() => removeUser(u.id)} className="text-red-400 hover:text-red-600">
                                <Icon name="trash" size={18} />
                             </button>
                          </td>
                       </tr>
                    ))}
                    {users.length === 0 && (
                       <tr><td colSpan={3} className="p-4 text-center text-gray-500">هیچ بەکارهێنەرێک نییە</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </Card>
  );
};