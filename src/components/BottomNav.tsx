import React from "react";
import { LayoutDashboard, Utensils, Wallet, FileSpreadsheet, UserCircle } from "lucide-react";

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const items = [
    { id: "dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
    { id: "meals", label: "মিল হিসাব", icon: Utensils },
    { id: "deposits", label: "জমা", icon: Wallet },
    { id: "monthly", label: "মাসিক হিসাব", icon: FileSpreadsheet },
    { id: "my-account", label: "আমার হিসাব", icon: UserCircle },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1.5 shadow-lg no-print">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[56px] ${
                isActive
                  ? "text-emerald-700 font-bold scale-105"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
              <span className="text-[11px] leading-tight tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
