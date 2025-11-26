import React, { useState, useRef } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseService';
import { Employee, AppLabels } from '../types';
import { Card, Button, Input } from '../components/UI';
import { Icon } from '../components/Icon';

interface EmployeesProps {
  employees: Employee[];
  onSelect: (emp: Employee) => void;
  labels: AppLabels;
  userRole: 'admin' | 'guest';
}

export const EmployeesList: React.FC<EmployeesProps> = ({ employees, onSelect, labels, userRole }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newEmp, setNewEmp] = useState<{name: string, startDate: string, notes: string, photo: string}>({ name: '', startDate: '', notes: '', photo: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Employee>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = userRole === 'admin';

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (isEdit) {
          setEditData(prev => ({ ...prev, photo: result }));
        } else {
          setNewEmp(prev => ({ ...prev, photo: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addEmp = async () => {
    if (!newEmp.name) return;
    const maxOrder = employees.length > 0 ? Math.max(...employees.map(e => e.order || 0)) : 0;
    await addDoc(collection(db, 'employees'), {
      ...newEmp,
      order: maxOrder + 100,
      createdAt: Date.now()
    });
    setNewEmp({ name: '', startDate: '', notes: '', photo: '' });
    setIsAdding(false);
  };

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEditData(emp);
  };

  const saveEdit = async () => {
    if (editingId && editData) {
      await updateDoc(doc(db, 'employees', editingId), editData);
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h2 className="font-bold text-xl text-gray-900 dark:text-white">{labels.nav_employees}</h2>
        {isAdmin && (
          <Button onClick={() => setIsAdding(!isAdding)}>
            <Icon name="plus" weight="bold" /> {labels.btn_add}
          </Button>
        )}
      </div>

      {isAdding && isAdmin && (
        <Card className="animate-fade-in border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
             {/* Photo Upload */}
             <div className="flex justify-center">
                <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center cursor-pointer overflow-hidden border border-gray-300 dark:border-slate-600 hover:opacity-80 transition"
                >
                   {newEmp.photo ? (
                      <img src={newEmp.photo} alt="Preview" className="w-full h-full object-cover" />
                   ) : (
                      <Icon name="camera" size={24} className="text-gray-400" />
                   )}
                </div>
                <input type="file" ref={fileInputRef} onChange={(e) => handlePhotoUpload(e, false)} className="hidden" accept="image/*" />
             </div>

            <Input 
              placeholder={labels.th_name} 
              value={newEmp.name} 
              onChange={e => setNewEmp({...newEmp, name: e.target.value})} 
            />
            <Input 
              type="date" 
              value={newEmp.startDate} 
              onChange={e => setNewEmp({...newEmp, startDate: e.target.value})} 
            />
            <Input 
              placeholder={labels.th_note} 
              value={newEmp.notes} 
              onChange={e => setNewEmp({...newEmp, notes: e.target.value})} 
            />
            <Button onClick={addEmp}>{labels.btn_save}</Button>
          </div>
        </Card>
      )}

      <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 no-print w-20">#</th>
                <th className="px-4 py-3 w-16">وێنە</th>
                <th className="px-4 py-3">{labels.th_name}</th>
                <th className="px-4 py-3">{labels.th_date}</th>
                <th className="px-4 py-3">{labels.th_note}</th>
                <th className="px-4 py-3 no-print text-center">{labels.th_actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700 text-sm text-gray-600 dark:text-gray-300">
              {employees.map((emp, idx) => (
                <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 no-print text-gray-400 font-mono">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3">
                     {editingId === emp.id ? (
                        <div onClick={() => editFileInputRef.current?.click()} className="w-10 h-10 rounded-full bg-gray-200 cursor-pointer overflow-hidden relative group">
                           {editData.photo ? <img src={editData.photo} className="w-full h-full object-cover" /> : <Icon name="camera" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-500" />}
                           <input type="file" ref={editFileInputRef} onChange={(e) => handlePhotoUpload(e, true)} className="hidden" accept="image/*" />
                        </div>
                     ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 overflow-hidden flex items-center justify-center">
                           {emp.photo ? <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" /> : <Icon name="user" className="text-gray-400" />}
                        </div>
                     )}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                    {editingId === emp.id ? (
                      <Input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                    ) : emp.name}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === emp.id ? (
                      <Input type="date" value={editData.startDate} onChange={e => setEditData({...editData, startDate: e.target.value})} />
                    ) : (emp.startDate || '-')}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === emp.id ? (
                      <Input value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} />
                    ) : (emp.notes || '-')}
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-center no-print">
                    {editingId === emp.id ? (
                      <button onClick={saveEdit} className="text-green-500 hover:bg-green-100 p-2 rounded-lg transition">
                        <Icon name="check" size={20} weight="bold" />
                      </button>
                    ) : (
                      <>
                        {/* {isAdmin && (
                          <button onClick={() => startEdit(emp)} className="text-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition">
                            <Icon name="pencil-simple" size={20} />
                          </button>
                        )} */}
                        <button 
                           onClick={() => onSelect(emp)} 
                           className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 px-3 py-1 rounded-lg transition flex items-center gap-2 border border-gray-200 dark:border-slate-600"
                        >
                          <Icon name="user-list" size={20} /> وردەکاری
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};