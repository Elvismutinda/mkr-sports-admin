"use client";

import AppSideBar from "@/components/AppSideBar";
import AppNavBar from "@/components/AppNavBar";
import React, { useState } from "react";
import IsAuth from "@/components/IsAuth";

function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="flex flex-row w-full h-screen overflow-hidden">
      <AppSideBar
        collapsed={collapsed}
        onClose={() => setCollapsed(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppNavBar toggleMenu={() => setCollapsed((c) => !c)} />
        <div className="p-4 bg-[#F4F5F7] flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default IsAuth(AppLayout);