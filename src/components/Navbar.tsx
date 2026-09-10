import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMess } from "../context/MessContext";
import {
  Utensils,
  Calendar,
  User as UserIcon,
  Shield,
  Briefcase,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Copy,
  Check,
  Share2,
  Building2,
  Users,
} from "lucide-react";
import { InviteRoomModal } from "./InviteRoomModal";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, mess, exitMess } = useAuth();
  const { months, activeMonth, setActiveMonthId } = useMess();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleQuickCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mess?.code) {
      navigator.clipboard.writeText(mess.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getRoleBadge = () => {
    if (!user) return null;
    if (user.role === "SUPER_ADMIN") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
          <Shield className="w-3 h-3 text-amber-600" />
          সুপার এডমিন
        </span>
      );
    }
    if (user.role === "MANAGER" || user.isManager) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200">
          <Briefcase className="w-3 h-3 text-blue-600" />
          ম্যানেজার
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
        <UserIcon className="w-3 h-3 text-stone-500" />
        সদস্য
      </span>
    );
  };

  const navItems = [
    { id: "dashboard", label: "ড্যাশবোর্ড", icon: "🏠" },
    { id: "meals", label: "মিল হিসাব", icon: "🍽️" },
    { id: "deposits", label: "জমা", icon: "💰" },
    { id: "bazar", label: "বাজার খরচ", icon: "🛒" },
    { id: "rice", label: "চাল + ভুষি", icon: "🌾" },
    { id: "extra", label: "অতিরিক্ত", icon: "➕" },
    { id: "monthly", label: "মাসিক হিসাব", icon: "📊" },
    { id: "transactions", label: "লেনদেন", icon: "💳" },
    { id: "my-account", label: "আমার হিসাব", icon: "👤" },
    { id: "reports", label: "রিপোর্ট", icon: "📑" },
    { id: "settings", label: "সেটিংস", icon: "⚙️" },
  ];

  const adminNavItems = [
    { id: "students", label: "রুমমেট ব্যবস্থাপনা", icon: "👥" },
    { id: "managers", label: "ম্যানেজার নিয়োগ", icon: "👨‍💼" },
    { id: "month-mgmt", label: "মাস ব্যবস্থাপনা", icon: "🗓️" },
    { id: "audit-logs", label: "Audit Logs", icon: "🔐" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-2xs no-print">
        {/* Top bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Mess Name */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setCurrentTab("dashboard")}
                className="flex items-center gap-2.5 text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg font-bold tracking-tight text-stone-900 font-serif line-clamp-1">
                      {mess?.name || "আদর্শ মেস"}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 hidden sm:block">
                    ডিজিটাল মেস হিসাব খাতা
                  </p>
                </div>
              </button>

              {/* 6-Digit Room Code Badge */}
              {mess?.code && (
                <div
                  onClick={() => setIsInviteModalOpen(true)}
                  title="রুম কোড দেখুন ও কপি করুন"
                  className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 px-2.5 py-1 rounded-xl cursor-pointer transition-colors"
                >
                  <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider hidden md:inline">
                    রুম কোড:
                  </span>
                  <span className="font-mono font-black text-xs sm:text-sm text-emerald-700 tracking-wider">
                    {mess.code}
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickCopy}
                    className="p-0.5 text-emerald-600 hover:text-emerald-800 transition"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              {/* Month Selector */}
              {months.length > 0 && (
                <div className="flex items-center">
                  <div className="relative inline-flex items-center bg-stone-100 hover:bg-stone-200/80 rounded-xl px-2 sm:px-2.5 py-1 border border-stone-200 transition">
                    <Calendar className="w-3.5 h-3.5 text-stone-500 mr-1 shrink-0 hidden sm:inline" />
                    <select
                      value={activeMonth?.id || ""}
                      onChange={(e) => setActiveMonthId(e.target.value)}
                      className="bg-transparent text-xs sm:text-sm font-semibold text-stone-800 pr-5 focus:outline-hidden cursor-pointer appearance-none"
                    >
                      {months.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.status === "CLOSED" ? "(বন্ধ)" : "(চালু)"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-stone-400 absolute right-2 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Invite button */}
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>আমন্ত্রণ</span>
              </button>

              {/* User badge */}
              {user && (
                <div className="text-right hidden md:block">
                  <div className="text-xs font-bold text-stone-900 leading-tight">
                    {user.name}
                  </div>
                  <div className="mt-0.5">{getRoleBadge()}</div>
                </div>
              )}

              {/* Exit/Switch Mess Button */}
              <button
                onClick={() => {
                  if (confirm("আপনি কি নিশ্চিতভাবে এই মেস থেকে বের হতে চান? পরে আবার ৬ ডিজিটের রুম কোড দিয়ে প্রবেশ করতে পারবেন।")) {
                    exitMess();
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-stone-200"
                title="মেস পরিবর্তন করুন / বের হন"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">মেস পরিবর্তন</span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition cursor-pointer"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Main Navigation Tabs */}
        <nav className="hidden lg:block border-t border-stone-100 bg-stone-50/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-1 py-1.5 overflow-x-auto scrollbar-none">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? "bg-white text-emerald-800 shadow-xs border border-stone-200"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/80"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Admin-only navigation items */}
              {user?.role === "SUPER_ADMIN" && (
                <>
                  <span className="text-stone-300 mx-1">|</span>
                  {adminNavItems.map((item) => {
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentTab(item.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? "bg-amber-100 text-amber-950 shadow-xs border border-amber-300 font-bold"
                            : "text-amber-900 hover:bg-amber-50"
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Mobile Drawer Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-2 pb-6 space-y-1 max-h-[75vh] overflow-y-auto">
            <div className="py-2 border-b border-stone-100 mb-2 flex items-center justify-between">
              <div>
                <div className="text-xs text-stone-500">
                  সদস্য: <span className="font-bold text-stone-900">{user?.name}</span>
                </div>
                <div className="text-[11px] text-stone-400 font-mono">কোড: {mess?.code}</div>
              </div>
              {getRoleBadge()}
            </div>

            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider pt-1">
              প্রধান মেন্যু
            </div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left cursor-pointer ${
                  currentTab === item.id
                    ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}

            {user?.role === "SUPER_ADMIN" && (
              <>
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider pt-4">
                  👑 সুপার এডমিন নিয়ন্ত্রণ
                </div>
                {adminNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left cursor-pointer ${
                      currentTab === item.id
                        ? "bg-amber-100 text-amber-950 font-bold border border-amber-300"
                        : "text-amber-900 hover:bg-amber-50"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </header>

      {/* Invitation Modal */}
      <InviteRoomModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </>
  );
};
