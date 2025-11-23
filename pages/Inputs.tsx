import React, { useState, useEffect } from 'react';
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
  readOnly?: boolean;
}

export const InputPage: React.FC<InputPageProps> = ({ type, employees, currentMonth, config, title, amountLabel, readOnly = false }) => {
  const [records, setRecords] = useState<Transaction[]>([]);
  const [form, setForm] = useState({ employeeName: '', date: new Date().toISOString().split('T')[0], amount: '', note: '', extra: '' });
  const [saved, setSaved] = useState(false);

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
    if (readOnly) return;
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
      payload.amount = config.loadRate; // Fixed rate for loads, handled in display or backend usually, here we can store 0 and calculate later or store rate.
    }

    await addDoc(collection(db, type), payload);
    setForm({ ...form, amount: '', note: '', extra: '' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {!readOnly ? (
        <Card className="no-print">
          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">{title}</h3>
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
        </Card>
      ) : (
        <div className="flex justify-between items-center no-print bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h3>
          <Button variant="secondary" onClick={() => window.print()}>
            <Icon name="printer" /> {config.labels.btn_print}
          </Button>
        </div>
      )}

      <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-right">
          <thead className="bg-gray-100 dark:bg-slate-800 text-xs text-gray-500">
            <tr>
              <th className="p-3">{config.labels.th_name}</th>
              <th className="p-3">{config.labels.th_date}</th>
              <th className="p-3">{config.labels.th_note}</th>
              <th className="p-3 no-print"></th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-600 dark:text-gray-300 divide-y divide-gray-200 dark:divide-slate-700">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <td className="p-3 font-bold text-gray-900 dark:text-white">{r.employeeName}</td>
                <td className="p-3">{r.date}</td>
                <td className="p-3">
                  <span className={`font-bold block dir-ltr font-mono ${type === 'deductions' ? 'text-red-500' : 'text-[var(--brand-color)]'}`}>
                    {type === 'loads' ? config.loadRate.toLocaleString() : r.amount?.toLocaleString()} IQD
                  </span>
                  {(r.note || r.description) && (
                    <span className="text-xs opacity-70 block">
                      {[r.description, r.note].filter(Boolean).join(' - ')}
                    </span>
                  )}
                </td>
                <td className="p-3 no-print">
                  {!readOnly && (
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
    </div>
  );
};