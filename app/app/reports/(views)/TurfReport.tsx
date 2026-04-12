"use client";

import { Button, DatePicker, Form, message, Select, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import { useState } from "react";
import {
  generateTurfReport,
  type TurfReportRow,
  type TurfReportSummary,
} from "@/services/api/reports.service";
import { ReportCard } from "../(components)/ReportCard";
import { SummaryBar } from "../(components)/SummaryBar";
import { ResultSection } from "../(components)/ResultSection";

export default function TurfReport() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    data: TurfReportRow[];
    summary: TurfReportSummary;
  } | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const v = form.getFieldsValue();
      const res = await generateTurfReport({
        city: v.city,
        surface: v.surface,
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

  const columns: ColumnsType<TurfReportRow> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      fixed: "left",
      width: 160,
    },
    { title: "City", dataIndex: "city", key: "city" },
    {
      title: "Surface",
      dataIndex: "surface",
      key: "surface",
      render: (v) => (v ? <Tag>{v.replace(/_/g, " ")}</Tag> : "—"),
    },
    {
      title: "Price/hr",
      dataIndex: "pricePerHour",
      key: "price",
      render: (v) => (v ? `KES ${v}` : "—"),
    },
    {
      title: "Capacity",
      dataIndex: "capacity",
      key: "cap",
      render: (v) => v ?? "—",
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      render: (v) => `⭐ ${Number(v).toFixed(1)}`,
    },
    {
      title: "Agent",
      dataIndex: "agentName",
      key: "agent",
      render: (v) => v ?? "—",
    },
    { title: "Matches", dataIndex: "matchCount", key: "matches" },
    { title: "Completed", dataIndex: "completedMatchCount", key: "completed" },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      render: (v) => (
        <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag>
      ),
    },
  ];

  return (
    <ReportCard
      title="Turf Utilisation Report"
      description="Turf activity, capacity and agent performance"
      icon="🏟️"
      color="bg-orange-50/60"
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Form.Item label="City" name="city" className="mb-0">
            <Select
              allowClear
              placeholder="All cities"
              options={[
                "Nairobi",
                "Mombasa",
                "Kisumu",
                "Nakuru",
                "Eldoret",
              ].map((c) => ({ label: c, value: c }))}
              showSearch
            />
          </Form.Item>
          <Form.Item label="Surface Type" name="surface" className="mb-0">
            <Select
              allowClear
              placeholder="All surfaces"
              options={[
                "natural_grass",
                "artificial_turf",
                "futsal_floor",
                "indoor",
              ].map((s) => ({ label: s.replace(/_/g, " "), value: s }))}
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
          <Form.Item label="Match Date Range" name="dateRange" className="mb-0">
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
          reportName="turf_report"
          summary={
            <SummaryBar
              items={[
                { label: "Total Turfs", value: result.summary.total },
                {
                  label: "Active",
                  value: result.summary.active,
                  accent: "text-green-600",
                },
                {
                  label: "Inactive",
                  value: result.summary.inactive,
                  accent: "text-red-500",
                },
                {
                  label: "Total Matches",
                  value: result.summary.totalMatches,
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
