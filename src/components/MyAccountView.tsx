import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useMess } from "../context/MessContext";
import {
  UserCircle,
  Calendar,
  Utensils,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDownLeft,
  Info,
} from "lucide-react";

export const MyAccountView: React.FC = () => {
  const { user } = useAuth();
  const { activeMonth, months, setActiveMonthId, users } = useMess();

  // If Admin or Manager, they can toggle which student account to view
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [accountData, setAccountData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const canSwitchStudent =
    user?.role === "SUPER_ADMIN" || user?.role === "MANAGER" || user?.isManager;

  useEffect(() => {
    if (user) {
      if (!selectedStudentId) {
        // If current user is student, use their id. If admin, pick first student
        if (user.role === "STUDENT" || user.role === "MANAGER") {
          setSelectedStudentId(user.id);
        } else if (users.length > 0) {
          const firstStudent = users.find((u) => u.role !== "SUPER_ADMIN");
          if (firstStudent) setSelectedStudentId(firstStudent.id);
        }
      }
    }
  }, [user, users, selectedStudentId]);

  const loadAccount = async () => {
    if (!activeMonth || !selectedStudentId) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/months/${activeMonth.id}/student/${selectedStudentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setAccountData(data);
      } else {
        setAccountData(null);
      }
    } catch (e) {
      console.error("Failed to load student account:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccount();
  }, [activeMonth, selectedStudentId]);

  if (!user) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-6">
        <UserCircle className="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-stone-800">
          আপনার ব্যক্তিগত হিসাব দেখতে লগইন করুন
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          লগইন বাটনে ক্লিক করে আপনার মোবাইল নম্বর দিয়ে প্রবেশ করুন।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header with Switcher for Admin/Manager */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">
              আমার হিসাব (ব্যক্তিগত খাতা)
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {activeMonth?.name}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            আপনার চলতি মাসের খাওয়া মিল, তরকারি (স্থায়ী ৫৬ মিল), চাল ও জমার বিবরণ।
          </p>
        </div>

        {/* Month & Student Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {canSwitchStudent && (
            <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-200">
              <span className="text-xs font-bold text-stone-500">ছাত্র:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-transparent text-xs font-bold text-stone-800 focus:outline-hidden cursor-pointer"
              >
                {users
                  .filter((u) => u.role !== "SUPER_ADMIN")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phone.slice(-4)})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-200">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={activeMonth?.id || ""}
              onChange={(e) => setActiveMonthId(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-800 focus:outline-hidden cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-stone-400 text-sm">হিসাব প্রস্তুত হচ্ছে...</div>
      ) : !accountData ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 text-stone-500 text-sm">
          এই মাসে কোনো হিসাবের তথ্য পাওয়া যায়নি।
        </div>
      ) : (
        <>
          {/* 7 Large Summary Cards (Strict Prompt Requirement) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {/* 1. টোটাল মিল */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-500 block mb-1">
                ১. টোটাল মিল (খাওয়া)
              </span>
              <div className="text-3xl font-black text-stone-900 font-mono">
                {accountData.summary.actualMeals}
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">
                চাল খরচের ভিত্তি
              </span>
            </div>

            {/* 2. তরকারি খরচ */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-500 block mb-1">
                ২. তরকারি খরচ (স্থায়ী ৫৬ মিল)
              </span>
              <div className="text-3xl font-black text-stone-900 font-mono">
                ৳{accountData.summary.curryCost.toFixed(0)}
              </div>
              <span className="text-[11px] text-emerald-700 mt-1 block font-medium">
                ৫৬ × ৳{accountData.rates.curryRate.toFixed(2)}
              </span>
            </div>

            {/* 3. চাল খরচ */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-500 block mb-1">
                ৩. চাল খরচ
              </span>
              <div className="text-3xl font-black text-stone-900 font-mono">
                ৳{accountData.summary.riceCost.toFixed(0)}
              </div>
              <span className="text-[11px] text-emerald-700 mt-1 block font-medium">
                {accountData.summary.actualMeals} মিল × ৳{accountData.rates.riceRate.toFixed(2)}
              </span>
            </div>

            {/* 4. অতিরিক্ত খরচ */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-500 block mb-1">
                ৪. অতিরিক্ত খরচ
              </span>
              <div className="text-3xl font-black text-stone-900 font-mono">
                ৳{accountData.summary.extraCost.toFixed(0)}
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">
                মাথাপিছু সমান ভাগ
              </span>
            </div>

            {/* 5. জমা */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-500 block mb-1">
                ৫. মোট জমা
              </span>
              <div className="text-3xl font-black text-emerald-700 font-mono">
                ৳{accountData.summary.totalDeposit.toLocaleString()}
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">
                ছাত্র কর্তৃক প্রদত্ত জমা
              </span>
            </div>

            {/* 6. মোট খরচ */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold text-stone-500 block mb-1">
                ৬. মোট খরচ
              </span>
              <div className="text-3xl font-black text-stone-900 font-mono">
                ৳{accountData.summary.totalExpense.toFixed(0)}
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">
                তরকারি + চাল + অতিরিক্ত
              </span>
            </div>

            {/* 7. সর্বশেষ ব্যালেন্স (Spotlight) */}
            <div
              className={`p-4 sm:p-5 rounded-3xl border shadow-md col-span-2 sm:col-span-3 lg:col-span-2 ${
                accountData.summary.balanceStatus === "SURPLUS"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-emerald-400"
                  : "bg-gradient-to-br from-rose-500 to-red-700 text-white border-rose-400"
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider block opacity-90 mb-1">
                ৭. সর্বশেষ ব্যালেন্স
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono">
                {accountData.summary.balanceFormatted}
              </div>
              <span className="text-xs opacity-90 mt-1 block">
                {accountData.summary.balanceStatus === "SURPLUS"
                  ? "আপনার এই টাকা মেসের ফান্ডে জমা আছে।"
                  : "ম্যানেজারকে এই পরিমাণ টাকা পরিশোধ করতে হবে।"}
              </span>
            </div>
          </div>

          {/* Detailed Tabs: Meal History & Deposit History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Meal Records */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-stone-900">
                    দৈনিক মিলের হিস্ট্রি ({accountData.meals.length} দিন)
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  মোট: {accountData.summary.actualMeals} মিল
                </span>
              </div>

              {accountData.meals.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  কোনো মিল এন্ট্রি করা হয়নি।
                </div>
              ) : (
                <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto pr-1">
                  {accountData.meals.map((m: any) => (
                    <div
                      key={m.id}
                      className="py-2.5 flex items-center justify-between text-xs hover:bg-stone-50 px-2 rounded-xl transition"
                    >
                      <div>
                        <div className="font-bold text-stone-800">{m.date}</div>
                        <div className="text-[11px] text-stone-500">
                          সকাল: {m.morning ? "✓ ০.৫" : "✗ ০"} | দুপুর: {m.lunch ? "✓ ১.০" : "✗ ০"} | রাত: {m.dinner ? "✓ ১.০" : "✗ ০"}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-lg ${
                            m.total > 0
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {m.total} মিল
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deposit History */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-stone-900">
                    জমার হিস্ট্রি ({accountData.deposits.length} বার)
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  মোট: ৳{accountData.summary.totalDeposit.toLocaleString()}
                </span>
              </div>

              {accountData.deposits.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  কোনো জমার তথ্য নেই।
                </div>
              ) : (
                <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto pr-1">
                  {accountData.deposits.map((d: any) => (
                    <div
                      key={d.id}
                      className="py-2.5 flex items-center justify-between text-xs hover:bg-stone-50 px-2 rounded-xl transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-stone-800">{d.note || "জমা"}</div>
                          <div className="text-[11px] text-stone-400">{d.date}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono text-sm font-black text-emerald-700">
                        ৳{d.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
