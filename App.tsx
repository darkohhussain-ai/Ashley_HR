import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firebaseService';
import { AppConfig, DEFAULTS, Employee, User } from './types';
import { Icon } from './components/Icon';

// Pages
import { Dashboard } from './pages/Dashboard';
import { EmployeesList } from './pages/Employees';
import { EmployeeProfile } from './pages/EmployeeProfile';
import { OvertimeSection } from './pages/Overtime';
import { InputPage } from './pages/Inputs';
import { SettingsPage } from './pages/Settings';
import { LoginPage } from './pages/Login';

function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App State
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [adminUnlock, setAdminUnlock] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') !== 'light');
  
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
      const q = query(collection(db, 'employees'), orderBy('order'));
      onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee));
        // Sort explicitly if order is missing
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setEmployees(list);
        setLoading(false);
      });
    };
    init();
  }, []);

  // --- Auth Checks ---
  // Simple session persistence using localStorage for this demo
  useEffect(() => {
    const storedUser = localStorage.getItem('ashley_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('ashley_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ashley_user');
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

  // SHOW LOGIN IF NO USER
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} appName={config.appName} logo={config.logo} />;
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
             <span className="text-[10px] bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-gray-300 px-1.5 py-0.5 rounded inline-block">
               {currentUser.role === 'admin' ? 'Admin' : 'Guest'}
             </span>
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

        <div className="p-4 border-t border-gray-200 dark:border-dark-border">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-xl transition">
            <Icon name="sign-out" />
            <span>چوونەدەرەوە</span>
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
                <Icon name="printer" />
             </button>
           </div>
        </header>

        {page === 'dashboard' && <Dashboard currentMonth={currentMonth} config={config} />}
        {page === 'employees' && (
          <EmployeesList 
            employees={employees} 
            labels={config.labels} 
            onSelect={(emp) => { setSelectedEmployee(emp); setPage('employee-profile'); }} 
            readOnly={currentUser.role === 'guest'}
          />
        )}
        {page === 'employee-profile' && selectedEmployee && (
          <EmployeeProfile 
            employee={selectedEmployee} 
            currentMonth={currentMonth} 
            config={config} 
            onBack={() => setPage('employees')} 
          />
        )}
        {page === 'settings' && (
          <SettingsPage 
            currentUser={currentUser}
            config={config} 
            setConfig={setConfig} 
            adminUnlock={adminUnlock} 
            setAdminUnlock={setAdminUnlock} 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode} 
          />
        )}
        {page === 'overtime' && (
          <OvertimeSection 
            employees={employees} 
            currentMonth={currentMonth} 
            config={config} 
            adminUnlock={adminUnlock} 
            readOnly={currentUser.role === 'guest'}
          />
        )}
        {(['expenses', 'loads', 'deductions'] as const).includes(page as any) && (
          <InputPage 
            type={page as any} 
            employees={employees} 
            currentMonth={currentMonth} 
            config={config} 
            title={getTitle()} 
            readOnly={currentUser.role === 'guest'}
          />
        )}
      </main>
    </div>
  );
}

export default App;