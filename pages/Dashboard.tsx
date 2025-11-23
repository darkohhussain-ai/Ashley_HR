import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseService';
import { AppConfig } from '../types';
import { Card } from '../components/UI';

interface DashboardProps {
  currentMonth: string;
  config: AppConfig;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentMonth, config }) => {
  const [stats, setStats] = useState({ expenses: 0, overtimePay: 0, loads: 0, withdrawals: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const start = currentMonth + '-01';
      const end = currentMonth + '-31';

      const [expSnap, otSnap, ldSnap, dedSnap] = await Promise.all([
        getDocs(query(collection(db, 'expenses'), where('date', '>=', start), where('date', '<=', end))),
        getDocs(query(collection(db, 'overtime'), where('date', '>=', start), where('date', '<=', end))),
        getDocs(query(collection(db, 'loads'), where('date', '>=', start), where('date', '<=', end))),
        getDocs(query(collection(db, 'deductions'), where('date', '>=', start), where('date', '<=', end)))
      ]);

      const expenses = expSnap.docs.reduce((a, b) => a + (Number(b.data().amount) || 0), 0);
      const overtimePay = otSnap.docs.reduce((a, b) => a + (Number(b.data().pay) || 0), 0);
      const loads = ldSnap.size * config.loadRate;
      const withdrawals = dedSnap.docs.reduce((a, b) => a + (Number(b.data().amount) || 0), 0);

      setStats({ expenses, overtimePay, loads, withdrawals });
    };

    fetchStats();
  }, [currentMonth, config]);

  const totalExtras = stats.expenses + stats.overtimePay + stats.loads;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        <Card className="border-l-4 border-l-[var(--brand-color)] bg-gradient-to-br from-gray-50 to-white dark:from-dark-surface dark:to-slate-800/50">
          <h2 className="text-lg text-gray-900 dark:text-white mb-1">{config.labels.stat_extras}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">خەرجی + زیادە + بار</p>
          <p className="text-4xl font-bold text-[var(--brand-color)] dir-ltr font-mono">{totalExtras.toLocaleString()} IQD</p>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <h2 className="text-lg text-gray-900 dark:text-white mb-1">{config.labels.stat_withdrawals}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">کۆی پارەی ڕاکێشراو</p>
          <p className="text-3xl font-bold text-red-500 dir-ltr font-mono">{stats.withdrawals.toLocaleString()} IQD</p>
        </Card>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-2">
        <StatBox label={config.labels.nav_expenses} value={stats.expenses} color="text-[var(--brand-color)]" />
        <StatBox label={config.labels.nav_overtime} value={stats.overtimePay} color="text-blue-500" />
        <StatBox label={config.labels.nav_loads} value={stats.loads} color="text-yellow-500" />
        <StatBox label={config.labels.nav_deductions} value={stats.withdrawals} color="text-red-500" />
      </div>
    </div>
  );
};

const StatBox = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <Card className="print:border print:border-gray-300">
    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">{label}</p>
    <h3 className={`text-xl font-bold ${color} font-mono`} dir="ltr">{value.toLocaleString()} IQD</h3>
  </Card>
);
