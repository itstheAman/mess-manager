import React, { useState, useEffect } from "react";
import { useMess } from "../context/MessContext";
import {
  FileText,
  Printer,
  PieChart,
  TrendingUp,
  Award,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";

export const ReportsView: React.FC = () => {
  const { summary, activeMonth, isLoadingSummary } = useMess();
  const [dailyData, setDailyData] = useState<any[]>([]);

  useEffect(() => {
    const loadDailyTrends = async () => {
      if (!activeMonth) return;
      try {
        const res = await fetch(`/api/months/${activeMonth.id}/meals`);
        if (res.ok) {
          const data = await res.json();
          const items = data.dates.map((d: string) => ({
            date: d,
            day: parseInt(d.split("-")[2], 10),
            total: data.dateTotals[d] || 0,
          }));
          setDailyData(items);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadDailyTrends();
  }, [activeMonth]);

  if (isLoadingSummary || !summary) {
    return (
      <div className="text-center py-16 text-stone-400 text-sm">রিপোর্ট প্রস্তুত হচ্ছে...</div>
    );
  }

  // Expense categories for breakdown
  const curryExp = summary.totalCurryExpense;
  const riceExp = summary.totalRiceExpense;
  const branExp = summary.totalBranExpense;
  const extraExp = summary.totalExtraExpense;
  const totalExp = curryExp + riceExp + branExp + extraExp || 1;

  const curryPct = Math.round((curryExp / totalExp) * 100);
  const ricePct = Math.round((riceExp / totalExp) * 100);
  const branPct = Math.round((branExp / totalExp) * 100);
  const extraPct = Math.round((extraExp / totalExp) * 100);

  // Highest meal eater student & lowest
  const sortedStudents = [...summary.students].sort((a, b) => b.actualMeals - a.actualMeals);
  const topEater = sortedStudents[0];
  const lowestEater = sortedStudents[sortedStudents.length - 1];

  // Daily meal trend max
  const maxDayMeal = Math.max(...dailyData.map((d) => d.total), 35);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">
              রিপোর্ট ও পরিসংখ্যান ({summary.monthName})
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              মেস অ্যানালিটিক্স
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            দৈনিক মিল ট্রেন্ড, খরচের শতকরা বিভাজন এবং নোটিশ বোর্ডের জন্য প্রিন্ট উপযোগী স্টেটমেন্ট।
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-black rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto no-print"
        >
          <Printer className="w-4 h-4" />
          নোটিশ প্রিন্ট করুন
        </button>
      </div>

      {/* Highlights & Records */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {topEater && (
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-xs text-stone-500 font-semibold block">সর্বোচ্চ মিল ভক্ষক</span>
              <span className="text-sm font-bold text-stone-900 block">{topEater.studentName}</span>
              <span className="text-xs text-emerald-700 font-mono font-bold">{topEater.actualMeals} মিল</span>
            </div>
          </div>
        )}

        {lowestEater && (
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Utensils className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="text-xs text-stone-500 font-semibold block">সর্বনিম্ন মিল খেয়েছে</span>
              <span className="text-sm font-bold text-stone-900 block">{lowestEater.studentName}</span>
              <span className="text-xs text-stone-600 font-mono font-bold">{lowestEater.actualMeals} মিল</span>
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-semibold block">গড় দৈনিক মিল খরচ</span>
            <span className="text-base font-black text-stone-900 font-mono block">
              ৳{(summary.curryRate + summary.riceRate).toFixed(2)}
            </span>
            <span className="text-[11px] text-stone-500">তরকারি + চাল প্রতি মিল</span>
          </div>
        </div>
      </div>

      {/* Daily Meals Consumption Chart (Interactive SVG Bar Chart) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            দৈনিক মেস মিলের উঠানামা (তারিখ ১ থেকে ৩০)
          </h3>
          <span className="text-xs text-stone-400 font-medium">প্রতিদিনের মোট মেস মিল</span>
        </div>

        <div className="pt-4 overflow-x-auto">
          <div className="min-w-[600px] h-48 flex items-end gap-1.5 border-b border-stone-200 pb-2">
            {dailyData.map((d) => {
              const heightPercent = maxDayMeal > 0 ? (d.total / maxDayMeal) * 100 : 0;
              const hasMeal = d.total > 0;

              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-8 bg-stone-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                    {d.day} তারিখ: {d.total} মিল
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    className={`w-full rounded-t-md transition-all ${
                      hasMeal
                        ? "bg-emerald-500 group-hover:bg-emerald-600"
                        : "bg-stone-100"
                    }`}
                  ></div>

                  {/* Day number */}
                  <span className="text-[10px] text-stone-400 font-mono mt-1 block">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expense Breakdown (Donut + Progress bars) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-600" />
          মেস খরচের খাতভিত্তিক বণ্টন (Expense Breakdown)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-xs font-semibold text-emerald-900 block">বাজার / তরকারি খরচ</span>
            <div className="text-2xl font-black text-emerald-950 font-mono mt-1">
              ৳{curryExp.toLocaleString()}
            </div>
            <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${curryPct}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-emerald-800 font-bold block mt-1">
              {curryPct}% মোট খরচের
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
            <span className="text-xs font-semibold text-blue-900 block">চাল খরচ</span>
            <div className="text-2xl font-black text-blue-950 font-mono mt-1">
              ৳{riceExp.toLocaleString()}
            </div>
            <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${ricePct}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-blue-800 font-bold block mt-1">
              {ricePct}% মোট খরচের
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
            <span className="text-xs font-semibold text-amber-900 block">ভুষি খরচ</span>
            <div className="text-2xl font-black text-amber-950 font-mono mt-1">
              ৳{branExp.toLocaleString()}
            </div>
            <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-amber-600 h-full rounded-full"
                style={{ width: `${branPct}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-amber-800 font-bold block mt-1">
              {branPct}% মোট খরচের
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200">
            <span className="text-xs font-semibold text-purple-900 block">অতিরিক্ত খরচ</span>
            <div className="text-2xl font-black text-purple-950 font-mono mt-1">
              ৳{extraExp.toLocaleString()}
            </div>
            <div className="w-full bg-purple-200 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-purple-600 h-full rounded-full"
                style={{ width: `${extraPct}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-purple-800 font-bold block mt-1">
              {extraPct}% মোট খরচের
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
