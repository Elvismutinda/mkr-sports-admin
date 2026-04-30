"use client";

import {
  Button,
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
import {
  createTurf,
  deactivateTurf,
  updateTurf,
  useTurfs,
} from "@/services/api/turfs.service";
import type { AdminTurfRow } from "@/services/_types";
import { usePermission } from "@/hooks/usePermission";
import { Permission } from "@/_utils/enums/permissions.enum";

const SURFACES = [
  "natural_grass",
  "artificial_turf",
  "futsal_floor",
  "indoor",
] as const;
type SurfaceType = (typeof SURFACES)[number];

interface TurfFormValues {
  name: string;
  city: string;
  area?: string;
  address?: string;
  surface?: SurfaceType;
  pricePerHour?: string;
  capacity?: number;
  amenities?: string[];
}

export default function TurfsPage() {
  const { hasPermission } = usePermission();
  const [query, setQuery] = useState("");
  const [dq, setDq] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTurfRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<TurfFormValues>();

  const { data, isLoading, isValidating, mutate } = useTurfs({
    q: dq,
    limit: 50,
  });

  useEffect(() => {
    const t = setTimeout(() => setDq(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };
  const openEdit = (r: AdminTurfRow) => {
    setEditing(r);
    form.setFieldsValue({
      name: r.name,
      city: r.city,
      area: r.area ?? undefined,
      address: r.address ?? undefined,
      surface: r.surface ?? undefined,
      pricePerHour: r.pricePerHour ?? undefined,
      capacity: r.capacity ?? undefined,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const v = await form.validateFields();
      if (editing) {
        await updateTurf(editing.id, v);
        message.open({ type: "success", content: "Turf updated." });
      } else {
        await createTurf(v as Parameters<typeof createTurf>[0]);
        message.open({ type: "success", content: "Turf created." });
      }
      setModalOpen(false);
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

  const columns: ColumnsType<AdminTurfRow> = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "City", dataIndex: "city", key: "city" },
    { title: "Area", dataIndex: "area", key: "area", render: (v) => v ?? "—" },
    {
      title: "Surface",
      dataIndex: "surface",
      key: "surface",
      render: (v) => (v ? <Tag>{v.replace("_", " ")}</Tag> : "—"),
    },
    {
      title: "Price/hr",
      dataIndex: "pricePerHour",
      key: "price",
      render: (v) => (v ? `KES ${v}` : "—"),
    },
    {
      title: "Partner",
      dataIndex: "partnerName",
      key: "partner",
      render: (v) => v ?? "—",
    },
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
      render: (_: unknown, r: AdminTurfRow) => (
        <div className="flex gap-2">
          {hasPermission(Permission.UPDATE_TURF) && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(r)}
            />
          )}
          {hasPermission(Permission.DELETE_TURF) && r.isActive && (
            <Button
              size="small"
              danger
              onClick={async () => {
                await deactivateTurf(r.id);
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

  return (
    <>
      <main className="flex flex-col gap-4 min-h-screen">
        <div className="flex flex-wrap gap-4 items-center">
          <h2 className="text-2xl font-bold grow">Turfs</h2>
          {hasPermission(Permission.CREATE_TURF) && (
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={openAdd}
            >
              Add Turf
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
            placeholder="Search name, city, area..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />
        </div>
        <Table<AdminTurfRow>
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
        />
      </main>

      <Modal
        title={editing ? "Edit Turf" : "Add Turf"}
        open={modalOpen}
        destroyOnHidden
        mask={{ closable: false }}
        okText={editing ? "Save" : "Create"}
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
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
          <Form.Item label="City" name="city" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Area" name="area">
            <Input />
          </Form.Item>
          <Form.Item label="Address" name="address">
            <Input />
          </Form.Item>
          <Form.Item label="Surface" name="surface">
            <Select
              allowClear
              options={SURFACES.map((s) => ({
                label: s.replace(/_/g, " "),
                value: s,
              }))}
            />
          </Form.Item>
          <Form.Item label="Price per Hour (KES)" name="pricePerHour">
            <Input placeholder="e.g. 2500.00" />
          </Form.Item>
          <Form.Item label="Capacity" name="capacity">
            <InputNumber min={1} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
