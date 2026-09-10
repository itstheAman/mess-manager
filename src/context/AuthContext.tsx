import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Mess } from "../types";

interface AuthContextType {
  user: User | null;
  mess: Mess | null;
  token: string | null;
  isLoading: boolean;
  createMess: (
    messName: string,
    creatorName: string,
    phone: string
  ) => Promise<{ success: boolean; error?: string; mess?: Mess; roomCode?: string }>;
  joinMess: (
    name: string,
    phone: string,
    roomCode: string
  ) => Promise<{ success: boolean; error?: string; mess?: Mess }>;
  exitMess: () => void;
  refreshUser: () => Promise<void>;
  updateMessNameInState: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [mess, setMess] = useState<Mess | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("adarsha_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setMess(data.mess);
      } else {
        // Token invalid or mess deleted
        localStorage.removeItem("adarsha_token");
        localStorage.removeItem("adarsha_mess_code");
        setToken(null);
        setUser(null);
        setMess(null);
      }
    } catch (e) {
      console.error("Auth me check failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const createMess = async (messName: string, creatorName: string, phone: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mess/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messName, creatorName, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: data.error || "মেস তৈরি করতে সমস্যা হয়েছে।" };
      }

      localStorage.setItem("adarsha_token", data.token);
      localStorage.setItem("adarsha_mess_code", data.mess.code);
      setToken(data.token);
      setUser(data.user);
      setMess(data.mess);
      setIsLoading(false);
      return { success: true, mess: data.mess, roomCode: data.mess.code };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: "সার্ভারে সংযোগ করা যায়নি।" };
    }
  };

  const joinMess = async (name: string, phone: string, roomCode: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mess/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, roomCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: data.error || "মেসে যোগ দিতে ব্যর্থ হয়েছে।" };
      }

      localStorage.setItem("adarsha_token", data.token);
      localStorage.setItem("adarsha_mess_code", data.mess.code);
      setToken(data.token);
      setUser(data.user);
      setMess(data.mess);
      setIsLoading(false);
      return { success: true, mess: data.mess };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: "সার্ভারে সংযোগ করা যায়নি।" };
    }
  };

  const exitMess = () => {
    localStorage.removeItem("adarsha_token");
    localStorage.removeItem("adarsha_mess_code");
    setToken(null);
    setUser(null);
    setMess(null);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  const updateMessNameInState = (name: string) => {
    if (mess) {
      setMess({ ...mess, name });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        mess,
        token,
        isLoading,
        createMess,
        joinMess,
        exitMess,
        refreshUser,
        updateMessNameInState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
