import React, { useState, useEffect } from "react";
import { useMess } from "../context/MessContext";
import {
  CreditCard,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Calendar,
  Download,
} from "lucide-react";

export const TransactionsView: React.FC = () => {
  const { activeMonth, summary } = useMess();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadTransactions = async () => {
    if (!activeMonth) return;
    setIsLoading(true);
    try {
      // Aggregate deposits, curry expenses, rice expenses, extra expenses
      const [depRes, curryRes, riceRes, extraRes] = await Promise.all([
        fetch(`/api/months/${activeMonth.id}/deposits`),
        fetch(`/api/months/${activeMonth.id}/curry-expenses`),
        fetch(`/api/months/${activeMonth.id}/rice-expenses`),
        fetch(`/api/months/${activeMonth.id}/extra-expenses`),
      ]);

      const deposits = depRes.ok ? await depRes.json() : [];
      const curryExp = curryRes.ok ? await curryRes.json() : [];
      const riceExp = riceRes.ok ? await riceRes.json() : [];
      const extraExp = extraRes.ok ? await extraRes.json() : [];

      const list: any[] = [];

      deposits.forEach((d: any) => {
        list.push({
          id: `dep_${d.id}`,
          date: d.date,
          type: "DEPOSIT",
          typeLabel: "জমা",
          name: d.student_name,
          category: "মাসিক জমা",
          amount: d.amount,
          isCredit: true,
          note: d.note,
        });
      });

      curryExp.forEach((c: any) => {
        list.push({
          id: `curry_${c.id}`,
          date: c.date,
          type: "CURRY",
          typeLabel: "বাজার (তরকারি)",
          name: c.person_name || "মেস",
          category: c.category,
          amount: c.amount,
          isCredit: false,
          note: c.description,
        });
      });

      riceExp.forEach((r: any) => {
        const total = r.rice_amount + r.bran_amount;
        list.push({
          id: `rice_${r.id}`,
          date: r.date,
          type: "RICE",
          typeLabel: "চাল ও ভুষি",
          name: r.person_name || "মেস",
          category: `চাল ৳${r.rice_amount} + ভুষি ৳${r.bran_amount}`,
          amount: total,
          isCredit: false,
          note: r.note,
        });
      });

      extraExp.forEach((e: any) => {
        list.push({
          id: `extra_${e.id}`,
          date: e.date,
          type: "EXTRA",
          typeLabel: "অতিরিক্ত খরচ",
          name: e.person_name || "মেস সাধারণ তহবিল",
          category: e.title,
          amount: e.amount,
          isCredit: false,
          note: e.note,
        });
      });

      // Sort by date descending
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(list);
    } catch (e) {
      console.error("Failed to load transactions:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [activeMonth]);

  const filtered = transactions.filter((t) => {
    const matchesType = typeFilter === "ALL" ? true : t.type === typeFilter;
    const matchesSearch =
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.note?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalIn = filtered
    .filter((t) => t.isCredit)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOut = filtered
    .filter((t) => !t.isCredit)
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">
              সকল লেনদেনের হিস্ট্রি (ক্যাশ লেজার)
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {activeMonth?.name}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            মেসের প্রতিটি জমা এবং খরচের একক ধারাবাহিক ক্যাশ খাতা।
          </p>
        </div>

        {/* Totals Summary */}
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs">
            <span className="text-emerald-700 block text-[10px] font-bold">মোট ক্যাশ ইন (জমা)</span>
            <span className="text-emerald-900 font-black font-mono">৳{totalIn.toLocaleString()}</span>
          </div>
          <div className="bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 text-xs">
            <span className="text-rose-700 block text-[10px] font-bold">মোট ক্যাশ আউট (খরচ)</span>
            <span className="text-rose-900 font-black font-mono">৳{totalOut.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="নাম বা বিবরণ দিয়ে লেনদেন খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">সকল লেনদেন</option>
            <option value="DEPOSIT">শুধুমাত্র জমা (ক্যাশ ইন)</option>
            <option value="CURRY">বাজার খরচ</option>
            <option value="RICE">চাল ও ভুষি</option>
            <option value="EXTRA">অতিরিক্ত খরচ</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-stone-400 text-sm">লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm">
            কোনো লেনদেনের রেকর্ড নেই।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-stone-100/90 text-stone-700 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-3 font-bold text-center w-12">#</th>
                  <th className="py-3 px-4 font-bold">তারিখ</th>
                  <th className="py-3 px-4 font-bold">ধরন</th>
                  <th className="py-3 px-4 font-bold">নাম / ব্যক্তি</th>
                  <th className="py-3 px-4 font-bold">খাত / বিবরণ</th>
                  <th className="py-3 px-4 font-bold text-right">পরিমাণ (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {filtered.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-3 text-center text-stone-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-600 whitespace-nowrap">
                      {t.date}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          t.isCredit
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-100 text-stone-800"
                        }`}
                      >
                        {t.isCredit ? (
                          <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 text-rose-600" />
                        )}
                        {t.typeLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900 whitespace-nowrap">
                      {t.name}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      <span className="font-semibold text-stone-800">{t.category}</span>
                      {t.note && (
                        <span className="text-stone-400 ml-1.5 text-[11px]">({t.note})</span>
                      )}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-black font-mono text-sm ${
                        t.isCredit ? "text-emerald-700" : "text-stone-900"
                      }`}
                    >
                      {t.isCredit ? "+" : "-"}৳{t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
