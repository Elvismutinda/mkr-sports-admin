"use client";

import {
  Button,
  Drawer,
  Descriptions,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Tooltip,
  Form,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  FileTextOutlined,
  SearchOutlined,
  SyncOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useRef, useState, useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  useKycSubmissions,
  reviewKycSubmission,
} from "@/services/api/partners.service";
import { KycSubmissionRow } from "@/services/_types";

dayjs.extend(relativeTime);

const STATUS_COLOR: Record<string, string> = {
  pending: "gold",
  in_review: "blue",
  approved: "green",
  rejected: "red",
  not_submitted: "default",
  expired: "orange",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
  not_submitted: "Not Submitted",
  expired: "Expired",
};

// ── Risk score (derived from submission attempt number as a proxy) ─────────────
// In a real system this would come from a scoring engine. For now we derive a
// display value so the column is meaningful without a DB change.
function getRiskBadge(attemptNumber: number) {
  if (attemptNumber === 1) return { label: "Low", color: "#16a34a", bg: "#f0fdf4" };
  if (attemptNumber === 2) return { label: "Medium", color: "#d97706", bg: "#fffbeb" };
  return { label: "High", color: "#dc2626", bg: "#fff1f2" };
}

function RejectModal({
  open,
  onCancel,
  onConfirm,
  submitting,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  submitting: boolean;
}) {
  const [form] = Form.useForm<{ reason: string }>();

  const handleOk = async () => {
    const { reason } = await form.validateFields();
    onConfirm(reason);
  };

  useEffect(() => {
    if (!open) form.resetFields();
  }, [open, form]);

  return (
    <Modal
      open={open}
      title={
        <span className="flex items-center gap-2 text-red-600">
          <CloseOutlined />
          Reject KYC Submission
        </span>
      }
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>,
        <Button
          key="reject"
          danger
          type="primary"
          loading={submitting}
          onClick={handleOk}
        >
          Reject Submission
        </Button>,
      ]}
      destroyOnHidden
    >
      <p className="text-sm text-slate-500 mb-4">
        The partner will be notified by email with your rejection reason. They
        may resubmit if resubmission is allowed in KYC settings.
      </p>
      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label="Rejection reason"
          rules={[{ required: true, message: "Please provide a rejection reason" }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="e.g. Documents are blurry or illegible. Please resubmit clear, high-resolution scans."
            maxLength={1000}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function SubmissionDrawer({
  submission,
  onClose,
  onApprove,
  onReject,
  approving,
}: {
  submission: KycSubmissionRow | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (submission: KycSubmissionRow) => void;
  approving: string | null;
}) {
  if (!submission) return null;
  const canAct =
    submission.status === "pending" || submission.status === "in_review";
  const risk = getRiskBadge(submission.attemptNumber);

  return (
    <Drawer
      open={!!submission}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <UserOutlined className="text-blue-600 text-sm" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 leading-tight text-sm">
              {submission.partnerName ?? "Unknown Partner"}
            </p>
            <p className="text-xs text-slate-400 font-normal">
              {submission.partnerEmail}
            </p>
          </div>
        </div>
      }
      width={480}
      destroyOnHidden
      footer={
        canAct ? (
          <div className="flex gap-2 justify-end">
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => onReject(submission)}
            >
              Reject
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={approving === submission.id}
              onClick={() => onApprove(submission.id)}
              style={{ background: "#16a34a", borderColor: "#16a34a" }}
            >
              Approve
            </Button>
          </div>
        ) : null
      }
    >
      <div className="flex flex-col gap-5">
        {/* Status + risk */}
        <div className="flex gap-3">
          <Tag color={STATUS_COLOR[submission.status]} className="text-sm px-3 py-1">
            {STATUS_LABEL[submission.status]}
          </Tag>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ color: risk.color, background: risk.bg }}
          >
            {risk.label} Risk
          </span>
        </div>

        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Business name">
            {submission.partnerBusinessName ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Partner ID">
            <span className="font-mono text-xs">{submission.partnerId}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Submission attempt">
            #{submission.attemptNumber}
          </Descriptions.Item>
          <Descriptions.Item label="Submitted">
            {new Date(submission.submittedAt).toLocaleString("en-KE")}
            <span className="text-slate-400 text-xs ml-2">
              ({dayjs(submission.submittedAt).fromNow()})
            </span>
          </Descriptions.Item>
          {submission.reviewedAt && (
            <Descriptions.Item label="Reviewed">
              {new Date(submission.reviewedAt).toLocaleString("en-KE")}
            </Descriptions.Item>
          )}
          {submission.rejectionReason && (
            <Descriptions.Item label="Rejection reason">
              <span className="text-red-600 text-xs">{submission.rejectionReason}</span>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* Placeholder for document list — wire to kyc_documents table when ready */}
        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Submitted Documents
          </p>
          <p className="text-xs text-slate-400 italic">
            Document viewer coming soon — wire to{" "}
            <code className="bg-slate-200 px-1 rounded">kyc_documents</code> table.
          </p>
        </div>
      </div>
    </Drawer>
  );
}

export default function KycReviews() {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<KycSubmissionRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<KycSubmissionRow | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDq(value); setPage(1); }, 300);
  };

  const { data, isLoading, isValidating, mutate } = useKycSubmissions({
    q: dq,
    status,
    page,
    limit: 20,
  });

  const handleApprove = async (id: string) => {
    setApproving(id);
    try {
      await reviewKycSubmission(id, "approved");
      message.success("KYC submission approved");
      setSelected(null);
      await mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setApproving(null);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await reviewKycSubmission(rejectTarget.id, "rejected", { rejectionReason: reason });
      message.success("KYC submission rejected");
      setRejectTarget(null);
      setSelected(null);
      await mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setRejecting(false);
    }
  };

  const columns: ColumnsType<KycSubmissionRow> = [
    {
      title: "Partner Name",
      key: "partner",
      render: (_: unknown, r: KycSubmissionRow) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <UserOutlined className="text-blue-600 text-xs" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800 leading-tight">
              {r.partnerName ?? "Unknown"}
            </p>
            <p className="text-xs text-slate-400">{r.partnerEmail}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Risk Score",
      key: "risk",
      width: 120,
      render: (_: unknown, r: KycSubmissionRow) => {
        const risk = getRiskBadge(r.attemptNumber);
        return (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ color: risk.color, background: risk.bg }}
          >
            {risk.label}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (v: string) => (
        <Tag color={STATUS_COLOR[v] ?? "default"}>
          {STATUS_LABEL[v] ?? v}
        </Tag>
      ),
    },
    {
      title: "Submitted",
      dataIndex: "submittedAt",
      key: "submitted",
      width: 160,
      render: (v: string) => (
        <Tooltip title={new Date(v).toLocaleString("en-KE")}>
          <span className="text-xs text-slate-500">{dayjs(v).fromNow()}</span>
        </Tooltip>
      ),
    },
    {
      title: "Reviewer",
      key: "reviewer",
      width: 120,
      render: (_: unknown, r: KycSubmissionRow) =>
        r.reviewedAt ? (
          <span className="text-xs text-slate-500">Reviewed</span>
        ) : (
          <span className="text-xs text-slate-300 italic">Unassigned</span>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_: unknown, r: KycSubmissionRow) => {
        const canAct = r.status === "pending" || r.status === "in_review";
        return (
          <div className="flex items-center gap-1.5">
            <Tooltip title="View details">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={(e) => { e.stopPropagation(); setSelected(r); }}
              />
            </Tooltip>
            {canAct && (
              <>
                <Tooltip title="Approve">
                  <Button
                    size="small"
                    icon={<CheckOutlined />}
                    style={{ color: "#16a34a", borderColor: "#16a34a" }}
                    loading={approving === r.id}
                    onClick={(e) => { e.stopPropagation(); handleApprove(r.id); }}
                  />
                </Tooltip>
                <Tooltip title="Reject">
                  <Button
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={(e) => { e.stopPropagation(); setRejectTarget(r); }}
                  />
                </Tooltip>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap items-center">
        <Tooltip title="Refresh">
          <Button
            icon={<SyncOutlined spin={isValidating} />}
            onClick={() => mutate()}
          />
        </Tooltip>
        <Input
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Search by partner name..."
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
          onClear={() => handleSearch("")}
          style={{ width: 260 }}
        />
        <Select
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          allowClear
          placeholder="All"
          style={{ width: 160 }}
          options={[
            { label: "Pending", value: "pending" },
            { label: "In Review", value: "in_review" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
            { label: "Expired", value: "expired" },
          ]}
        />
      </div>

      <Table<KycSubmissionRow>
        loading={isLoading}
        dataSource={data?.data ?? []}
        columns={columns}
        rowKey="id"
        size="small"
        onRow={(r) => ({
          onClick: () => setSelected(r),
          className: "cursor-pointer hover:bg-slate-50 transition-colors",
        })}
        pagination={{
          current: page,
          total: data?.pagination.total,
          pageSize: 20,
          showTotal: (t) => `${t.toLocaleString()} submissions`,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
        }}
        locale={{
          emptyText: (
            <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <FileTextOutlined className="text-2xl text-slate-300" />
              </div>
              <span className="text-sm">No submissions found</span>
            </div>
          ),
        }}
      />

      <SubmissionDrawer
        submission={selected}
        onClose={() => setSelected(null)}
        onApprove={handleApprove}
        onReject={(s) => { setRejectTarget(s); }}
        approving={approving}
      />

      <RejectModal
        open={!!rejectTarget}
        onCancel={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        submitting={rejecting}
      />
    </div>
  );
}