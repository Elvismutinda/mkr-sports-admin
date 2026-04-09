"use client";

import DashClients from "@/app/app/dashboard/(components)/DashClients";
import DashTransactions from "@/app/app/dashboard/(components)/DashTransactions";
import { usePermission } from "@/hooks/usePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

export default function DashboardHome() {
  const { hasPermission, hasAnyPermission } = usePermission();

  return (
    <main className="flex min-h-screen flex-col gap-8">
      <h2 className={"text-2xl font-bold"}>Dashboards</h2>
      {hasPermission(Permission.DASHBOARD_CLIENTS) && <DashClients />}
      {hasPermission(Permission.DASHBOARD_TRANSACTIONS) && <DashTransactions />}
    </main>
  );
}
