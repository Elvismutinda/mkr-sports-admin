import { Button, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownloadOutlined } from "@ant-design/icons";
import {
  exportToCSV,
} from "@/services/api/reports.service";

export function ResultSection<T extends object>({
  data, columns, summary, reportName,
}: {
  data: T[];
  columns: ColumnsType<T>;
  summary: React.ReactNode;
  reportName: string;
}) {
  if (!data.length) return null;
  return (
    <div className="flex flex-col gap-3 mt-2">
      {summary}
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-400 font-medium">{data.length} records</p>
        <Button
          size="small"
          icon={<DownloadOutlined />}
          onClick={() => exportToCSV(data as Record<string, unknown>[], reportName)}
        >
          Export CSV
        </Button>
      </div>
      <Table<T>
        dataSource={data}
        columns={columns}
        rowKey="id"
        size="small"
        scroll={{ x: true }}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        className="rounded-lg overflow-hidden border"
      />
    </div>
  );
}