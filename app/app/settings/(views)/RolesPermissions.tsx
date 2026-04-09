"use client";

import { Button, message, Modal, Table, Tag } from "antd";
import { EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import {
  addSystemRole,
  updateSystemRole,
  useSystemRoles,
} from "@/services/api/settings.service";
import { type SystemRoleRow } from "@/services/_types";
import ModalAddRolePermission from "../(modals)/ModalAddRolePermission";

interface RoleFormData {
  name: string;
  permissionKeys: string[];
}

export default function RolesPermissions() {
  const { data: roles, isLoading, mutate } = useSystemRoles();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<SystemRoleRow | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    permissionKeys: [],
  });

  useEffect(() => {
    if (!open) setEditingRole(null);
  }, [open]);

  const handleOpen = (role?: SystemRoleRow) => {
    setEditingRole(role ?? null);
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      message.open({ type: "error", content: "Role name is required." });
      return;
    }

    setSubmitting(true);
    try {
      if (editingRole) {
        await updateSystemRole(editingRole.id, {
          name: formData.name,
          permissionKeys: formData.permissionKeys,
        });
        message.open({
          type: "success",
          content: "Role updated successfully.",
        });
      } else {
        await addSystemRole({
          name: formData.name,
          permissionKeys: formData.permissionKeys,
        });
        message.open({
          type: "success",
          content: "Role created successfully.",
        });
      }
      await mutate();
      setOpen(false);
    } catch (e: unknown) {
      const err = e as { error?: string };
      message.open({
        type: "error",
        content: err?.error ?? "Could not complete action. Please try again.",
        duration: 5,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<SystemRoleRow> = [
    { title: "Role Name", dataIndex: "name", key: "name" },
    {
      title: "Permissions",
      dataIndex: "permissions",
      key: "permissions",
      render: (perms: SystemRoleRow["permissions"]) => (
        <Tag color="blue">{perms.length}</Tag>
      ),
    },
    {
      title: "Default",
      dataIndex: "isDefault",
      key: "isDefault",
      render: (v: boolean) => (v ? <Tag color="green">Yes</Tag> : null),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: SystemRoleRow) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleOpen(record)}
        />
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
          Add Role & Permissions
        </Button>

        <Table<SystemRoleRow>
          loading={isLoading}
          dataSource={roles}
          columns={columns}
          rowKey="id"
          bordered
        />
      </main>

      <Modal
        title={
          editingRole ? "Edit Role & Permissions" : "Add Role & Permissions"
        }
        className="w-250! max-w-full!"
        open={open}
        destroyOnHidden
        mask={{ closable: false }}
        okText={editingRole ? "Save Changes" : "Create Role"}
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => setOpen(false)}
      >
        <ModalAddRolePermission
          key={editingRole?.id ?? "new"}
          isEditingData={editingRole}
          onDataChange={setFormData}
        />
      </Modal>
    </>
  );
}
