"use client";

import { Skeleton, Tag } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import { useDashboard } from "@/services/api/dashboard.service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
      {children}
    </h3>
  );
}

function getActionColor(action: string): string {
  const a = action.toUpperCase();
  if (a.startsWith("CREATE")) return "green";
  if (a.startsWith("UPDATE") || a.startsWith("EDIT")) return "blue";
  if (
    a.startsWith("DELETE") ||
    a.startsWith("DEACTIVATE") ||
    a.startsWith("CANCEL") ||
    a.startsWith("SUSPEND")
  )
    return "red";
  if (a.startsWith("LOGIN") || a.startsWith("AUTH")) return "purple";
  if (a.startsWith("SEND") || a.startsWith("INVITE")) return "cyan";
  if (a.startsWith("RECORD")) return "gold";
  return "orange";
}

export default function DashTransactions() {
  const { data, isLoading } = useDashboard();

  const revenueData =
    data?.charts.revenueTrend.map((r) => ({
      date: dayjs(r.date).format("DD MMM"),
      "Revenue (KES)": r.revenue,
    })) ?? [];

  return (
    <section className="flex flex-col gap-6">
      <SectionTitle>Revenue &amp; Transactions</SectionTitle>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-800/20 p-5 shadow-sm">
          <SectionTitle>Daily Revenue — Last 30 Days</SectionTitle>
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={revenueData}
                margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v
                  }
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value) => {
                    const v = typeof value === "number" ? value : 0;
                    return [`KES ${v.toLocaleString()}`, "Revenue"];
                  }}
                />
                <Bar
                  dataKey="Revenue (KES)"
                  fill="#2a79b5"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-55 text-slate-300 text-sm">
              No revenue data for this period
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-800/20 p-5 shadow-sm flex-1">
            <SectionTitle>Match Status</SectionTitle>
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : (
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: "Live Now",
                    value: data?.matches.live ?? 0,
                    color: "bg-green-500",
                    badge: "green",
                  },
                  {
                    label: "Upcoming",
                    value: data?.matches.upcoming ?? 0,
                    color: "bg-blue-500",
                    badge: "blue",
                  },
                  {
                    label: "Completed (this month)",
                    value: data?.matches.completedThisMonth ?? 0,
                    color: "bg-slate-400",
                    badge: "default",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-sm text-slate-600">
                        {item.label}
                      </span>
                    </div>
                    <Tag color={item.badge} className="font-bold">
                      {item.value}
                    </Tag>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-800/20 p-5 shadow-sm flex-1">
            <SectionTitle>Tournaments</SectionTitle>
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: "Ongoing",
                    value: data?.tournaments.ongoing ?? 0,
                    color: "bg-green-500",
                    badge: "green",
                  },
                  {
                    label: "Upcoming",
                    value: data?.tournaments.upcoming ?? 0,
                    color: "bg-blue-500",
                    badge: "blue",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-sm text-slate-600">
                        {item.label}
                      </span>
                    </div>
                    <Tag color={item.badge} className="font-bold">
                      {item.value}
                    </Tag>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-800/20 p-5 shadow-sm">
        <SectionTitle>Recent System Activity</SectionTitle>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (data?.recentActivity.length ?? 0) > 0 ? (
          <div className="flex flex-col divide-y">
            {data?.recentActivity.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="shrink-0 mt-0.5">
                  <ThunderboltOutlined className="text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag
                      color={getActionColor(log.action)}
                      className="font-mono text-[10px] px-1.5 py-0 m-0"
                    >
                      {log.action}
                    </Tag>
                    {log.entityType && (
                      <span className="text-xs text-slate-400 capitalize">
                        {log.entityType}
                      </span>
                    )}
                  </div>
                  {log.description && (
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      {log.description}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 mt-1">
                  {dayjs(log.createdAt).fromNow()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No activity logged yet.</p>
        )}
      </div>
    </section>
  );
}
