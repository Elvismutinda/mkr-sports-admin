"use client";

import {
  Badge,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Input,
  Select,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { SwapOutlined, SyncOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useSystemLogs } from "@/services/api/system-logs.service";
import type { SystemLogRow } from "@/services/_types";

dayjs.extend(relativeTime);

// ─── Types ────────────────────────────────────────────────────────────────────

type DiffRow = {
  field: string;
  before: string;
  after: string;
  type: "changed" | "added" | "removed" | "unchanged";
};

type MetadataShape = {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  [key: string]: unknown;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  if (a.startsWith("VIEW") || a.startsWith("GET") || a.startsWith("FETCH"))
    return "default";
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

function buildDiff(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): DiffRow[] {
  const allKeys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);
  return Array.from(allKeys).map((field) => {
    const b = before?.[field] ?? null;
    const a = after?.[field] ?? null;
    const bStr =
      b === null ? "—" : typeof b === "object" ? JSON.stringify(b) : String(b);
    const aStr =
      a === null ? "—" : typeof a === "object" ? JSON.stringify(a) : String(a);
    const changed = JSON.stringify(b) !== JSON.stringify(a);
    let type: DiffRow["type"] = "unchanged";
    if (changed) {
      if (b === null) type = "added";
      else if (a === null) type = "removed";
      else type = "changed";
    }
    return { field, before: bStr, after: aStr, type };
  });
}

function hasDiffMetadata(metadata: unknown): metadata is MetadataShape {
  if (!metadata || typeof metadata !== "object") return false;
  const m = metadata as MetadataShape;
  return m.before !== undefined || m.after !== undefined;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActorBadge({
  type,
  name,
}: {
  type: string | null;
  name: string | null;
}) {
  if (!type) return <span>System</span>;
  return (
    <div className="flex flex-col gap-0.5">
      <span>{name ?? "Unknown"}</span>
      <Tag
        className="w-fit text-[10px] px-1 py-0 leading-4 m-0 capitalize"
        color={type === "system_user" ? "blue" : "green"}
      >
        {type.replace("_", " ")}
      </Tag>
    </div>
  );
}

function MetaView({ value }: { value: unknown }) {
  if (!value) {
    return <span className="text-slate-400 text-xs">—</span>;
  }
  let str: string;
  try {
    str = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  } catch {
    return <span className="text-slate-400 text-xs">Unreadable</span>;
  }
  return (
    <pre className="text-xs bg-slate-50 rounded p-2 overflow-auto max-h-64 border whitespace-pre-wrap break-all">
      {str}
    </pre>
  );
}

function ChangesTable({ metadata }: { metadata: MetadataShape }) {
  const [showUnchanged, setShowUnchanged] = useState(false);
  const diff = buildDiff(metadata.before, metadata.after);
  const changedRows = diff.filter((r) => r.type !== "unchanged");
  const unchangedRows = diff.filter((r) => r.type === "unchanged");
  const extraKeys = Object.keys(metadata).filter(
    (k) => k !== "before" && k !== "after",
  );

  if (diff.length === 0 && extraKeys.length === 0) {
    return (
      <p className="text-xs text-slate-400 italic">No field data recorded.</p>
    );
  }

  const rowBg = (type: DiffRow["type"]) => {
    if (type === "added") return "#f0fdf4";
    if (type === "removed") return "#fff1f2";
    if (type === "changed") return "#fffbeb";
    return undefined;
  };

  const beforeStyle = (type: DiffRow["type"]): React.CSSProperties => {
    if (type === "added") return { color: "#94a3b8" };
    if (type === "changed" || type === "removed")
      return { color: "#ef4444", textDecoration: "line-through" };
    return { color: "#94a3b8" };
  };

  const afterStyle = (type: DiffRow["type"]): React.CSSProperties => {
    if (type === "removed") return { color: "#94a3b8" };
    if (type === "changed" || type === "added")
      return { color: "#16a34a", fontWeight: 500 };
    return { color: "#94a3b8" };
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
  };

  const tableHeader = (
    <div
      style={{
        ...gridStyle,
        backgroundColor: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
        padding: "5px 10px",
        fontSize: 11,
        fontWeight: 600,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      <span>Field</span>
      <span>Before</span>
      <span>After</span>
    </div>
  );

  const renderRow = (row: DiffRow, i: number) => (
    <div
      key={row.field}
      style={{
        ...gridStyle,
        padding: "6px 10px",
        borderTop: i > 0 ? "1px solid #e2e8f0" : undefined,
        backgroundColor: rowBg(row.type),
        fontSize: 12,
        gap: 4,
      }}
    >
      <span style={{ fontFamily: "monospace", color: "#475569" }}>
        {row.field}
      </span>
      <span
        style={{
          fontFamily: "monospace",
          wordBreak: "break-all",
          paddingRight: 4,
          ...beforeStyle(row.type),
        }}
      >
        {row.before}
      </span>
      <span
        style={{
          fontFamily: "monospace",
          wordBreak: "break-all",
          ...afterStyle(row.type),
        }}
      >
        {row.after}
      </span>
    </div>
  );

  const tableWrap = (rows: DiffRow[]) => (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      {tableHeader}
      {rows.map((row, i) => renderRow(row, i))}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {changedRows.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Changed fields{" "}
            <span className="font-normal text-slate-400">
              ({changedRows.length})
            </span>
          </p>
          {tableWrap(changedRows)}
        </div>
      )}

      {unchangedRows.length > 0 && (
        <div>
          <button
            onClick={() => setShowUnchanged((s) => !s)}
            style={{
              fontSize: 11,
              color: "#94a3b8",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontWeight: 600,
              marginBottom: showUnchanged ? 6 : 0,
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: 8,
                transform: showUnchanged ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.15s",
              }}
            >
              ▶
            </span>
            Unchanged fields ({unchangedRows.length})
          </button>
          {showUnchanged && tableWrap(unchangedRows)}
        </div>
      )}

      {extraKeys.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Additional metadata
          </p>
          <MetaView
            value={Object.fromEntries(extraKeys.map((k) => [k, metadata[k]]))}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SystemLogsPage() {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [actorType, setActorType] = useState<string | undefined>();
  const [entityType, setEntityType] = useState<string | undefined>();
  const [action, setAction] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [detailLog, setDetailLog] = useState<SystemLogRow | null>(null);

  const { data, isLoading, isValidating, mutate } = useSystemLogs({
    q: dq,
    actorType,
    entityType,
    action,
    dateFrom,
    dateTo,
    page,
    limit: 50,
  });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDq(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const updateFilter =
    <T,>(setter: (v: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const columns: ColumnsType<SystemLogRow> = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      width: 100,
      render: (v: string) => (
        <Tooltip title={new Date(v).toLocaleString("en-KE")}>
          <span>{dayjs(v).format("DD MMM YYYY")}</span>
        </Tooltip>
      ),
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "time",
      width: 80,
      render: (v: string) => (
        <Tooltip title={new Date(v).toLocaleString("en-KE")}>
          <span>{dayjs(v).format("HH:mm:ss")}</span>
        </Tooltip>
      ),
    },
    {
      title: "Actor",
      key: "actor",
      width: 160,
      render: (_: unknown, r: SystemLogRow) => (
        <ActorBadge type={r.actorType} name={r.actorName} />
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 200,
      render: (v: string) => (
        <Tag color={getActionColor(v)} className="font-mono text-xs">
          {v}
        </Tag>
      ),
    },
    {
      title: "Entity",
      key: "entity",
      width: 160,
      render: (_: unknown, r: SystemLogRow) =>
        r.entityType ? (
          <div className="flex flex-col gap-0.5">
            <span className="capitalize">{r.entityType}</span>
            {r.entityId && (
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-30">
                {r.entityId}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (v: string | null) => <span>{v ?? "—"}</span>,
    },
    {
      title: "IP",
      dataIndex: "ipAddress",
      key: "ip",
      width: 130,
      render: (v: string | null) => <span>{v ?? "—"}</span>,
    },
    {
      title: "Changes",
      key: "changes",
      width: 90,
      render: (_: unknown, r: SystemLogRow) =>
        hasDiffMetadata(r.metadata) ? (
          <Button
            type="primary"
            size="medium"
            onClick={(e) => {
              e.stopPropagation();
              setDetailLog(r);
            }}
          >
            <SwapOutlined />
            Changes
          </Button>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        ),
    },
  ];

  const actionOptions = (data?.meta.actions ?? []).map((a) => ({
    label: a,
    value: a,
  }));

  const entityTypeOptions = (data?.meta.entityTypes ?? []).map((e) => ({
    label: e,
    value: e,
  }));

  return (
    <>
      <main className="flex flex-col gap-4 min-h-screen">
        <div className="flex flex-wrap gap-4 items-center">
          <h2 className="text-2xl font-bold grow">System Logs</h2>
          <Badge
            count={data?.pagination.total ?? 0}
            overflowCount={9999}
            color="blue"
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center bg-white p-3">
          <Tooltip title="Refresh">
            <Button
              icon={<SyncOutlined spin={isValidating} />}
              onClick={() => mutate()}
            />
          </Tooltip>

          <Input
            placeholder="Search action, description, IP..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />

          <Select
            value={actorType}
            onChange={updateFilter(setActorType)}
            allowClear
            placeholder="Actor type"
            style={{ width: 150 }}
            options={[
              { label: "Admin User", value: "system_user" },
              { label: "Player / Agent", value: "user" },
            ]}
          />

          <Select
            value={action}
            onChange={updateFilter(setAction)}
            allowClear
            placeholder="Action"
            style={{ width: 180 }}
            showSearch
            options={actionOptions}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />

          <Select
            value={entityType}
            onChange={updateFilter(setEntityType)}
            allowClear
            placeholder="Entity type"
            style={{ width: 150 }}
            showSearch
            options={entityTypeOptions}
          />

          <DatePicker
            placeholder="From date"
            onChange={(d) =>
              updateFilter(setDateFrom)(d?.startOf("day").toISOString())
            }
            allowClear
          />
          <DatePicker
            placeholder="To date"
            onChange={(d) =>
              updateFilter(setDateTo)(d?.endOf("day").toISOString())
            }
            allowClear
          />

          {[actorType, action, entityType, dateFrom, dateTo].filter(Boolean)
            .length > 0 && (
            <Button
              size="small"
              danger
              onClick={() => {
                setActorType(undefined);
                setAction(undefined);
                setEntityType(undefined);
                setDateFrom(undefined);
                setDateTo(undefined);
                setQ("");
                setPage(1);
              }}
            >
              Clear filters
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
            onClick: () => setDetailLog(r),
            className: "cursor-pointer hover:bg-slate-50",
          })}
          pagination={{
            current: page,
            total: data?.pagination.total,
            pageSize: 50,
            showTotal: (total) => `${total.toLocaleString()} logs`,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
        />
      </main>

      <Drawer
        title={
          <div className="flex items-center gap-3">
            <Tag
              color={getActionColor(detailLog?.action ?? "")}
              className="font-mono"
            >
              {detailLog?.action}
            </Tag>
            <span className="text-sm text-slate-500 font-normal">
              {detailLog?.createdAt
                ? new Date(detailLog.createdAt).toLocaleString("en-KE")
                : ""}
            </span>
          </div>
        }
        open={!!detailLog}
        onClose={() => setDetailLog(null)}
        width={560}
        destroyOnHidden
      >
        {detailLog && (
          <div className="flex flex-col gap-6">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Actor">
                <ActorBadge
                  type={detailLog.actorType}
                  name={detailLog.actorName}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Actor ID">
                <span className="font-mono text-xs">
                  {detailLog.actorId ?? "—"}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Action">
                <Tag
                  color={getActionColor(detailLog.action)}
                  className="font-mono"
                >
                  {detailLog.action}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Entity type">
                <span className="capitalize">
                  {detailLog.entityType ?? "—"}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Entity ID">
                <span className="font-mono text-xs">
                  {detailLog.entityId ?? "—"}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {detailLog.description ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="IP address">
                <span className="font-mono">{detailLog.ipAddress ?? "—"}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Timestamp">
                {new Date(detailLog.createdAt).toLocaleString("en-KE")}
                <span className="text-slate-400 text-xs ml-2">
                  ({dayjs(detailLog.createdAt).fromNow()})
                </span>
              </Descriptions.Item>
            </Descriptions>

            {detailLog.userAgent && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  User Agent
                </p>
                <p className="text-xs text-slate-600 break-all bg-slate-50 rounded p-2 border">
                  {detailLog.userAgent}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {hasDiffMetadata(detailLog.metadata) ? "Changes" : "Metadata"}
              </p>
              {hasDiffMetadata(detailLog.metadata) ? (
                <ChangesTable metadata={detailLog.metadata} />
              ) : (
                <MetaView value={detailLog.metadata} />
              )}
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
