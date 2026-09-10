import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Building2,
  Users,
  Copy,
  Check,
  Share2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calculator,
  Utensils,
  Receipt,
} from "lucide-react";
import confetti from "canvas-confetti";

export const MessWelcomeScreen: React.FC = () => {
  const { createMess, joinMess } = useAuth();
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  // Create Mess Form State
  const [createMessName, setCreateMessName] = useState("");
  const [createCreatorName, setCreateCreatorName] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Success Created State
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [createdMessName, setCreatedMessName] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Join Mess Form State
  const [joinName, setJoinName] = useState("");
  const [joinPhone, setJoinPhone] = useState("");
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateMess = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!createMessName.trim()) {
      setCreateError("মেসের নাম লিখুন (যেমন: আদর্শ ছাত্রাবাস)।");
      return;
    }
    if (!createCreatorName.trim()) {
      setCreateError("আপনার নাম লিখুন।");
      return;
    }
    if (!createPhone.trim() || createPhone.trim().length < 6) {
      setCreateError("সঠিক মোবাইল নম্বর প্রদান করুন।");
      return;
    }

    setIsCreating(true);
    const res = await createMess(createMessName.trim(), createCreatorName.trim(), createPhone.trim());
    setIsCreating(false);

    if (res.success && res.roomCode) {
      setCreatedRoomCode(res.roomCode);
      setCreatedMessName(createMessName.trim());
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // ignore confetti errors
      }
    } else {
      setCreateError(res.error || "মেস তৈরি করতে ব্যর্থ হয়েছে।");
    }
  };

  const handleJoinMess = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");

    if (!joinName.trim()) {
      setJoinError("আপনার নাম লিখুন।");
      return;
    }
    if (!joinPhone.trim() || joinPhone.trim().length < 6) {
      setJoinError("সঠিক মোবাইল নম্বর লিখুন।");
      return;
    }
    if (!joinRoomCode.trim() || joinRoomCode.trim().length < 4) {
      setJoinError("৬ ডিজিটের সঠিক রুম কোড দিন।");
      return;
    }

    setIsJoining(true);
    const res = await joinMess(joinName.trim(), joinPhone.trim(), joinRoomCode.trim());
    setIsJoining(false);

    if (!res.success) {
      setJoinError(res.error || "মেসে যোগ দেওয়া সম্ভব হয়নি। রুম কোড যাচাই করুন।");
    }
  };

  const copyRoomCode = () => {
    if (createdRoomCode) {
      navigator.clipboard.writeText(createdRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const shareOnWhatsApp = () => {
    if (!createdRoomCode) return;
    const text = `আমাদের মেস হিসাব খাতায় যোগ দিন!\n🏢 মেসের নাম: ${createdMessName}\n🔑 ৬ ডিজিটের রুম কোড: ${createdRoomCode}\nওয়েবসাইটে গিয়ে "মেসে যোগ দিন" অপশনে এই কোড দিন।`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center px-4 py-8 sm:py-12 selection:bg-emerald-500/20">
      {/* Brand Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-full text-emerald-900 text-xs font-semibold tracking-wide mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>ডিজিটাল মেস হিসাব খাতা • নো পাসওয়ার্ড</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-serif mb-2">
          আদর্শ মেস
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          কোনো রেজিস্ট্রেশন বা পাসওয়ার্ডের ঝামেলা নেই। যেকোনো নামে নতুন মেস তৈরি করুন বা ৬ ডিজিটের রুম কোড দিয়ে যোগ দিন।
        </p>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden">
        {/* If Mess Just Created: Celebratory Screen */}
        {createdRoomCode ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Building2 className="w-8 h-8" />
            </div>

            <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full mb-2">
              মেস তৈরি সম্পন্ন!
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-1 font-serif">{createdMessName}</h2>
            <p className="text-sm text-stone-500 mb-6">
              আপনি এই মেসের <strong className="text-emerald-700 font-semibold">সুপার এডমিন</strong>। রুমমেটদের সাথে নিচের ৬ ডিজিটের কোডটি শেয়ার করুন।
            </p>

            {/* Room Code Card */}
            <div className="bg-stone-50 border-2 border-dashed border-emerald-300 rounded-xl p-5 mb-6">
              <div className="text-xs uppercase font-bold text-stone-500 tracking-wider mb-1">
                মেসের ৬ ডিজিটের ইনভাইটেশন / রুম কোড
              </div>
              <div className="text-4xl sm:text-5xl font-mono font-black text-emerald-700 tracking-widest my-2 select-all">
                {createdRoomCode}
              </div>
              <p className="text-xs text-stone-500">
                অন্যান্য সদস্যরা এই কোডটি দিয়ে আপনার মেসে যুক্ত হতে পারবে।
              </p>
            </div>

            {/* Share & Copy Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={copyRoomCode}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm font-semibold rounded-xl border border-stone-300 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>কপি করা হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>রুম কোড কপি করুন</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={shareOnWhatsApp}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp-এ শেয়ার করুন</span>
              </button>
            </div>

            {/* Direct Enter */}
            <button
              type="button"
              onClick={() => {
                // Already authenticated in context, refreshing / dismissing screen enters the mess dashboard
                setCreatedRoomCode(null);
              }}
              className="w-full py-3 px-5 bg-stone-900 hover:bg-black text-white text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>সুপার এডমিন হিসেবে প্রবেশ করুন</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div>
            {/* Top Navigation Tabs: Create vs Join */}
            <div className="grid grid-cols-2 border-b border-stone-200 bg-stone-50/70 p-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("create")}
                className={`py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "create"
                    ? "bg-white text-emerald-900 shadow-xs border border-stone-200/80"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>১. নতুন মেস তৈরি</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("join")}
                className={`py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "join"
                    ? "bg-white text-emerald-900 shadow-xs border border-stone-200/80"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>২. মেসে যোগ দিন</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 sm:p-8">
              {activeTab === "create" ? (
                /* OPTION 1: CREATE A MESS */
                <div>
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-stone-900 font-serif mb-1">
                      নতুন মেস তৈরি করুন
                    </h2>
                    <p className="text-xs text-stone-500">
                      মেস তৈরি করলেই একটি ইউনিক ৬ ডিজিটের রুম কোড পাবেন যা দিয়ে রুমমেটরা যোগ দিতে পারবে। আপনি হবেন এই মেসের <strong className="text-emerald-700">সুপার এডমিন</strong>।
                    </p>
                  </div>

                  {createError && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl">
                      {createError}
                    </div>
                  )}

                  <form onSubmit={handleCreateMess} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        মেসের নাম <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: আদর্শ মেস, গোলাপ ভিলা, চিলিং হোস্টেল"
                        value={createMessName}
                        onChange={(e) => setCreateMessName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        আপনার নাম (সুপার এডমিন) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="আপনার পূর্ণ নাম"
                        value={createCreatorName}
                        onChange={(e) => setCreateCreatorName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        আপনার মোবাইল নম্বর <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="017XXXXXXXX"
                        value={createPhone}
                        onChange={(e) => setCreatePhone(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                      />
                      <p className="text-[11px] text-stone-500 mt-1">
                        ভবিষ্যতে অন্য ডিভাইস থেকে যোগ দিতে এই মোবাইল নম্বরটি ব্যবহার করবেন।
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isCreating}
                      className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      {isCreating ? (
                        <span>রুম তৈরি হচ্ছে...</span>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>মেস তৈরি করুন এবং ৬ ডিজিট কোড পান</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* OPTION 2: JOIN A MESS */
                <div>
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-stone-900 font-serif mb-1">
                      মেসে যোগ দিন
                    </h2>
                    <p className="text-xs text-stone-500">
                      আপনার রুমমেট বা এডমিনের কাছ থেকে প্রাপ্ত ৬ ডিজিটের ইনভাইটেশন কোডটি দিন।
                    </p>
                  </div>

                  {joinError && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl">
                      {joinError}
                    </div>
                  )}

                  <form onSubmit={handleJoinMess} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        ৬ ডিজিটের রুম কোড <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="842915"
                        value={joinRoomCode}
                        onChange={(e) => setJoinRoomCode(e.target.value.replace(/\s+/g, ""))}
                        required
                        className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-300 rounded-xl text-stone-900 text-xl font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all uppercase placeholder:text-stone-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        আপনার নাম <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="আপনার নাম"
                        value={joinName}
                        onChange={(e) => setJoinName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        মোবাইল নম্বর <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="017XXXXXXXX"
                        value={joinPhone}
                        onChange={(e) => setJoinPhone(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isJoining}
                      className="w-full mt-2 py-3 px-4 bg-stone-900 hover:bg-black disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      {isJoining ? (
                        <span>মেসে সংযোগ হচ্ছে...</span>
                      ) : (
                        <>
                          <Users className="w-4 h-4" />
                          <span>মেসে প্রবেশ করুন</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feature Highlights Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mt-8">
        <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-stone-200/80 text-center shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-1.5">
            <Utensils className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-stone-900">স্বচ্ছ দৈনিক মিল শিট</div>
          <div className="text-[11px] text-stone-500">সকাল, দুপুর ও রাতের মিল হিসাব</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-stone-200/80 text-center shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-1.5">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-stone-900">বাজার, চাল ও ভুষি হিসাব</div>
          <div className="text-[11px] text-stone-500">স্বয়ংক্রিয় মিল রেট ও ক্যালকুলেশন</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-stone-200/80 text-center shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-1.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-stone-900">সুপার এডমিন আলটিমেট কন্ট্রোল</div>
          <div className="text-[11px] text-stone-500">যেকোনো ডাটা পরিবর্তন ও নিয়ন্ত্রণ</div>
        </div>
      </div>
    </div>
  );
};
