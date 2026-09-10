import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useMess } from "../context/MessContext";
import { RiceExpense } from "../types";
import { ConfirmationModal } from "./ConfirmationModal";
import {
  Wheat,
  Plus,
  Search,
  Calendar,
  Edit2,
  Trash2,
  Lock,
  X,
  Save,
  Info,
} from "lucide-react";

export const RiceBranExpenseView: React.FC = () => {
  const { user } = useAuth();
  const { activeMonth, isMonthClosed, users, notify, refreshData, summary } = useMess();

  const [expenses, setExpenses] = useState<RiceExpense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    person_id: "",
    date: new Date().toISOString().split("T")[0],
    rice_amount: "",
    bran_amount: "0",
    note: "চাল ক্রয়",
  });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const canManage =
    !isMonthClosed &&
    (user?.role === "SUPER_ADMIN" || user?.role === "MANAGER" || user?.isManager);

  const loadExpenses = async () => {
    if (!activeMonth) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/months/${activeMonth.id}/rice-expenses`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (e) {
      console.error("Failed to load rice expenses:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [activeMonth]);

  const handleOpenAdd = () => {
    const firstStudent = users.find((u) => u.role !== "SUPER_ADMIN");
    setEditingId(null);
    setFormData({
      person_id: user?.id || firstStudent?.id || "",
      date: new Date().toISOString().split("T")[0],
      rice_amount: "",
      bran_amount: "0",
      note: "চাল ক্রয়",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (exp: RiceExpense) => {
    setEditingId(exp.id);
    setFormData({
      person_id: exp.person_id,
      date: exp.date,
      rice_amount: exp.rice_amount.toString(),
      bran_amount: exp.bran_amount.toString(),
      note: exp.note || "",
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMonth) return;

    const numRice = parseFloat(formData.rice_amount) || 0;
    const numBran = parseFloat(formData.bran_amount) || 0;

    if (numRice <= 0 && numBran <= 0) {
      notify("চাল অথবা ভুষি খরচের পরিমাণ ০ এর বেশি দিন।", "error");
      return;
    }

    try {
      const url = editingId ? `/api/rice-expenses/${editingId}` : "/api/rice-expenses";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
        body: JSON.stringify({
          month_id: activeMonth.id,
          person_id: formData.person_id,
          date: formData.date,
          rice_amount: numRice,
          bran_amount: numBran,
          note: formData.note,
        }),
      });

      if (res.ok) {
        notify(
          editingId ? "চাল/ভুষি খরচ সফলভাবে আপডেট হয়েছে!" : "চাল/ভুষি খরচ যুক্ত হয়েছে!",
          "success"
        );
        setIsFormOpen(false);
        await loadExpenses();
        await refreshData();
      } else {
        const err = await res.json();
        notify(err.error || "সংরক্ষণ ব্যর্থ হয়েছে", "error");
      }
    } catch (e) {
      notify("সার্ভার ত্রুটি", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await fetch(`/api/rice-expenses/${deleteTargetId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
      });
      if (res.ok) {
        notify("চাল/ভুষি খরচ সফলভাবে মুছে ফেলা হয়েছে।", "success");
        setDeleteTargetId(null);
        await loadExpenses();
        await refreshData();
      } else {
        const err = await res.json();
        notify(err.error || "মুছে ফেলা যায়নি", "error");
      }
    } catch (e) {
      notify("সার্ভার সমস্যা", "error");
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      (e.person_name && e.person_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.note && e.note.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const totalFilteredRice = filteredExpenses.reduce((acc, e) => acc + e.rice_amount, 0);
  const totalFilteredBran = filteredExpenses.reduce((acc, e) => acc + e.bran_amount, 0);
  const totalFilteredCombined = totalFilteredRice + totalFilteredBran;

  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">
              চাল ও ভুষি খরচ
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              মোট ৳{totalFilteredCombined.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            রেফারেন্স খাতা অনুযায়ী চাল ও ভুষি খরচের হিসাব।
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            + চাল ও ভুষি খরচ লিখুন
          </button>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200">
          <span className="text-xs font-bold text-stone-500 block">মোট চাল খরচ</span>
          <span className="text-xl font-black text-stone-900 font-mono mt-1 block">
            ৳{totalFilteredRice.toLocaleString()}
          </span>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">
            খাওয়া মিল ভিত্তিক রেট: ৳{summary?.riceRate.toFixed(2) || "0.00"}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200">
          <span className="text-xs font-bold text-stone-500 block">মোট ভুষি খরচ</span>
          <span className="text-xl font-black text-stone-900 font-mono mt-1 block">
            ৳{totalFilteredBran.toLocaleString()}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">
            {summary?.includeBranInRice ? "চালে অন্তর্ভুক্ত" : "পৃথক সংরক্ষিত"}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200">
          <span className="text-xs font-bold text-stone-500 block">সর্বমোট (চাল + ভুষি)</span>
          <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">
            ৳{totalFilteredCombined.toLocaleString()}
          </span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">
            মোট ক্রয়কৃত খরচের যোগফল
          </span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="ক্রেতার নাম অথবা বিবরণ দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Table: তারিখ | নাম | চাল | ভুষি | মোট | অ্যাকশন */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-stone-400 text-sm">লোড হচ্ছে...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm">
            কোনো চাল বা ভুষি খরচের তথ্য পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-stone-100/90 text-stone-700 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-3 font-bold text-center w-12">#</th>
                  <th className="py-3 px-4 font-bold">তারিখ</th>
                  <th className="py-3 px-4 font-bold">নাম (ক্রেতা)</th>
                  <th className="py-3 px-4 font-bold text-right">চাল</th>
                  <th className="py-3 px-4 font-bold text-right">ভুষি</th>
                  <th className="py-3 px-4 font-bold text-right">মোট</th>
                  <th className="py-3 px-4 font-bold">নোট</th>
                  {canManage && (
                    <th className="py-3 px-4 font-bold text-right w-24">অ্যাকশন</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono">
                {filteredExpenses.map((exp, idx) => {
                  const combined = exp.rice_amount + exp.bran_amount;
                  return (
                    <tr key={exp.id} className="hover:bg-stone-50 transition-colors font-sans">
                      <td className="py-3 px-3 text-center text-stone-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-medium text-stone-600 whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900 whitespace-nowrap">
                        {exp.person_name || "মেস"}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-stone-900 font-mono text-sm">
                        ৳{exp.rice_amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-amber-700 font-mono text-sm">
                        ৳{exp.bran_amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700 font-mono text-sm">
                        ৳{combined.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-stone-600 max-w-xs truncate">
                        {exp.note || "-"}
                      </td>
                      {canManage && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(exp)}
                              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                              title="সম্পাদনা"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(exp.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-stone-900 text-white font-bold border-t border-stone-800 font-mono">
                <tr>
                  <td colSpan={3} className="py-3 px-4 font-sans text-xs">
                    মোট
                  </td>
                  <td className="py-3 px-4 text-right text-stone-200 font-mono text-sm">
                    ৳{totalFilteredRice.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-amber-300 font-mono text-sm">
                    ৳{totalFilteredBran.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-300 font-mono text-sm">
                    ৳{totalFilteredCombined.toLocaleString()}
                  </td>
                  <td colSpan={canManage ? 2 : 1}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">
                {editingId ? "চাল ও ভুষি খরচ সম্পাদনা" : "নতুন চাল ও ভুষি খরচ লিখুন"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ক্রেতার নাম *
                </label>
                <select
                  required
                  value={formData.person_id}
                  onChange={(e) =>
                    setFormData({ ...formData, person_id: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                >
                  {users
                    .filter((u) => u.role !== "SUPER_ADMIN")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  তারিখ *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    চাল খরচ (৳) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="যেমন: 2000"
                    value={formData.rice_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, rice_amount: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ভুষি খরচ (৳)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="যেমন: 100"
                    value={formData.bran_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, bran_amount: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  নোট / বিবরণ
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ১ বস্তা পাইজাম চাল"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        title="হিসাব মুছে ফেলা"
        message="আপনি কি এই চাল/ভুষি খরচের হিসাবটি মুছে ফেলতে চান?"
        confirmText="হ্যাঁ, মুছে ফেলুন"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
