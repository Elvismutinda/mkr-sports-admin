"use client";

import DashClients from "./(components)/DashClients";
import DashTransactions from "./(components)/DashTransactions";
import { usePermission } from "@/hooks/usePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useDashboard } from "@/services/api/dashboard.service";

export default function DashboardHome() {
  const { hasPermission } = usePermission();
  const { mutate, isLoading } = useDashboard();

  return (
    <main className="flex min-h-screen flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
        </div>
        <Button
          icon={<ReloadOutlined spin={isLoading} />}
          onClick={() => mutate()}
          size="small"
        >
          Refresh
        </Button>
      </div>

      {hasPermission(Permission.DASHBOARD_CLIENTS) && <DashClients />}
      {hasPermission(Permission.DASHBOARD_TRANSACTIONS) && <DashTransactions />}

      {!hasPermission(Permission.DASHBOARD_CLIENTS) &&
        !hasPermission(Permission.DASHBOARD_TRANSACTIONS) && (
          <div className="flex items-center justify-center flex-1 min-h-[60vh]">
            <div className="text-center">
              <p className="text-4xl mb-4">🔒</p>
              <p className="text-slate-500 font-medium">
                You don&apos;t have permission to view dashboard data.
              </p>
            </div>
          </div>
        )}
    </main>
  );
}
