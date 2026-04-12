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
  cancelTournament,
  createTournament,
  updateTournament,
  useTournamentsAdmin,
} from "@/services/api/tournaments.service";
import type { AdminTournamentRow, TournamentStatus } from "@/services/_types";
import { usePermission } from "@/hooks/usePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

const STATUS_COLORS: Record<TournamentStatus, string> = {
  UPCOMING: "blue",
  ONGOING: "green",
  COMPLETED: "default",
};
const FORMATS = [
  "LEAGUE",
  "KNOCKOUT",
  "GROUP_STAGE_KNOCKOUT",
  "ROUND_ROBIN",
] as const;

export default function TournamentsAdminPage() {
  const { hasPermission } = usePermission();
  const [query, setQuery] = useState("");
  const [dq, setDq] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    TournamentStatus | undefined
  >();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTournamentRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, isValidating, mutate } = useTournamentsAdmin({
    q: dq,
    status: statusFilter,
    limit: 50,
  });

  useEffect(() => {
    const t = setTimeout(() => setDq(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const openEdit = (r: AdminTournamentRow) => {
    setEditing(r);
    form.setFieldsValue({
      name: r.name,
      description: r.description,
      location: r.location,
      prizePool: r.prizePool,
      entryFee: r.entryFee,
      maxTeams: r.maxTeams,
      maxPlayersPerTeam: r.maxPlayersPerTeam,
      format: r.format,
      status: r.status,
      rules: r.rules,
      isPublic: r.isPublic,
      startsAt: r.startsAt ? dayjs(r.startsAt) : null,
      endsAt: r.endsAt ? dayjs(r.endsAt) : null,
      registrationDeadline: r.registrationDeadline
        ? dayjs(r.registrationDeadline)
        : null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const v = await form.validateFields();
      const payload = {
        ...v,
        startsAt: v.startsAt?.toISOString() ?? undefined,
        endsAt: v.endsAt?.toISOString() ?? undefined,
        registrationDeadline:
          v.registrationDeadline?.toISOString() ?? undefined,
      };
      if (editing) {
        await updateTournament(editing.id, payload);
        message.open({ type: "success", content: "Tournament updated." });
      } else {
        await createTournament(payload);
        message.open({ type: "success", content: "Tournament created." });
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

  const columns: ColumnsType<AdminTournamentRow> = [
    { title: "Name", dataIndex: "name", key: "name" },
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
      render: (v: TournamentStatus) => <Tag color={STATUS_COLORS[v]}>{v}</Tag>,
    },
    {
      title: "Prize Pool",
      dataIndex: "prizePool",
      key: "prizePool",
      render: (v) => `KES ${Number(v).toLocaleString()}`,
    },
    {
      title: "Participants",
      dataIndex: "participantCount",
      key: "participants",
    },
    {
      title: "Starts",
      dataIndex: "startsAt",
      key: "startsAt",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, r: AdminTournamentRow) => (
        <div className="flex gap-2">
          {hasPermission(Permission.UPDATE_TOURNAMENT) && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(r)}
            />
          )}
          {hasPermission(Permission.DELETE_TOURNAMENT) &&
            r.status !== "COMPLETED" && (
              <Button
                size="small"
                danger
                onClick={async () => {
                  await cancelTournament(r.id);
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

  return (
    <>
      <main className="flex flex-col gap-4 min-h-screen">
        <div className="flex flex-wrap gap-4 items-center">
          <h2 className="text-2xl font-bold grow">Tournaments</h2>
          {hasPermission(Permission.CREATE_TOURNAMENT) && (
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={() => {
                setEditing(null);
                form.resetFields();
                setModalOpen(true);
              }}
            >
              New Tournament
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
            placeholder="Search tournaments..."
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
              { label: "Upcoming", value: "UPCOMING" },
              { label: "Ongoing", value: "ONGOING" },
              { label: "Completed", value: "COMPLETED" },
            ]}
          />
        </div>
        <Table<AdminTournamentRow>
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
        title={editing ? "Edit Tournament" : "New Tournament"}
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
              label="Name"
              name="name"
              rules={[{ required: true }]}
              className="col-span-2"
            >
              <Input />
            </Form.Item>
            <Form.Item label="Format" name="format" initialValue="KNOCKOUT">
              <Select
                options={FORMATS.map((f) => ({
                  label: f.replace(/_/g, " "),
                  value: f,
                }))}
              />
            </Form.Item>
            {editing && (
              <Form.Item label="Status" name="status">
                <Select
                  options={[
                    { label: "Upcoming", value: "UPCOMING" },
                    { label: "Ongoing", value: "ONGOING" },
                    { label: "Completed", value: "COMPLETED" },
                  ]}
                />
              </Form.Item>
            )}
            <Form.Item label="Prize Pool (KES)" name="prizePool">
              <Input placeholder="50000.00" />
            </Form.Item>
            <Form.Item label="Entry Fee (KES)" name="entryFee">
              <Input placeholder="0.00" />
            </Form.Item>
            <Form.Item label="Max Teams" name="maxTeams">
              <InputNumber min={2} className="w-full" />
            </Form.Item>
            <Form.Item label="Max Players/Team" name="maxPlayersPerTeam">
              <InputNumber min={1} className="w-full" />
            </Form.Item>
            <Form.Item label="Starts At" name="startsAt">
              <DatePicker showTime className="w-full" />
            </Form.Item>
            <Form.Item label="Ends At" name="endsAt">
              <DatePicker showTime className="w-full" />
            </Form.Item>
            <Form.Item label="Reg. Deadline" name="registrationDeadline">
              <DatePicker showTime className="w-full" />
            </Form.Item>
            <Form.Item label="Location" name="location">
              <Input />
            </Form.Item>
            <Form.Item
              label="Description"
              name="description"
              className="col-span-2"
            >
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item label="Rules" name="rules" className="col-span-2">
              <Input.TextArea rows={3} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
}
