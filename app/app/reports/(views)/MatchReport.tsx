"use client";

import { Button, DatePicker, Form, message, Select, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import { useState } from "react";
import dayjs from "dayjs";
import {
  generateMatchReport,
  type MatchReportRow,
  type MatchReportSummary,
} from "@/services/api/reports.service";
import { ReportCard } from "../(components)/ReportCard";
import { ResultSection } from "../(components)/ResultSection";
import { SummaryBar } from "../(components)/SummaryBar";

export default function MatchReport() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    data: MatchReportRow[];
    summary: MatchReportSummary;
  } | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const v = form.getFieldsValue();
      const res = await generateMatchReport({
        status: v.status,
        mode: v.mode,
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
    UPCOMING: "blue",
    LIVE: "green",
    COMPLETED: "default",
    CANCELLED: "red",
    POSTPONED: "orange",
  };

  const columns: ColumnsType<MatchReportRow> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      fixed: "left",
      width: 130,
      render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    { title: "Location", dataIndex: "location", key: "location", width: 160 },
    {
      title: "Mode",
      dataIndex: "mode",
      key: "mode",
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: "Home",
      dataIndex: "homeTeamName",
      key: "home",
      render: (v) => v ?? "Open",
    },
    {
      title: "Away",
      dataIndex: "awayTeamName",
      key: "away",
      render: (v) => v ?? "Open",
    },
    {
      title: "Score",
      key: "score",
      render: (_, r) => (r.score ? `${r.score.home} - ${r.score.away}` : "—"),
    },
    {
      title: "Players",
      key: "players",
      render: (_, r) => `${r.registeredCount}/${r.maxPlayers}`,
    },
    {
      title: "Revenue",
      key: "revenue",
      render: (_, r) =>
        `KES ${(r.registeredCount * Number(r.price)).toLocaleString()}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => <Tag color={STATUS_COLORS[v]}>{v}</Tag>,
    },
    {
      title: "Turf",
      dataIndex: "turfName",
      key: "turf",
      render: (v) => v ?? "—",
    },
    {
      title: "Tournament",
      dataIndex: "tournamentName",
      key: "tournament",
      render: (v) => v ?? "—",
    },
  ];

  return (
    <ReportCard
      title="Match Report"
      description="Match activity, results and revenue"
      icon="⚽"
      color="bg-green-50/60"
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Form.Item label="Status" name="status" className="mb-0">
            <Select
              allowClear
              placeholder="All statuses"
              options={[
                "UPCOMING",
                "LIVE",
                "COMPLETED",
                "CANCELLED",
                "POSTPONED",
              ].map((s) => ({ label: s, value: s }))}
            />
          </Form.Item>
          <Form.Item label="Mode" name="mode" className="mb-0">
            <Select
              allowClear
              placeholder="All modes"
              options={["5v5", "7v7", "11v11", "3v3"].map((m) => ({
                label: m,
                value: m,
              }))}
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
          reportName="match_report"
          summary={
            <SummaryBar
              items={[
                { label: "Total", value: result.summary.total },
                {
                  label: "Completed",
                  value: result.summary.completed,
                  accent: "text-green-600",
                },
                {
                  label: "Upcoming",
                  value: result.summary.upcoming,
                  accent: "text-blue-600",
                },
                {
                  label: "Est. Revenue",
                  value: `KES ${result.summary.totalRevenue.toLocaleString()}`,
                  accent: "text-emerald-600",
                },
              ]}
            />
          }
        />
      )}
    </ReportCard>
  );
}
