import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useMess } from "../context/MessContext";
import {
  Calendar,
  Grid,
  CheckSquare,
  Save,
  RotateCcw,
  Check,
  X,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Utensils,
  Lock,
} from "lucide-react";

export const MealSheetView: React.FC = () => {
  const { user } = useAuth();
  const { activeMonth, isMonthClosed, notify, refreshData } = useMess();

  const [mode, setMode] = useState<"grid" | "daily">("daily");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [gridData, setGridData] = useState<any>(null);
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Single cell modal edit
  const [editingCell, setEditingCell] = useState<{
    studentId: string;
    studentName: string;
    date: string;
    morning: boolean;
    lunch: boolean;
    dinner: boolean;
    total: number;
    note?: string;
  } | null>(null);

  const canEdit =
    !isMonthClosed &&
    (user?.role === "SUPER_ADMIN" || user?.role === "MANAGER" || user?.isManager);

  // Initialize date to today or 1st day of month
  useEffect(() => {
    if (activeMonth) {
      const today = new Date().toISOString().split("T")[0];
      const monthPrefix = `${activeMonth.year}-${activeMonth.month < 10 ? "0" + activeMonth.month : activeMonth.month}`;
      if (today.startsWith(monthPrefix)) {
        setSelectedDate(today);
      } else {
        setSelectedDate(`${monthPrefix}-01`);
      }
    }
  }, [activeMonth]);

  // Load grid data
  const loadGridData = async () => {
    if (!activeMonth) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/months/${activeMonth.id}/meals`);
      if (res.ok) {
        const data = await res.json();
        setGridData(data);
      }
    } catch (e) {
      console.error("Failed to load meal grid:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Load daily entries
  const loadDailyEntries = async (date: string) => {
    if (!activeMonth || !date) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/months/${activeMonth.id}/meals/daily?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setDailyEntries(data.list || []);
      }
    } catch (e) {
      console.error("Failed to load daily meals:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "grid") {
      loadGridData();
    } else if (selectedDate) {
      loadDailyEntries(selectedDate);
    }
  }, [mode, activeMonth, selectedDate]);

  // Daily entry helpers
  const handleToggleDailyMeal = (
    index: number,
    period: "morning" | "lunch" | "dinner"
  ) => {
    if (!canEdit) return;
    setDailyEntries((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const currentVal = item[period] ? 1 : 0;
      item[period] = currentVal ? 0 : 1;

      // Recalculate total: morning*0.5 + lunch*1 + dinner*1
      item.total =
        (item.morning ? 0.5 : 0) +
        (item.lunch ? 1.0 : 0) +
        (item.dinner ? 1.0 : 0);
      updated[index] = item;
      return updated;
    });
  };

  const setAllStudentsDailyState = (type: "all_on" | "all_off") => {
    if (!canEdit) return;
    setDailyEntries((prev) =>
      prev.map((item) => {
        const on = type === "all_on";
        return {
          ...item,
          morning: on ? 1 : 0,
          lunch: on ? 1 : 0,
          dinner: on ? 1 : 0,
          total: on ? 2.5 : 0,
        };
      })
    );
  };

  const handleSaveDailyBatch = async () => {
    if (!activeMonth || !selectedDate || !canEdit) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/meals/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
        body: JSON.stringify({
          month_id: activeMonth.id,
          date: selectedDate,
          entries: dailyEntries.map((e) => ({
            student_id: e.student_id,
            morning: Boolean(e.morning),
            lunch: Boolean(e.lunch),
            dinner: Boolean(e.dinner),
            note: e.note || "",
          })),
        }),
      });

      if (res.ok) {
        notify(`${selectedDate} তারিখের সকল ছাত্রের মিল হিসাব সংরক্ষিত হয়েছে!`, "success");
        await refreshData();
      } else {
        const data = await res.json();
        notify(data.error || "সংরক্ষণ ব্যর্থ হয়েছে", "error");
      }
    } catch (e) {
      notify("সার্ভার ত্রুটি", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Single cell modal save
  const handleSaveSingleCell = async () => {
    if (!editingCell || !activeMonth) return;
    try {
      const res = await fetch("/api/meals/single", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
        body: JSON.stringify({
          month_id: activeMonth.id,
          student_id: editingCell.studentId,
          date: editingCell.date,
          morning: editingCell.morning,
          lunch: editingCell.lunch,
          dinner: editingCell.dinner,
          note: editingCell.note,
        }),
      });

      if (res.ok) {
        notify("মিল সফলভাবে পরিবর্তন করা হয়েছে!", "success");
        setEditingCell(null);
        await loadGridData();
        await refreshData();
      } else {
        const err = await res.json();
        notify(err.error || "পরিবর্তন ব্যর্থ হয়েছে", "error");
      }
    } catch (e) {
      notify("সার্ভার সমস্যা", "error");
    }
  };

  const openCellEditor = (student: any, date: string, cell: any) => {
    if (!canEdit) return;
    const morning = cell ? cell.morning === 1 : true;
    const lunch = cell ? cell.lunch === 1 : true;
    const dinner = cell ? cell.dinner === 1 : true;
    const total = (morning ? 0.5 : 0) + (lunch ? 1 : 0) + (dinner ? 1 : 0);

    setEditingCell({
      studentId: student.id,
      studentName: student.name,
      date,
      morning,
      lunch,
      dinner,
      total,
      note: cell?.note || "",
    });
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">
              মিল হিসাব (খাতার ডিজিটাল রূপ)
            </h1>
            {isMonthClosed && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                <Lock className="w-3 h-3" /> বন্ধ
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            রেফারেন্স খাতার মতো পুরো মাসের গ্রিড অথবা প্রতিদিনের সহজ চেকলিস্ট এন্ট্রি।
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-stone-100 rounded-xl border border-stone-200">
            <button
              onClick={() => setMode("daily")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                mode === "daily"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              দৈনিক এন্ট্রি
            </button>
            <button
              onClick={() => setMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                mode === "grid"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              মাসিক শিট (খাতা গ্রিড)
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODE 2: DAILY QUICK ENTRY (ম্যানেজার দ্রুত সবার মিল আপডেট করবে)
          ======================================================== */}
      {mode === "daily" && (
        <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-6 shadow-sm space-y-4">
          {/* Date Selector and Batch Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-stone-700 whitespace-nowrap">
                তারিখ নির্বাচন:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllStudentsDailyState("all_on")}
                  className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition cursor-pointer"
                >
                  সবার সব অন (২.৫)
                </button>
                <button
                  type="button"
                  onClick={() => setAllStudentsDailyState("all_off")}
                  className="px-2.5 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer"
                >
                  সবার সব অফ (০)
                </button>
                <button
                  type="button"
                  onClick={handleSaveDailyBatch}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? "সংরক্ষণ হচ্ছে..." : "সব সংরক্ষণ করুন"}
                </button>
              </div>
            )}
          </div>

          {/* Daily Entry List for all 15 students */}
          {isLoading ? (
            <div className="text-center py-12 text-stone-400 text-sm">লোড হচ্ছে...</div>
          ) : dailyEntries.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">
              কোনো মিলের হিসাব পাওয়া যায়নি।
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dailyEntries.map((item, idx) => {
                const isNormal = item.total === 2.5;
                const isOff = item.total === 0;

                return (
                  <div
                    key={item.student_id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isOff
                        ? "bg-stone-50/80 border-stone-200/80 opacity-75"
                        : isNormal
                        ? "bg-white border-stone-200"
                        : "bg-amber-50/40 border-amber-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-bold text-stone-900">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-stone-500 font-medium">মিল:</span>
                        <span
                          className={`text-sm font-black px-2 py-0.5 rounded-md ${
                            item.total > 0
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-rose-100 text-rose-900"
                          }`}
                        >
                          {item.total}
                        </span>
                      </div>
                    </div>

                    {/* Meal switches: Morning (0.5), Lunch (1), Dinner (1) */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleToggleDailyMeal(idx, "morning")}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          item.morning
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                        }`}
                      >
                        {item.morning ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>সকাল ০.৫</span>
                      </button>

                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleToggleDailyMeal(idx, "lunch")}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          item.lunch
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                        }`}
                      >
                        {item.lunch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>দুপুর ১.০</span>
                      </button>

                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleToggleDailyMeal(idx, "dinner")}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          item.dinner
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                        }`}
                      >
                        {item.dinner ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>রাত ১.০</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {canEdit && dailyEntries.length > 0 && (
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveDailyBatch}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "সংরক্ষণ হচ্ছে..." : "সকল ১৫ জনের হিসাব এক ক্লিকে সংরক্ষণ করুন"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODE 1: MONTHLY GRID (রেফারেন্স ইমেজ ১-এর নিখুঁত ডিজিটাল রূপ)
          ======================================================== */}
      {mode === "grid" && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <div className="text-xs text-stone-600 font-medium">
              💡 কোনো নির্দিষ্ট দিনের ছাত্রের মিল পরিবর্তন করতে যেকোনো ঘরের (cell) উপর ক্লিক করুন।
            </div>
            <div className="text-xs font-bold text-emerald-800">
              মাসের গ্র্যান্ড টোটাল মিল: <span className="font-mono text-sm">{gridData?.grandTotal || 0}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-stone-400 text-sm">গ্রিড হিসাব লোড হচ্ছে...</div>
          ) : !gridData ? (
            <div className="text-center py-16 text-stone-400 text-sm">কোনো মিল তথ্য নেই।</div>
          ) : (
            <div className="overflow-x-auto max-h-[70vh] relative">
              <table className="w-full text-xs text-center border-collapse">
                {/* Table Header: তারিখ | ১৫ জন ছাত্র | দৈনিক মোট */}
                <thead className="sticky top-0 bg-stone-800 text-white z-20">
                  <tr>
                    <th className="py-2.5 px-3 font-bold border-r border-stone-700 whitespace-nowrap sticky left-0 bg-stone-800 z-30">
                      তারিখ
                    </th>
                    {gridData.students.map((st: any) => (
                      <th
                        key={st.id}
                        className="py-2.5 px-2.5 font-bold border-r border-stone-700 whitespace-nowrap min-w-[58px]"
                      >
                        {st.name}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 font-bold bg-stone-900 whitespace-nowrap sticky right-0 z-30">
                      দৈনিক মোট
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {gridData.dates.map((dateStr: string) => {
                    const dayNum = parseInt(dateStr.split("-")[2], 10);
                    const dayTotal = gridData.dateTotals[dateStr] || 0;
                    const isToday =
                      new Date().toISOString().split("T")[0] === dateStr;

                    return (
                      <tr
                        key={dateStr}
                        className={`border-b border-stone-100 hover:bg-emerald-50/40 transition-colors ${
                          isToday ? "bg-amber-50/50 font-bold" : ""
                        }`}
                      >
                        {/* Date Column */}
                        <td className="py-2 px-2.5 font-semibold text-stone-700 border-r border-stone-200 whitespace-nowrap sticky left-0 bg-stone-50 z-10">
                          {dayNum} {isToday && <span className="text-[10px] text-amber-600 font-bold">(আজ)</span>}
                        </td>

                        {/* Student meal values */}
                        {gridData.students.map((st: any) => {
                          const cell = gridData.matrix[dateStr]?.[st.id];
                          const total = cell !== undefined ? cell.total : "-";
                          const isOff = total === 0;

                          return (
                            <td
                              key={st.id}
                              onClick={() => openCellEditor(st, dateStr, cell)}
                              className={`py-1.5 px-2 border-r border-stone-100 font-mono transition cursor-pointer ${
                                canEdit ? "hover:bg-emerald-100 hover:font-bold" : ""
                              } ${
                                isOff
                                  ? "bg-rose-50 text-rose-700 font-semibold"
                                  : total === 2.5
                                  ? "text-stone-800"
                                  : total > 0
                                  ? "bg-amber-50 text-amber-800 font-semibold"
                                  : "text-stone-300"
                              }`}
                              title={canEdit ? "ক্লিক করে পরিবর্তন করুন" : ""}
                            >
                              {total}
                            </td>
                          );
                        })}

                        {/* Row Daily Total */}
                        <td className="py-2 px-2.5 font-bold font-mono text-stone-900 bg-stone-100/70 border-l border-stone-200 whitespace-nowrap sticky right-0 z-10">
                          {dayTotal > 0 ? dayTotal : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Table Footer: সর্বমোট (Monthly Totals for every student & grand total) */}
                <tfoot className="sticky bottom-0 bg-stone-900 text-white font-bold z-20">
                  <tr>
                    <td className="py-3 px-3 border-r border-stone-700 whitespace-nowrap sticky left-0 bg-stone-900 z-30">
                      সর্বমোট
                    </td>
                    {gridData.students.map((st: any) => (
                      <td
                        key={st.id}
                        className="py-3 px-2 border-r border-stone-700 font-mono text-emerald-300 text-sm"
                      >
                        {gridData.studentTotals[st.id] || 0}
                      </td>
                    ))}
                    <td className="py-3 px-3 font-mono text-emerald-300 text-sm bg-black whitespace-nowrap sticky right-0 z-30">
                      {gridData.grandTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Single Cell Edit Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {editingCell.studentName}-এর মিল
                </h3>
                <p className="text-xs text-stone-500">{editingCell.date}</p>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-xs font-semibold text-stone-700">সকালের মিল (০.৫)</span>
                <input
                  type="checkbox"
                  checked={editingCell.morning}
                  onChange={(e) => {
                    const m = e.target.checked;
                    setEditingCell({
                      ...editingCell,
                      morning: m,
                      total: (m ? 0.5 : 0) + (editingCell.lunch ? 1 : 0) + (editingCell.dinner ? 1 : 0),
                    });
                  }}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-xs font-semibold text-stone-700">দুপুরের মিল (১.০)</span>
                <input
                  type="checkbox"
                  checked={editingCell.lunch}
                  onChange={(e) => {
                    const l = e.target.checked;
                    setEditingCell({
                      ...editingCell,
                      lunch: l,
                      total: (editingCell.morning ? 0.5 : 0) + (l ? 1 : 0) + (editingCell.dinner ? 1 : 0),
                    });
                  }}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-xs font-semibold text-stone-700">রাতের মিল (১.০)</span>
                <input
                  type="checkbox"
                  checked={editingCell.dinner}
                  onChange={(e) => {
                    const d = e.target.checked;
                    setEditingCell({
                      ...editingCell,
                      dinner: d,
                      total: (editingCell.morning ? 0.5 : 0) + (editingCell.lunch ? 1 : 0) + (d ? 1 : 0),
                    });
                  }}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 text-emerald-950 font-bold text-sm">
                <span>হিসাবকৃত মোট মিল:</span>
                <span className="text-base font-mono">{editingCell.total}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-3 py-1.5 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveSingleCell}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
              >
                আপডেট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
