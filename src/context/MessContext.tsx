import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { MonthlyPeriod, MessMonthlySummary, User } from "../types";
import { useAuth } from "./AuthContext";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface MessContextType {
  months: MonthlyPeriod[];
  activeMonth: MonthlyPeriod | null;
  setActiveMonthId: (id: string) => void;
  summary: MessMonthlySummary | null;
  isLoadingSummary: boolean;
  refreshData: () => Promise<void>;
  users: User[];
  refreshUsers: () => Promise<void>;
  settings: Record<string, string>;
  refreshSettings: () => Promise<void>;
  notify: (message: string, type?: "success" | "error" | "info") => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
  isMonthClosed: boolean;
}

const MessContext = createContext<MessContextType | undefined>(undefined);

export const MessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, mess } = useAuth();
  const [months, setMonths] = useState<MonthlyPeriod[]>([]);
  const [activeMonth, setActiveMonth] = useState<MonthlyPeriod | null>(null);
  const [summary, setSummary] = useState<MessMonthlySummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const authHeaders = useCallback(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const notify = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch months list
  const fetchMonths = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/months", {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data: MonthlyPeriod[] = await res.json();
        setMonths(data);
        if (data.length > 0) {
          setActiveMonth((current) => {
            if (current) {
              const updated = data.find((m) => m.id === current.id);
              if (updated) return updated;
            }
            return data[0];
          });
        } else {
          setActiveMonth(null);
        }
      }
    } catch (e) {
      console.error("Failed to load months:", e);
    }
  }, [token, authHeaders]);

  // Fetch summary for active month
  const fetchSummary = useCallback(
    async (monthId: string) => {
      if (!token) return;
      setIsLoadingSummary(true);
      try {
        const res = await fetch(`/api/months/${monthId}/summary`, {
          headers: authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (e) {
        console.error("Failed to load monthly summary:", e);
      } finally {
        setIsLoadingSummary(false);
      }
    },
    [token, authHeaders]
  );

  // Fetch all users
  const refreshUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/users", {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error("Failed to load users:", e);
    }
  }, [token, authHeaders]);

  // Fetch settings
  const refreshSettings = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/settings", {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    if (token && mess) {
      fetchMonths();
      refreshUsers();
      refreshSettings();
    } else {
      setMonths([]);
      setActiveMonth(null);
      setSummary(null);
      setUsers([]);
      setSettings({});
    }
  }, [token, mess, fetchMonths, refreshUsers, refreshSettings]);

  useEffect(() => {
    if (activeMonth && token) {
      fetchSummary(activeMonth.id);
    }
  }, [activeMonth, token, fetchSummary]);

  const setActiveMonthId = (id: string) => {
    const found = months.find((m) => m.id === id);
    if (found) {
      setActiveMonth(found);
    }
  };

  const refreshData = async () => {
    if (activeMonth) {
      await fetchSummary(activeMonth.id);
    }
    await fetchMonths();
    await refreshUsers();
  };

  const isMonthClosed = activeMonth?.status === "CLOSED";

  return (
    <MessContext.Provider
      value={{
        months,
        activeMonth,
        setActiveMonthId,
        summary,
        isLoadingSummary,
        refreshData,
        users,
        refreshUsers,
        settings,
        refreshSettings,
        notify,
        toasts,
        removeToast,
        isMonthClosed,
      }}
    >
      {children}
    </MessContext.Provider>
  );
};

export const useMess = () => {
  const context = useContext(MessContext);
  if (!context) {
    throw new Error("useMess must be used within a MessProvider");
  }
  return context;
};
