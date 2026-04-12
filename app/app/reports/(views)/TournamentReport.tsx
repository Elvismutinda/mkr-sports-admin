"use client";

import { Button, DatePicker, Form, message, Select, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import { useState } from "react";
import dayjs from "dayjs";
import {
  generateTournamentReport,
  type TournamentReportRow,
  type TournamentReportSummary,
} from "@/services/api/reports.service";
import { ReportCard } from "../(components)/ReportCard";
import { ResultSection } from "../(components)/ResultSection";
import { SummaryBar } from "../(components)/SummaryBar";

export default function TournamentReport() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    data: TournamentReportRow[];
    summary: TournamentReportSummary;
  } | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const v = form.getFieldsValue();
      const res = await generateTournamentReport({
        status: v.status,
        format: v.format,
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
    ONGOING: "green",
    COMPLETED: "default",
  };

  const columns: ColumnsType<TournamentReportRow> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      fixed: "left",
      width: 180,
    },
    {
      title: "Format",
      dataIndex: "format",
      key: "format",
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => <Tag color={STATUS_COLORS[v]}>{v}</Tag>,
    },
    { title: "Teams", dataIndex: "teamCount", key: "teams" },
    { title: "Players", dataIndex: "participantCount", key: "players" },
    {
      title: "Entry Fee",
      dataIndex: "entryFee",
      key: "fee",
      render: (v) => `KES ${Number(v).toLocaleString()}`,
    },
    {
      title: "Prize Pool",
      dataIndex: "prizePool",
      key: "prize",
      render: (v) => `KES ${Number(v).toLocaleString()}`,
    },
    {
      title: "Est. Revenue",
      dataIndex: "estimatedRevenue",
      key: "rev",
      render: (v) => (
        <span className="text-emerald-600 font-semibold">
          KES {Number(v).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Venue",
      dataIndex: "turfName",
      key: "turf",
      render: (v) => v ?? "—",
    },
    {
      title: "Starts",
      dataIndex: "startsAt",
      key: "starts",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "—"),
    },
  ];

  return (
    <ReportCard
      title="Tournament Report"
      description="Tournament performance, participation and revenue"
      icon="🏆"
      color="bg-purple-50/60"
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
                { label: "Upcoming", value: "UPCOMING" },
                { label: "Ongoing", value: "ONGOING" },
                { label: "Completed", value: "COMPLETED" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Format" name="format" className="mb-0">
            <Select
              allowClear
              placeholder="All formats"
              options={[
                "LEAGUE",
                "KNOCKOUT",
                "GROUP_STAGE_KNOCKOUT",
                "ROUND_ROBIN",
              ].map((f) => ({ label: f.replace(/_/g, " "), value: f }))}
            />
          </Form.Item>
          <Form.Item
            label="Start Date Range"
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
          reportName="tournament_report"
          summary={
            <SummaryBar
              items={[
                { label: "Total", value: result.summary.total },
                {
                  label: "Ongoing",
                  value: result.summary.ongoing,
                  accent: "text-green-600",
                },
                {
                  label: "Completed",
                  value: result.summary.completed,
                  accent: "text-slate-600",
                },
                {
                  label: "Total Prize Pool",
                  value: `KES ${result.summary.totalPrizePool.toLocaleString()}`,
                  accent: "text-purple-600",
                },
              ]}
            />
          }
        />
      )}
    </ReportCard>
  );
}
