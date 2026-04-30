"use client";

import { Skeleton } from "antd";
import {
  UserOutlined,
  UserSwitchOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  FallOutlined,
} from "@ant-design/icons";
import { useDashboard } from "@/services/api/dashboard.service";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import dayjs from "dayjs";

function StatCard({
  label,
  value,
  icon,
  sub,
  growth,
  accent,
  loading,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  sub?: string;
  growth?: number;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-800/20 p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${accent}`}
        >
          {icon}
        </div>
        {growth !== undefined && (
          <span
            className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
              growth >= 0
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-500"
            }`}
          >
            {growth >= 0 ? <RiseOutlined /> : <FallOutlined />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} title={{ width: 80 }} />
      ) : (
        <>
          <div>
            <p className="text-3xl font-black text-slate-800">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
          {sub && <p className="text-xs text-slate-400">{sub}</p>}
        </>
      )}
    </div>
  );
}


function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
      {children}
    </h3>
  );
}


const MODE_COLORS = ["#2a79b5", "#34d399", "#f59e0b", "#f87171", "#a78bfa"];


export default function DashClients() {
  const { data, isLoading } = useDashboard();

  const registrationData = data?.charts.registrationTrend.map((r) => ({
    date: dayjs(r.date).format("DD MMM"),
    Players: r.count,
  })) ?? [];

  return (
    <section className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Players" value={data?.totals.players ?? 0} icon={<UserOutlined />} accent="bg-blue-100 text-blue-600" growth={data?.players.growth} sub={`+${data?.players.thisMonth ?? 0} this month`} loading={isLoading} />
        <StatCard label="Turf Managers" value={data?.totals.partners ?? 0} icon={<UserSwitchOutlined />} accent="bg-cyan-100 text-cyan-600" loading={isLoading} />
        <StatCard label="Active Turfs" value={data?.totals.turfs ?? 0} icon={<EnvironmentOutlined />} accent="bg-orange-100 text-orange-600" loading={isLoading} />
        <StatCard label="Teams" value={data?.totals.teams ?? 0} icon={<TeamOutlined />} accent="bg-indigo-100 text-indigo-600" loading={isLoading} />
        <StatCard label="Tournaments" value={data?.totals.tournaments ?? 0} icon={<TrophyOutlined />} accent="bg-purple-100 text-purple-600" sub={`${data?.tournaments.ongoing ?? 0} ongoing`} loading={isLoading} />
        <StatCard label="All Matches" value={data?.totals.matches ?? 0} icon={<ThunderboltOutlined />} accent="bg-green-100 text-green-600" sub={`${data?.matches.live ?? 0} live now`} loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-800/20 p-5 shadow-sm">
          <SectionTitle>New Player Registrations — Last 30 Days</SectionTitle>
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : registrationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={registrationData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="playerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2a79b5" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2a79b5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="Players" stroke="#2a79b5" strokeWidth={2} fill="url(#playerGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-55 text-slate-300 text-sm">No data for this period</div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-800/20 p-5 shadow-sm">
          <SectionTitle>Match Modes</SectionTitle>
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : (data?.charts.matchModeDistribution.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data?.charts.matchModeDistribution}
                  dataKey="count"
                  nameKey="mode"
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {data?.charts.matchModeDistribution.map((_, i) => (
                    <Cell key={i} fill={MODE_COLORS[i % MODE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-55 text-slate-300 text-sm">No match data</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-800/20 p-5 shadow-sm">
        <SectionTitle>Top Turfs by Match Count</SectionTitle>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : (data?.topTurfs.length ?? 0) > 0 ? (
          <div className="flex flex-col gap-2">
            {data?.topTurfs.map((t, i) => {
              const max = data.topTurfs[0]?.matchCount ?? 1;
              const pct = Math.round((t.matchCount / max) * 100);
              return (
                <div key={t.name} className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-400 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{t.name}</span>
                      <span className="text-xs text-slate-400">{t.city} · {t.matchCount} matches</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-[#2a79b5] h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No turf data yet.</p>
        )}
      </div>
    </section>
  );
}