import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useMess } from "../context/MessContext";
import { ExtraExpense } from "../types";
import { ConfirmationModal } from "./ConfirmationModal";
import {
  PlusCircle,
  Plus,
  Search,
  Calendar,
  Edit2,
  Trash2,
  Lock,
  X,
  Save,
  Users,
  Info,
} from "lucide-react";

export const ExtraExpenseView: React.FC = () => {
  const { user } = useAuth();
  const { activeMonth, isMonthClosed, users, notify, refreshData, summary } = useMess();

  const [expenses, setExpenses] = useState<ExtraExpense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    person_id: "",
    date: new Date().toISOString().split("T")[0],
    title: "",
    amount: "",
    note: "",
  });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const canManage =
    !isMonthClosed &&
    (user?.role === "SUPER_ADMIN" || user?.role === "MANAGER" || user?.isManager);

  const loadExpenses = async () => {
    if (!activeMonth) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/months/${activeMonth.id}/extra-expenses`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (e) {
      console.error("Failed to load extra expenses:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [activeMonth]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      person_id: user?.id || "",
      date: new Date().toISOString().split("T")[0],
      title: "",
      amount: "",
      note: "",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (exp: ExtraExpense) => {
    setEditingId(exp.id);
    setFormData({
      person_id: exp.person_id || "",
      date: exp.date,
      title: exp.title,
      amount: exp.amount.toString(),
      note: exp.note || "",
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMonth) return;

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      notify("টাকার পরিমাণ ০ এর বেশি হতে হবে।", "error");
      return;
    }

    try {
      const url = editingId ? `/api/extra-expenses/${editingId}` : "/api/extra-expenses";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
        body: JSON.stringify({
          month_id: activeMonth.id,
          person_id: formData.person_id || null,
          date: formData.date,
          title: formData.title,
          amount: numAmount,
          note: formData.note,
        }),
      });

      if (res.ok) {
        notify(
          editingId ? "অতিরিক্ত খরচ সফলভাবে আপডেট হয়েছে!" : "অতিরিক্ত খরচ যোগ হয়েছে!",
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
      notify("সার্ভার সমস্যা", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await fetch(`/api/extra-expenses/${deleteTargetId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
      });
      if (res.ok) {
        notify("অতিরিক্ত খরচ সফলভাবে মুছে ফেলা হয়েছে।", "success");
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
      (e.title && e.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.person_name && e.person_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.note && e.note.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const totalFilteredAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const perStudentShare = summary ? summary.studentExtraCost : 0;

  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">
              অতিরিক্ত খরচ (মাথাপিছু সমান বণ্টন)
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              মোট ৳{totalFilteredAmount.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            পেপার বিল, ময়লা বিল, বাবুর্চি টিপস বা অন্যান্য সাধারণ মেস খরচ যা সবার মধ্যে সমানভাবে ভাগ হয়।
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            + অতিরিক্ত খরচ লিখুন
          </button>
        )}
      </div>

      {/* Overview Stat Card */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-amber-900 font-bold block">
              ছাত্র প্রতি বর্তমান অতিরিক্ত খরচ
            </span>
            <div className="text-2xl font-black text-amber-950 font-mono">
              ৳{perStudentShare.toFixed(0)} <span className="text-xs font-normal text-amber-800">/ জন</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-amber-900/80 max-w-sm text-left sm:text-right">
          হিসাব: মোট অতিরিক্ত খরচ (৳{totalFilteredAmount.toLocaleString()}) ÷ মোট ছাত্র ({summary?.activeStudentCount || 15} জন)
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="বিবরণ অথবা প্রদানকারীর নাম দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Table: তারিখ | নাম (বা মেস) | বিবরণ | টাকা | অ্যাকশন */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-stone-400 text-sm">লোড হচ্ছে...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm">
            কোনো অতিরিক্ত খরচের তথ্য নেই।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-stone-100/90 text-stone-700 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-3 font-bold text-center w-12">#</th>
                  <th className="py-3 px-4 font-bold">তারিখ</th>
                  <th className="py-3 px-4 font-bold">নাম (প্রদানকারী)</th>
                  <th className="py-3 px-4 font-bold">বিবরণ / খাত</th>
                  <th className="py-3 px-4 font-bold text-right">টাকা</th>
                  <th className="py-3 px-4 font-bold">নোট</th>
                  {canManage && (
                    <th className="py-3 px-4 font-bold text-right w-24">অ্যাকশন</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {filteredExpenses.map((exp, idx) => (
                  <tr key={exp.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-3 text-center text-stone-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-600 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900 whitespace-nowrap">
                      {exp.person_name || "মেস সাধারণ তহবিল"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-800">
                      {exp.title}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-stone-900 font-mono text-sm">
                      ৳{exp.amount.toLocaleString()}
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
                ))}
              </tbody>
              <tfoot className="bg-stone-900 text-white font-bold border-t border-stone-800 font-mono">
                <tr>
                  <td colSpan={4} className="py-3 px-4 font-sans text-xs">
                    মোট অতিরিক্ত খরচ
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-300 font-mono text-sm">
                    ৳{totalFilteredAmount.toLocaleString()}
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
                {editingId ? "অতিরিক্ত খরচ সম্পাদনা" : "নতুন অতিরিক্ত খরচ লিখুন"}
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
                  খরচের বিবরণ / খাত *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: পেপার বিল, ময়লা বিল, ওয়াইফাই ইত্যাদি"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  প্রদানকারীর নাম (কে পরিশোধ করেছে)
                </label>
                <select
                  value={formData.person_id}
                  onChange={(e) =>
                    setFormData({ ...formData, person_id: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">মেস সাধারণ তহবিল</option>
                  {users
                    .filter((u) => u.role !== "SUPER_ADMIN")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    টাকার পরিমাণ (৳) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="যেমন: 450"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  নোট
                </label>
                <input
                  type="text"
                  placeholder="অতিরিক্ত কোনো তথ্য"
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
        message="আপনি কি এই অতিরিক্ত খরচের হিসাবটি মুছে ফেলতে চান?"
        confirmText="হ্যাঁ, মুছে ফেলুন"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
