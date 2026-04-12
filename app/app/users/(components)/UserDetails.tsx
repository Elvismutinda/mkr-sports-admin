"use client";

import {
  Button,
  Descriptions,
  Form,
  Input,
  message,
  Modal,
  Select,
  Tag,
} from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useState } from "react";
import { updateUser } from "@/services/api/users.service";
import { AdminUserRow } from "@/services/_types";

const POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Forward"] as const;

export default function UserDetails({
  user,
  onUpdated,
}: {
  user: AdminUserRow;
  onUpdated: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<{
    name: string;
    phone?: string;
    position: (typeof POSITIONS)[number];
    bio?: string;
    isActive: boolean;
  }>();

  const handleEdit = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      await updateUser(user.id, values);
      message.open({ type: "success", content: "User updated." });
      setEditOpen(false);
      onUpdated();
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      const err = e as { error?: string };
      message.open({ type: "error", content: err?.error ?? "Update failed." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          icon={<EditOutlined />}
          onClick={() => {
            form.setFieldsValue({
              name: user.name,
              phone: user.phone ?? undefined,
              position: user.position,
              bio: user.bio ?? undefined,
              isActive: user.isActive,
            });
            setEditOpen(true);
          }}
        >
          Edit
        </Button>
      </div>

      <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
        <Descriptions.Item label="Name">{user.name}</Descriptions.Item>
        <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
        <Descriptions.Item label="Phone">{user.phone ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Position">{user.position}</Descriptions.Item>
        <Descriptions.Item label="Role" span={1}>
          <Tag color="blue" className="capitalize">
            {user.role}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={user.isActive ? "green" : "red"}>
            {user.isActive ? "Active" : "Inactive"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Email Verified">
          {user.emailVerified ? (
            <Tag color="green">Verified</Tag>
          ) : (
            <Tag color="orange">Unverified</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Last Login">
          {user.lastLoginAt
            ? new Date(user.lastLoginAt).toLocaleString("en-KE")
            : "Never"}
        </Descriptions.Item>
        <Descriptions.Item label="Joined">
          {new Date(user.createdAt).toLocaleString("en-KE")}
        </Descriptions.Item>
        <Descriptions.Item label="Bio" span={2}>
          {user.bio ?? "—"}
        </Descriptions.Item>
        {user.aiAnalysis && (
          <Descriptions.Item label="AI Analysis" span={2}>
            {user.aiAnalysis}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Modal
        title="Edit Player Details"
        open={editOpen}
        destroyOnHidden
        mask={{ closable: false }}
        okText="Save"
        confirmLoading={submitting}
        onOk={handleEdit}
        onCancel={() => setEditOpen(false)}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="mt-4"
        >
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input placeholder="+254 7XX XXX XXX" />
          </Form.Item>
          <Form.Item
            label="Position"
            name="position"
            rules={[{ required: true }]}
          >
            <Select options={POSITIONS.map((p) => ({ label: p, value: p }))} />
          </Form.Item>
          <Form.Item label="Bio" name="bio">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Status" name="isActive">
            <Select
              options={[
                { label: "Active", value: true },
                { label: "Inactive", value: false },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
