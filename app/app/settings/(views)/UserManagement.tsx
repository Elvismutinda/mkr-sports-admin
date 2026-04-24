"use client";

import {
  Alert,
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Table,
  Tag,
} from "antd";
import { EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import {
  createSystemUser,
  suspendSystemUser,
  updateSystemUser,
  useSystemRoles,
  useSystemUsers,
} from "@/services/api/settings.service";
import { type SystemUserRow } from "@/services/_types";

const STATUS_COLORS: Record<SystemUserRow["status"], string> = {
  active: "green",
  inactive: "orange",
  suspended: "red",
};

interface UserFormValues {
  name: string;
  email: string;
  phone?: string;
  roleId?: string;
}

export default function UserManagement() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUserRow | null>(null);
  const [form] = Form.useForm<UserFormValues>();

  const { data: usersData, isLoading, mutate } = useSystemUsers({ limit: 100 });
  const { data: roles, isLoading: rolesLoading } = useSystemRoles();

  // Populate form when editing
  useEffect(() => {
    if (!open) return;

    if (editingUser) {
      form.setFieldsValue({
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone ?? undefined,
        roleId: editingUser.roleId ?? undefined,
      });
    } else {
      form.resetFields();
    }
  }, [editingUser, open, form]);

  // Reset editing state when modal closes
  useEffect(() => {
    if (!open) setEditingUser(null);
  }, [open]);

  const handleOpen = (user?: SystemUserRow) => {
    setEditingUser(user ?? null);
    setOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();

      if (editingUser) {
        await updateSystemUser(editingUser.id, {
          name: values.name,
          phone: values.phone,
          roleId: values.roleId ?? null,
        });
        message.open({
          type: "success",
          content: "User updated successfully.",
        });
      } else {
        await createSystemUser(values);
        message.open({
          type: "success",
          content:
            "User created. They will receive an email to set their password.",
        });
      }

      await mutate();
      setOpen(false);
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return; // validation error
      const err = e as { error?: string };
      message.open({
        type: "error",
        content: err?.error ?? "Something went wrong. Please try again.",
        duration: 5,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async (user: SystemUserRow) => {
    try {
      await suspendSystemUser(user.id);
      message.open({
        type: "success",
        content: `${user.name} has been suspended.`,
      });
      await mutate();
    } catch (e: unknown) {
      const err = e as { error?: string };
      message.open({
        type: "error",
        content: err?.error ?? "Could not suspend user.",
      });
    }
  };

  const columns: ColumnsType<SystemUserRow> = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (v) => v ?? "—",
    },
    {
      title: "Role",
      dataIndex: "roleName",
      key: "role",
      render: (v) => v ?? "—",
    },
    {
      title: "Last Login",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      render: (v: string | null) =>
        v ? new Date(v).toLocaleString("en-KE") : "Never",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: SystemUserRow["status"]) => (
        <Tag color={STATUS_COLORS[status]} className="capitalize">
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: SystemUserRow) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpen(record)}
          />
          {record.status !== "suspended" && (
            <Button size="small" danger onClick={() => handleSuspend(record)}>
              Suspend
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <main className="flex flex-col gap-4">
        <Button
          type="primary"
          icon={<PlusCircleOutlined />}
          className="w-fit"
          onClick={() => handleOpen()}
        >
          Add System User
        </Button>

        <Table<SystemUserRow>
          loading={isLoading}
          dataSource={usersData?.data ?? []}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{
            total: usersData?.pagination.total,
            pageSize: usersData?.pagination.limit,
          }}
        />
      </main>

      <Modal
        title={editingUser ? "Edit System User" : "Add System User"}
        open={open}
        destroyOnHidden
        mask={{ closable: false }}
        okText={editingUser ? "Save Changes" : "Create User"}
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => setOpen(false)}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="mt-4"
        >
          <Form.Item
            label="Full Name"
            name="name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="e.g. Jane Doe" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input
              placeholder="jane@mkrsports.com"
              disabled={!!editingUser} // email cannot be changed after creation
            />
          </Form.Item>

          <Form.Item label="Phone" name="phone">
            <Input placeholder="+254 7XX XXX XXX" />
          </Form.Item>

          <Form.Item label="Role" name="roleId">
            <Select
              loading={rolesLoading}
              placeholder="Assign a role"
              allowClear
              options={roles.map((r) => ({ label: r.name, value: r.id }))}
            />
          </Form.Item>

          {!editingUser && (
            <Alert
              showIcon
              type="info"
              title="A temporary password will be generated. The user will receive an email to set their own password."
            />
          )}
        </Form>
      </Modal>
    </>
  );
}
