import React, { useState } from "react";
import { useMess } from "../context/MessContext";
import {
  FileSpreadsheet,
  Printer,
  Download,
  Search,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Info,
} from "lucide-react";

export const MonthlyAccountView: React.FC = () => {
  const { summary, activeMonth, isLoadingSummary } = useMess();
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoadingSummary || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-stone-400">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">মাসিক হিসাব তৈরি হচ্ছে...</p>
      </div>
    );
  }

  // Filter students by search
  const filteredStudents = summary.students.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery)
  );

  // Column totals
  const totalActualMeals = summary.totalActualMeals;
  const totalCurryCost = summary.students.reduce((acc, s) => acc + s.curryCost, 0);
  const totalRiceCost = summary.students.reduce((acc, s) => acc + s.riceCost, 0);
  const totalExtraCost = summary.students.reduce((acc, s) => acc + s.extraCost, 0);
  const totalDeposits = summary.totalDeposits;
  const totalExpense = summary.students.reduce((acc, s) => acc + s.totalExpense, 0);
  const totalNetBalance = totalDeposits - totalExpense;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ["ক্রমিক", "নাম", "ফোন", "মিল", "তরকারি খরচ (৫৬ মিল)", "চাল খরচ", "অতিরিক্ত", "জমা", "মোট খরচ", "ব্যালেন্স", "স্ট্যাটাস"];
    const rows = summary.students.map((s, idx) => [
      idx + 1,
      s.studentName,
      s.phone,
      s.actualMeals,
      s.curryCost.toFixed(2),
      s.riceCost.toFixed(2),
      s.extraCost.toFixed(2),
      s.totalDeposit.toFixed(2),
      s.totalExpense.toFixed(2),
      s.balance.toFixed(2),
      s.balanceStatus === "SURPLUS" ? "জমা" : "বাকি",
    ]);

    // Footer
    rows.push([
      "সর্বমোট",
      "-",
      "-",
      totalActualMeals,
      totalCurryCost.toFixed(2),
      totalRiceCost.toFixed(2),
      totalExtraCost.toFixed(2),
      totalDeposits.toFixed(2),
      totalExpense.toFixed(2),
      totalNetBalance.toFixed(2),
      totalNetBalance >= 0 ? "জমা" : "ঘাটতি",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Adarsha_Mess_${summary.monthName}_Account.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">
              মাসিক হিসাব — {summary.monthName}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              রেফারেন্স খাতা ফরম্যাট
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            রেফারেন্স ইমেজ ২-এর ডিজিটাল সংস্করণ। প্রতিটি ছাত্রের মিল, তরকারি (স্থায়ী ৫৬), চাল, অতিরিক্ত খরচ, জমা ও নিট ব্যালেন্স।
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="ছাত্র খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl w-36 sm:w-44 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer"
            title="CSV এক্সপোর্ট"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-stone-800 hover:bg-stone-900 rounded-xl transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            প্রিন্ট
          </button>
        </div>
      </div>

      {/* Financial Rates Pill */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-900 text-white p-4 rounded-2xl shadow-sm text-xs">
        <div>
          <span className="text-stone-400 block text-[11px]">তরকারি রেট (স্থায়ী ৫৬ মিল)</span>
          <span className="text-base font-bold text-emerald-300 font-mono">৳{summary.curryRate.toFixed(2)}</span>
          <span className="text-[10px] text-stone-400 block mt-0.5">মোট খরচ ৳{summary.totalCurryExpense}</span>
        </div>
        <div>
          <span className="text-stone-400 block text-[11px]">চাল রেট (খাওয়া মিল)</span>
          <span className="text-base font-bold text-emerald-300 font-mono">৳{summary.riceRate.toFixed(2)}</span>
          <span className="text-[10px] text-stone-400 block mt-0.5">মোট খরচ ৳{summary.totalRiceExpense}</span>
        </div>
        <div>
          <span className="text-stone-400 block text-[11px]">অতিরিক্ত খরচ (মাথাপিছু)</span>
          <span className="text-base font-bold text-amber-300 font-mono">৳{summary.studentExtraCost.toFixed(0)}</span>
          <span className="text-[10px] text-stone-400 block mt-0.5">মোট খরচ ৳{summary.totalExtraExpense}</span>
        </div>
        <div>
          <span className="text-stone-400 block text-[11px]">মেস ব্যালেন্স (উদ্বৃত্ত/ঘাটতি)</span>
          <span
            className={`text-base font-black font-mono ${
              totalNetBalance >= 0 ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            ৳{Math.abs(totalNetBalance).toFixed(0)} {totalNetBalance >= 0 ? "জমা" : "ঘাটতি"}
          </span>
          <span className="text-[10px] text-stone-400 block mt-0.5">
            জমা ৳{totalDeposits} - খরচ ৳{totalExpense.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Accounting Table (Reference Image 2 Digital Mirror) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            {/* Table Header */}
            <thead className="bg-stone-100/90 text-stone-700 border-b border-stone-200">
              <tr>
                <th className="py-3 px-3 font-bold text-center w-10">#</th>
                <th className="py-3 px-4 font-bold">নাম</th>
                <th className="py-3 px-3 font-bold text-right" title="প্রকৃত খাওয়া মিল (চাল রেটের জন্য ব্যবহৃত)">
                  মিল
                </th>
                <th className="py-3 px-3 font-bold text-right" title="স্থায়ী ৫৬ মিল × তরকারি রেট">
                  তরকারি (৫৬)
                </th>
                <th className="py-3 px-3 font-bold text-right" title="খাওয়া মিল × চাল রেট">
                  চাল
                </th>
                <th className="py-3 px-3 font-bold text-right" title="মোট অতিরিক্ত খরচ ÷ সক্রিয় ছাত্র">
                  অতিরিক্ত
                </th>
                <th className="py-3 px-3 font-bold text-right text-emerald-800">
                  জমা
                </th>
                <th className="py-3 px-3 font-bold text-right text-stone-900">
                  মোট খরচ
                </th>
                <th className="py-3 px-4 font-bold text-right">
                  ব্যালেন্স
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-stone-100 font-mono">
              {filteredStudents.map((s, idx) => {
                const isSurplus = s.balanceStatus === "SURPLUS";
                const isDue = s.balanceStatus === "DUE";

                return (
                  <tr
                    key={s.studentId}
                    className="hover:bg-stone-50 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center text-stone-400 font-sans font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-bold text-stone-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{s.studentName}</span>
                        {s.isManager && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-sans font-semibold">
                            ম্যানেজার
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-stone-800 font-bold">
                      {s.actualMeals}
                    </td>
                    <td className="py-2.5 px-3 text-right text-stone-700">
                      ৳{s.curryCost.toFixed(0)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-stone-700">
                      ৳{s.riceCost.toFixed(0)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-stone-700">
                      ৳{s.extraCost.toFixed(0)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      ৳{s.totalDeposit.toFixed(0)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-stone-900">
                      ৳{s.totalExpense.toFixed(0)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap font-sans">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-lg text-xs font-black font-mono ${
                          isSurplus
                            ? "bg-emerald-100 text-emerald-900"
                            : isDue
                            ? "bg-rose-100 text-rose-900"
                            : "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {s.balanceFormatted}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer: সর্বমোট */}
            <tfoot className="bg-stone-900 text-white font-bold border-t-2 border-stone-900 font-mono">
              <tr>
                <td colSpan={2} className="py-3 px-4 font-sans text-sm tracking-wide">
                  সর্বমোট
                </td>
                <td className="py-3 px-3 text-right text-emerald-300 text-sm">
                  {totalActualMeals}
                </td>
                <td className="py-3 px-3 text-right text-stone-200">
                  ৳{totalCurryCost.toFixed(0)}
                </td>
                <td className="py-3 px-3 text-right text-stone-200">
                  ৳{totalRiceCost.toFixed(0)}
                </td>
                <td className="py-3 px-3 text-right text-stone-200">
                  ৳{totalExtraCost.toFixed(0)}
                </td>
                <td className="py-3 px-3 text-right text-emerald-400 text-sm">
                  ৳{totalDeposits.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right text-stone-100 text-sm">
                  ৳{totalExpense.toFixed(0)}
                </td>
                <td className="py-3 px-4 text-right text-sm">
                  <span
                    className={`font-black font-mono ${
                      totalNetBalance >= 0 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    ৳{Math.abs(totalNetBalance).toFixed(0)} {totalNetBalance >= 0 ? "জমা" : "বাকি"}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Bottom Math Explanation Box */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-stone-600">
        <Info className="w-5 h-5 text-stone-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-stone-800">হিসাবের সূত্রাবলি (স্বয়ংক্রিয় ক্যালকুলেশন):</div>
          <div>• <span className="font-semibold text-stone-700">তরকারি খরচ</span> = ৫৬ (স্থায়ী মিল) × তরকারি রেট (৳{summary.curryRate.toFixed(2)}) = ৳{(56 * summary.curryRate).toFixed(0)}</div>
          <div>• <span className="font-semibold text-stone-700">চাল খরচ</span> = ছাত্রের খাওয়া মিল × চাল রেট (৳{summary.riceRate.toFixed(2)})</div>
          <div>• <span className="font-semibold text-stone-700">অতিরিক্ত খরচ</span> = মেসের মোট অতিরিক্ত খরচ ÷ {summary.activeStudentCount} = ৳{summary.studentExtraCost.toFixed(0)}</div>
          <div>• <span className="font-semibold text-stone-700">ব্যালেন্স</span> = ছাত্রের জমা − (তরকারি খরচ + চাল খরচ + অতিরিক্ত খরচ)</div>
        </div>
      </div>
    </div>
  );
};
