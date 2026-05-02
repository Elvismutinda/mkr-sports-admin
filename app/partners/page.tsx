"use client";

import { Button, Skeleton, Tooltip } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  RightOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts";
import { usePartnerAnalytics } from "@/services/api/partners.service";

dayjs.extend(relativeTime);

const BLUE = "#2a79b5";
const GREEN = "#16a34a";
const AMBER = "#d97706";
const RED = "#dc2626";
const SLATE = "#64748b";

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
  trend,
  href,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  trend?: { value: number; label: string };
  href?: string;
}) {
  const isPositive = (trend?.value ?? 0) >= 0;

  const inner = (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md transition-all group cursor-default">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
          style={{ background: accent + "18", color: accent }}
        >
          {icon}
        </div>
      </div>

      <div>
        <p className="text-3xl font-bold text-slate-800 leading-none">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5">
          <span
            className="flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded"
            style={{
              color: isPositive ? GREEN : RED,
              background: isPositive ? "#f0fdf4" : "#fff1f2",
            }}
          >
            {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-slate-400">{trend.label}</span>
        </div>
      )}

      {href && (
        <div
          className="flex items-center gap-1 text-xs mt-auto pt-1"
          style={{ color: accent }}
        >
          <span className="group-hover:underline">View details</span>
          <RightOutlined style={{ fontSize: 10 }} />
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Section({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}
    >
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="font-semibold text-slate-800 text-sm">{title}</p>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-5"
          >
            <Skeleton active paragraph={{ rows: 2 }} title={false} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 xl:col-span-2">
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-5"
          >
            <Skeleton active paragraph={{ rows: 5 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      {label && <p className="font-semibold mb-1 text-slate-300">{label}</p>}
      <p>{payload[0].value.toLocaleString()} partners</p>
    </div>
  );
}

export default function PartnersDashboard() {
  const { data, isLoading, isValidating, mutate } = usePartnerAnalytics();

  return (
    <main className="flex flex-col gap-6 min-h-screen">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Partner Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Overview of partner operations and status
          </p>
        </div>
        <Tooltip title="Refresh">
          <Button
            icon={<ReloadOutlined spin={isValidating} />}
            onClick={() => mutate()}
          >
            Refresh
          </Button>
        </Tooltip>
      </div>

      {isLoading && <DashboardSkeleton />}

      {data &&
        (() => {
          const { kpis, growthTrend, kycFunnel } =
            data;

          // Derive alert count from suspended + pending KYC
          const alertCount = kpis.suspendedPartners + kpis.pendingKyc;

          return (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  label="Total Partners"
                  value={kpis.totalPartners}
                  sub={`${kpis.activePartners} active`}
                  icon={<TeamOutlined />}
                  accent={BLUE}
                  trend={{
                    value: kpis.partnerGrowth,
                    label: "vs last 30 days",
                  }}
                  href="/partners/onboarding"
                />
                <KpiCard
                  label="Pending KYC"
                  value={kpis.pendingKyc}
                  sub="Awaiting admin review"
                  icon={<ClockCircleOutlined />}
                  accent={AMBER}
                  href="/partners/kyc-review"
                />
                <KpiCard
                  label="Active Partners"
                  value={kpis.activePartners}
                  sub={`${Math.round((kpis.activePartners / Math.max(kpis.totalPartners, 1)) * 100)}% of total`}
                  icon={<CheckCircleOutlined />}
                  accent={GREEN}
                />
                <KpiCard
                  label="Needs Attention"
                  value={alertCount}
                  sub={`${kpis.suspendedPartners} suspended · ${kpis.pendingKyc} KYC pending`}
                  icon={<ExclamationCircleOutlined />}
                  accent={alertCount > 0 ? RED : SLATE}
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Section
                  title="Partner Growth"
                  action={
                    <Link
                      href="/partners/analytics"
                      className="text-xs flex items-center gap-1"
                      style={{ color: BLUE }}
                    >
                      Full analytics <RightOutlined style={{ fontSize: 10 }} />
                    </Link>
                  }
                  className="xl:col-span-2"
                >
                  <div className="px-5 pb-5 pt-2">
                    {growthTrend.length === 0 ? (
                      <div className="flex items-center justify-center h-44 text-slate-300 text-sm">
                        No registration data yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart
                          data={growthTrend}
                          margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                        >
                          <defs>
                            <linearGradient
                              id="blueGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor={BLUE}
                                stopOpacity={0.15}
                              />
                              <stop
                                offset="95%"
                                stopColor={BLUE}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <ReTooltip content={<ChartTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke={BLUE}
                            strokeWidth={2.5}
                            fill="url(#blueGrad)"
                            dot={{ fill: BLUE, r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: BLUE, strokeWidth: 0 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Section>

                <div className="flex flex-col gap-4">
                  <Section title="Quick Actions">
                    <div className="flex flex-col">
                      {[
                        {
                          label: "Add New Partner",
                          href: "/partners/onboarding",
                          color: BLUE,
                        },
                        {
                          label: "Review Pending KYC",
                          href: "/partners/kyc-review",
                          color: AMBER,
                          badge: kpis.pendingKyc,
                        },
                        {
                          label: "View Full Analytics",
                          href: "/partners/analytics",
                          color: BLUE,
                        },
                        {
                          label: "Partner Settings",
                          href: "/partners/management/settings",
                          color: SLATE,
                        },
                        {
                          label: "Partner Logs",
                          href: "/partners/management/logs",
                          color: SLATE,
                        },
                      ].map(({ label, href, color, badge }) => (
                        <Link
                          key={href}
                          href={href}
                          className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group"
                        >
                          <span
                            className="text-sm font-medium group-hover:underline"
                            style={{ color }}
                          >
                            {label}
                          </span>
                          <div className="flex items-center gap-2">
                            {badge !== undefined && badge > 0 && (
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                {badge}
                              </span>
                            )}
                            <RightOutlined
                              style={{ fontSize: 10, color: "#cbd5e1" }}
                            />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Section>
                </div>
              </div>

              {kycFunnel.length > 0 && (
                <Section
                  title="KYC Status Breakdown"
                  action={
                    <Link
                      href="/partners/kyc-review"
                      className="text-xs flex items-center gap-1"
                      style={{ color: BLUE }}
                    >
                      Review submissions{" "}
                      <RightOutlined style={{ fontSize: 10 }} />
                    </Link>
                  }
                >
                  <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {kycFunnel.map((k) => {
                      const colorMap: Record<
                        string,
                        { bg: string; text: string }
                      > = {
                        approved: { bg: "#f0fdf4", text: GREEN },
                        pending: { bg: "#fffbeb", text: AMBER },
                        rejected: { bg: "#fff1f2", text: RED },
                        in_review: { bg: "#eff6ff", text: BLUE },
                        not_submitted: { bg: "#f8fafc", text: SLATE },
                        expired: { bg: "#f8fafc", text: "#94a3b8" },
                      };
                      const c = colorMap[k.status] ?? {
                        bg: "#f8fafc",
                        text: SLATE,
                      };
                      const label =
                        {
                          approved: "Approved",
                          pending: "Pending",
                          rejected: "Rejected",
                          in_review: "In Review",
                          not_submitted: "Not Submitted",
                          expired: "Expired",
                        }[k.status] ?? k.status;

                      return (
                        <div
                          key={k.status}
                          className="flex flex-col items-center gap-1 p-3 rounded-lg"
                          style={{ background: c.bg }}
                        >
                          <p
                            className="text-2xl font-bold"
                            style={{ color: c.text }}
                          >
                            {k.count}
                          </p>
                          <p className="text-xs text-slate-500 text-center leading-tight">
                            {label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}
            </>
          );
        })()}
    </main>
  );
}
