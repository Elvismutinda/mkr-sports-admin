"use client";

import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EditOutlined,
  PlusCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  cancelMatch,
  createMatch,
  updateMatch,
  useMatchesAdmin,
} from "@/services/api/matches.service";
import { useTurfs } from "@/services/api/turfs.service";
import { useTeamsAdmin } from "@/services/api/teams.service";
import type { AdminMatchRow, FixtureStatus } from "@/services/_types";
import { usePermission } from "@/hooks/usePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

const STATUS_COLORS: Record<FixtureStatus, string> = {
  UPCOMING: "blue",
  LIVE: "green",
  COMPLETED: "default",
  CANCELLED: "red",
  POSTPONED: "orange",
};
const MODES = ["5v5", "7v7", "11v11", "3v3"] as const;

export default function MatchesAdminPage() {
  const { hasPermission } = usePermission();
  const [query, setQuery] = useState("");
  const [dq, setDq] = useState("");
  const [statusFilter, setStatusFilter] = useState<FixtureStatus | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [editing, setEditing] = useState<AdminMatchRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [scoreForm] = Form.useForm();

  const { data, isLoading, isValidating, mutate } = useMatchesAdmin({
    q: dq,
    status: statusFilter,
    limit: 50,
  });
  const { data: turfsData } = useTurfs({ limit: 100 });
  const { data: teamsData } = useTeamsAdmin({ limit: 100 });

  useEffect(() => {
    const t = setTimeout(() => setDq(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const openEdit = (r: AdminMatchRow) => {
    setEditing(r);
    form.setFieldsValue({
      location: r.location,
      mode: r.mode,
      price: r.price,
      maxPlayers: r.maxPlayers,
      turfId: r.turfId,
      homeTeamId: r.homeTeamId,
      awayTeamId: r.awayTeamId,
      status: r.status,
      roundName: r.roundName,
      isPublic: r.isPublic,
      date: dayjs(r.date),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const v = await form.validateFields();
      const payload = { ...v, date: v.date?.toISOString() };
      if (editing) {
        await updateMatch(editing.id, payload);
        message.open({ type: "success", content: "Match updated." });
      } else {
        await createMatch(payload);
        message.open({ type: "success", content: "Match created." });
      }
      setModalOpen(false);
      form.resetFields();
      setEditing(null);
      await mutate();
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      message.open({
        type: "error",
        content: (e as { error?: string }).error ?? "Failed.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleScore = async () => {
    if (!editing) return;
    setSubmitting(true);
    try {
      const v = await scoreForm.validateFields();
      await updateMatch(editing.id, {
        score: { home: v.home, away: v.away },
        completed: true,
        status: "COMPLETED",
      });
      message.open({ type: "success", content: "Score recorded." });
      setScoreOpen(false);
      await mutate();
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      message.open({
        type: "error",
        content: (e as { error?: string }).error ?? "Failed.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<AdminMatchRow> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    { title: "Location", dataIndex: "location", key: "location" },
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: FixtureStatus) => <Tag color={STATUS_COLORS[v]}>{v}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, r: AdminMatchRow) => (
        <div className="flex gap-2">
          {hasPermission(Permission.UPDATE_MATCH) && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(r)}
            />
          )}
          {hasPermission(Permission.UPDATE_MATCH) && !r.completed && (
            <Button
              size="small"
              onClick={() => {
                setEditing(r);
                scoreForm.setFieldsValue({
                  home: r.score?.home ?? 0,
                  away: r.score?.away ?? 0,
                });
                setScoreOpen(true);
              }}
            >
              Score
            </Button>
          )}
          {hasPermission(Permission.DELETE_MATCH) &&
            r.status !== "CANCELLED" &&
            r.status !== "COMPLETED" && (
              <Button
                size="small"
                danger
                onClick={async () => {
                  await cancelMatch(r.id);
                  await mutate();
                }}
              >
                Cancel
              </Button>
            )}
        </div>
      ),
    },
  ];

  const turfOptions =
    turfsData?.data.map((t) => ({ label: t.name, value: t.id })) ?? [];
  const teamOptions =
    teamsData?.data.map((t) => ({ label: t.name, value: t.id })) ?? [];

  return (
    <>
      <main className="flex flex-col gap-4 min-h-screen">
        <div className="flex flex-wrap gap-4 items-center">
          <h2 className="text-2xl font-bold grow">Matches</h2>
          {hasPermission(Permission.CREATE_MATCH) && (
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={() => {
                setEditing(null);
                form.resetFields();
                setModalOpen(true);
              }}
            >
              New Match
            </Button>
          )}
        </div>
        <div className="flex gap-2 items-center bg-white p-2 rounded-lg flex-wrap">
          <Tooltip title="Refresh">
            <Button
              icon={<SyncOutlined spin={isValidating} />}
              onClick={() => mutate()}
            />
          </Tooltip>
          <Input
            placeholder="Search location, mode..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            placeholder="All Statuses"
            style={{ width: 150 }}
            options={[
              "UPCOMING",
              "LIVE",
              "COMPLETED",
              "CANCELLED",
              "POSTPONED",
            ].map((s) => ({ label: s, value: s }))}
          />
        </div>
        <Table<AdminMatchRow>
          loading={isLoading}
          dataSource={data?.data ?? []}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{
            total: data?.pagination.total,
            pageSize: data?.pagination.limit,
          }}
        />
      </main>

      <Modal
        title={editing ? "Edit Match" : "New Match"}
        open={modalOpen}
        destroyOnHidden
        mask={{ closable: false }}
        okText={editing ? "Save" : "Create"}
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        width={680}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="mt-4"
        >
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              label="Date & Time"
              name="date"
              rules={[{ required: true }]}
              className="col-span-2"
            >
              <DatePicker showTime className="w-full" />
            </Form.Item>
            <Form.Item
              label="Location"
              name="location"
              rules={[{ required: true }]}
              className="col-span-2"
            >
              <Input />
            </Form.Item>
            <Form.Item label="Mode" name="mode" rules={[{ required: true }]}>
              <Select options={MODES.map((m) => ({ label: m, value: m }))} />
            </Form.Item>
            <Form.Item label="Max Players" name="maxPlayers" initialValue={14}>
              <InputNumber min={2} className="w-full" />
            </Form.Item>
            <Form.Item label="Price (KES)" name="price" initialValue="0.00">
              <Input />
            </Form.Item>
            <Form.Item label="Turf" name="turfId">
              <Select
                allowClear
                options={turfOptions}
                placeholder="Select turf"
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item label="Home Team" name="homeTeamId">
              <Select
                allowClear
                options={teamOptions}
                placeholder="Open / TBD"
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item label="Away Team" name="awayTeamId">
              <Select
                allowClear
                options={teamOptions}
                placeholder="Open / TBD"
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            {editing && (
              <Form.Item label="Status" name="status">
                <Select
                  options={[
                    "UPCOMING",
                    "LIVE",
                    "COMPLETED",
                    "CANCELLED",
                    "POSTPONED",
                  ].map((s) => ({ label: s, value: s }))}
                />
              </Form.Item>
            )}
            <Form.Item label="Round" name="roundName">
              <Input placeholder="e.g. Quarter Final" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title={`Record Score — ${editing?.location ?? ""}`}
        open={scoreOpen}
        destroyOnHidden
        mask={{ closable: false }}
        okText="Save Score"
        confirmLoading={submitting}
        onOk={handleScore}
        onCancel={() => setScoreOpen(false)}
      >
        <Form form={scoreForm} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label={`Home (${editing?.homeTeamName ?? "Home"})`}
              name="home"
              initialValue={0}
            >
              <InputNumber min={0} className="w-full" />
            </Form.Item>
            <Form.Item
              label={`Away (${editing?.awayTeamName ?? "Away"})`}
              name="away"
              initialValue={0}
            >
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
}
