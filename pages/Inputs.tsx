import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseService';
import { Employee, Transaction, AppConfig } from '../types';
import { Card, Button, Input, Select } from '../components/UI';
import { Icon } from '../components/Icon';

interface InputPageProps {
  type: 'expenses' | 'loads' | 'deductions';
  employees: Employee[];
  currentMonth: string;
  config: AppConfig;
  title: string;
  amountLabel?: string;
  userRole: 'admin' | 'guest';
}

export const InputPage: React.FC<InputPageProps> = ({ type, employees, currentMonth, config, title, amountLabel, userRole }) => {
  const [records, setRecords] = useState<Transaction[]>([]);
  const [form, setForm] = useState({ employeeName: '', date: new Date().toISOString().split('T')[0], amount: '', note: '', extra: '' });
  const [saved, setSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'weekly'>('list');

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    const start = currentMonth + '-01';
    const end = currentMonth + '-31';
    const q = query(
      collection(db, type), 
      where('date', '>=', start), 
      where('date', '<=', end),
      orderBy('date', 'desc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
    return () => unsub();
  }, [type, currentMonth]);

  const handleSubmit = async () => {
    if (!form.employeeName) return alert('کارمەند هەڵبژێرە');
    
    const payload: any = {
      employeeName: form.employeeName,
      date: form.date,
      note: form.note,
      createdAt: Date.now()
    };

    if (type === 'expenses' || type === 'deductions') {
      if (!form.amount) return alert('بڕی پارە دیاری بکە');
      payload.amount = parseFloat(form.amount);
    }

    if (type === 'loads') {
      payload.description = form.extra; // 'extra' field stores Load Type
      payload.amount = config.loadRate; 
    }

    await addDoc(collection(db, type), payload);
    setForm({ ...form, amount: '', note: '', extra: '' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const weeklyStats = useMemo(() => {
    if (type !== 'expenses') return [];
    
    const weeks = [
      { id: 1, label: 'هەفتەی یەکەم (1-7)', start: 1, end: 7, total: 0, items: [] as Transaction[] },
      { id: 2, label: 'هەفتەی دووەم (8-14)', start: 8, end: 14, total: 0, items: [] as Transaction[] },
      { id: 3, label: 'هەفتەی سێیەم (15-21)', start: 15, end: 21, total: 0, items: [] as Transaction[] },
      { id: 4, label: 'هەفتەی چوارەم (22-31)', start: 22, end: 31, total: 0, items: [] as Transaction[] },
    ];

    records.forEach(r => {
      const day = parseInt(r.date.split('-')[2]);
      const week = weeks.find(w => day >= w.start && day <= w.end);
      if (week) {
        week.total += Number(r.amount) || 0;
        week.items.push(r);
      }
    });

    return weeks;
  }, [records, type]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm">
         <div className="flex items-center gap-4">
           <h3 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h3>
           {type === 'expenses' && (
             <div className="flex bg-gray-100 dark:bg-black/20 rounded-lg p-1">
               <button 
                 onClick={() => setViewMode('list')}
                 className={`px-3 py-1.5 rounded-md text-sm font-bold transition ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
               >
                 لیست
               </button>
               <button 
                 onClick={() => setViewMode('weekly')}
                 className={`px-3 py-1.5 rounded-md text-sm font-bold transition ${viewMode === 'weekly' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
               >
                 هەفتانە
               </button>
             </div>
           )}
         </div>
         <Button variant="secondary" onClick={() => window.print()}>
            <Icon name="printer" /> {config.labels.btn_print}
         </Button>
      </div>

      {viewMode === 'list' ? (
        <>
          <Card className="no-print">
             {isAdmin ? (
               <>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <Select value={form.employeeName} onChange={e => setForm({...form, employeeName: e.target.value})}>
                    <option value="">کارمەند...</option>
                    {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                  </Select>
                  
                  <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                  
                  {(type === 'expenses' || type === 'deductions') && (
                    <Input 
                      type="number" 
                      placeholder={amountLabel || config.labels.th_amount} 
                      value={form.amount} 
                      onChange={e => setForm({...form, amount: e.target.value})} 
                    />
                  )}
                  
                  {type === 'loads' && (
                    <Input 
                      placeholder="جۆری بار" 
                      value={form.extra} 
                      onChange={e => setForm({...form, extra: e.target.value})} 
                    />
                  )}
                  
                  <Input 
                    placeholder={config.labels.th_note} 
                    value={form.note} 
                    onChange={e => setForm({...form, note: e.target.value})} 
                  />
                </div>
                
                <div className="mt-4 flex items-center gap-4">
                  <Button onClick={handleSubmit}>{config.labels.btn_add}</Button>
                  {saved && <span className="text-green-500 font-bold flex items-center gap-1 animate-pulse"><Icon name="check" weight="bold"/> تۆمارکرا</span>}
                </div>
               </>
             ) : (
                <div className="text-center text-gray-400 py-2">تەنها بەڕێوەبەر دەتوانێت داتا زیاد بکات</div>
             )}
          </Card>

          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden shadow-sm print:shadow-none print:border-none">
            {/* Print Header */}
            <div className="hidden print:block p-4 border-b border-gray-200 text-center font-bold text-xl">
               {title} - {currentMonth}
            </div>
            <table className="w-full text-right">
              <thead className="bg-gray-100 dark:bg-slate-800 text-xs text-gray-500 print:bg-gray-200 print:text-black">
                <tr>
                  <th className="p-3">{config.labels.th_name}</th>
                  <th className="p-3">{config.labels.th_date}</th>
                  <th className="p-3">{config.labels.th_note}</th>
                  <th className="p-3 no-print"></th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-600 dark:text-gray-300 divide-y divide-gray-200 dark:divide-slate-700 print:text-black print:divide-black">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-gray-900 dark:text-white print:text-black">{r.employeeName}</td>
                    <td className="p-3">{r.date}</td>
                    <td className="p-3">
                      <span className={`font-bold block dir-ltr font-mono ${type === 'deductions' ? 'text-red-500' : 'text-[var(--brand-color)] print:text-black'}`}>
                        {type === 'loads' ? config.loadRate.toLocaleString() : r.amount?.toLocaleString()} IQD
                      </span>
                      {(r.note || r.description) && (
                        <span className="text-xs opacity-70 block">
                          {[r.description, r.note].filter(Boolean).join(' - ')}
                        </span>
                      )}
                    </td>
                    <td className="p-3 no-print">
                      {isAdmin && (
                        <button onClick={() => deleteDoc(doc(db, type, r.id))} className="text-red-400 hover:text-red-500">
                          <Icon name="trash" size={20} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-dark-surface rounded-xl overflow-hidden shadow-sm print:shadow-none print:border-none">
          <div className="p-6 border-b border-gray-200 dark:border-dark-border print:border-black">
             <h3 className="font-bold text-2xl text-center text-gray-900 dark:text-white print:text-black">
               ڕاپۆرتی هەفتانەی خەرجییەکان - {currentMonth}
             </h3>
          </div>
          <div className="p-6 space-y-8">
             {weeklyStats.map(week => (
               <div key={week.id} className="break-inside-avoid">
                  <div className="flex justify-between items-center mb-2 border-b-2 border-gray-100 dark:border-dark-border pb-2">
                     <h4 className="font-bold text-lg text-[var(--brand-color)] print:text-black">{week.label}</h4>
                     <span className="font-mono font-bold text-xl dir-ltr print:text-black">{week.total.toLocaleString()} IQD</span>
                  </div>
                  {week.items.length > 0 ? (
                    <table className="w-full text-right text-sm">
                       <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 print:bg-gray-100 print:text-black">
                         <tr>
                           <th className="p-2">ناو</th>
                           <th className="p-2">بەروار</th>
                           <th className="p-2">بڕ</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-slate-800 print:divide-gray-300">
                         {week.items.map(item => (
                           <tr key={item.id}>
                             <td className="p-2 text-gray-900 dark:text-white print:text-black">{item.employeeName}</td>
                             <td className="p-2 text-gray-500 print:text-black">{item.date}</td>
                             <td className="p-2 font-mono dir-ltr text-gray-700 dark:text-gray-300 print:text-black">{item.amount?.toLocaleString()}</td>
                           </tr>
                         ))}
                       </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-gray-400 italic">هیچ خەرجییەک نییە</p>
                  )}
               </div>
             ))}
             
             <div className="mt-8 pt-4 border-t-2 border-gray-900 dark:border-white print:border-black flex justify-between items-center text-xl font-bold">
                <span>کۆی گشتی مانگ</span>
                <span className="font-mono dir-ltr">{records.reduce((a, b) => a + (b.amount || 0), 0).toLocaleString()} IQD</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};