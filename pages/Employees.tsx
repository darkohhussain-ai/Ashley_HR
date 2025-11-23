import React, { useState } from 'react';
import { collection, addDoc, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseService';
import { Employee, AppLabels } from '../types';
import { Card, Button, Input } from '../components/UI';
import { Icon } from '../components/Icon';

interface EmployeesProps {
  employees: Employee[];
  onSelect: (emp: Employee) => void;
  labels: AppLabels;
  readOnly?: boolean;
}

export const EmployeesList: React.FC<EmployeesProps> = ({ employees, onSelect, labels, readOnly = false }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', startDate: '', notes: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Employee>>({});

  const addEmp = async () => {
    if (!newEmp.name) return;
    const maxOrder = employees.length > 0 ? Math.max(...employees.map(e => e.order || 0)) : 0;
    await addDoc(collection(db, 'employees'), {
      ...newEmp,
      order: maxOrder + 100,
      createdAt: Date.now()
    });
    setNewEmp({ name: '', startDate: '', notes: '' });
    setIsAdding(false);
  };

  const move = async (index: number, direction: number) => {
    if (readOnly) return;
    if ((direction === -1 && index === 0) || (direction === 1 && index === employees.length - 1)) return;
    const empA = employees[index];
    const empB = employees[index + direction];
    
    const batch = writeBatch(db);
    batch.update(doc(db, 'employees', empA.id), { order: empB.order });
    batch.update(doc(db, 'employees', empB.id), { order: empA.order });
    await batch.commit();
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
        {readOnly ? (
          <Button variant="secondary" onClick={() => window.print()}>
            <Icon name="printer" /> {labels.btn_print}
          </Button>
        ) : (
          <Button onClick={() => setIsAdding(!isAdding)}>
            <Icon name="plus" weight="bold" /> {labels.btn_add}
          </Button>
        )}
      </div>

      {isAdding && !readOnly && (
        <Card className="animate-fade-in border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
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
                <th className="px-4 py-3">{labels.th_name}</th>
                <th className="px-4 py-3">{labels.th_date}</th>
                <th className="px-4 py-3">{labels.th_note}</th>
                <th className="px-4 py-3 no-print text-center">{labels.th_actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700 text-sm text-gray-600 dark:text-gray-300">
              {employees.map((emp, idx) => (
                <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 no-print">
                    {!readOnly && (
                      <div className="flex gap-1">
                        <button onClick={() => move(idx, -1)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-[var(--brand-color)]">
                          <Icon name="caret-up" size={16} />
                        </button>
                        <button onClick={() => move(idx, 1)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-[var(--brand-color)]">
                          <Icon name="caret-down" size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                    {editingId === emp.id && !readOnly ? (
                      <Input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                    ) : emp.name}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === emp.id && !readOnly ? (
                      <Input type="date" value={editData.startDate} onChange={e => setEditData({...editData, startDate: e.target.value})} />
                    ) : (emp.startDate || '-')}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === emp.id && !readOnly ? (
                      <Input value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} />
                    ) : (emp.notes || '-')}
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-center no-print">
                    {editingId === emp.id && !readOnly ? (
                      <button onClick={saveEdit} className="text-green-500 hover:bg-green-100 p-2 rounded-lg transition">
                        <Icon name="check" size={20} weight="bold" />
                      </button>
                    ) : (
                      <>
                        {!readOnly && (
                          <button onClick={() => startEdit(emp)} className="text-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition">
                            <Icon name="pencil-simple" size={20} />
                          </button>
                        )}
                        <button onClick={() => onSelect(emp)} className="text-gray-400 hover:text-[var(--brand-color)] hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-lg transition">
                          <Icon name="eye" size={20} />
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