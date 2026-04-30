"use client";

import {
  Avatar,
  Button,
  Dropdown,
  Form,
  Input,
  type MenuProps,
  message,
  Modal,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EditOutlined,
  EllipsisOutlined,
  MailOutlined,
  PlusCircleOutlined,
  StopOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useRef, useState } from "react";
import {
  createTurfManager,
  resendTurfManagerInvite,
  suspendTurfManager,
  updateTurfManager,
  useTurfManagers,
  type TurfManagerRow,
} from "@/services/api/partners.service";
import { usePermission } from "@/hooks/usePermission";
import { Permission } from "@/_utils/enums/permissions.enum";
import dayjs from "dayjs";

const STATUS_COLORS: Record<TurfManagerRow["status"], string> = {
  active: "green",
  inactive: "orange",
  suspended: "red",
};

function initials(name: string) {
  return name.trim().split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

interface CreateValues { name: string; email: string; phone?: string; businessName?: string }
interface EditValues { name: string; phone?: string; businessName?: string; status: TurfManagerRow["status"] }

export default function TurfManagement() {
  const { hasPermission } = usePermission();
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, isValidating, mutate } = useTurfManagers({ q: dq, page, limit: 50 });

  const handleSearch = (value: string) => {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDq(value); setPage(1); }, 300);
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm<CreateValues>();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const values = await createForm.validateFields();
      await createTurfManager(values);
      message.open({ type: "success", content: "Turf manager created. Invite email sent." });
      createForm.resetFields();
      setCreateOpen(false);
      await mutate();
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      const err = e as { error?: string };
      message.open({ type: "error", content: err?.error ?? "Could not create turf manager." });
    } finally {
      setCreating(false);
    }
  };

  const [editTarget, setEditTarget] = useState<TurfManagerRow | null>(null);
  const [editForm] = Form.useForm<EditValues>();
  const [editing, setEditing] = useState(false);

  const openEdit = (manager: TurfManagerRow) => {
    setEditTarget(manager);
    editForm.setFieldsValue({
      name: manager.name, phone: manager.phone ?? undefined,
      businessName: manager.businessName ?? undefined, status: manager.status,
    });
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setEditing(true);
    try {
      const values = await editForm.validateFields();
      await updateTurfManager(editTarget.id, values);
      message.open({ type: "success", content: "Turf manager updated." });
      setEditTarget(null);
      await mutate();
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      const err = e as { error?: string };
      message.open({ type: "error", content: err?.error ?? "Update failed." });
    } finally {
      setEditing(false);
    }
  };

  const handleSuspend = async (manager: TurfManagerRow) => {
    try {
      await suspendTurfManager(manager.id);
      message.open({ type: "success", content: `"${manager.name}" suspended.` });
      await mutate();
    } catch (e: unknown) {
      const err = e as { error?: string };
      message.open({ type: "error", content: err?.error ?? "Could not suspend." });
    }
  };

  const handleResend = async (manager: TurfManagerRow) => {
    try {
      await resendTurfManagerInvite(manager.id);
      message.open({ type: "success", content: "Invite email resent." });
    } catch (e: unknown) {
      const err = e as { error?: string };
      message.open({ type: "error", content: err?.error ?? "Could not resend invite." });
    }
  };

  const menuItems = (manager: TurfManagerRow): MenuProps["items"] => [
    { key: "edit", icon: <EditOutlined />, label: "Edit" },
    !manager.emailVerified
      ? { key: "resend", icon: <MailOutlined />, label: "Resend Invite" }
      : null,
    manager.status !== "suspended"
      ? { key: "suspend", icon: <StopOutlined />, label: "Suspend", danger: true }
      : null,
  ].filter(Boolean) as MenuProps["items"];

  const handleMenu = (key: string, manager: TurfManagerRow) => {
    switch (key) {
      case "edit": openEdit(manager); break;
      case "resend": handleResend(manager); break;
      case "suspend": handleSuspend(manager); break;
    }
  };

  const columns: ColumnsType<TurfManagerRow> = [
    {
      title: "Manager",
      key: "manager",
      render: (_: unknown, r: TurfManagerRow) => (
        <div className="flex items-center gap-3">
          <Avatar size={36} style={{ backgroundColor: "#2a79b5", fontWeight: 700 }}>
            {initials(r.name)}
          </Avatar>
          <div>
            <p className="font-medium text-sm leading-none">{r.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Business",
      dataIndex: "businessName",
      key: "business",
      render: (v: string | null) => v ? <span className="text-sm">{v}</span> : <span className="text-slate-400 text-xs">—</span>,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (v: string | null) => v ?? "—",
    },
    {
      title: "Invite",
      dataIndex: "emailVerified",
      key: "invite",
      width: 110,
      render: (v: string | null) =>
        v ? <Tag color="green">Accepted</Tag> : <Tag color="orange">Pending</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (v: TurfManagerRow["status"]) => (
        <Tag color={STATUS_COLORS[v]} className="capitalize">{v}</Tag>
      ),
    },
    {
      title: "Last Login",
      dataIndex: "lastLoginAt",
      key: "login",
      width: 140,
      render: (v: string | null) => (
        <span className="text-xs text-slate-500">{v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "Never"}</span>
      ),
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "joined",
      width: 110,
      render: (v: string) => <span className="text-xs text-slate-500">{dayjs(v).format("DD/MM/YYYY")}</span>,
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_: unknown, r: TurfManagerRow) => (
        <Dropdown
          menu={{ items: menuItems(r), onClick: ({ key }) => handleMenu(key, r) }}
          placement="bottomRight"
        >
          <Button icon={<EllipsisOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div>
            <p className="font-bold text-base">Turf Managers</p>
            <p className="text-sm text-slate-500">Partners who manage turfs through the portal</p>
          </div>
          {hasPermission(Permission.CREATE_USER) && (
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={() => setCreateOpen(true)}
              style={{ background: "#2a79b5" }}
            >
              Add Turf Manager
            </Button>
          )}
        </div>

        <div className="flex gap-2 items-center bg-white p-2 rounded-lg">
          <Tooltip title="Refresh">
            <Button icon={<SyncOutlined spin={isValidating} />} onClick={() => mutate()} />
          </Tooltip>
          <Input
            placeholder="Search name, email, or business..."
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 280 }}
            allowClear
            onClear={() => handleSearch("")}
          />
        </div>

        <Table<TurfManagerRow>
          loading={isLoading}
          dataSource={data?.data ?? []}
          columns={columns}
          rowKey="id"
          bordered
          size="small"
          pagination={{
            current: page,
            total: data?.pagination.total,
            pageSize: 50,
            showTotal: (t) => `${t} managers`,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
        />
      </div>

      <Modal
        title="Add Turf Manager"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
        onOk={handleCreate}
        okText="Create & Send Invite"
        confirmLoading={creating}
        destroyOnHidden
        mask={{ closable: false }}
      >
        <Form form={createForm} layout="vertical" requiredMark={false} className="mt-4">
          <Form.Item label="Full Name" name="name" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="Jane Smith" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
            <Input placeholder="jane@turfco.com" />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input placeholder="+254 7XX XXX XXX" />
          </Form.Item>
          <Form.Item label="Business / Company Name" name="businessName">
            <Input placeholder="e.g. Greenfields Turf Co." />
          </Form.Item>
        </Form>
        <p className="text-xs text-slate-400 mt-1">
          A partner portal invite email (48-hour link) will be sent automatically.
        </p>
      </Modal>

      <Modal
        title="Edit Turf Manager"
        open={!!editTarget}
        onCancel={() => setEditTarget(null)}
        onOk={handleEdit}
        okText="Save Changes"
        confirmLoading={editing}
        destroyOnHidden
        mask={{ closable: false }}
      >
        <Form form={editForm} layout="vertical" requiredMark={false} className="mt-4">
          <Form.Item label="Full Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="Business Name" name="businessName">
            <Input />
          </Form.Item>
          <Form.Item label="Status" name="status">
            <Input disabled />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}