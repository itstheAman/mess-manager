import { queryAll, queryOne } from "./db";

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
  balanceStatus: "SURPLUS" | "DUE" | "BALANCED"; // "জমা", "বাকি", or "সমতা"
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

export function calculateMonthSummary(monthId: string): MessMonthlySummary {
  const month = queryOne<any>(
    "SELECT * FROM monthly_periods WHERE id = ?",
    [monthId]
  );
  if (!month) {
    throw new Error("Month not found");
  }

  // Active students for this mess
  const activeStudents = queryAll<any>(
    `SELECT u.*, 
     (SELECT COUNT(*) FROM manager_assignments ma WHERE ma.user_id = u.id AND ma.month_id = ?) as is_month_manager
     FROM users u 
     WHERE u.mess_id = ? AND u.active = 1 AND u.approved = 1
     ORDER BY u.created_at ASC`,
    [monthId, month.mess_id]
  );

  const activeStudentCount = activeStudents.length > 0 ? activeStudents.length : (month.active_student_count || 1);
  const fixedCurryMeals = Number(month.fixed_curry_meals || 56);
  const includeBranInRice = Boolean(month.include_bran_in_rice_calculation);

  // Total Curry / Bazar expenses
  const curryExpenseRow = queryOne<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM curry_expenses WHERE month_id = ?",
    [monthId]
  );
  const totalCurryExpense = curryExpenseRow?.total || 0;

  // Total Rice & Bran expenses
  const riceExpenseRow = queryOne<{ total_rice: number; total_bran: number }>(
    "SELECT COALESCE(SUM(rice_amount), 0) as total_rice, COALESCE(SUM(bran_amount), 0) as total_bran FROM rice_expenses WHERE month_id = ?",
    [monthId]
  );
  const totalRiceExpense = riceExpenseRow?.total_rice || 0;
  const totalBranExpense = riceExpenseRow?.total_bran || 0;

  // Total Extra expenses
  const extraExpenseRow = queryOne<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM extra_expenses WHERE month_id = ?",
    [monthId]
  );
  const totalExtraExpense = extraExpenseRow?.total || 0;

  // Total Actual Meals
  const mealTotalRow = queryOne<{ total_meals: number }>(
    "SELECT COALESCE(SUM(total), 0) as total_meals FROM meal_records WHERE month_id = ?",
    [monthId]
  );
  const totalActualMeals = mealTotalRow?.total_meals || 0;

  // Curry rate calculation
  // Total Curry Rate Base = Fixed Curry Meals × Number of Active Students
  const curryRateBase = fixedCurryMeals * activeStudentCount;
  const curryRate = curryRateBase > 0 ? totalCurryExpense / curryRateBase : 0;

  // Rice rate calculation
  // Rice Rate = Total Rice Expense / Total Actual Meals
  const effectiveRiceExpense = totalRiceExpense + (includeBranInRice ? totalBranExpense : 0);
  const riceRate = totalActualMeals > 0 ? effectiveRiceExpense / totalActualMeals : 0;

  // Extra expense per student
  // Student Extra Expense = Total Extra Expense / Number of Active Students
  const studentExtraCost = activeStudentCount > 0 ? totalExtraExpense / activeStudentCount : 0;

  // Deposits per student
  const studentDeposits = queryAll<{ student_id: string; total_deposit: number }>(
    "SELECT student_id, COALESCE(SUM(amount), 0) as total_deposit FROM deposits WHERE month_id = ? GROUP BY student_id",
    [monthId]
  );
  const depositMap = new Map<string, number>();
  for (const d of studentDeposits) {
    depositMap.set(d.student_id, d.total_deposit);
  }

  // Actual meals per student
  const studentMeals = queryAll<{ student_id: string; actual_meals: number }>(
    "SELECT student_id, COALESCE(SUM(total), 0) as actual_meals FROM meal_records WHERE month_id = ? GROUP BY student_id",
    [monthId]
  );
  const mealMap = new Map<string, number>();
  for (const m of studentMeals) {
    mealMap.set(m.student_id, m.actual_meals);
  }

  let totalDeposits = 0;
  let studentsWithDue = 0;
  let studentsWithSurplus = 0;

  const studentCalculations: StudentCalculation[] = activeStudents.map((s) => {
    const actualMeals = mealMap.get(s.id) || 0;
    const studentCurryCost = fixedCurryMeals * curryRate;
    const studentRiceCost = actualMeals * riceRate;
    const studentTotalExpense = studentCurryCost + studentRiceCost + studentExtraCost;
    const totalDeposit = depositMap.get(s.id) || 0;
    totalDeposits += totalDeposit;

    const balance = totalDeposit - studentTotalExpense;
    const isSurplus = balance > 0.001;
    const isDue = balance < -0.001;
    let balanceStatus: "SURPLUS" | "DUE" | "BALANCED" = "BALANCED";
    if (isSurplus) {
      balanceStatus = "SURPLUS";
      studentsWithSurplus++;
    } else if (isDue) {
      balanceStatus = "DUE";
      studentsWithDue++;
    }

    const absBalance = Math.abs(balance);
    const balanceFormatted = isSurplus
      ? `৳${round2(absBalance)} জমা`
      : isDue
      ? `৳${round2(absBalance)} বাকি`
      : `৳0 সমতা`;

    return {
      studentId: s.id,
      studentName: s.name,
      phone: s.phone,
      role: s.role,
      isManager: s.role === "MANAGER" || s.is_month_manager > 0,
      actualMeals: round2(actualMeals),
      fixedCurryMeals,
      curryRate: round4(curryRate),
      curryCost: round2(studentCurryCost),
      riceRate: round4(riceRate),
      riceCost: round2(studentRiceCost),
      extraCost: round2(studentExtraCost),
      totalExpense: round2(studentTotalExpense),
      totalDeposit: round2(totalDeposit),
      balance: round2(balance),
      balanceStatus,
      balanceFormatted,
    };
  });

  const totalMessExpense = totalCurryExpense + totalRiceExpense + (includeBranInRice ? 0 : totalBranExpense) + totalExtraExpense;
  const netMessBalance = totalDeposits - totalMessExpense;

  return {
    monthId: month.id,
    monthName: month.name,
    monthStatus: month.status,
    year: month.year,
    month: month.month,
    activeStudentCount,
    fixedCurryMealsPerStudent: fixedCurryMeals,
    totalActualMeals: round2(totalActualMeals),
    totalCurryExpense: round2(totalCurryExpense),
    curryRateBase,
    curryRate: round4(curryRate),
    totalRiceExpense: round2(totalRiceExpense),
    totalBranExpense: round2(totalBranExpense),
    includeBranInRice,
    riceRate: round4(riceRate),
    totalExtraExpense: round2(totalExtraExpense),
    studentExtraCost: round2(studentExtraCost),
    totalDeposits: round2(totalDeposits),
    totalMessExpense: round2(totalMessExpense),
    netMessBalance: round2(netMessBalance),
    studentsWithDue,
    studentsWithSurplus,
    students: studentCalculations,
  };
}

function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function round4(num: number): number {
  return Math.round((num + Number.EPSILON) * 10000) / 10000;
}
