"use client";

import {
  Badge,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { SwapOutlined, SyncOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { usePartnerLogs } from "@/services/api/partners.service";
import type { SystemLogRow } from "@/services/_types";

dayjs.extend(relativeTime);

type DiffType = "changed" | "added" | "removed" | "unchanged";
interface DiffRow {
  field: string;
  before: string;
  after: string;
  type: DiffType;
}
interface MetadataShape {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  [key: string]: unknown;
}

function getActionColor(action: string): string {
  const a = action.toUpperCase();
  if (a.startsWith("CREATE")) return "green";
  if (
    a.startsWith("UPDATE") ||
    a.startsWith("EDIT") ||
    a.startsWith("RECORD") ||
    a.startsWith("CHANGE")
  )
    return "blue";
  if (
    a.startsWith("DELETE") ||
    a.startsWith("DEACTIVATE") ||
    a.startsWith("CANCEL") ||
    a.startsWith("SUSPEND")
  )
    return "red";
  if (a.startsWith("LOGIN") || a.startsWith("LOGOUT") || a.startsWith("AUTH"))
    return "purple";
  if (
    a.startsWith("SEND") ||
    a.startsWith("EMAIL") ||
    a.startsWith("INVITE") ||
    a.startsWith("RESEND")
  )
    return "cyan";
  return "orange";
}

function serialize(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return "[unserializable]";
  }
}

function buildDiff(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): DiffRow[] {
  const allKeys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);
  return Array.from(allKeys).map((field): DiffRow => {
    const b = before?.[field] ?? null;
    const a = after?.[field] ?? null;
    let type: DiffType = "unchanged";
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      if (b === null || b === undefined) type = "added";
      else if (a === null || a === undefined) type = "removed";
      else type = "changed";
    }
    return { field, before: serialize(b), after: serialize(a), type };
  });
}

function hasDiffMetadata(metadata: unknown): metadata is MetadataShape {
  if (!metadata || typeof metadata !== "object") return false;
  const m = metadata as MetadataShape;
  return "before" in m || "after" in m;
}

function PartnerBadge({ name }: { name: string | null }) {
  if (!name)
    return <span className="text-slate-400 text-xs">Unknown Partner</span>;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium leading-none">{name}</span>
      <Tag className="w-fit text-[10px] px-1 py-0 leading-4 m-0" color="gold">
        Partner
      </Tag>
    </div>
  );
}

function DiffTable({ rows }: { rows: DiffRow[] }) {
  const rowBg = (t: DiffType) =>
    t === "added"
      ? "#f0fdf4"
      : t === "removed"
        ? "#fff1f2"
        : t === "changed"
          ? "#fffbeb"
          : "white";
  const beforeColor = (t: DiffType) =>
    t === "changed" || t === "removed" ? "#ef4444" : "#94a3b8";
  const afterColor = (t: DiffType) =>
    t === "changed" || t === "added" ? "#16a34a" : "#94a3b8";

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr 1fr",
          padding: "7px 14px",
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          fontSize: 11,
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        <span>Field</span>
        <span>Before</span>
        <span>After</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.field}
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr 1fr",
            padding: "9px 14px",
            gap: 8,
            backgroundColor: rowBg(row.type),
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontWeight: 600,
              color: "#475569",
              fontSize: 12,
            }}
          >
            {row.field}
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              wordBreak: "break-all",
              whiteSpace: "pre-wrap",
              color: beforeColor(row.type),
              textDecoration:
                row.type === "changed" || row.type === "removed"
                  ? "line-through"
                  : "none",
            }}
          >
            {row.before}
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              wordBreak: "break-all",
              whiteSpace: "pre-wrap",
              color: afterColor(row.type),
              fontWeight:
                row.type === "changed" || row.type === "added" ? 600 : 400,
            }}
          >
            {row.after}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChangesModalInner({ log }: { log: SystemLogRow }) {
  const [showUnchanged, setShowUnchanged] = useState(false);
  if (!hasDiffMetadata(log.metadata)) return null;
  const meta = log.metadata as MetadataShape;
  const diff = buildDiff(meta.before ?? undefined, meta.after ?? undefined);
  const changed = diff.filter((r) => r.type !== "unchanged");
  const unchanged = diff.filter((r) => r.type === "unchanged");
  const extraKeys = Object.keys(meta).filter(
    (k) => k !== "before" && k !== "after",
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-x-6 gap-y-1 flex-wrap text-sm">
        {log.actorName && (
          <span>
            <span className="text-slate-400 mr-1">Partner:</span>
            <span className="font-medium">{log.actorName}</span>
          </span>
        )}
        {log.entityType && (
          <span>
            <span className="text-slate-400 mr-1">Entity:</span>
            <span className="font-medium capitalize">{log.entityType}</span>
          </span>
        )}
        {log.description && (
          <span className="text-slate-500 italic">{log.description}</span>
        )}
      </div>
      {changed.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Changed fields{" "}
            <span className="font-normal normal-case text-slate-300">
              ({changed.length})
            </span>
          </p>
          <DiffTable rows={changed} />
        </div>
      )}
      {unchanged.length > 0 && (
        <div>
          <button
            onClick={() => setShowUnchanged((s) => !s)}
            className="text-xs text-slate-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 hover:text-slate-600 transition-colors"
          >
            <span
              style={{
                fontSize: 8,
                display: "inline-block",
                transform: showUnchanged ? "rotate(90deg)" : "none",
                transition: "transform 0.15s",
              }}
            >
              ▶
            </span>
            Unchanged fields ({unchanged.length})
          </button>
          {showUnchanged && (
            <div className="mt-2">
              <DiffTable rows={unchanged} />
            </div>
          )}
        </div>
      )}
      {extraKeys.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Additional metadata
          </p>
          <pre className="text-xs bg-slate-50 rounded-lg p-3 border overflow-auto max-h-48 whitespace-pre-wrap break-all">
            {JSON.stringify(
              Object.fromEntries(extraKeys.map((k) => [k, meta[k]])),
              null,
              2,
            )}
          </pre>
        </div>
      )}
      {changed.length === 0 && unchanged.length === 0 && (
        <p className="text-sm text-slate-400 italic">
          No field data recorded for this action.
        </p>
      )}
    </div>
  );
}

function ChangesModal({
  log,
  onClose,
}: {
  log: SystemLogRow | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={!!log}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
      title={
        log ? (
          <div className="flex items-center gap-3 flex-wrap">
            <Tag
              color={getActionColor(log.action)}
              className="font-mono font-bold"
            >
              {log.action}
            </Tag>
            <span className="text-sm text-slate-500 font-normal">
              {new Date(log.createdAt).toLocaleString("en-KE")}
            </span>
          </div>
        ) : null
      }
      width={920}
      key={log?.id ?? "empty"}
      destroyOnHidden
      styles={{
        body: { maxHeight: "72vh", overflowY: "auto", padding: "16px 24px" },
      }}
    >
      {log && <ChangesModalInner log={log} />}
    </Modal>
  );
}

function LogDrawer({
  log,
  onClose,
  onViewChanges,
}: {
  log: SystemLogRow | null;
  onClose: () => void;
  onViewChanges: (log: SystemLogRow) => void;
}) {
  return (
    <Drawer
      open={!!log}
      onClose={onClose}
      size={520}
      destroyOnHidden
      title={
        log ? (
          <div className="flex items-center gap-3">
            <Tag color={getActionColor(log.action)} className="font-mono">
              {log.action}
            </Tag>
            <span className="text-sm text-slate-500 font-normal">
              {new Date(log.createdAt).toLocaleString("en-KE")}
            </span>
          </div>
        ) : undefined
      }
    >
      {log && (
        <div className="flex flex-col gap-5">
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Partner">
              <PartnerBadge name={log.actorName} />
            </Descriptions.Item>
            <Descriptions.Item label="Partner ID">
              <span className="font-mono text-xs">{log.actorId ?? "—"}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Action">
              <Tag color={getActionColor(log.action)} className="font-mono">
                {log.action}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Entity type">
              <span className="capitalize">{log.entityType ?? "—"}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Entity ID">
              <span className="font-mono text-xs">{log.entityId ?? "—"}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {log.description ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="IP address">
              <span className="font-mono">{log.ipAddress ?? "—"}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Timestamp">
              {new Date(log.createdAt).toLocaleString("en-KE")}
              <span className="text-slate-400 text-xs ml-2">
                ({dayjs(log.createdAt).fromNow()})
              </span>
            </Descriptions.Item>
          </Descriptions>

          {log.userAgent && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                User Agent
              </p>
              <p className="text-xs text-slate-600 break-all bg-slate-50 rounded p-2 border">
                {log.userAgent}
              </p>
            </div>
          )}

          {hasDiffMetadata(log.metadata) && (
            <Button
              type="primary"
              icon={<SwapOutlined />}
              onClick={() => {
                onClose();
                onViewChanges(log);
              }}
              style={{ background: "#2a79b5" }}
            >
              View Changes
            </Button>
          )}

          {!hasDiffMetadata(log.metadata) && log.metadata != null && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Metadata
              </p>
              <pre className="text-xs bg-slate-50 rounded p-2 border overflow-auto max-h-48 whitespace-pre-wrap break-all">
                {serialize(log.metadata as Record<string, unknown>)}
              </pre>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

export default function PartnerLogsPage() {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [entityType, setEntityType] = useState<string | undefined>();
  const [action, setAction] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [drawerLog, setDrawerLog] = useState<SystemLogRow | null>(null);
  const [diffLog, setDiffLog] = useState<SystemLogRow | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDq(value);
      setPage(1);
    }, 300);
  };
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const updateFilter =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(1);
    };

  const { data, isLoading, isValidating, mutate } = usePartnerLogs({
    q: dq,
    entityType,
    action,
    dateFrom,
    dateTo,
    page,
    limit: 50,
  });

  const columns: ColumnsType<SystemLogRow> = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      width: 105,
      render: (v: string) => (
        <Tooltip title={new Date(v).toLocaleString("en-KE")}>
          <span className="text-xs">{dayjs(v).format("DD/MM/YYYY")}</span>
        </Tooltip>
      ),
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "time",
      width: 82,
      render: (v: string) => (
        <span className="text-xs font-mono">{dayjs(v).format("HH:mm:ss")}</span>
      ),
    },
    {
      title: "Operation",
      dataIndex: "action",
      key: "op",
      width: 185,
      render: (v: string) => (
        <Tag color={getActionColor(v)} className="font-mono text-xs">
          {v}
        </Tag>
      ),
    },
    {
      title: "Entity",
      key: "entity",
      width: 165,
      render: (_: unknown, r: SystemLogRow) =>
        r.entityType ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs capitalize font-medium">
              {r.entityType}
            </span>
            {r.entityId && (
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-32.5">
                {r.entityId}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      title: "Partner",
      key: "actor",
      width: 165,
      render: (_: unknown, r: SystemLogRow) => (
        <PartnerBadge name={r.actorName} />
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "desc",
      render: (v: string | null) => (
        <span className="text-xs text-slate-600">{v ?? "—"}</span>
      ),
    },
    {
      title: "IP Address",
      dataIndex: "ipAddress",
      key: "ip",
      width: 125,
      render: (v: string | null) => (
        <span className="text-xs font-mono text-slate-500">{v ?? "—"}</span>
      ),
    },
    {
      title: "Action",
      key: "btn",
      width: 110,
      render: (_: unknown, r: SystemLogRow) =>
        hasDiffMetadata(r.metadata) ? (
          <Button
            type="primary"
            size="small"
            icon={<SwapOutlined />}
            style={{ background: "#2a79b5", fontSize: 12 }}
            onClick={(e) => {
              e.stopPropagation();
              setDiffLog(r);
            }}
          >
            Changes
          </Button>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        ),
    },
  ];

  const activeFilters = [action, entityType, dateFrom, dateTo].filter(
    Boolean,
  ).length;

  return (
    <>
      <main className="flex flex-col gap-4 min-h-screen">
        <div className="flex flex-wrap gap-4 items-center">
          <h2 className="text-2xl font-bold grow">Partner Logs</h2>
          <Badge
            count={data?.pagination.total ?? 0}
            overflowCount={99999}
            color="gold"
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center bg-white p-3 rounded-lg">
          <Tooltip title="Refresh">
            <Button
              icon={<SyncOutlined spin={isValidating} />}
              onClick={() => mutate()}
            />
          </Tooltip>
          <Input
            placeholder="Search action, description, IP..."
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 280 }}
            allowClear
            onClear={() => handleSearch("")}
          />
          <Select
            value={action}
            onChange={updateFilter(setAction)}
            allowClear
            placeholder="Operation"
            style={{ width: 190 }}
            showSearch
            options={(data?.meta.actions ?? []).map((a) => ({
              label: a,
              value: a,
            }))}
            filterOption={(input, opt) =>
              (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
          <Select
            value={entityType}
            onChange={updateFilter(setEntityType)}
            allowClear
            placeholder="Entity type"
            style={{ width: 150 }}
            showSearch
            options={(data?.meta.entityTypes ?? []).map((e) => ({
              label: e,
              value: e,
            }))}
          />
          <DatePicker
            placeholder="Start date"
            onChange={(d) =>
              updateFilter(setDateFrom)(d?.startOf("day").toISOString())
            }
            allowClear
          />
          <DatePicker
            placeholder="End date"
            onChange={(d) =>
              updateFilter(setDateTo)(d?.endOf("day").toISOString())
            }
            allowClear
          />
          {activeFilters > 0 && (
            <Button
              size="small"
              danger
              onClick={() => {
                setAction(undefined);
                setEntityType(undefined);
                setDateFrom(undefined);
                setDateTo(undefined);
                handleSearch("");
              }}
            >
              Clear filters ({activeFilters})
            </Button>
          )}
        </div>

        <Table<SystemLogRow>
          loading={isLoading}
          dataSource={data?.data ?? []}
          columns={columns}
          rowKey="id"
          bordered
          size="small"
          onRow={(r) => ({
            onClick: () => setDrawerLog(r),
            className: "cursor-pointer hover:bg-slate-50 transition-colors",
          })}
          pagination={{
            current: page,
            total: data?.pagination.total,
            pageSize: 50,
            showTotal: (t) => `${t.toLocaleString()} entries`,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
        />
      </main>

      <LogDrawer
        log={drawerLog}
        onClose={() => setDrawerLog(null)}
        onViewChanges={(log) => setDiffLog(log)}
      />
      <ChangesModal log={diffLog} onClose={() => setDiffLog(null)} />
    </>
  );
}
