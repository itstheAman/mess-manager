import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMess } from "../context/MessContext";
import { MessMonth } from "../types";
import { ConfirmationModal } from "./ConfirmationModal";
import {
  Calendar,
  Plus,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ShieldAlert,
  X,
  Save,
} from "lucide-react";

export const MonthManagementView: React.FC = () => {
  const { user } = useAuth();
  const { months, activeMonth, setActiveMonthId, refreshData, notify } = useMess();

  const [isAddMonthOpen, setIsAddMonthOpen] = useState(false);
  const [newMonthForm, setNewMonthForm] = useState({
    name: "অক্টোবর ২০২৬",
    year: 2026,
    month: 10,
    carry_balances: true,
  });

  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: async () => {},
  });

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const handleToggleMonthStatus = (m: MessMonth) => {
    if (!isSuperAdmin) return;
    const isCurrentlyClosed = m.status === "CLOSED";
    const nextStatus = isCurrentlyClosed ? "OPEN" : "CLOSED";

    setConfirmData({
      isOpen: true,
      title: isCurrentlyClosed ? "মাসের হিসাব পুনরায় চালু (OPEN)" : "মাসের হিসাব বন্ধ (CLOSE)",
      message: isCurrentlyClosed
        ? `আপনি কি '${m.name}' মাসের হিসাব পুনরায় চালু করতে চান? তখন পুনরায় মিল ও খরচ পরিবর্তন করা যাবে।`
        : `আপনি কি '${m.name}' মাসের হিসাব চূড়ান্তভাবে বন্ধ (CLOSE) করতে চান? বন্ধ করার পর সাধারণ ম্যানেজার বা ছাত্ররা কোনো ডাটা পরিবর্তন করতে পারবে না।`,
      action: async () => {
        try {
          const res = await fetch(`/api/months/${m.id}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
            },
            body: JSON.stringify({ status: nextStatus }),
          });

          if (res.ok) {
            notify(`'${m.name}' মাসের অবস্থা পরিবর্তন সম্পন্ন!`, "success");
            await refreshData();
          } else {
            notify("অবস্থা পরিবর্তন ব্যর্থ হয়েছে", "error");
          }
        } catch (e) {
          notify("সার্ভার ত্রুটি", "error");
        }
      },
    });
  };

  const handleCreateMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    try {
      const res = await fetch("/api/months", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
        body: JSON.stringify(newMonthForm),
      });

      if (res.ok) {
        const created = await res.json();
        notify(`'${newMonthForm.name}' সফলভাবে চালু করা হয়েছে!`, "success");
        setIsAddMonthOpen(false);
        await refreshData();
        if (created.id) setActiveMonthId(created.id);
      } else {
        const err = await res.json();
        notify(err.error || "মাস তৈরিতে সমস্যা হয়েছে", "error");
      }
    } catch (e) {
      notify("সার্ভার সমস্যা", "error");
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">
              মাস ব্যবস্থাপনা (Month Control)
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              এডমিন সুবিধা
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            নতুন মাসের খাতা খোলা, বিগত মাসের ব্যালেন্স টানার নিয়ম এবং হিসাব বন্ধ (CLOSE/OPEN) করা।
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setIsAddMonthOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            নতুন মাস খুলুন
          </button>
        )}
      </div>

      {/* Month List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {months.map((m) => {
          const isSelected = activeMonth?.id === m.id;
          const isClosed = m.status === "CLOSED";

          return (
            <div
              key={m.id}
              className={`p-5 rounded-3xl border transition-all ${
                isSelected
                  ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                  : "bg-white border-stone-200 shadow-xs hover:border-stone-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm ${
                      isClosed
                        ? "bg-stone-100 text-stone-600"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900">{m.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          isClosed
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-emerald-900"
                        }`}
                      >
                        {isClosed ? (
                          <>
                            <Lock className="w-3 h-3 text-amber-700" /> হিসাব বন্ধ
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3 text-emerald-700" /> চলমান (এন্ট্রি চালু)
                          </>
                        )}
                      </span>
                      <span className="text-xs text-stone-400 font-mono">
                        {m.year}-{m.month < 10 ? "0" + m.month : m.month}
                      </span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-[11px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-lg">
                    সক্রিয় নির্বাচন
                  </span>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => setActiveMonthId(m.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                >
                  {isSelected ? "এই মাসটি দেখা হচ্ছে" : "এই মাসে যান"}
                </button>

                {isSuperAdmin && (
                  <button
                    onClick={() => handleToggleMonthStatus(m)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      isClosed
                        ? "text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                        : "text-amber-800 hover:bg-amber-50 border border-amber-200"
                    }`}
                  >
                    {isClosed ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" /> পুনরায় চালু করুন
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" /> হিসাব বন্ধ (Close) করুন
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Month Modal */}
      {isAddMonthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">নতুন মাস চালু করুন</h3>
              <button
                onClick={() => setIsAddMonthOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMonth} className="py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  মাসের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: অক্টোবর ২০২৬"
                  value={newMonthForm.name}
                  onChange={(e) =>
                    setNewMonthForm({ ...newMonthForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    বছর *
                  </label>
                  <input
                    type="number"
                    required
                    value={newMonthForm.year}
                    onChange={(e) =>
                      setNewMonthForm({
                        ...newMonthForm,
                        year: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    মাস নম্বর (১-১২) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={newMonthForm.month}
                    onChange={(e) =>
                      setNewMonthForm({
                        ...newMonthForm,
                        month: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                <input
                  type="checkbox"
                  id="carry_bal"
                  checked={newMonthForm.carry_balances}
                  onChange={(e) =>
                    setNewMonthForm({
                      ...newMonthForm,
                      carry_balances: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
                <label htmlFor="carry_bal" className="text-xs text-purple-950 font-medium cursor-pointer">
                  বিগত মাসের উদ্বৃত্ত ও বকেয়া ব্যালেন্স স্বয়ংক্রিয়ভাবে এই মাসে টানুন (Carry forward)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddMonthOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  নতুন মাস তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmData.isOpen}
        title={confirmData.title}
        message={confirmData.message}
        onConfirm={async () => {
          await confirmData.action();
          setConfirmData((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmData((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
