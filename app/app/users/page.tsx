"use client";

import {
  Button,
  Input,
  Table,
  Tag,
  Tooltip,
  Form,
  Modal,
  Select,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EyeOutlined,
  PlusCircleOutlined,
  SyncOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  createUser,
  deactivateUser,
  useUsers,
} from "@/services/api/users.service";
import { usePermission } from "@/hooks/usePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { AdminUserRow } from "@/services/_types";

const POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Forward"] as const;

interface CreateFormValues {
  name: string;
  email: string;
  phone?: string;
  position: (typeof POSITIONS)[number];
}

export default function PlayersPage() {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<CreateFormValues>();

  const { data, isLoading, isValidating, mutate } = useUsers({
    q: debouncedQuery,
    role: "player",
    limit: 50,
    ...(statusFilter !== "all" && { isActive: statusFilter === "active" }),
    ...(verifiedFilter !== "all" && { emailVerified: verifiedFilter === "verified" }),
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleDeactivate = useCallback(
    async (record: AdminUserRow) => {
      try {
        await deactivateUser(record.id);
        message.open({ type: "success", content: `${record.name} deactivated.` });
        await mutate();
      } catch (e: unknown) {
        const err = e as { error?: string };
        message.open({ type: "error", content: err?.error ?? "Could not deactivate user." });
      }
    },
    [mutate],
  );

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      await createUser({ ...values, role: "player" });
      message.open({ type: "success", content: "Player created successfully." });
      form.resetFields();
      setAddOpen(false);
      await mutate();
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      const err = e as { error?: string };
      message.open({
        type: "error",
        content: err?.error ?? "Could not create player.",
        duration: 5,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<AdminUserRow> = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone", render: (v) => v ?? "—" },
    { title: "Position", dataIndex: "position", key: "position" },
    {
      title: "Email Verified",
      dataIndex: "emailVerified",
      key: "emailVerified",
      render: (v: string | null) =>
        v ? <Tag color="green">Verified</Tag> : <Tag color="orange">Unverified</Tag>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      render: (v: boolean) => (
        <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => new Date(v).toLocaleDateString("en-KE"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: AdminUserRow) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/app/users/${record.id}`)}
          />
          {hasPermission(Permission.UPDATE_USER) && record.isActive && (
            <Button size="small" danger onClick={() => handleDeactivate(record)}>
              Deactivate
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
          <h2 className="text-2xl font-bold grow">Players</h2>
          {hasPermission(Permission.CREATE_USER) && (
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={() => setAddOpen(true)}
            >
              Add Player
            </Button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center bg-white p-2 rounded-lg">
          <Tooltip title="Refresh">
            <Button
              icon={<SyncOutlined spin={isValidating} />}
              onClick={() => mutate()}
            />
          </Tooltip>
          <Input
            placeholder="Search name or email..."
            prefix={<UserOutlined className="text-slate-400" />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 130 }}
            options={[
              { label: "All Statuses", value: "all" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
          <Select
            value={verifiedFilter}
            onChange={setVerifiedFilter}
            style={{ width: 150 }}
            options={[
              { label: "All Emails", value: "all" },
              { label: "Verified", value: "verified" },
              { label: "Unverified", value: "unverified" },
            ]}
          />
        </div>

        <Table<AdminUserRow>
          loading={isLoading}
          dataSource={data?.data ?? []}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{
            total: data?.pagination.total,
            pageSize: data?.pagination.limit,
            showSizeChanger: true,
          }}
          onRow={(record) => ({
            onClick: () => router.push(`/app/users/${record.id}`),
            className: "cursor-pointer",
          })}
        />
      </main>

      <Modal
        title="Add Player"
        open={addOpen}
        destroyOnHidden
        mask={{ closable: false }}
        okText="Create Player"
        confirmLoading={submitting}
        onOk={handleCreate}
        onCancel={() => { setAddOpen(false); form.resetFields(); }}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-4">
          <Form.Item
            label="Full Name"
            name="name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="e.g. John Doe" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input placeholder="john@example.com" />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input placeholder="+254 7XX XXX XXX" />
          </Form.Item>
          <Form.Item
            label="Position"
            name="position"
            rules={[{ required: true, message: "Position is required" }]}
          >
            <Select
              placeholder="Select position"
              options={POSITIONS.map((p) => ({ label: p, value: p }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}