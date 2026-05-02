"use client";

import {
  Button,
  Input,
  Modal,
  Form,
  Skeleton,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  SearchOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  useKycDocuments,
  reviewKycDocument,
} from "@/services/api/partners.service";
import { KycDocumentBundle, KycDocumentRow } from "@/services/_types";

dayjs.extend(relativeTime);

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocTypeIcon({ mimeType }: { mimeType: string | null }) {
  if (mimeType?.startsWith("image/"))
    return <FileImageOutlined className="text-blue-500" />;
  if (mimeType === "application/pdf")
    return <FilePdfOutlined className="text-red-500" />;
  return <FileTextOutlined className="text-slate-400" />;
}

const DOC_STATUS_COLOR = {
  pending: "gold",
  accepted: "green",
  rejected: "red",
} as const;

const DOC_STATUS_LABEL = {
  pending: "Unverified",
  accepted: "Accepted",
  rejected: "Rejected",
} as const;

function RejectDocModal({
  doc,
  onCancel,
  onConfirm,
  submitting,
}: {
  doc: KycDocumentRow | null;
  onCancel: () => void;
  onConfirm: (note: string) => void;
  submitting: boolean;
}) {
  const [form] = Form.useForm<{ note: string }>();

  useEffect(() => {
    if (!doc) form.resetFields();
  }, [doc, form]);

  return (
    <Modal
      open={!!doc}
      title={
        <span className="flex items-center gap-2 text-red-600">
          <WarningOutlined />
          Reject Document
        </span>
      }
      onCancel={onCancel}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>,
        <Button
          key="reject"
          danger
          type="primary"
          loading={submitting}
          onClick={async () => {
            const { note } = await form.validateFields();
            onConfirm(note);
          }}
        >
          Reject Document
        </Button>,
      ]}
    >
      {doc && (
        <p className="text-sm text-slate-500 mb-4">
          Rejecting <strong>{doc.documentLabel}</strong>. The partner will see
          this note when reviewing their submission.
        </p>
      )}
      <Form form={form} layout="vertical">
        <Form.Item
          name="note"
          label="Rejection note"
          rules={[
            {
              required: true,
              message: "Please explain why this document is rejected",
            },
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="e.g. Image is blurry — please resubmit a clear, high-resolution scan."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function DocRow({
  doc,
  onAccept,
  onReject,
  actingOn,
}: {
  doc: KycDocumentRow;
  onAccept: (doc: KycDocumentRow) => void;
  onReject: (doc: KycDocumentRow) => void;
  actingOn: string | null;
}) {
  const isPending = doc.status === "pending";
  const isActing = actingOn === doc.id;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0">
      <DocTypeIcon mimeType={doc.mimeType} />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 truncate">
          {doc.documentLabel}
        </p>
        {doc.sizeBytes && (
          <p className="text-[10px] text-slate-400">
            {formatBytes(doc.sizeBytes)}
          </p>
        )}
        {doc.rejectionNote && (
          <p className="text-[10px] text-red-500 mt-0.5 truncate">
            {doc.rejectionNote}
          </p>
        )}
      </div>

      <Tag color={DOC_STATUS_COLOR[doc.status]} className="text-xs shrink-0">
        {DOC_STATUS_LABEL[doc.status]}
      </Tag>

      <Tooltip title="Open file">
        <Button
          type="text"
          size="small"
          icon={<FileTextOutlined />}
          href={doc.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-blue-600"
        />
      </Tooltip>

      {isPending && (
        <div className="flex gap-1 shrink-0">
          <Tooltip title="Accept">
            <Button
              size="small"
              icon={<CheckOutlined />}
              style={{ color: "#16a34a", borderColor: "#16a34a" }}
              loading={isActing}
              disabled={!!actingOn && !isActing}
              onClick={() => onAccept(doc)}
            />
          </Tooltip>
          <Tooltip title="Reject">
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              disabled={!!actingOn}
              onClick={() => onReject(doc)}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
}

function BundleCard({
  bundle,
  onDocAction,
  actingOn,
}: {
  bundle: KycDocumentBundle;
  onDocAction: (doc: KycDocumentRow, decision: "accepted" | "rejected") => void;
  actingOn: string | null;
}) {
  const pendingCount = bundle.documents.filter(
    (d) => d.status === "pending",
  ).length;
  const acceptedCount = bundle.documents.filter(
    (d) => d.status === "accepted",
  ).length;
  const rejectedCount = bundle.documents.filter(
    (d) => d.status === "rejected",
  ).length;

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-sm font-bold text-blue-600">
          {(bundle.partnerName ?? "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
            {bundle.partnerName ?? "Unknown Partner"}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {bundle.partnerBusinessName
              ? `${bundle.partnerBusinessName} · ${bundle.partnerEmail}`
              : bundle.partnerEmail}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {pendingCount > 0 && (
            <Tag color="gold" className="text-xs m-0">
              {pendingCount} pending
            </Tag>
          )}
          {acceptedCount > 0 && (
            <Tag color="green" className="text-xs m-0">
              {acceptedCount} accepted
            </Tag>
          )}
          {rejectedCount > 0 && (
            <Tag color="red" className="text-xs m-0">
              {rejectedCount} rejected
            </Tag>
          )}
        </div>
      </div>

      <div>
        {bundle.documents.length === 0 ? (
          <p className="text-xs text-slate-400 italic px-4 py-3">
            No documents in this submission.
          </p>
        ) : (
          bundle.documents.map((doc) => (
            <DocRow
              key={doc.id}
              doc={doc}
              actingOn={actingOn}
              onAccept={(d) => onDocAction(d, "accepted")}
              onReject={(d) => onDocAction(d, "rejected")}
            />
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          Attempt #{bundle.attemptNumber} · submitted{" "}
          {dayjs(bundle.submittedAt).fromNow()}
        </span>
        <span className="text-[10px] text-slate-400">
          {bundle.documents.length} doc
          {bundle.documents.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

export default function UnverifiedDocumentsTab() {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [page, setPage] = useState(1);

  // Track which document is being acted on to show per-row loading
  const [actingOn, setActingOn] = useState<string | null>(null);
  // Which doc is being rejected (triggers modal)
  const [rejectingDoc, setRejectingDoc] = useState<KycDocumentRow | null>(null);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDq(value);
      setPage(1);
    }, 300);
  };

  // Fetch bundles with pending documents only (default in route)
  const { data, isLoading, isValidating, mutate } = useKycDocuments({
    q: dq,
    status: "pending",
    page,
    limit: 12,
  });

  const bundles = data?.data ?? [];

  const handleDocAction = async (
    doc: KycDocumentRow,
    decision: "accepted" | "rejected",
    rejectionNote?: string,
  ) => {
    setActingOn(doc.id);
    try {
      await reviewKycDocument(doc.id, decision, { rejectionNote });
      message.success(
        decision === "accepted" ? "Document accepted" : "Document rejected",
      );
      await mutate();
    } catch (err: unknown) {
      message.error(
        err instanceof Error ? err.message : "Failed to update document",
      );
    } finally {
      setActingOn(null);
    }
  };

  const handleRejectConfirm = async (note: string) => {
    if (!rejectingDoc) return;
    setRejectSubmitting(true);
    try {
      await handleDocAction(rejectingDoc, "rejected", note);
      setRejectingDoc(null);
    } finally {
      setRejectSubmitting(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 items-center">
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
        </div>
        {data && (
          <span className="text-xs text-slate-400">
            {data.pagination.total} submission
            {data.pagination.total !== 1 ? "s" : ""} with unverified documents
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4">
              <Skeleton active paragraph={{ rows: 5 }} />
            </div>
          ))}
        </div>
      ) : bundles.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <FileTextOutlined className="text-2xl text-slate-300" />
          </div>
          <p className="text-sm font-medium">No unverified documents</p>
          <p className="text-xs text-slate-300">
            All submitted documents have been reviewed
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bundles.map((bundle) => (
            <BundleCard
              key={bundle.submissionId}
              bundle={bundle}
              actingOn={actingOn}
              onDocAction={(doc, decision) => {
                if (decision === "rejected") {
                  setRejectingDoc(doc);
                } else {
                  handleDocAction(doc, decision);
                }
              }}
            />
          ))}
        </div>
      )}

      {(data?.pagination.totalPages ?? 0) > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <Button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            size="small"
          >
            Previous
          </Button>
          <span className="text-xs text-slate-500 self-center">
            Page {page} of {data?.pagination.totalPages}
          </span>
          <Button
            disabled={page === (data?.pagination.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
            size="small"
          >
            Next
          </Button>
        </div>
      )}

      <RejectDocModal
        doc={rejectingDoc}
        onCancel={() => setRejectingDoc(null)}
        onConfirm={handleRejectConfirm}
        submitting={rejectSubmitting}
      />
    </div>
  );
}
