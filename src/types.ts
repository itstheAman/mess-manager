export type UserRole = "SUPER_ADMIN" | "MANAGER" | "STUDENT";

export interface Mess {
  id: string;
  name: string;
  code: string; // 6-digit invitation / room code (e.g. "842915")
  creator_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  mess_id?: string;
  name: string;
  phone: string;
  role: UserRole;
  approved: number;
  active: number;
  status?: "ACTIVE" | "INACTIVE";
  room_number?: string;
  isManager?: boolean;
  is_manager?: number;
  managerMonthIds?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyPeriod {
  id: string;
  name: string;
  month: number;
  year: number;
  status: "OPEN" | "CLOSED" | "ARCHIVED";
  active_student_count: number;
  fixed_curry_meals: number;
  morning_meal_value: number;
  lunch_meal_value: number;
  dinner_meal_value: number;
  include_bran_in_rice_calculation: number;
  created_at: string;
  updated_at: string;
}

export type MessMonth = MonthlyPeriod;

export interface StudentCalculation {
  studentId: string;
  studentName: string;
  phone: string;
  role: string;
  isManager: boolean;
  actualMeals: number;
  fixedCurryMeals: number;
  curryRate: number;
  curryCost: number;
  riceRate: number;
  riceCost: number;
  extraCost: number;
  totalExpense: number;
  totalDeposit: number;
  balance: number;
  balanceStatus: "SURPLUS" | "DUE" | "BALANCED";
  balanceFormatted: string;
}

export interface MessMonthlySummary {
  monthId: string;
  monthName: string;
  monthStatus: "OPEN" | "CLOSED" | "ARCHIVED";
  year: number;
  month: number;
  activeStudentCount: number;
  fixedCurryMealsPerStudent: number;
  totalActualMeals: number;
  totalCurryExpense: number;
  curryRateBase: number;
  curryRate: number;
  totalRiceExpense: number;
  totalBranExpense: number;
  includeBranInRice: boolean;
  riceRate: number;
  totalExtraExpense: number;
  studentExtraCost: number;
  totalDeposits: number;
  totalMessExpense: number;
  netMessBalance: number;
  studentsWithDue: number;
  studentsWithSurplus: number;
  students: StudentCalculation[];
}

export interface MealRecord {
  id: string;
  month_id: string;
  student_id: string;
  date: string;
  morning: number;
  lunch: number;
  dinner: number;
  total: number;
  note?: string;
  student_name?: string;
}

export interface Deposit {
  id: string;
  month_id: string;
  student_id: string;
  student_name?: string;
  student_phone?: string;
  date: string;
  amount: number;
  note: string;
  created_at: string;
}

export interface CurryExpense {
  id: string;
  month_id: string;
  date: string;
  person_id: string;
  person_name?: string;
  category: string;
  amount: number;
  description: string;
  created_at: string;
}

export interface RiceExpense {
  id: string;
  month_id: string;
  date: string;
  person_id: string;
  person_name?: string;
  rice_amount: number;
  bran_amount: number;
  note: string;
  created_at: string;
}

export interface ExtraExpense {
  id: string;
  month_id: string;
  date: string;
  person_id?: string;
  person_name?: string;
  title?: string;
  description?: string;
  note?: string;
  amount: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: "জমা" | "বাজার খরচ" | "চাল খরচ" | "ভুষি খরচ" | "অতিরিক্ত খরচ";
  student_id?: string;
  person_name?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}
