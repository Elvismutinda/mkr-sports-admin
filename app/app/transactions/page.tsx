"use client";

import { Button, Input, Select, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SyncOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { usePayments } from "@/services/api/payments.service";
import type { AdminPaymentRow, PaymentStatus } from "@/services/_types";

const STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: "orange",
  success: "green",
  failed: "red",
};

export default function PaymentsPage() {
  const [query, setQuery] = useState("");
  const [dq, setDq] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>();

  const { data, isLoading, isValidating, mutate } = usePayments({
    q: dq,
    status: statusFilter,
    limit: 50,
  });

  useEffect(() => {
    const t = setTimeout(() => setDq(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const columns: ColumnsType<AdminPaymentRow> = [
    {
      title: "Player",
      key: "player",
      render: (_: unknown, r: AdminPaymentRow) => (
        <div>
          <p className="font-medium text-sm">{r.userName}</p>
          <p className="text-xs text-slate-400">{r.userEmail}</p>
        </div>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      render: (_: unknown, r: AdminPaymentRow) => (
        <span className="font-mono font-semibold">
          {r.currency} {Number(r.amount).toLocaleString()}
        </span>
      ),
    },
    {
      title: "For",
      key: "for",
      render: (_: unknown, r: AdminPaymentRow) => {
        if (r.tournamentName) return <Tag color="purple">{r.tournamentName}</Tag>;
        if (r.matchLocation) return <Tag color="blue">{r.matchLocation}</Tag>;
        return "—";
      },
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Mpesa Ref",
      dataIndex: "mpesaReceiptNumber",
      key: "mpesa",
      render: (v: string | null) => (
        <span className="font-mono text-xs">{v ?? "—"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: PaymentStatus) => (
        <Tag color={STATUS_COLORS[v]} className="capitalize">
          {v}
        </Tag>
      ),
    },
    {
      title: "Email",
      dataIndex: "emailSent",
      key: "email",
      render: (v: boolean) =>
        v ? <Tag color="green">Sent</Tag> : <Tag color="default">Pending</Tag>,
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Failure",
      dataIndex: "failureReason",
      key: "failure",
      render: (v: string | null) =>
        v ? (
          <Tooltip title={v}>
            <span className="text-red-500 text-xs truncate max-w-30 block">
              {v}
            </span>
          </Tooltip>
        ) : (
          "—"
        ),
    },
  ];

  // Summary stats
  const totalAmount = data?.data.reduce(
    (sum, p) => (p.status === "success" ? sum + Number(p.amount) : sum),
    0,
  ) ?? 0;
  const pendingCount = data?.data.filter((p) => p.status === "pending").length ?? 0;
  const failedCount = data?.data.filter((p) => p.status === "failed").length ?? 0;

  return (
    <main className="flex flex-col gap-4 min-h-screen">
      <div className="flex flex-wrap gap-4 items-center">
        <h2 className="text-2xl font-bold grow">Transactions</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total (page)", value: `KES ${totalAmount.toLocaleString()}`, color: "text-emerald-600" },
          { label: "Total transactions", value: data?.pagination.total ?? 0, color: "text-slate-700" },
          { label: "Pending", value: pendingCount, color: "text-amber-500" },
          { label: "Failed", value: failedCount, color: "text-red-500" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">{c.label}</p>
            <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-center bg-white p-2 rounded-lg flex-wrap">
        <Tooltip title="Refresh">
          <Button
            icon={<SyncOutlined spin={isValidating} />}
            onClick={() => mutate()}
          />
        </Tooltip>
        <Input
          placeholder="Search player, email, receipt..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          placeholder="All Statuses"
          style={{ width: 150 }}
          options={[
            { label: "Pending", value: "pending" },
            { label: "Success", value: "success" },
            { label: "Failed", value: "failed" },
          ]}
        />
      </div>

      <Table<AdminPaymentRow>
        loading={isLoading}
        dataSource={data?.data ?? []}
        columns={columns}
        rowKey="id"
        bordered
        size="small"
        pagination={{
          total: data?.pagination.total,
          pageSize: data?.pagination.limit,
          showSizeChanger: true,
          showTotal: (total) => `${total} payments`,
        }}
      />
    </main>
  );
}