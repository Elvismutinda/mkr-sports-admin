"use client";

import { Button, Skeleton, Tag, Tooltip } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { usePartnerAnalytics } from "@/services/api/partners.service";

dayjs.extend(relativeTime);

const BLUE = "#2a79b5";
const GREEN = "#16a34a";
const AMBER = "#d97706";
const RED = "#dc2626";
const SLATE = "#64748b";

const KYC_COLORS: Record<string, string> = {
  approved: GREEN,
  pending: AMBER,
  rejected: RED,
  in_review: BLUE,
  not_submitted: "#cbd5e1",
  expired: "#94a3b8",
};

const KYC_LABELS: Record<string, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  in_review: "In Review",
  not_submitted: "Not Submitted",
  expired: "Expired",
};

const STATUS_COLORS: Record<string, string> = {
  active: GREEN,
  inactive: "#94a3b8",
  suspended: RED,
};

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
  trend,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  trend?: { value: number; label: string };
}) {
  const isPositive = (trend?.value ?? 0) >= 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
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
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="font-semibold text-slate-800 text-sm">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <Skeleton active paragraph={{ rows: 2 }} title={false} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {[2, 1].map((span, i) => (
          <div
            key={i}
            className={`bg-white rounded-xl border border-slate-200 p-5 xl:col-span-${span}`}
          >
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function getActionColor(action: string) {
  const a = action.toUpperCase();
  if (a.startsWith("LOGIN")) return BLUE;
  if (a.startsWith("CREATE")) return GREEN;
  if (a.startsWith("UPDATE") || a.startsWith("EDIT")) return AMBER;
  if (a.startsWith("DELETE") || a.startsWith("CANCEL")) return RED;
  return SLATE;
}

function ChartTooltip({
  active,
  payload,
  label,
  prefix = "",
  suffix = "",
}: {
  active?: boolean;
  payload?: { value: number; name?: string; color?: string }[];
  label?: string;
  prefix?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      {label && <p className="font-semibold mb-1 text-slate-300">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? "white" }}>
          {p.name ? `${p.name}: ` : ""}{prefix}{p.value.toLocaleString()}{suffix}
        </p>
      ))}
    </div>
  );
}

export default function PartnerAnalyticsPage() {
  const { data, isLoading, isValidating, mutate } = usePartnerAnalytics();

  if (isLoading) {
    return (
      <main className="flex flex-col gap-6 min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Partner Analytics</h2>
            <p className="text-sm text-slate-400 mt-1">Performance overview of the partner ecosystem</p>
          </div>
        </div>
        <PageSkeleton />
      </main>
    );
  }

  if (!data) return null;

  const { kpis, growthTrend, loginTrend, kycFunnel, statusDist, topPartners, recentActivity } = data;

  // Enrich status dist for pie chart
  const statusPieData = statusDist.map((s) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count,
    color: STATUS_COLORS[s.status] ?? SLATE,
  }));

  // KYC funnel for horizontal bar
  const kycData = kycFunnel
    .map((k) => ({ name: KYC_LABELS[k.status] ?? k.status, value: k.count, color: KYC_COLORS[k.status] ?? SLATE }))
    .sort((a, b) => b.value - a.value);

  return (
    <main className="flex flex-col gap-6 min-h-screen">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Partner Analytics</h2>
          <p className="text-sm text-slate-400 mt-1">
            Performance overview of the partner ecosystem
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

      {/* ── KPI row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Partners"
          value={kpis.totalPartners}
          sub={`${kpis.activePartners} active`}
          icon={<TeamOutlined />}
          accent={BLUE}
          trend={{ value: kpis.partnerGrowth, label: "vs last 30 days" }}
        />
        <KpiCard
          label="New This Month"
          value={kpis.newThisMonth}
          sub={`${kpis.newLastMonth} last month`}
          icon={<ArrowUpOutlined />}
          accent={GREEN}
          trend={{ value: kpis.partnerGrowth, label: "growth rate" }}
        />
        <KpiCard
          label="KYC Approved"
          value={kpis.approvedKyc}
          sub={`${kpis.pendingKyc} pending review`}
          icon={<CheckCircleOutlined />}
          accent={GREEN}
        />
        <KpiCard
          label="Pending KYC"
          value={kpis.pendingKyc}
          sub="Awaiting admin review"
          icon={<ClockCircleOutlined />}
          accent={AMBER}
        />
        <KpiCard
          label="Total Turfs"
          value={kpis.totalTurfs}
          sub={`${kpis.activeTurfs} active listings`}
          icon={<EnvironmentOutlined />}
          accent={BLUE}
        />
        <KpiCard
          label="Active Partners"
          value={kpis.activePartners}
          sub={`${Math.round((kpis.activePartners / Math.max(kpis.totalPartners, 1)) * 100)}% of total`}
          icon={<CheckCircleOutlined />}
          accent={GREEN}
        />
        <KpiCard
          label="Suspended"
          value={kpis.suspendedPartners}
          sub="Accounts suspended"
          icon={<ClockCircleOutlined />}
          accent={RED}
        />
        <KpiCard
          label="Avg Turfs / Partner"
          value={
            kpis.totalPartners > 0
              ? (kpis.totalTurfs / kpis.activePartners).toFixed(1)
              : "0"
          }
          sub="Among active partners"
          icon={<EnvironmentOutlined />}
          accent={SLATE}
        />
      </div>

      {/* ── Growth trend + Status pie ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Section
          title="Partner Growth"
          subtitle="New partner registrations over the last 12 months"
          className="xl:col-span-2"
        >
          {growthTrend.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-300 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={growthTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BLUE} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
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
                <ReTooltip content={<ChartTooltip suffix=" partners" />} />
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
        </Section>

        <Section title="Partner Status" subtitle="Distribution by account status">
          {statusPieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-300 text-sm">No data</div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <ReTooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                {statusPieData.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: s.color }}
                    />
                    <span className="text-xs text-slate-500">
                      {s.name}{" "}
                      <span className="font-semibold text-slate-700">{s.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* ── KYC funnel + Login trend ──────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Section title="KYC Funnel" subtitle="Submission status breakdown across all partners">
          {kycData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-300 text-sm">No KYC submissions yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={kycData}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <ReTooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {kycData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        <Section title="Partner Logins" subtitle="Daily login activity over the last 30 days">
          {loginTrend.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-300 text-sm">
              No login data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={loginTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <ReTooltip content={<ChartTooltip suffix=" logins" />} />
                <Bar dataKey="count" fill={BLUE} radius={[3, 3, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      {/* ── Top partners + Recent activity ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Top partners by turf count */}
        <Section title="Top Partners" subtitle="Ranked by number of turf listings">
          {topPartners.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-300 text-sm">
              No partners yet
            </div>
          ) : (
            <div className="flex flex-col gap-0 -mx-5">
              {topPartners.map((p, i) => (
                <div
                  key={p.partnerId}
                  className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  {/* Rank */}
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: i === 0 ? "#fef3c7" : i === 1 ? "#f1f5f9" : "#f8fafc",
                      color: i === 0 ? "#d97706" : i === 1 ? "#64748b" : "#94a3b8",
                    }}
                  >
                    {i + 1}
                  </span>

                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                    style={{ background: BLUE }}
                  >
                    {(p.partnerName ?? "?")[0].toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate leading-tight">
                      {p.partnerName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {p.businessName ?? p.email}
                    </p>
                  </div>

                  {/* Turf count */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">{p.turfCount}</p>
                      <p className="text-[10px] text-slate-400">turfs</p>
                    </div>
                    <Tag
                      color={STATUS_COLORS[p.status] ? undefined : "default"}
                      style={
                        STATUS_COLORS[p.status]
                          ? {
                              color: STATUS_COLORS[p.status],
                              background: STATUS_COLORS[p.status] + "15",
                              borderColor: STATUS_COLORS[p.status] + "30",
                            }
                          : undefined
                      }
                      className="text-xs capitalize m-0"
                    >
                      {p.status}
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Recent activity */}
        <Section title="Recent Partner Activity" subtitle="Last 30 days of partner actions">
          {recentActivity.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-300 text-sm">
              No recent activity
            </div>
          ) : (
            <div className="flex flex-col gap-0 -mx-5">
              {recentActivity.map((a) => {
                const color = getActionColor(a.action);
                return (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 px-5 py-3 border-b border-slate-50 last:border-0"
                  >
                    {/* Action dot */}
                    <div
                      className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                      style={{ background: color }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded font-mono"
                          style={{ color, background: color + "15" }}
                        >
                          {a.action}
                        </span>
                        {a.actorName && (
                          <span className="text-xs text-slate-500 truncate">
                            {a.actorName}
                          </span>
                        )}
                      </div>
                      {a.description && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {a.description}
                        </p>
                      )}
                    </div>

                    <Tooltip title={new Date(a.createdAt).toLocaleString("en-KE")}>
                      <span className="text-[10px] text-slate-300 shrink-0 mt-0.5">
                        {dayjs(a.createdAt).fromNow()}
                      </span>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </main>
  );
}