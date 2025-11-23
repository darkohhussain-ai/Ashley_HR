import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseService';
import { Employee, AppConfig } from '../types';
import { Button } from '../components/UI';
import { Icon } from '../components/Icon';

interface ProfileProps {
  employee: Employee;
  currentMonth: string;
  onBack: () => void;
  config: AppConfig;
}

export const EmployeeProfile: React.FC<ProfileProps> = ({ employee, currentMonth, onBack, config }) => {
  const [data, setData] = useState({ expenses: [], overtime: [], loads: [], deductions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchProfile = async () => {
      const q = (col: string) => query(collection(db, col), where('employeeName', '==', employee.name));
      
      const [exp, ot, ld, ded] = await Promise.all([
        getDocs(q('expenses')),
        getDocs(q('overtime')),
        getDocs(q('loads')),
        getDocs(q('deductions'))
      ]);

      const filterByMonth = (doc: any) => doc.data().date.startsWith(currentMonth);

      setData({
        expenses: exp.docs.filter(filterByMonth).map(d => d.data()) as any,
        overtime: ot.docs.filter(filterByMonth).map(d => d.data()) as any,
        loads: ld.docs.filter(filterByMonth).map(d => d.data()) as any,
        deductions: ded.docs.filter(filterByMonth).map(d => d.data()) as any
      });
      setLoading(false);
    };

    fetchProfile();
  }, [employee, currentMonth]);

  const totals = {
    expenses: data.expenses.reduce((s, i: any) => s + (i.amount || 0), 0),
    overtime: data.overtime.reduce((s, i: any) => s + (i.pay || 0), 0),
    overtimeHours: data.overtime.reduce((s, i: any) => s + (i.hours || 0), 0),
    loads: data.loads.length * config.loadRate,
    deductions: data.deductions.reduce((s, i: any) => s + (i.amount || 0), 0)
  };
  const netSalary = totals.expenses + totals.overtime + totals.loads - totals.deductions;

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Profile...</div>;

  const allTransactions = [
    ...data.expenses.map((i: any) => ({ ...i, t: config.labels.nav_expenses, v: i.amount })),
    ...data.deductions.map((i: any) => ({ ...i, t: config.labels.nav_deductions, v: -i.amount })),
    ...data.overtime.map((i: any) => ({ ...i, t: `زیادە (${i.hours}h)`, v: i.pay })),
    ...data.loads.map((i: any) => ({ ...i, t: config.labels.nav_loads, v: config.loadRate }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-200 dark:border-dark-border pb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 overflow-hidden flex items-center justify-center no-print">
              {employee.photo ? <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover" /> : <Icon name="user" size={32} className="text-gray-400" />}
          </div>
          <div>
            <button onClick={onBack} className="no-print text-sm text-gray-500 hover:text-[var(--brand-color)] mb-2 flex items-center gap-1 transition">
              <Icon name="arrow-right" /> {config.labels.btn_back}
            </button>
            <h1 className="text-2xl font-bold text-[var(--brand-color)]">{employee.name}</h1>
            <div className="text-sm text-gray-500 mt-1 flex gap-4">
               <span>{employee.startDate || '-'}</span>
               <span>{employee.notes}</span>
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => window.print()} className="no-print">
          <Icon name="printer" /> {config.labels.btn_print}
        </Button>
      </div>

      {/* Print View Section */}
      <div className="print-only">
        <div className="flex items-center gap-4 mb-6">
           {employee.photo && <img src={employee.photo} className="w-20 h-20 rounded-full object-cover border border-gray-300" />}
           <h3 className="hidden print:block text-center text-xl font-bold">ڕاپۆرتی مانگی {currentMonth} - {employee.name}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
           <SummaryBox label="خەرجی" value={totals.expenses} />
           <SummaryBox label={`زیادە (${totals.overtimeHours}h)`} value={totals.overtime} />
           <SummaryBox label="بار" value={totals.loads} />
           <SummaryBox label="قەرز" value={totals.deductions} isNegative />
           <div className="col-span-2 bg-gray-100 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-dark-border print:border-black flex justify-between items-center">
             <strong className="text-lg">کۆی گشتی مووچە</strong>
             <strong className="text-xl font-mono dir-ltr">{netSalary.toLocaleString()} IQD</strong>
           </div>
        </div>

        <table className="w-full text-right border-collapse text-sm">
          <thead className="bg-gray-100 text-black">
            <tr>
              <th className="p-2 border border-gray-300">بەروار</th>
              <th className="p-2 border border-gray-300">جۆر</th>
              <th className="p-2 border border-gray-300">بڕ</th>
              <th className="p-2 border border-gray-300">تێبینی</th>
            </tr>
          </thead>
          <tbody>
            {allTransactions.map((r, i) => (
              <tr key={i}>
                <td className="p-2 border border-gray-300">{r.date}</td>
                <td className="p-2 border border-gray-300">{r.t}</td>
                <td className="p-2 border border-gray-300 font-bold dir-ltr font-mono">{(r.v > 0 ? r.v : Math.abs(r.v)).toLocaleString()}</td>
                <td className="p-2 border border-gray-300">{r.note || r.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SummaryBox = ({ label, value, isNegative }: { label: string, value: number, isNegative?: boolean }) => (
  <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-border print:border-black flex justify-between items-center">
    <span className="text-gray-600 dark:text-gray-300 print:text-black font-bold">{label}</span>
    <span className={`font-mono font-bold dir-ltr ${isNegative ? 'text-red-500' : 'text-gray-900 dark:text-white print:text-black'}`}>
      {value.toLocaleString()}
    </span>
  </div>
);