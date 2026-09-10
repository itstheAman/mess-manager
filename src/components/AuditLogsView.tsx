import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useMess } from "../context/MessContext";
import { ShieldCheck, Search, Clock, User, AlertCircle } from "lucide-react";

export const AuditLogsView: React.FC = () => {
  const { user } = useAuth();
  const { activeMonth } = useMess();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/audit-logs", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adarsha_token")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-16">
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">
              সিস্টেম অডিট লগ (Audit Trails)
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              সিকিউরিটি ট্র্যাকিং
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            কে কখন কোন মিল, খরচ বা সেটিংস পরিবর্তন করেছে তার সম্পূর্ণ লগ যাতে কোনো গরমিল না হয়।
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="ইউজার বা অ্যাকশন খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-stone-400 text-sm">লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm">
            কোনো অডিট লগ রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-stone-100/90 text-stone-700 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-3 font-bold text-center w-12">#</th>
                  <th className="py-3 px-4 font-bold">সময়</th>
                  <th className="py-3 px-4 font-bold">ব্যবহারকারী</th>
                  <th className="py-3 px-4 font-bold">অ্যাকশন</th>
                  <th className="py-3 px-4 font-bold">বিস্তারিত</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {filtered.map((l, idx) => (
                  <tr key={l.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-3 text-center text-stone-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-500 font-mono whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString("bn-BD")}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900 whitespace-nowrap">
                      {l.user_name || "অজানা"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-purple-50 text-purple-900 border border-purple-200/60">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-600 max-w-md truncate font-mono">
                      {l.details || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
