"use client";

import PartnerSideBar from "@/components/partners/PartnerSideBar";
import PartnerNavBar from "@/components/partners/PartnerNavBar";
import React, { useState } from "react";
import IsPartnersAuth from "@/components/partners/IsPartnersAuth";

function PartnerLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="flex flex-row w-full h-screen overflow-hidden">
      <PartnerSideBar
        collapsed={collapsed}
        onClose={() => setCollapsed(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <PartnerNavBar toggleMenu={() => setCollapsed((c) => !c)} />
        <div className="p-4 bg-[#F4F5F7] flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

export default IsPartnersAuth(PartnerLayout);
