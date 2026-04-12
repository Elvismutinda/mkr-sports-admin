"use client";

import {
  Button,
  Dropdown,
  Form,
  Input,
  type MenuProps,
  message,
  Modal,
  Select,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EllipsisOutlined,
  EyeOutlined,
  MailOutlined,
  PlusCircleOutlined,
  SyncOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  createUser,
  resendAgentInvite,
  updateUser,
  useUsers,
} from "@/services/api/users.service";
import { usePermission } from "@/hooks/usePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import { AdminUserRow } from "@/services/_types";

const POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Forward"] as const;

interface AgentFormValues {
  name: string;
  email: string;
  phone?: string;
  position: (typeof POSITIONS)[number];
}

export default function AgentManagement() {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUserRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [addForm] = Form.useForm<AgentFormValues>();
  const [editForm] = Form.useForm<Partial<AgentFormValues>>();

  const { data, isLoading, isValidating, mutate } = useUsers({
    q: debouncedQuery,
    role: "agent",
    limit: 50,
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const values = await addForm.validateFields();
      await createUser({ ...values, role: "agent" });
      message.open({
        type: "success",
        content: "Agent created and invite email sent.",
      });
      addForm.resetFields();
      setAddOpen(false);
      await mutate();
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      const err = e as { error?: string };
      message.open({ type: "error", content: err?.error ?? "Could not create agent." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const values = await editForm.validateFields();
      await updateUser(editTarget.id, values);
      message.open({ type: "success", content: "Agent updated." });
      setEditOpen(false);
      setEditTarget(null);
      await mutate();
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      const err = e as { error?: string };
      message.open({ type: "error", content: err?.error ?? "Update failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvite = useCallback(
    async (agent: AdminUserRow) => {
      try {
        await resendAgentInvite(agent.id);
        message.open({ type: "success", content: "Invite email resent." });
      } catch (e: unknown) {
        const err = e as { error?: string };
        message.open({ type: "error", content: err?.error ?? "Could not resend invite." });
      }
    },
    [],
  );

  const getMenuItems = (): MenuProps["items"] => [
    {
      key: "view",
      icon: <EyeOutlined />,
      label: "View",
    },
    {
      key: "edit",
      icon: <EditOutlined />,
      label: "Edit",
    },
    {
      key: "resend",
      icon: <MailOutlined />,
      label: "Resend Invite",
    },
  ];

  const handleMenuClick = (key: string, record: AdminUserRow) => {
    switch (key) {
      case "view":
        router.push(`/app/users/${record.id}`);
        break;
      case "edit":
        setEditTarget(record);
        editForm.setFieldsValue({
          name: record.name,
          phone: record.phone ?? undefined,
          position: record.position,
        });
        setEditOpen(true);
        break;
      case "resend":
        handleResendInvite(record);
        break;
    }
  };

  const columns: ColumnsType<AdminUserRow> = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone", render: (v) => v ?? "—" },
    {
      title: "Invite Status",
      dataIndex: "emailVerified",
      key: "emailVerified",
      render: (v: string | null) =>
        v ? (
          <Tag color="green">Accepted</Tag>
        ) : (
          <Tag color="orange">Pending</Tag>
        ),
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
        <Dropdown
          placement="bottomRight"
          menu={{
            items: getMenuItems(),
            onClick: ({ key }) => handleMenuClick(key, record),
          }}
        >
          <Button icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <>
      <main className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 items-center">
          {hasPermission(Permission.CREATE_USER) && (
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={() => setAddOpen(true)}
            >
              Add Turf Owner
            </Button>
          )}
        </div>

        <div className="flex gap-2 items-center bg-white p-2 rounded-lg">
          <Tooltip title="Refresh">
            <Button
              icon={<SyncOutlined spin={isValidating} />}
              onClick={() => mutate()}
            />
          </Tooltip>
          <Input
            placeholder="Search name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 260 }}
            allowClear
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
          }}
        />
      </main>

      <Modal
        title="Add Turf Owner"
        open={addOpen}
        destroyOnHidden
        mask={{ closable: false }}
        okText="Create & Send Invite"
        confirmLoading={submitting}
        onOk={handleCreate}
        onCancel={() => { setAddOpen(false); addForm.resetFields(); }}
      >
        <Form form={addForm} layout="vertical" requiredMark={false} className="mt-4">
          <Form.Item label="Full Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Jane Smith" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email" },
            ]}
          >
            <Input placeholder="jane@turfowner.com" />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input placeholder="+254 7XX XXX XXX" />
          </Form.Item>
          <Form.Item label="Position" name="position" rules={[{ required: true }]}>
            <Select options={POSITIONS.map((p) => ({ label: p, value: p }))} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Turf Owner"
        open={editOpen}
        destroyOnHidden
        mask={{ closable: false }}
        okText="Save Changes"
        confirmLoading={submitting}
        onOk={handleEdit}
        onCancel={() => { setEditOpen(false); setEditTarget(null); }}
      >
        <Form form={editForm} layout="vertical" requiredMark={false} className="mt-4">
          <Form.Item label="Full Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="Position" name="position" rules={[{ required: true }]}>
            <Select options={POSITIONS.map((p) => ({ label: p, value: p }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}