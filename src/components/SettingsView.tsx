import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useMess } from "../context/MessContext";
import {
  Settings,
  Shield,
  Save,
  Sliders,
  CheckCircle,
  HelpCircle,
  Trash2,
  AlertTriangle,
  Building2,
  Copy,
  Check,
  Share2,
  Users,
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const { user, mess, updateMessNameInState } = useAuth();
  const { settings, refreshSettings, refreshData, notify, users } = useMess();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [fixedMeals, setFixedMeals] = useState<number>(56);
  const [includeBran, setIncludeBran] = useState<boolean>(false);
  const [messName, setMessName] = useState<string>(mess?.name || "আদর্শ মেস");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  useEffect(() => {
    if (mess?.name) {
      setMessName(mess.name);
    }
    if (settings.default_fixed_curry_meals) {
      setFixedMeals(parseFloat(settings.default_fixed_curry_meals));
    }
    if (settings.include_bran_default !== undefined) {
      setIncludeBran(settings.include_bran_default === "1");
    }
  }, [settings, mess]);

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
        body: JSON.stringify({
          mess_name: messName.trim(),
          default_fixed_curry_meals: fixedMeals,
          include_bran_default: includeBran ? "1" : "0",
        }),
      });

      if (res.ok) {
        updateMessNameInState(messName.trim());
        await refreshSettings();
        await refreshData();
        notify("মেস সেটিংস সফলভাবে সংরক্ষিত হয়েছে!", "success");
      } else {
        const err = await res.json();
        notify(err.error || "সেটিংস সংরক্ষণে ব্যর্থতা", "error");
      }
    } catch (e) {
      notify("সার্ভার ত্রুটি", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const copyRoomCode = () => {
    if (mess?.code) {
      navigator.clipboard.writeText(mess.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareOnWhatsApp = () => {
    if (!mess) return;
    const text = `আমাদের মেস হিসাব খাতায় যোগ দিন!\n🏢 মেসের নাম: ${mess.name}\n🔑 ৬ ডিজিটের রুম কোড: ${mess.code}\nওয়েবসাইটে গিয়ে "মেসে যোগ দিন" অপশনে এই কোড দিন।`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleClearTransactions = async () => {
    if (
      !window.confirm(
        "সতর্কতা! আপনি কি নিশ্চিত যে বর্তমান মেসের সকল মিল শিট, বাজার খরচ, চাল ও জমার তথ্য মুছে ফেলতে চান? মেসের সদস্য তালিকা ও রুম কোড অপরিবর্তিত থাকবে।"
      )
    ) {
      return;
    }

    setIsClearingData(true);
    try {
      const res = await fetch("/api/settings/clear-transactions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
      });

      if (res.ok) {
        notify("এই মেসের সকল হিসাব ও লেনদেন মুছে ফেলা হয়েছে।", "success");
        await refreshData();
      } else {
        const err = await res.json();
        notify(err.error || "ডাটা মুছতে সমস্যা হয়েছে", "error");
      }
    } catch (e) {
      notify("সার্ভার সংযোগে ত্রুটি", "error");
    } finally {
      setIsClearingData(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-700" />
            মেস ও সিস্টেম সেটিংস
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মেসের নাম, ইনভাইটেশন রুম কোড এবং মিল হিসাবের বৈজ্ঞানিক পরামিতি
          </p>
        </div>
      </div>

      {/* Room Code & Invitation Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
                বর্তমান মেস
              </div>
              <h2 className="text-xl font-bold font-serif text-stone-900">{mess?.name}</h2>
              <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                <span>মোট সদস্য: {users.length} জন</span>
                <span>•</span>
                <span className="text-emerald-700 font-medium">
                  {isSuperAdmin ? "👑 আপনি সুপার এডমিন" : "সদস্য"}
                </span>
              </div>
            </div>
          </div>

          {/* 6-Digit Room Code Box */}
          <div className="bg-stone-50 border-2 border-dashed border-emerald-300 rounded-xl px-5 py-3 text-center sm:text-right">
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
              ৬ ডিজিটের রুম ইনভাইটেশন কোড
            </span>
            <div className="text-3xl font-mono font-black text-emerald-700 tracking-widest my-1 select-all">
              {mess?.code}
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={copyRoomCode}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold rounded-lg border border-stone-300 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "কপি হয়েছে!" : "কপি"}</span>
              </button>
              <button
                type="button"
                onClick={shareOnWhatsApp}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-stone-500 bg-stone-50 p-3 rounded-xl">
          💡 নতুন রুমমেট যোগ দিতে চাইলে তাকে এই ৬ ডিজিটের কোড দিন। সে ওয়েবঅ্যাপে ঢুকে <strong>"২. মেসে যোগ দিন"</strong> অপশনে নাম, নম্বর ও কোড দিলেই মেসে যুক্ত হতে পারবে। কোনো পাসওয়ার্ড প্রয়োজন নেই।
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSystemSettings} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-700" />
            মেসের মৌলিক কনফিগারেশন
          </h3>
          {isSuperAdmin ? (
            <span className="text-xs bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
              👑 সুপার এডমিন নিয়ন্ত্রণ
            </span>
          ) : (
            <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
              শুধুমাত্র দেখার অনুমতি
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              মেসের নাম
            </label>
            <input
              type="text"
              value={messName}
              onChange={(e) => setMessName(e.target.value)}
              disabled={!isSuperAdmin}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-75"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              এই নামটি মেসের ড্যাশবোর্ড ও প্রতিবেদনে প্রদর্শিত হবে।
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              ছাত্র প্রতি নির্ধারিত তরকারি মিল (Fixed Curry Meals)
            </label>
            <input
              type="number"
              step="0.5"
              value={fixedMeals}
              onChange={(e) => setFixedMeals(parseFloat(e.target.value) || 0)}
              disabled={!isSuperAdmin}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-mono font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-75"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              আদর্শ মেসে প্রতি ছাত্রের তরকারির খরচ এই ফিক্সড মিল (ডিফল্ট ৫৬ মিল) অনুযায়ী ভাগ হয়।
            </p>
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeBran}
              onChange={(e) => setIncludeBran(e.target.checked)}
              disabled={!isSuperAdmin}
              className="mt-1 w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="text-sm font-semibold text-stone-800">
                চালের খরচে ভুষির টাকা অন্তর্ভুক্ত করুন
              </span>
              <p className="text-xs text-stone-500">
                সক্রিয় থাকলে চালের মোট খরচের সাথে ভুষির মূল্য যোগ করে চাল রেট হিসাব করা হবে।
              </p>
            </div>
          </label>
        </div>

        {isSuperAdmin && (
          <div className="flex justify-end pt-3 border-t border-stone-100">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "সংরক্ষণ হচ্ছে..." : "সেটিংস সংরক্ষণ করুন"}</span>
            </button>
          </div>
        )}
      </form>

      {/* Danger Zone: Clear Transactions (Super Admin Only) */}
      {isSuperAdmin && (
        <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-rose-950 text-sm">হিসাব ও লেনদেন রিসেট (Danger Zone)</h4>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                যদি আপনি নতুনভাবে হিসাব শুরু করতে চান, তবে এই মেসের সকল মিল রেকর্ড, বাজার খরচ, চাল ও জমা মুছে ফেলতে পারবেন। মেসের সদস্য ও সুপার এডমিন অ্যাকাউন্ট বহাল থাকবে।
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleClearTransactions}
                  disabled={isClearingData}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isClearingData ? "রিসেট হচ্ছে..." : "এই মেসের সকল হিসাব রিসেট করুন"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
