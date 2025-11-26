import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseService';
import { Employee, AppConfig } from '../types';
import { Button, Input } from '../components/UI';
import { Icon } from '../components/Icon';

interface ProfileProps {
  employee: Employee;
  currentMonth: string;
  onBack: () => void;
  config: AppConfig;
  userRole: 'admin' | 'guest';
}

export const EmployeeProfile: React.FC<ProfileProps> = ({ employee, currentMonth, onBack, config, userRole }) => {
  const [data, setData] = useState({ expenses: [], overtime: [], loads: [], deductions: [] });
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(employee);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
     setEditForm(employee);
  }, [employee]);

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

  const handleSave = async () => {
     try {
        await updateDoc(doc(db, 'employees', employee.id), {
           name: editForm.name,
           startDate: editForm.startDate,
           notes: editForm.notes,
           photo: editForm.photo
        });
        setIsEditing(false);
        // Note: The parent App component listens to Firestore updates, so the UI will refresh automatically.
     } catch (err) {
        console.error("Error updating profile:", err);
        alert("هەڵەیەک ڕوویدا لە تۆمارکردن");
     }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditForm(prev => ({ ...prev, photo: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

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
        <div className="flex items-center gap-4 w-full">
          {/* Photo */}
          <div className="relative group">
             <div 
               className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 overflow-hidden flex items-center justify-center no-print"
               onClick={() => isEditing && fileInputRef.current?.click()}
               style={{ cursor: isEditing ? 'pointer' : 'default' }}
             >
                 {isEditing ? (
                    editForm.photo ? <img src={editForm.photo} alt="Preview" className="w-full h-full object-cover" /> : <Icon name="camera" size={24} className="text-gray-400" />
                 ) : (
                    employee.photo ? <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover" /> : <Icon name="user" size={32} className="text-gray-400" />
                 )}
             </div>
             {isEditing && (
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
                   <Icon name="pencil" className="text-white" />
                </div>
             )}
             <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
          </div>

          <div className="flex-1">
            <button onClick={onBack} className="no-print text-sm text-gray-500 hover:text-[var(--brand-color)] mb-2 flex items-center gap-1 transition">
              <Icon name="arrow-right" /> {config.labels.btn_back}
            </button>
            
            {isEditing ? (
               <div className="space-y-2 max-w-md">
                  <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="ناو" className="font-bold" />
                  <div className="flex gap-2">
                     <Input type="date" value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} />
                     <Input value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} placeholder="تێبینی" />
                  </div>
                  <div className="flex gap-2 mt-2">
                     <Button onClick={handleSave} variant="success" className="text-xs py-1"><Icon name="check"/> تۆمارکردن</Button>
                     <Button onClick={() => setIsEditing(false)} variant="secondary" className="text-xs py-1"><Icon name="x"/> هەڵوەشاندنەوە</Button>
                  </div>
               </div>
            ) : (
               <>
                  <h1 className="text-2xl font-bold text-[var(--brand-color)]">{employee.name}</h1>
                  <div className="text-sm text-gray-500 mt-1 flex gap-4">
                     <span>{employee.startDate || '-'}</span>
                     <span>{employee.notes}</span>
                  </div>
                  {isAdmin && (
                     <button onClick={() => setIsEditing(true)} className="no-print text-xs text-blue-500 hover:underline mt-1 flex items-center gap-1">
                        <Icon name="pencil" /> دەستکاری زانیاری
                     </button>
                  )}
               </>
            )}
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