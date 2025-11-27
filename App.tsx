import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc, query, orderBy, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseService';
import { AppConfig, DEFAULTS, Employee, User } from './types';
import { Icon } from './components/Icon';
import { Select } from './components/UI';

// Pages
import { Dashboard } from './pages/Dashboard';
import { EmployeesList } from './pages/Employees';
import { EmployeeProfile } from './pages/EmployeeProfile';
import { OvertimeSection } from './pages/Overtime';
import { InputPage } from './pages/Inputs';
import { SettingsPage } from './pages/Settings';

function App() {
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [adminUnlock, setAdminUnlock] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') !== 'light');
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '', role: 'admin' });
  const [loginError, setLoginError] = useState('');

  const [config, setConfig] = useState<AppConfig>({
    appName: 'سیستەمی بەڕێوەبردن',
    logo: '',
    overtimeRate: 5000,
    loadRate: 5000,
    fontFamily: 'Noto Sans Arabic',
    customFontData: null,
    labels: DEFAULTS.labels,
    colors: DEFAULTS.colors
  });

  // Derived state
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId) || null;

  // Theme & Fonts
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const root = document.documentElement.style;
    if (config.customFontData) {
      const fontFace = new FontFace('CustomUploadedFont', `url(${config.customFontData})`);
      fontFace.load().then(loadedFace => {
        document.fonts.add(loadedFace);
        root.setProperty('--app-font', 'CustomUploadedFont, sans-serif');
      });
    } else {
      root.setProperty('--app-font', config.fontFamily + ', sans-serif');
    }
    root.setProperty('--brand-color', config.colors.brand || DEFAULTS.colors.brand);
  }, [config]);

  // Initial Data Load
  useEffect(() => {
    const init = async () => {
      // Load Settings
      const cDoc = await getDoc(doc(db, 'settings', 'appConfig'));
      if (cDoc.exists()) {
        const data = cDoc.data() as Partial<AppConfig>;
        setConfig(prev => ({ 
          ...prev, 
          ...data, 
          labels: { ...prev.labels, ...(data.labels || {}) }, 
          colors: { ...prev.colors, ...(data.colors || {}) } 
        }));
      }

      // Load Employees
      // Request: Sort alphabetically (Arabic)
      const q = query(collection(db, 'employees'));
      onSnapshot(q, (snap: any) => {
        const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Employee));
        // Sort by name using localeCompare for Arabic support
        list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        setEmployees(list);
        setLoading(false);
      });
    };
    init();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      // Check Database
      const q = query(collection(db, 'users'), where('username', '==', loginForm.username));
      const querySnapshot = await getDocs(q);
      
      let user: User | null = null;

      if (!querySnapshot.empty) {
        // User exists in DB
        const userData = querySnapshot.docs[0].data() as User;
        if (userData.password === loginForm.password) {
          user = { ...userData, id: querySnapshot.docs[0].id };
        }
      } 
      
      // Fallback: Master Admins
      if (!user) {
        // Darko
        if ((loginForm.username === 'Darko' || loginForm.username === 'darko') && loginForm.password === '123456') {
          user = { id: 'master', username: 'Darko', password: '', role: 'admin', createdAt: Date.now() };
        }
        // Danar
        else if (loginForm.username === 'danar' && loginForm.password === '11223344') {
          user = { id: 'master_danar', username: 'Danar', password: '', role: 'admin', createdAt: Date.now() };
        }
      }

      if (user) {
        // Strict Role Check based on Login Form selection
        if (user.role !== loginForm.role) {
          setLoginError(`تکایە دڵنیابەرەوە، ڕۆڵی ئەم بەکارهێنەرە "${user.role === 'admin' ? 'بەڕێوەبەر' : 'میوان'}"ـە`);
          return;
        }

        setCurrentUser(user);
        setIsAuthenticated(true);
        setLoginError('');
      } else {
        setLoginError('ناوەکە یان وشەی نهێنی هەڵەیە');
      }
    } catch (error) {
      console.error("Login error", error);
      setLoginError('هەڵەیەک ڕوویدا لە پەیوەندی');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLoginForm({ username: '', password: '', role: 'admin' });
    setPage('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-dark-bg flex items-center justify-center text-gray-500 flex-col gap-4">
         <div className="w-10 h-10 border-4 border-[var(--brand-color)] border-t-transparent rounded-full animate-spin"></div>
         <p>چاوەڕوانبە...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-dark-bg flex items-center justify-center p-4 transition-colors duration-300">
        <div className="max-w-md w-full bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-dark-border animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-2xl mx-auto mb-4 flex items-center justify-center text-[var(--brand-color)] shadow-inner">
               {config.logo ? <img src={config.logo} className="w-full h-full object-contain p-2" alt="Logo" /> : <Icon name="lock-key" size={40} weight="duotone" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{config.appName}</h1>
            <p className="text-gray-500 text-sm">تکایە بچۆ ژوورەوە بۆ بەکارهێنانی سیستەم</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ناوەکە</label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={loginForm.username}
                  onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-dark-border rounded-xl pl-4 pr-10 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] transition"
                  placeholder="ناوی بەکارهێنەر"
                />
                <span className="absolute right-3 top-3.5 text-gray-400">
                  <Icon name="user" size={20} />
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">وشەی نهێنی</label>
              <div className="relative">
                <input
                  type="password"
                  dir="ltr"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-dark-border rounded-xl pl-4 pr-10 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] transition"
                  placeholder="••••••"
                />
                <span className="absolute right-3 top-3.5 text-gray-400">
                  <Icon name="key" size={20} />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">جۆری هەژمار</label>
              <Select value={loginForm.role} onChange={e => setLoginForm({...loginForm, role: e.target.value})}>
                <option value="admin">بەڕێوەبەر (Admin)</option>
                <option value="guest">میوان (Viewer)</option>
              </Select>
            </div>

            {loginError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-500 p-3 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2">
                <Icon name="warning-circle" weight="fill" />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[var(--brand-color)] text-white font-bold py-3 rounded-xl hover:opacity-90 transition shadow-lg shadow-orange-500/20 mt-4 flex items-center justify-center gap-2"
            >
              <Icon name="sign-in" weight="bold" />
              چوونە ژوورەوە
            </button>
          </form>
          
          <div className="mt-8 text-center">
             <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
             >
                {isDarkMode ? <Icon name="sun" size={24} /> : <Icon name="moon" size={24} />}
             </button>
          </div>
        </div>
      </div>
    );
  }

  const getTitle = () => {
    const map: Record<string, string> = {
      dashboard: config.labels.nav_dashboard,
      employees: config.labels.nav_employees,
      expenses: config.labels.nav_expenses,
      overtime: config.labels.nav_overtime,
      loads: config.labels.nav_loads,
      deductions: config.labels.nav_deductions,
      settings: config.labels.nav_settings
    };
    return map[page] || '';
  };

  const SidebarItem = ({ id, icon, label }: { id: string, icon: string, label: string }) => (
    <button 
      onClick={() => setPage(id)} 
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
        page === id 
          ? 'bg-[var(--brand-color)] text-white shadow-md' 
          : 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <Icon name={icon} size={20} weight={page === id ? 'fill' : 'regular'} />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Print Header */}
      <div className="hidden print:flex items-center justify-between p-4 border-b-2 border-black w-full mb-4 bg-white">
        <div className="flex items-center gap-4">
          {config.logo && <img src={config.logo} style={{ height: '50px' }} alt="Logo" />}
          <div>
            <h1 className="text-xl font-bold text-black">{config.appName}</h1>
            <p className="text-sm text-black">{getTitle()} - {currentMonth}</p>
          </div>
        </div>
        <div className="text-sm text-black">{new Date().toLocaleDateString('ku-IQ')}</div>
      </div>

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-dark-surface border-l border-gray-200 dark:border-dark-border flex flex-col sticky top-0 md:h-screen z-50 no-print">
        <div className="p-6 flex items-center gap-3 border-b border-gray-200 dark:border-dark-border/30">
          <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center overflow-hidden shadow-sm border border-gray-100">
            {config.logo ? <img src={config.logo} className="object-contain w-full h-full" alt="Logo" /> : <Icon name="cube" className="text-[var(--brand-color)]"/>}
          </div>
          <div className="overflow-hidden">
             <span className="font-bold text-gray-900 dark:text-white block truncate">{config.appName}</span>
             <span className="text-xs text-gray-500 block">Version 3.0</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarItem id="dashboard" icon="squares-four" label={config.labels.nav_dashboard} />
          <div className="h-px bg-gray-200 dark:bg-white/5 my-2 mx-2"></div>
          <SidebarItem id="expenses" icon="money" label={config.labels.nav_expenses} />
          <SidebarItem id="overtime" icon="clock" label={config.labels.nav_overtime} />
          <SidebarItem id="loads" icon="package" label={config.labels.nav_loads} />
          <SidebarItem id="deductions" icon="trend-down" label={config.labels.nav_deductions} />
          <div className="h-px bg-gray-200 dark:bg-white/5 my-2 mx-2"></div>
          <SidebarItem id="employees" icon="users" label={config.labels.nav_employees} />
          <SidebarItem id="settings" icon="gear" label={config.labels.nav_settings} />
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-dark-border/30">
          <div className="mb-4 px-2 flex items-center gap-2 text-sm text-gray-500">
             <Icon name="user-circle" /> 
             <span className="font-bold">{currentUser?.username}</span>
             <span className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{currentUser?.role === 'admin' ? 'بەڕێوەبەر' : 'میوان'}</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors duration-200"
          >
            <Icon name="sign-out" size={20} />
            <span className="font-bold text-sm">چوونە دەرەوە</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-100 dark:bg-dark-bg p-4 lg:p-8 overflow-y-auto print:bg-white print:p-0">
        <header className="flex justify-between items-center mb-6 no-print">
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getTitle()}</h1>
           <div className="flex items-center gap-3">
             <div className="bg-white dark:bg-dark-surface px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border flex items-center gap-2 shadow-sm">
                <span className="text-gray-400"><Icon name="calendar" /></span>
                <input 
                  type="month" 
                  value={currentMonth} 
                  onChange={(e) => setCurrentMonth(e.target.value)} 
                  className="bg-transparent text-gray-900 dark:text-white font-bold outline-none cursor-pointer text-sm" 
                />
             </div>
             <button 
                onClick={() => window.print()} 
                className="bg-white text-gray-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 shadow-sm border border-gray-200"
              >
                <Icon name="printer" /> {config.labels.btn_print}
             </button>
           </div>
        </header>

        {page === 'dashboard' && <Dashboard currentMonth={currentMonth} config={config} />}
        {page === 'employees' && (
          <EmployeesList 
            employees={employees} 
            labels={config.labels} 
            onSelect={(emp) => { setSelectedEmployeeId(emp.id); setPage('employee-profile'); }} 
            userRole={currentUser?.role || 'guest'}
          />
        )}
        {page === 'employee-profile' && selectedEmployee && (
          <EmployeeProfile 
            employee={selectedEmployee} 
            currentMonth={currentMonth} 
            config={config} 
            onBack={() => setPage('employees')}
            userRole={currentUser?.role || 'guest'}
          />
        )}
        {page === 'settings' && currentUser && (
          <SettingsPage 
            config={config} 
            setConfig={setConfig} 
            adminUnlock={adminUnlock} 
            setAdminUnlock={setAdminUnlock} 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode}
            currentUser={currentUser}
          />
        )}
        {page === 'overtime' && (
          <OvertimeSection 
            employees={employees} 
            currentMonth={currentMonth} 
            config={config} 
            adminUnlock={adminUnlock} 
            userRole={currentUser?.role || 'guest'}
          />
        )}
        {(['expenses', 'loads', 'deductions'] as const).includes(page as any) && (
          <InputPage 
            type={page as any} 
            employees={employees} 
            currentMonth={currentMonth} 
            config={config} 
            title={getTitle()} 
            userRole={currentUser?.role || 'guest'}
          />
        )}
      </main>
    </div>
  );
}

export default App;