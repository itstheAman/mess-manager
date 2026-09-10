import React from "react";
import { useAuth } from "../context/AuthContext";
import { useMess } from "../context/MessContext";
import {
  Users,
  Utensils,
  Wallet,
  ShoppingCart,
  Wheat,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Info,
} from "lucide-react";

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { summary, activeMonth, isLoadingSummary, isMonthClosed } = useMess();

  if (isLoadingSummary || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-stone-500">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">হিসাব লোড হচ্ছে...</p>
      </div>
    );
  }

  // Find user's personal calculation if they are a student or manager
  const myRecord = user ? summary.students.find((s) => s.studentId === user.id) : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Closed Month Banner */}
      {isMonthClosed && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {summary.monthName} মাসের হিসাব বন্ধ (CLOSED) করা হয়েছে
              </h4>
              <p className="text-xs text-amber-700">
                এই মাসের মিল ও খরচের তথ্য শুধুমাত্র দেখা যাবে, পরিবর্তন করা যাবে না।
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-200 text-amber-900">
            ক্লোজড
          </span>
        </div>
      )}

      {/* Hero Header with Month & Rates */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold backdrop-blur-xs mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {summary.monthName} ({summary.monthStatus === "OPEN" ? "চলমান" : "বন্ধ"})
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
                আদর্শ মেস ড্যাশবোর্ড
              </h1>
              <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-xl">
                ম্যানেজার ডাটা এন্ট্রি করলে সিস্টেম স্বয়ংক্রিয়ভাবে তরকারি ও চালের রেট এবং সবার ব্যালেন্স হিসাব করে।
              </p>
            </div>

            {/* Crucial Mess Rate Formula Display */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col gap-2 min-w-[240px]">
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/10">
                <span className="text-stone-300">তরকারি রেট (স্থায়ী ৫৬ মিল)</span>
                <span className="text-emerald-300 font-bold font-mono">৳{summary.curryRate.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/10">
                <span className="text-stone-300">চাল রেট (খাওয়া মিল ভিত্তিক)</span>
                <span className="text-emerald-300 font-bold font-mono">৳{summary.riceRate.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300">অতিরিক্ত খরচ (মাথাপিছু)</span>
                <span className="text-amber-300 font-bold font-mono">৳{summary.studentExtraCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle decorative mesh */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Student Personal Spotlight (If user is student or manager) */}
      {myRecord && (
        <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                {myRecord.studentName.slice(0, 2)}
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {myRecord.studentName} — আমার ব্যক্তিগত চলতি হিসাব
                </h3>
                <p className="text-xs text-stone-500">
                  চলতি মাসের মিল, তরকারি (স্থায়ী ৫৬), চাল ও বর্তমান ব্যালেন্স
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("my-account")}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              বিস্তারিত দেখুন <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100">
              <span className="text-[11px] font-semibold text-stone-500 block">খাওয়া মিল</span>
              <span className="text-lg font-bold text-stone-900">{myRecord.actualMeals}</span>
            </div>
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100">
              <span className="text-[11px] font-semibold text-stone-500 block">তরকারি খরচ (৫৬ মিল)</span>
              <span className="text-lg font-bold text-stone-900">৳{myRecord.curryCost.toFixed(0)}</span>
            </div>
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100">
              <span className="text-[11px] font-semibold text-stone-500 block">চাল খরচ</span>
              <span className="text-lg font-bold text-stone-900">৳{myRecord.riceCost.toFixed(0)}</span>
            </div>
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100">
              <span className="text-[11px] font-semibold text-stone-500 block">অতিরিক্ত খরচ</span>
              <span className="text-lg font-bold text-stone-900">৳{myRecord.extraCost.toFixed(0)}</span>
            </div>
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100">
              <span className="text-[11px] font-semibold text-stone-500 block">মোট জমা</span>
              <span className="text-lg font-bold text-emerald-700">৳{myRecord.totalDeposit.toFixed(0)}</span>
            </div>
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100">
              <span className="text-[11px] font-semibold text-stone-500 block">মোট খরচ</span>
              <span className="text-lg font-bold text-stone-900">৳{myRecord.totalExpense.toFixed(0)}</span>
            </div>
            <div
              className={`rounded-2xl p-3 border col-span-2 sm:col-span-1 ${
                myRecord.balanceStatus === "SURPLUS"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <span className="text-[11px] font-bold block">সর্বশেষ ব্যালেন্স</span>
              <span className="text-lg font-black">{myRecord.balanceFormatted}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Buttons for Managers & Admin */}
      {(user?.role === "SUPER_ADMIN" || user?.role === "MANAGER" || user?.isManager) && !isMonthClosed && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-700" />
              ম্যানেজার কুইক অ্যাকশন (দ্রুত হিসাব লিপিবদ্ধ করুন)
            </h3>
            <span className="text-xs text-emerald-700 font-medium hidden sm:inline">
              খাতায় হিসাবের মতো দ্রুত এন্ট্রি
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <button
              onClick={() => onNavigate("meals")}
              className="p-3 bg-white hover:bg-emerald-100/60 text-stone-800 rounded-2xl border border-emerald-200 text-xs font-bold transition shadow-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-emerald-300"
            >
              <Utensils className="w-5 h-5 text-emerald-700" />
              <span>+ মিল যোগ / এন্ট্রি</span>
            </button>
            <button
              onClick={() => onNavigate("deposits")}
              className="p-3 bg-white hover:bg-emerald-100/60 text-stone-800 rounded-2xl border border-emerald-200 text-xs font-bold transition shadow-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-emerald-300"
            >
              <Wallet className="w-5 h-5 text-emerald-700" />
              <span>+ জমা যোগ করুন</span>
            </button>
            <button
              onClick={() => onNavigate("bazar")}
              className="p-3 bg-white hover:bg-emerald-100/60 text-stone-800 rounded-2xl border border-emerald-200 text-xs font-bold transition shadow-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-emerald-300"
            >
              <ShoppingCart className="w-5 h-5 text-emerald-700" />
              <span>+ বাজার খরচ</span>
            </button>
            <button
              onClick={() => onNavigate("rice")}
              className="p-3 bg-white hover:bg-emerald-100/60 text-stone-800 rounded-2xl border border-emerald-200 text-xs font-bold transition shadow-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-emerald-300"
            >
              <Wheat className="w-5 h-5 text-emerald-700" />
              <span>+ চাল/ভুষি খরচ</span>
            </button>
            <button
              onClick={() => onNavigate("extra")}
              className="p-3 bg-white hover:bg-emerald-100/60 text-stone-800 rounded-2xl border border-emerald-200 text-xs font-bold transition shadow-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-emerald-300 col-span-2 sm:col-span-1"
            >
              <PlusCircle className="w-5 h-5 text-emerald-700" />
              <span>+ অতিরিক্ত খরচ</span>
            </button>
          </div>
        </div>
      )}

      {/* Mess Overview Stats Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900 font-serif">
            মাসের সামগ্রিক হিসাব ওভারভিউ ({summary.monthName})
          </h2>
          <button
            onClick={() => onNavigate("monthly")}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            মাসিক পূর্ণাঙ্গ শিট <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {/* Total Active Students */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold">মোট সক্রিয় ছাত্র</span>
              <Users className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-black text-stone-900">{summary.activeStudentCount} জন</div>
            <div className="text-[11px] text-stone-500 mt-1">স্থায়ী ৫৬ মিল/জন = {summary.curryRateBase} মিল</div>
          </div>

          {/* Total Actual Meals */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold">মাসের মোট খাওয়া মিল</span>
              <Utensils className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-stone-900">{summary.totalActualMeals}</div>
            <div className="text-[11px] text-stone-500 mt-1">চাল হিসাবের মূল ভিত্তি</div>
          </div>

          {/* Total Deposits */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold">সর্বমোট জমা</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">৳{summary.totalDeposits.toLocaleString()}</div>
            <div className="text-[11px] text-stone-500 mt-1">ছাত্রদের দেওয়া মোট জমা</div>
          </div>

          {/* Total Mess Expense */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold">সর্বমোট খরচ</span>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-stone-900">৳{summary.totalMessExpense.toLocaleString()}</div>
            <div className="text-[11px] text-stone-500 mt-1">বাজার + চাল + ভুষি + অতিরিক্ত</div>
          </div>

          {/* Total Curry Expense */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold">বাজার / তরকারি খরচ</span>
              <ShoppingCart className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-xl font-bold text-stone-900">৳{summary.totalCurryExpense.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-700 mt-1">রেট: ৳{summary.curryRate.toFixed(2)}/মিল</div>
          </div>

          {/* Total Rice Expense */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold">চাল খরচ</span>
              <Wheat className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-xl font-bold text-stone-900">৳{summary.totalRiceExpense.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-700 mt-1">রেট: ৳{summary.riceRate.toFixed(2)}/মিল</div>
          </div>

          {/* Total Bran Expense */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold">ভুষি খরচ</span>
              <Wheat className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-stone-900">৳{summary.totalBranExpense.toLocaleString()}</div>
            <div className="text-[11px] text-stone-500 mt-1">
              {summary.includeBranInRice ? "চালে অন্তর্ভুক্ত" : "পৃথক সংরক্ষিত"}
            </div>
          </div>

          {/* Total Extra Expense */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold">অতিরিক্ত খরচ</span>
              <PlusCircle className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-xl font-bold text-stone-900">৳{summary.totalExtraExpense.toLocaleString()}</div>
            <div className="text-[11px] text-stone-500 mt-1">মাথাপিছু ৳{summary.studentExtraCost.toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* Student Balances Summary Cards (Due vs Surplus) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Surplus Students */}
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-emerald-950">
                জমা আছে এমন ছাত্র ({summary.studentsWithSurplus} জন)
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              উদ্বৃত্ত
            </span>
          </div>
          {summary.studentsWithSurplus === 0 ? (
            <div className="text-xs text-stone-500 italic py-2">
              এখনও কোনো অতিরিক্ত জমা বা উদ্বৃত্ত নেই।
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {summary.students
                .filter((s) => s.balanceStatus === "SURPLUS")
                .map((s) => (
                  <div
                    key={s.studentId}
                    className="bg-white border border-emerald-200/80 rounded-xl px-2.5 py-1.5 text-xs flex items-center gap-2 shadow-2xs"
                  >
                    <span className="font-semibold text-stone-800">{s.studentName}</span>
                    <span className="font-bold text-emerald-700 font-mono">+{s.balanceFormatted}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Due Students */}
        <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold text-rose-950">
                বাকি ছাত্র ({summary.studentsWithDue} জন)
              </h3>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
              বকেয়া
            </span>
          </div>
          {summary.studentsWithDue === 0 ? (
            <div className="text-xs text-stone-500 italic py-2">
              আলহামদুলিল্লাহ, কারও কোনো বকেয়া নেই।
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {summary.students
                .filter((s) => s.balanceStatus === "DUE")
                .map((s) => (
                  <div
                    key={s.studentId}
                    className="bg-white border border-rose-200/80 rounded-xl px-2.5 py-1.5 text-xs flex items-center gap-2 shadow-2xs"
                  >
                    <span className="font-semibold text-stone-800">{s.studentName}</span>
                    <span className="font-bold text-rose-700 font-mono">{s.balanceFormatted}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Accounting Rule Clarification Note */}
      <div className="bg-stone-100 rounded-2xl p-4 border border-stone-200/80 flex items-start gap-3">
        <Info className="w-5 h-5 text-stone-500 shrink-0 mt-0.5" />
        <div className="text-xs text-stone-600 leading-relaxed">
          <strong className="text-stone-900 font-semibold">আদর্শ মেস হিসাব নীতি:</strong>{" "}
          প্রতিটি সক্রিয় ছাত্রকে প্রতি মাসে <span className="font-bold text-stone-900">৫৬টি ফিক্সড তরকারি মিলের</span> খরচ দিতে হয় (কেউ কম বা বেশি খেলেও তরকারি খরচ সমান থাকে)। অপরদিকে <span className="font-bold text-stone-900">চাল খরচ</span> নির্ধারিত হয় ছাত্রের <span className="font-bold text-stone-900">প্রকৃত খাওয়া মিলের</span> সংখ্যার উপর। পেপার, ময়লা বা ইন্টারনেট প্রভৃতি <span className="font-bold text-stone-900">অতিরিক্ত খরচ</span> সকল ছাত্রের মাঝে সমানভাবে বিভক্ত হয়।
        </div>
      </div>
    </div>
  );
};
