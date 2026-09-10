/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MessProvider } from "./context/MessContext";
import { Navbar } from "./components/Navbar";
import { BottomNav } from "./components/BottomNav";
import { MessWelcomeScreen } from "./components/MessWelcomeScreen";
import { DashboardView } from "./components/DashboardView";
import { MealSheetView } from "./components/MealSheetView";
import { DepositsView } from "./components/DepositsView";
import { BazarExpenseView } from "./components/BazarExpenseView";
import { RiceBranExpenseView } from "./components/RiceBranExpenseView";
import { ExtraExpenseView } from "./components/ExtraExpenseView";
import { MonthlyAccountView } from "./components/MonthlyAccountView";
import { TransactionsView } from "./components/TransactionsView";
import { MyAccountView } from "./components/MyAccountView";
import { ReportsView } from "./components/ReportsView";
import { SettingsView } from "./components/SettingsView";
import { StudentManagementView } from "./components/StudentManagementView";
import { ManagerAssignmentView } from "./components/ManagerAssignmentView";
import { MonthManagementView } from "./components/MonthManagementView";
import { AuditLogsView } from "./components/AuditLogsView";

function MainContent() {
  const { user, mess, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>("dashboard");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold text-stone-600 font-serif">
          মেসের খাতা লোড হচ্ছে...
        </p>
      </div>
    );
  }

  // If not in a mess or not authenticated, show the 2-option Room Welcome Screen
  if (!user || !mess) {
    return <MessWelcomeScreen />;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <DashboardView onNavigate={setCurrentTab} />;
      case "meals":
        return <MealSheetView />;
      case "deposits":
        return <DepositsView />;
      case "bazar":
        return <BazarExpenseView />;
      case "rice":
        return <RiceBranExpenseView />;
      case "extra":
        return <ExtraExpenseView />;
      case "monthly":
        return <MonthlyAccountView />;
      case "transactions":
        return <TransactionsView />;
      case "my-account":
        return <MyAccountView />;
      case "reports":
        return <ReportsView />;
      case "settings":
        return <SettingsView />;
      case "students":
        return <StudentManagementView />;
      case "managers":
        return <ManagerAssignmentView />;
      case "month-mgmt":
        return <MonthManagementView />;
      case "audit-logs":
        return <AuditLogsView />;
      default:
        return <DashboardView onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* Top sticky Navigation with 6-digit Room Code */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-20 lg:pb-12">
        {renderTabContent()}
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MessProvider>
        <MainContent />
      </MessProvider>
    </AuthProvider>
  );
}
