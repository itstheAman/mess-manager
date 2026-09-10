import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMess } from "../context/MessContext";
import { User } from "../types";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Briefcase,
  UserCheck,
  Edit2,
  Trash2,
  X,
  Save,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { InviteRoomModal } from "./InviteRoomModal";

export const StudentManagementView: React.FC = () => {
  const { user, mess } = useAuth();
  const { users, refreshUsers, refreshData, notify } = useMess();

  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Add Form
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addRoomNumber, setAddRoomNumber] = useState("");
  const [addRole, setAddRole] = useState<"STUDENT" | "MANAGER">("STUDENT");
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Form
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editRole, setEditRole] = useState<"STUDENT" | "MANAGER" | "SUPER_ADMIN">("STUDENT");
  const [editActive, setEditActive] = useState(true);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    if (!addName.trim() || !addPhone.trim()) {
      notify("নাম এবং মোবাইল নম্বর পূরণ করুন।", "error");
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
        body: JSON.stringify({
          name: addName.trim(),
          phone: addPhone.trim(),
          room_number: addRoomNumber.trim(),
          role: addRole,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        notify("নতুন সদস্য সফলভাবে যোগ করা হয়েছে!", "success");
        setIsAddOpen(false);
        setAddName("");
        setAddPhone("");
        setAddRoomNumber("");
        setAddRole("STUDENT");
        await refreshUsers();
        await refreshData();
      } else {
        notify(data.error || "সদস্য যোগ করতে ব্যর্থ হয়েছে।", "error");
      }
    } catch (e) {
      notify("সার্ভার সংযোগে ত্রুটি", "error");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setEditName(u.name);
    setEditPhone(u.phone);
    setEditRoomNumber(u.room_number || "");
    setEditRole(u.role);
    setEditActive(u.active === 1);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !selectedUser) return;

    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
          room_number: editRoomNumber.trim(),
          role: editRole,
          active: editActive ? 1 : 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        notify("সদস্যের তথ্য সফলভাবে আপডেট করা হয়েছে!", "success");
        setIsEditOpen(false);
        await refreshUsers();
        await refreshData();
      } else {
        notify(data.error || "আপডেট ব্যর্থ হয়েছে", "error");
      }
    } catch (e) {
      notify("সার্ভার সংযোগে ত্রুটি", "error");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (!isSuperAdmin) return;
    if (u.id === user?.id) {
      notify("সুপার এডমিন নিজেকে মেস থেকে সরাতে পারবেন না।", "error");
      return;
    }

    if (!window.confirm(`আপনি কি নিশ্চিত যে "${u.name}"-কে এই মেস থেকে বাদ দিতে চান?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        notify(`${u.name}-কে মেস থেকে বাদ দেওয়া হয়েছে।`, "success");
        await refreshUsers();
        await refreshData();
      } else {
        notify(data.error || "মুছতে সমস্যা হয়েছে", "error");
      }
    } catch (e) {
      notify("সার্ভার সংযোগে ত্রুটি", "error");
    }
  };

  const handleToggleRole = async (u: User) => {
    if (!isSuperAdmin) return;
    if (u.role === "SUPER_ADMIN") return;

    const newRole = u.role === "MANAGER" ? "STUDENT" : "MANAGER";
    const roleTitle = newRole === "MANAGER" ? "ম্যানেজার" : "সাধারণ সদস্য";

    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        notify(`${u.name}-কে ${roleTitle} করা হয়েছে।`, "success");
        await refreshUsers();
        await refreshData();
      } else {
        notify("পদবী পরিবর্তন ব্যর্থ হয়েছে", "error");
      }
    } catch (e) {
      notify("সার্ভার সংযোগে ত্রুটি", "error");
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.phone.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-700" />
            রুমমেট ও সদস্য ব্যবস্থাপনা
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            মেসের সদস্যদের তালিকা, নতুন সদস্য আমন্ত্রণ এবং সুপার এডমিন নিয়ন্ত্রণ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>আমন্ত্রণ কোড: {mess?.code}</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>সদস্য যোগ করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="text-xs text-stone-500 font-medium">
          মোট সদস্য: <strong className="text-stone-900 font-bold">{users.length}</strong> জন
        </div>
      </div>

      {/* Users List Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">নাম ও মোবাইল</th>
                <th className="py-3 px-4">রুম নং</th>
                <th className="py-3 px-4">পদবী / ভূমিকা</th>
                <th className="py-3 px-4">স্ট্যাটাস</th>
                {isSuperAdmin && <th className="py-3 px-4 text-right">কার্যক্রম</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 5 : 4} className="py-8 text-center text-stone-400">
                    কোনো সদস্য পাওয়া যায়নি। রুমমেটদের ৬ ডিজিটের রুম কোড <strong>({mess?.code})</strong> শেয়ার করুন।
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        {u.name}
                        {u.id === user?.id && (
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                            আপনি
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 font-mono mt-0.5">{u.phone}</div>
                    </td>

                    <td className="py-3 px-4 text-stone-600 font-mono">
                      {u.room_number || "—"}
                    </td>

                    <td className="py-3 px-4">
                      {u.role === "SUPER_ADMIN" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          <Shield className="w-3 h-3 text-amber-600" />
                          👑 সুপার এডমিন
                        </span>
                      ) : u.role === "MANAGER" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
                          <Briefcase className="w-3 h-3 text-blue-600" />
                          📋 ম্যানেজার
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
                          🎓 সদস্য
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {u.active === 1 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                          <UserCheck className="w-3.5 h-3.5" />
                          সক্রিয়
                        </span>
                      ) : (
                        <span className="text-stone-400 text-xs">নিষ্ক্রিয়</span>
                      )}
                    </td>

                    {isSuperAdmin && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Make Manager / Student Toggle */}
                          {u.role !== "SUPER_ADMIN" && (
                            <button
                              type="button"
                              onClick={() => handleToggleRole(u)}
                              className="p-1.5 text-stone-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                              title={u.role === "MANAGER" ? "সদস্য করুন" : "ম্যানেজার বানান"}
                            >
                              <Briefcase className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="সম্পাদনা"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Member (cannot delete self) */}
                          {u.id !== user?.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="মেস থেকে সরান"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                নতুন সদস্য যোগ করুন
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  সদস্যের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: সাকিব হাসান"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    রুম নম্বর
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ২০৪"
                    value={addRoomNumber}
                    onChange={(e) => setAddRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    পদবী
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="STUDENT">সদস্য (Student)</option>
                    <option value="MANAGER">ম্যানেজার (Manager)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isSubmittingAdd ? "সংরক্ষণ হচ্ছে..." : "যোগ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                সদস্যের তথ্য সম্পাদনা
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  সদস্যের নাম
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    রুম নম্বর
                  </label>
                  <input
                    type="text"
                    value={editRoomNumber}
                    onChange={(e) => setEditRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    পদবী
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    disabled={selectedUser.role === "SUPER_ADMIN"}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {selectedUser.role === "SUPER_ADMIN" ? (
                      <option value="SUPER_ADMIN">👑 সুপার এডমিন</option>
                    ) : (
                      <>
                        <option value="STUDENT">🎓 সদস্য (Student)</option>
                        <option value="MANAGER">📋 ম্যানেজার (Manager)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-stone-800">
                    সদস্য সক্রিয় (মেসে বসবাসরত ও মিল চালু)
                  </span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmittingEdit ? "আপডেট হচ্ছে..." : "সংরক্ষণ করুন"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Room Modal */}
      <InviteRoomModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
};
