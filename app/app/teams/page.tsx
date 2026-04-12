"use client";

import {
  Button,
  Descriptions,
  Form,
  Input,
  message,
  Modal,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EditOutlined,
  EyeOutlined,
  PlusCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import {
  createTeam,
  deactivateTeam,
  updateTeam,
  useTeamAdmin,
  useTeamsAdmin,
} from "@/services/api/teams.service";
import type { AdminTeamRow } from "@/services/_types";
import { usePermission } from "@/hooks/usePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

type ViewTeamType = AdminTeamRow & {
  members?: {
    id: string;
    name: string;
    position: string | null;
    jerseyNumber: number | null;
  }[];
};

export default function TeamsAdminPage() {
  const { hasPermission } = usePermission();
  const [query, setQuery] = useState("");
  const [dq, setDq] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminTeamRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data, isLoading, isValidating, mutate } = useTeamsAdmin({
    q: dq,
    limit: 50,
  });
  const { data: viewTeam, isLoading: viewLoading } = useTeamAdmin(viewId);

  useEffect(() => {
    const t = setTimeout(() => setDq(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const v = await addForm.validateFields();
      await createTeam(v);
      message.open({ type: "success", content: "Team created." });
      addForm.resetFields();
      setAddOpen(false);
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

  const handleEdit = async () => {
    if (!editing) return;
    setSubmitting(true);
    try {
      const v = await editForm.validateFields();
      await updateTeam(editing.id, v);
      message.open({ type: "success", content: "Team updated." });
      setEditOpen(false);
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

  const columns: ColumnsType<AdminTeamRow> = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Type", dataIndex: "type", key: "type", render: (v) => v ?? "—" },
    {
      title: "Captain",
      dataIndex: "captainName",
      key: "captain",
      render: (v) => v ?? "—",
    },
    { title: "Members", dataIndex: "memberCount", key: "memberCount" },
    { title: "W", render: (_, r) => r.stats?.wins ?? 0 },
    { title: "D", render: (_, r) => r.stats?.draws ?? 0 },
    { title: "L", render: (_, r) => r.stats?.losses ?? 0 },
    { title: "Pts", render: (_, r) => r.stats?.points ?? 0 },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      render: (v) => (
        <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, r: AdminTeamRow) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setViewId(r.id)}
          />
          {hasPermission(Permission.UPDATE_TEAM) && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(r);
                editForm.setFieldsValue({
                  name: r.name,
                  type: r.type,
                  bio: r.bio,
                  badgeFallback: r.badgeFallback,
                });
                setEditOpen(true);
              }}
            />
          )}
          {hasPermission(Permission.DELETE_TEAM) && r.isActive && (
            <Button
              size="small"
              danger
              onClick={async () => {
                await deactivateTeam(r.id);
                await mutate();
              }}
            >
              Deactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  const team = viewTeam as ViewTeamType | undefined;

  return (
    <>
      <main className="flex flex-col gap-4 min-h-screen">
        <div className="flex flex-wrap gap-4 items-center">
          <h2 className="text-2xl font-bold grow">Teams</h2>
          {hasPermission(Permission.CREATE_TEAM) && (
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={() => {
                addForm.resetFields();
                setAddOpen(true);
              }}
            >
              Add Team
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
            placeholder="Search teams..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />
        </div>
        <Table<AdminTeamRow>
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
        title="Add Team"
        open={addOpen}
        destroyOnHidden
        mask={{ closable: false }}
        okText="Create"
        confirmLoading={submitting}
        onOk={handleCreate}
        onCancel={() => setAddOpen(false)}
      >
        <Form
          form={addForm}
          layout="vertical"
          requiredMark={false}
          className="mt-4"
        >
          <Form.Item label="Team Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Type" name="type">
            <Input placeholder="e.g. 5-a-side" />
          </Form.Item>
          <Form.Item label="Badge Initials" name="badgeFallback">
            <Input maxLength={8} placeholder="e.g. NN" />
          </Form.Item>
          <Form.Item label="Bio" name="bio">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Team"
        open={editOpen}
        destroyOnHidden
        mask={{ closable: false }}
        okText="Save"
        confirmLoading={submitting}
        onOk={handleEdit}
        onCancel={() => setEditOpen(false)}
      >
        <Form
          form={editForm}
          layout="vertical"
          requiredMark={false}
          className="mt-4"
        >
          <Form.Item label="Team Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Type" name="type">
            <Input />
          </Form.Item>
          <Form.Item label="Badge Initials" name="badgeFallback">
            <Input maxLength={8} />
          </Form.Item>
          <Form.Item label="Bio" name="bio">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={viewTeam?.name ?? "Team"}
        open={!!viewId}
        footer={null}
        onCancel={() => setViewId(null)}
        width={700}
      >
        {viewLoading ? (
          <p>Loading...</p>
        ) : (
          team && (
            <>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="Type">
                  {team.type ?? "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Captain">
                  {team.captainName ?? "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Members">
                  {team.memberCount}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={team.isActive ? "green" : "red"}>
                    {team.isActive ? "Active" : "Inactive"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Bio" span={2}>
                  {team.bio ?? "—"}
                </Descriptions.Item>
              </Descriptions>
              {team.members && team.members.length > 0 && (
                <div className="mt-4">
                  <p className="font-bold mb-2">Members</p>
                  <Table
                    size="small"
                    dataSource={
                      (
                        viewTeam as AdminTeamRow & {
                          members?: {
                            id: string;
                            name: string;
                            position: string | null;
                            jerseyNumber: number | null;
                          }[];
                        }
                      ).members
                    }
                    rowKey="id"
                    pagination={false}
                    columns={[
                      {
                        title: "#",
                        dataIndex: "jerseyNumber",
                        render: (v) => v ?? "—",
                      },
                      { title: "Name", dataIndex: "name" },
                      {
                        title: "Position",
                        dataIndex: "position",
                        render: (v) => v ?? "—",
                      },
                    ]}
                  />
                </div>
              )}
            </>
          )
        )}
      </Modal>
    </>
  );
}
