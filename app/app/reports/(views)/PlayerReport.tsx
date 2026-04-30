"use client";

import { Button, DatePicker, Form, message, Select, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import { useState } from "react";
import dayjs from "dayjs";
import {
  generatePlayerReport,
  type PlayerReportRow,
  type PlayerReportSummary,
} from "@/services/api/reports.service";
import { ReportCard } from "../(components)/ReportCard";
import { SummaryBar } from "../(components)/SummaryBar";
import { ResultSection } from "../(components)/ResultSection";

export default function PlayerReport() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    data: PlayerReportRow[];
    summary: PlayerReportSummary;
  } | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const v = form.getFieldsValue();
      const res = await generatePlayerReport({
        role: v.role,
        isActive: v.isActive,
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

  const columns: ColumnsType<PlayerReportRow> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      fixed: "left",
      width: 140,
    },
    { title: "Email", dataIndex: "email", key: "email", width: 200 },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (v) => (
        <Tag color="blue" className="capitalize">
          {v}
        </Tag>
      ),
    },
    { title: "Position", dataIndex: "position", key: "position" },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      render: (v) => (
        <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Email Verified",
      dataIndex: "emailVerified",
      key: "verified",
      render: (v) =>
        v ? <Tag color="green">Yes</Tag> : <Tag color="orange">No</Tag>,
    },
    { title: "Matches", render: (_, r) => r.stats?.matchesPlayed ?? 0 },
    { title: "Goals", render: (_, r) => r.stats?.goals ?? 0 },
    { title: "Rating", render: (_, r) => r.stats?.rating?.toFixed(1) ?? "—" },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "joined",
      render: (v) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Last Login",
      dataIndex: "lastLoginAt",
      key: "login",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "Never"),
    },
  ];

  return (
    <ReportCard
      title="Player Report"
      description="Player registration, activity and stats"
      icon="👤"
      color="bg-blue-50/60"
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Form.Item label="Role" name="role" className="mb-0">
            <Select
              allowClear
              placeholder="All roles"
              options={[
                { label: "Players", value: "player" },
                { label: "Partners", value: "partner" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Status" name="isActive" className="mb-0">
            <Select
              allowClear
              placeholder="All statuses"
              options={[
                { label: "Active", value: "true" },
                { label: "Inactive", value: "false" },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Date Range (joined)"
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
          reportName="player_report"
          summary={
            <SummaryBar
              items={[
                {
                  label: "Total",
                  value: result.summary.total,
                  accent: "text-slate-800",
                },
                {
                  label: "Verified",
                  value: result.summary.verified,
                  accent: "text-green-600",
                },
                {
                  label: "Unverified",
                  value: result.summary.unverified,
                  accent: "text-amber-600",
                },
                {
                  label: "Active",
                  value: result.summary.active,
                  accent: "text-blue-600",
                },
              ]}
            />
          }
        />
      )}
    </ReportCard>
  );
}
