import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseService';
import { User, UserRole } from '../types';
import { Card, Button, Input, Select } from '../components/UI';
import { Icon } from '../components/Icon';

interface LoginProps {
  onLogin: (user: User) => void;
  appName: string;
  logo: string;
}

export const LoginPage: React.FC<LoginProps> = ({ onLogin, appName, logo }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'admin' as UserRole
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. First, check database for real users
      const q = query(
        collection(db, 'users'), 
        where('username', '==', formData.username),
        where('password', '==', formData.password),
        where('role', '==', formData.role)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data() as User;
        onLogin({ ...userData, id: snapshot.docs[0].id });
      } else {
        // 2. Fallback / Master Account Check
        // This allows 'Darko' to login even if not in database, or if database has other users.
        const isMasterAdmin = 
          formData.username === 'Darko' && 
          formData.password === '123456' && 
          formData.role === 'admin';

        if (isMasterAdmin) {
           // Create a temporary session for the master admin
           onLogin({ 
             id: 'master-admin', 
             username: 'Darko', 
             password: '123456', 
             role: 'admin', 
             createdAt: Date.now() 
           });
        } else {
          setError('زانیارییەکان هەڵەن، تکایە دڵنیابەرەوە.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('هەڵەیەک ڕوویدا لە پەیوەستبوون.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-bg p-4 bg-gradient-to-br from-gray-200 to-gray-100 dark:from-dark-bg dark:to-slate-900">
      <Card className="w-full max-w-md animate-fade-in border-t-4 border-t-[var(--brand-color)]">
        <div className="text-center mb-8">
          {logo && (
            <div className="w-20 h-20 mx-auto bg-white rounded-2xl p-2 shadow-sm mb-4 border border-gray-100">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{appName}</h1>
          <p className="text-gray-500 text-sm mt-1">چوونەژوورەوە بۆ سیستەم</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">ناوی بەکارهێنەر</label>
            <Input 
              value={formData.username} 
              onChange={e => setFormData({...formData, username: e.target.value})}
              placeholder="Name"
              required
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">وشەی نهێنی</label>
            <Input 
              type="password"
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})}
              placeholder="Password"
              required
            />
          </div>

          <div>
             <label className="text-xs font-bold text-gray-500 mb-1 block">ڕۆڵ (Role)</label>
             <Select 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
             >
               <option value="admin">Admin (بەڕێوەبەر)</option>
               <option value="guest">Guest (میوان)</option>
             </Select>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/10 p-3 rounded-lg flex items-center gap-2">
              <Icon name="warning-circle" weight="fill" /> {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full py-3 text-lg mt-4 shadow-lg shadow-[var(--brand-color)]/20"
            disabled={loading}
          >
            {loading ? '...چاوەڕوانبە' : 'چوونەژوورەوە'} <Icon name="sign-in" weight="bold" />
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          Ashley System v1.0
        </div>
      </Card>
    </div>
  );
};