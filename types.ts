export interface Employee {
  id: string;
  name: string;
  startDate: string;
  notes: string;
  order: number;
  createdAt: number;
}

export interface Transaction {
  id: string;
  employeeName: string;
  date: string;
  amount: number;
  note: string;
  description?: string; // For loads
  createdAt: number;
}

export interface OvertimeRecord {
  id: string;
  employeeName: string;
  date: string;
  hours: number;
  pay: number;
  note: string;
  createdAt: number;
}

export interface LockedDay {
  locked: boolean;
}

export interface AppColors {
  brand: string;
  sidebar: string;
}

export type UserRole = 'admin' | 'guest';

export interface User {
  id: string;
  username: string;
  password: string; // In a real production app, never store plain text. For this demo, we store as is.
  role: UserRole;
  createdAt: number;
}

export interface AppLabels {
  nav_dashboard: string;
  nav_employees: string;
  nav_expenses: string;
  nav_overtime: string;
  nav_loads: string;
  nav_deductions: string;
  nav_settings: string;
  stat_extras: string;
  stat_withdrawals: string;
  th_name: string;
  th_date: string;
  th_amount: string;
  th_note: string;
  th_actions: string;
  btn_add: string;
  btn_save: string;
  btn_print: string;
  btn_back: string;
  [key: string]: string;
}

export interface AppConfig {
  appName: string;
  logo: string;
  overtimeRate: number;
  loadRate: number;
  fontFamily: string;
  customFontData: string | null;
  labels: AppLabels;
  colors: AppColors;
}

export const DEFAULTS = {
  colors: { brand: '#F97316', sidebar: '#1e293b' },
  labels: {
    nav_dashboard: 'سەرەکی',
    nav_employees: 'کارمەندان',
    nav_expenses: 'خەرجییەکان',
    nav_overtime: 'کاتژمێر زیادە',
    nav_loads: 'بارهەڵگرتن',
    nav_deductions: 'قەرز و پێشینە',
    nav_settings: 'ڕێکخستنەکان',
    stat_extras: 'کۆی هەموو زیادەکان',
    stat_withdrawals: 'کۆی ڕاکێشانی پارە',
    th_name: 'ناوی کارمەند',
    th_date: 'بەروار',
    th_amount: 'بڕی پارە',
    th_note: 'تێبینی',
    th_actions: 'کردارەکان',
    btn_add: 'زیادکردن',
    btn_save: 'تۆمارکردن',
    btn_print: 'چاپکردن',
    btn_back: 'گەڕانەوە'
  }
};