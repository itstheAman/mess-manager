import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMess } from "../context/MessContext";
import {
  X,
  Copy,
  Check,
  Share2,
  Building2,
  Users,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

interface InviteRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteRoomModal: React.FC<InviteRoomModalProps> = ({ isOpen, onClose }) => {
  const { mess, user } = useAuth();
  const { users } = useMess();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !mess) return null;

  const roomCode = mess.code;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareOnWhatsApp = () => {
    const text = `আমাদের মেস হিসাব খাতায় যোগ দিন!\n🏢 মেসের নাম: ${mess.name}\n🔑 ৬ ডিজিটের রুম কোড: ${roomCode}\nওয়েবসাইটে গিয়ে "মেসে যোগ দিন" বাটনে এই কোড দিন।`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base">রুম ইনভাইটেশন কোড</h3>
              <p className="text-xs text-stone-500">{mess.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-xs text-stone-500 mb-2">
              রুমমেটদের এই ৬ ডিজিটের কোডটি দিন। তারা "মেসে যোগ দিন" অপশনে গিয়ে নাম, নম্বর ও কোড দিয়ে সরাসরি যুক্ত হতে পারবে।
            </p>

            {/* Room Code Display */}
            <div className="bg-emerald-50/60 border-2 border-dashed border-emerald-300 rounded-2xl p-5 my-3 text-center">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest block mb-1">
                মেস ইনভাইটেশন কোড
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-black text-emerald-700 tracking-widest my-1 select-all">
                {roomCode}
              </div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  onClick={copyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-lg border border-stone-300 shadow-2xs transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>কোড কপি</span>
                    </>
                  )}
                </button>
                <button
                  onClick={shareOnWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* Members in Mess */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>বর্তমানে যুক্ত রুমমেট ({users.length} জন)</span>
              </span>
              {user?.role === "SUPER_ADMIN" && (
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  আপনি সুপার এডমিন
                </span>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-xl bg-stone-50/50">
              {users.map((u) => (
                <div key={u.id} className="p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[11px]">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-stone-900 flex items-center gap-1">
                        {u.name}
                        {u.id === user?.id && <span className="text-[10px] text-stone-500">(আপনি)</span>}
                      </div>
                      <div className="text-[11px] text-stone-400 font-mono">{u.phone}</div>
                    </div>
                  </div>
                  <div>
                    {u.role === "SUPER_ADMIN" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        👑 সুপার এডমিন
                      </span>
                    ) : u.role === "MANAGER" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                        📋 ম্যানেজার
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600">
                        সদস্য
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
