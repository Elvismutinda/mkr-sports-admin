"use client";

import { Button, DatePicker, Form, message, Select, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import { useState } from "react";
import dayjs from "dayjs";
import {
  generatePaymentReport,
  type PaymentReportRow,
  type PaymentReportSummary,
} from "@/services/api/reports.service";
import { ReportCard } from "../(components)/ReportCard";
import { ResultSection } from "../(components)/ResultSection";
import { SummaryBar } from "../(components)/SummaryBar";

export default function PaymentReport() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    data: PaymentReportRow[];
    summary: PaymentReportSummary;
  } | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const v = form.getFieldsValue();
      const res = await generatePaymentReport({
        status: v.status,
        type: v.type,
        dateFrom: v.dateRange?.[0]?.startOf("day").toISOString(),
        dateTo: v.dateRange?.[1]?.endOf("day").toISOString(),
      });
      setResult(res);
    } catch {
      message.error("Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "orange",
    success: "green",
    failed: "red",
  };

  const columns: ColumnsType<PaymentReportRow> = [
    {
      title: "Player",
      key: "player",
      fixed: "left",
      width: 160,
      render: (_, r) => (
        <div>
          <p className="font-medium text-xs">{r.userName}</p>
          <p className="text-[10px] text-slate-400">{r.userEmail}</p>
        </div>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      render: (_, r) => (
        <span className="font-mono font-bold">
          {r.currency} {Number(r.amount).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => <Tag color={STATUS_COLORS[v]}>{v}</Tag>,
    },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    {
      title: "Receipt",
      dataIndex: "mpesaReceiptNumber",
      key: "receipt",
      render: (v) => <span className="font-mono text-xs">{v ?? "—"}</span>,
    },
    {
      title: "For",
      key: "for",
      render: (_, r) =>
        r.tournamentName ? (
          <Tag color="purple">{r.tournamentName}</Tag>
        ) : r.matchLocation ? (
          <Tag color="blue">{r.matchLocation}</Tag>
        ) : (
          "—"
        ),
    },
    {
      title: "Failure",
      dataIndex: "failureReason",
      key: "failure",
      render: (v) =>
        v ? <span className="text-red-500 text-xs">{v}</span> : "—",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
  ];

  return (
    <ReportCard
      title="Revenue Report"
      description="Payment transactions and financial summary"
      icon="💰"
      color="bg-emerald-50/60"
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Form.Item label="Payment Status" name="status" className="mb-0">
            <Select
              allowClear
              placeholder="All statuses"
              options={[
                { label: "Success", value: "success" },
                { label: "Pending", value: "pending" },
                { label: "Failed", value: "failed" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Payment Type" name="type" className="mb-0">
            <Select
              allowClear
              placeholder="All types"
              options={[
                { label: "Match Payments", value: "match" },
                { label: "Tournament Payments", value: "tournament" },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Date Range"
            name="dateRange"
            className="mb-0 col-span-full"
          >
            <DatePicker.RangePicker className="w-full" />
          </Form.Item>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SearchOutlined />}
            style={{ background: "#2a79b5" }}
          >
            Generate Report
          </Button>
          <Button
            onClick={() => {
              form.resetFields();
              setResult(null);
            }}
          >
            Reset
          </Button>
        </div>
      </Form>
      {result && (
        <ResultSection
          data={result.data}
          columns={columns}
          reportName="revenue_report"
          summary={
            <SummaryBar
              items={[
                {
                  label: "Transactions",
                  value: result.summary.totalTransactions,
                },
                {
                  label: "Total Revenue",
                  value: `KES ${result.summary.totalRevenue.toLocaleString()}`,
                  accent: "text-emerald-600",
                },
                {
                  label: "Successful",
                  value: result.summary.successCount,
                  accent: "text-green-600",
                },
                {
                  label: "Failed",
                  value: result.summary.failedCount,
                  accent: "text-red-500",
                },
              ]}
            />
          }
        />
      )}
    </ReportCard>
  );
}
