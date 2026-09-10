import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useMess } from "../context/MessContext";
import { Deposit } from "../types";
import { ConfirmationModal } from "./ConfirmationModal";
import {
  Wallet,
  Plus,
  Search,
  Calendar,
  Edit2,
  Trash2,
  Lock,
  ArrowDownLeft,
  X,
  Save,
} from "lucide-react";

export const DepositsView: React.FC = () => {
  const { user } = useAuth();
  const { activeMonth, isMonthClosed, users, notify, refreshData } = useMess();

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentFilter, setSelectedStudentFilter] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    student_id: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    note: "মাসিক জমা",
  });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const canManage =
    !isMonthClosed &&
    (user?.role === "SUPER_ADMIN" || user?.role === "MANAGER" || user?.isManager);

  const loadDeposits = async () => {
    if (!activeMonth) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/months/${activeMonth.id}/deposits`);
      if (res.ok) {
        const data = await res.json();
        setDeposits(data);
      }
    } catch (e) {
      console.error("Failed to load deposits:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeposits();
  }, [activeMonth]);

  const handleOpenAdd = () => {
    const firstStudent = users.find((u) => u.role !== "SUPER_ADMIN");
    setEditingId(null);
    setFormData({
      student_id: firstStudent?.id || "",
      date: new Date().toISOString().split("T")[0],
      amount: "",
      note: "মাসিক জমা",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (dep: Deposit) => {
    setEditingId(dep.id);
    setFormData({
      student_id: dep.student_id,
      date: dep.date,
      amount: dep.amount.toString(),
      note: dep.note,
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMonth) return;

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      notify("জমার পরিমাণ সঠিক দিন (০ এর বেশি হতে হবে)।", "error");
      return;
    }

    try {
      const url = editingId ? `/api/deposits/${editingId}` : "/api/deposits";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
        body: JSON.stringify({
          month_id: activeMonth.id,
          student_id: formData.student_id,
          date: formData.date,
          amount: numAmount,
          note: formData.note,
        }),
      });

      if (res.ok) {
        notify(
          editingId ? "জমা সফলভাবে পরিবর্তন করা হয়েছে!" : "জমা সফলভাবে যোগ করা হয়েছে!",
          "success"
        );
        setIsFormOpen(false);
        await loadDeposits();
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
      const res = await fetch(`/api/deposits/${deleteTargetId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
      });
      if (res.ok) {
        notify("জমার রেকর্ড সফলভাবে মুছে ফেলা হয়েছে।", "success");
        setDeleteTargetId(null);
        await loadDeposits();
        await refreshData();
      } else {
        const err = await res.json();
        notify(err.error || "মুছে ফেলা যায়নি", "error");
      }
    } catch (e) {
      notify("সার্ভার সমস্যা", "error");
    }
  };

  const filteredDeposits = deposits.filter((d) => {
    const matchesSearch =
      (d.student_name && d.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.note && d.note.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStudent = selectedStudentFilter
      ? d.student_id === selectedStudentFilter
      : true;
    return matchesSearch && matchesStudent;
  });

  const totalFilteredAmount = filteredDeposits.reduce((acc, d) => acc + d.amount, 0);

  return (
    <div className="space-y-5 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">
              জমা খাতা
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              মোট ৳{totalFilteredAmount.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            ছাত্রদের কাছ থেকে সংগৃহীত অগ্রিম বা মাসিক জমার তালিকা।
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            নতুন জমা লিখুন
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="নাম অথবা বিবরণ দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStudentFilter}
            onChange={(e) => setSelectedStudentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-hidden cursor-pointer"
          >
            <option value="">সকল ছাত্র</option>
            {users
              .filter((u) => u.role !== "SUPER_ADMIN")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Deposit Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-stone-400 text-sm">লোড হচ্ছে...</div>
        ) : filteredDeposits.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm">
            কোনো জমার তথ্য নেই।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-stone-100/90 text-stone-700 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-3 font-bold text-center w-12">#</th>
                  <th className="py-3 px-4 font-bold">তারিখ</th>
                  <th className="py-3 px-4 font-bold">নাম</th>
                  <th className="py-3 px-4 font-bold text-right">জমা</th>
                  <th className="py-3 px-4 font-bold">নোট</th>
                  {canManage && (
                    <th className="py-3 px-4 font-bold text-right w-24">অ্যাকশন</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredDeposits.map((d, idx) => (
                  <tr key={d.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-3 text-center text-stone-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-600 whitespace-nowrap">
                      {d.date}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900 whitespace-nowrap">
                      {d.student_name}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700 font-mono text-sm">
                      ৳{d.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-stone-600 max-w-xs truncate">
                      {d.note || "-"}
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(d)}
                            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                            title="সম্পাদনা"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(d.id)}
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
              <tfoot className="bg-stone-900 text-white font-bold border-t border-stone-800">
                <tr>
                  <td colSpan={3} className="py-3 px-4 font-sans text-xs">
                    মোট জমা
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
                {editingId ? "জমা সম্পাদনা করুন" : "নতুন জমা যোগ করুন"}
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
                  ছাত্র নির্বাচন করুন *
                </label>
                <select
                  required
                  value={formData.student_id}
                  onChange={(e) =>
                    setFormData({ ...formData, student_id: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                >
                  {users
                    .filter((u) => u.role !== "SUPER_ADMIN")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.phone})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  জমার তারিখ *
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
                  placeholder="যেমন: 2500"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  নোট / বিবরণ
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মাসিক জমা, বিকাশে পাঠানো ইত্যাদি"
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
        message="আপনি কি এই জমার হিসাবটি মুছে ফেলতে চান? এটি মুছে ফেললে ছাত্রের ব্যালেন্সে পরিবর্তন আসবে।"
        confirmText="হ্যাঁ, মুছে ফেলুন"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
