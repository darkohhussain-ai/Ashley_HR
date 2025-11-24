import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseService';
import { Employee, OvertimeRecord, AppConfig } from '../types';
import { Card, Button, Input, Select } from '../components/UI';
import { Icon } from '../components/Icon';

interface OvertimeProps {
  employees: Employee[];
  currentMonth: string;
  config: AppConfig;
  adminUnlock: boolean;
  userRole: 'admin' | 'guest';
}

export const OvertimeSection: React.FC<OvertimeProps> = ({ employees, currentMonth, config, adminUnlock, userRole }) => {
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [form, setForm] = useState({ hours: '', note: '' });
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [isDayLocked, setIsDayLocked] = useState(false);

  const isAdmin = userRole === 'admin';

  // Fetch Monthly Records
  useEffect(() => {
    const start = currentMonth + '-01';
    const end = currentMonth + '-31';
    const q = query(collection(db, 'overtime'), where('date', '>=', start), where('date', '<=', end));
    
    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() } as OvertimeRecord)));
    });
    return () => unsub();
  }, [currentMonth]);

  // Check Lock Status
  useEffect(() => {
    const checkLock = async () => {
      const docRef = doc(db, 'locked_days', selectedDate);
      const snap = await getDoc(docRef);
      setIsDayLocked(snap.exists() ? snap.data().locked : false);
    };
    checkLock();
  }, [selectedDate]);

  const dailyList = useMemo(() => records.filter(r => r.date === selectedDate), [records, selectedDate]);

  // Calculate Daily Totals
  const dailyTotalHours = useMemo(() => dailyList.reduce((a, b) => a + (Number(b.hours) || 0), 0), [dailyList]);
  const dailyTotalPay = useMemo(() => dailyList.reduce((a, b) => a + (Number(b.pay) || 0), 0), [dailyList]);

  const monthlySummary = useMemo(() => {
    const summary: Record<string, { hours: number; pay: number }> = {};
    records.forEach(r => {
      if (!summary[r.employeeName]) summary[r.employeeName] = { hours: 0, pay: 0 };
      summary[r.employeeName].hours += (Number(r.hours) || 0);
      summary[r.employeeName].pay += (Number(r.pay) || 0);
    });
    return Object.entries(summary).map(([name, data]) => ({ name, ...data }));
  }, [records]);

  const handleSubmit = async () => {
    if (!selectedEmpId || !form.hours) return alert('زانیاری تەواو نییە');
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;

    await addDoc(collection(db, 'overtime'), {
      employeeName: emp.name,
      date: selectedDate,
      hours: parseFloat(form.hours),
      pay: parseFloat(form.hours) * config.overtimeRate,
      note: form.note,
      createdAt: Date.now()
    });
    setForm({ hours: '', note: '' });
  };

  const lockDay = async () => {
    if (confirm('ئایا دڵنیایت لە قفڵکردنی ئەم ڕۆژە؟ پاشان ناتوانیت دەستکاری بکەیت.')) {
      await setDoc(doc(db, 'locked_days', selectedDate), { locked: true });
      setIsDayLocked(true);
    }
  };

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const canEdit = (!isDayLocked || adminUnlock) && isAdmin;

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm">
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('daily')} 
            className={`px-4 py-2 rounded-xl font-bold transition ${viewMode === 'daily' ? 'bg-[var(--brand-color)] text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}
          >
            تۆماری ڕۆژانە
          </button>
          <button 
            onClick={() => setViewMode('monthly')} 
            className={`px-4 py-2 rounded-xl font-bold transition ${viewMode === 'monthly' ? 'bg-[var(--brand-color)] text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}
          >
            ڕاپۆرتی مانگانە
          </button>
        </div>
        
        {viewMode === 'daily' ? (
          <div className="flex items-center gap-3">
            <button onClick={prevDay} className="p-2 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 transition" title="ڕۆژی پێشوو">
              <Icon name="caret-left" />
            </button>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/20 px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-border">
              <span className="text-gray-500 text-sm">بەروار</span>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)} 
                className="bg-transparent text-gray-900 dark:text-white font-bold outline-none cursor-pointer"
              />
            </div>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => window.print()}>
            <Icon name="printer" /> چاپکردن
          </Button>
        )}
      </div>

      {/* VIEW 1: DAILY ENTRY */}
      {viewMode === 'daily' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="h-fit">
            <div className="font-bold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-dark-border pb-2 flex justify-between items-center">
              <span>زیادکردن - {selectedDate}</span>
              {isDayLocked && (
                <span className="text-red-500 text-xs flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                  <Icon name="lock" weight="fill" /> قفڵە
                </span>
              )}
            </div>
            
            {canEdit ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">کارمەند</label>
                  <Select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}>
                    <option value="">هەڵبژێرە...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">کاتژمێر</label>
                  <Input type="number" value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} placeholder="4" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">تێبینی</label>
                  <Input value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="تێبینی..." />
                </div>
                <Button onClick={handleSubmit} className="w-full">زیادکردن</Button>
                
                {isAdmin && !isDayLocked && (
                  <button 
                    onClick={lockDay} 
                    className="w-full mt-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 transition shadow-md text-sm"
                  >
                    <Icon name="lock-key" weight="fill" /> تۆمارکردن و قفڵکردنی ڕۆژ
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-slate-800 rounded-xl">
                 {!isAdmin ? (
                    <span>تەنها بەڕێوەبەر دەتوانێت زیاد بکات</span>
                 ) : (
                    <>
                       <Icon name="lock-key" size={32} className="mx-auto mb-2 opacity-50" />
                       ئەم ڕۆژە قفڵ کراوە
                    </>
                 )}
              </div>
            )}
          </Card>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800/50">
                لیستی تۆمارکراوی ({selectedDate})
              </div>
              <table className="w-full text-right">
                <thead className="bg-gray-100 dark:bg-slate-800 text-xs text-gray-500">
                  <tr>
                    <th className="p-4">کارمەند</th>
                    <th className="p-4">کاتژمێر</th>
                    <th className="p-4">تێبینی</th>
                    <th className="p-4">پارە</th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-600 dark:text-gray-300 divide-y divide-gray-200 dark:divide-slate-700">
                  {dailyList.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="p-4 font-bold text-gray-900 dark:text-white">{r.employeeName}</td>
                      <td className="p-4">{r.hours}</td>
                      <td className="p-4 text-xs opacity-70">{r.note || '-'}</td>
                      <td className="p-4 text-[var(--brand-color)] font-bold dir-ltr font-mono">{r.pay.toLocaleString()} IQD</td>
                      <td className="p-4">
                        {canEdit && (
                          <button onClick={() => deleteDoc(doc(db, 'overtime', r.id))} className="text-red-400 hover:text-red-500 transition">
                            <Icon name="trash" size={20} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {dailyList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">هیچ داتایەک نییە</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-100 dark:bg-slate-800 font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-dark-border">
                  <tr>
                    <td className="p-4">کۆی گشتی</td>
                    <td className="p-4">{dailyTotalHours}</td>
                    <td className="p-4"></td>
                    <td className="p-4 text-[var(--brand-color)] dir-ltr font-mono">{dailyTotalPay.toLocaleString()} IQD</td>
                    <td className="p-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MONTHLY REPORT */}
      {viewMode === 'monthly' && (
        <div className="bg-white dark:bg-dark-surface rounded-xl overflow-hidden shadow-sm print:shadow-none print:border-none">
          <div className="p-6 border-b border-gray-200 dark:border-dark-border print:border-black">
            <h3 className="font-bold text-2xl text-center text-gray-900 dark:text-white print:text-black">
              ڕاپۆرتی مانگی {currentMonth} - کاتژمێری زیادە
            </h3>
            <p className="text-center text-gray-500 mt-2 font-bold print:text-black">
              نرخی کاتژمێر {config.overtimeRate.toLocaleString()} IQD
            </p>
          </div>
          <table className="w-full text-right">
            <thead className="bg-[var(--brand-color)] text-white print:bg-gray-200 print:text-black">
              <tr>
                <th className="p-4">ناوی کارمەند</th>
                <th className="p-4 text-center">کۆی کاتژمێرەکان</th>
                <th className="p-4 text-left">کۆی گشتی پارە</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-300 divide-y divide-gray-200 dark:divide-slate-700 print:text-black print:divide-black">
              {monthlySummary.map(item => (
                <tr key={item.name}>
                  <td className="p-4 font-bold text-gray-900 dark:text-white print:text-black">{item.name}</td>
                  <td className="p-4 text-center font-bold">{item.hours}</td>
                  <td className="p-4 text-left font-bold text-[var(--brand-color)] print:text-black dir-ltr font-mono">
                    {item.pay.toLocaleString()} IQD
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 dark:bg-slate-800 font-bold text-gray-900 dark:text-white print:bg-gray-100 print:text-black">
              <tr>
                <td className="p-4">کۆی گشتی</td>
                <td className="p-4 text-center">{monthlySummary.reduce((a, b) => a + b.hours, 0)}</td>
                <td className="p-4 text-left dir-ltr font-mono">{monthlySummary.reduce((a, b) => a + b.pay, 0).toLocaleString()} IQD</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};