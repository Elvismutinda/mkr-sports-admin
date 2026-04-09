"use client";
import AppSideBar from "@/components/AppSideBar";
import AppNavBar from "@/components/AppNavBar";
import React, { useState } from "react";
import IsAuth from "@/components/IsAuth";

function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div className={"flex flex-row w-full h-screen overflow-hidden"}>
      <div className="relative z-20 shrink-0">
        <AppSideBar collapsed={collapsed} className="" />
      </div>
      <div className="relative grow flex flex-col overflow-hidden">
        <AppNavBar toggleMenu={() => setCollapsed(!collapsed)} />
        <div className={"p-4 bg-[#F4F5F7] grow overflow-auto"}>{children}</div>
      </div>
    </div>
  );
}

export default IsAuth(AppLayout);
