import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMess } from "../context/MessContext";
import { User } from "../types";
import { ConfirmationModal } from "./ConfirmationModal";
import {
  Briefcase,
  Shield,
  UserCheck,
  UserX,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const ManagerAssignmentView: React.FC = () => {
  const { user } = useAuth();
  const { users, refreshData, notify } = useMess();
  const [searchQuery, setSearchQuery] = useState("");

  const [confirmModalData, setConfirmModalData] = useState<{
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

  const handleToggleManager = (targetUser: User) => {
    if (!isSuperAdmin) return;
    const isCurrentlyManager =
      targetUser.role === "MANAGER" || targetUser.is_manager === 1;
    const newIsManager = !isCurrentlyManager;

    setConfirmModalData({
      isOpen: true,
      title: newIsManager ? "ম্যানেজার দায়িত্ব প্রদান" : "ম্যানেজার দায়িত্ব প্রত্যাহার",
      message: newIsManager
        ? `আপনি কি ${targetUser.name}-কে মেসের ম্যানেজারের ক্ষমতা প্রদান করতে চান? তিনি মিল, জমা ও বাজার খরচের হিসাব সংরক্ষণ করতে পারবেন।`
        : `আপনি কি ${targetUser.name}-এর ম্যানেজারের দায়িত্ব প্রত্যাহার করতে চান? তিনি তখন সাধারণ ছাত্র হিসেবে শুধুমাত্র নিজের হিসাব দেখতে পারবেন।`,
      action: async () => {
        try {
          const res = await fetch(`/api/users/${targetUser.id}/manager`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
            },
            body: JSON.stringify({ is_manager: newIsManager }),
          });

          if (res.ok) {
            notify(
              newIsManager
                ? `${targetUser.name}-কে সফলভাবে ম্যানেজার করা হয়েছে!`
                : `${targetUser.name}-এর ম্যানেজার দায়িত্ব প্রত্যাহার করা হয়েছে।`,
              "success"
            );
            await refreshData();
          } else {
            notify("ম্যানেজার পদবি পরিবর্তন ব্যর্থ হয়েছে", "error");
          }
        } catch (e) {
          notify("সার্ভার ত্রুটি", "error");
        }
      },
    });
  };

  const currentManagers = users.filter(
    (u) => u.role === "MANAGER" || u.is_manager === 1
  );

  const studentList = users.filter((u) => u.role !== "SUPER_ADMIN");

  const filteredStudents = studentList.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">
              ম্যানেজার নির্ধারণ ও ব্যবস্থাপনা
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {currentManagers.length} জন সক্রিয় ম্যানেজার
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            সুপার এডমিন যেকোনো ছাত্রকে মেসের ম্যানেজার দায়িত্ব দিতে বা প্রত্যাহার করতে পারেন।
          </p>
        </div>
      </div>

      {/* Current Active Managers Card */}
      <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-5 shadow-sm">
        <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-200 mb-3">
          <Briefcase className="w-4 h-4" />
          চলতি মাসের দায়িত্বপ্রাপ্ত ম্যানেজারবৃন্দ
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentManagers.map((m) => (
            <div
              key={m.id}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-sm block">{m.name}</span>
                <span className="text-xs text-stone-300 font-mono">{m.phone}</span>
                <span className="text-[11px] text-emerald-300 block mt-0.5">
                  রুম: {m.room_number || "২০১"}
                </span>
              </div>
              {isSuperAdmin && (
                <button
                  onClick={() => handleToggleManager(m)}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-200 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 rounded-xl transition cursor-pointer"
                >
                  অব্যাহতি দিন
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* All Students List with Manager Toggle */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-stone-900">
            সকল ছাত্র তালিকা ও পদবি পরিবর্তন
          </h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="ছাত্র খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 w-48"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-stone-100 text-stone-700 border-b border-stone-200">
              <tr>
                <th className="py-3 px-3 font-bold text-center w-12">#</th>
                <th className="py-3 px-4 font-bold">নাম</th>
                <th className="py-3 px-4 font-bold">ফোন</th>
                <th className="py-3 px-4 font-bold">বর্তমান পদবি</th>
                <th className="py-3 px-4 font-bold text-right">ম্যানেজার অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredStudents.map((st, idx) => {
                const isManager = st.role === "MANAGER" || st.is_manager === 1;

                return (
                  <tr key={st.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-3 text-center text-stone-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900">
                      {st.name}
                    </td>
                    <td className="py-3 px-4 text-stone-600 font-mono">
                      {st.phone}
                    </td>
                    <td className="py-3 px-4">
                      {isManager ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ম্যানেজার
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600">
                          সাধারণ ছাত্র
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isSuperAdmin ? (
                        <button
                          onClick={() => handleToggleManager(st)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isManager
                              ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isManager ? "ম্যানেজার প্রত্যাহার" : "ম্যানেজার বানান"}
                        </button>
                      ) : (
                        <span className="text-stone-400 italic">শুধুমাত্র এডমিন</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModalData.isOpen}
        title={confirmModalData.title}
        message={confirmModalData.message}
        onConfirm={async () => {
          await confirmModalData.action();
          setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() =>
          setConfirmModalData((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </div>
  );
};
