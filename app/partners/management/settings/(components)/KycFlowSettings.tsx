"use client";

import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Skeleton,
  Switch,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  AuditOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PlusOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import {
  useKycSettings,
  saveKycSettings,
} from "@/services/api/partners.service";
import { KycDocumentConfig } from "@/services/_types";

// Re-export local alias so sub-components don't need to import from service
type KycDocument = KycDocumentConfig;

function DocRow({
  doc,
  onChange,
  onRemove,
}: {
  doc: KycDocument;
  onChange: (updated: KycDocument) => void;
  onRemove: () => void;
}) {
  const set = <K extends keyof KycDocument>(key: K, value: KycDocument[K]) =>
    onChange({ ...doc, [key]: value });

  return (
    <div className="border border-slate-200 rounded-lg p-4 flex flex-col gap-3 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <FileTextOutlined className="text-blue-500 shrink-0" />
          <Input
            value={doc.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="Document name"
            variant="borderless"
            style={{ padding: "0 4px", fontWeight: 600 }}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Tag color={doc.required ? "red" : "default"} className="text-xs">
            {doc.required ? "Required" : "Optional"}
          </Tag>
          <Switch
            size="small"
            checked={doc.required}
            onChange={(v) => set("required", v)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={onRemove}
          />
        </div>
      </div>

      <Input
        value={doc.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Description shown to partners..."
        size="small"
        className="text-slate-500"
      />

      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Accepted formats</span>
          <Select
            value={doc.acceptedTypes}
            onChange={(v) => set("acceptedTypes", v)}
            size="small"
            style={{ width: 120 }}
          >
            <Select.Option value="image">Images only</Select.Option>
            <Select.Option value="pdf">PDF only</Select.Option>
            <Select.Option value="any">Image or PDF</Select.Option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Max size</span>
          <InputNumber
            value={doc.maxSizeMb}
            onChange={(v) => set("maxSizeMb", v ?? 5)}
            min={1}
            max={50}
            size="small"
            addonAfter="MB"
            style={{ width: 110 }}
          />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-slate-800 leading-tight">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-slate-700">{label}</span>
        {hint && (
          <Tooltip title={hint}>
            <InfoCircleOutlined className="text-slate-400 text-xs" />
          </Tooltip>
        )}
      </div>
      <div className="ml-4">{children}</div>
    </div>
  );
}

function WorkflowStep({
  step,
  label,
  description,
}: {
  step: number;
  label: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 items-start p-3 rounded-lg bg-blue-50">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 bg-blue-600 text-white">
        {step}
      </div>
      <div>
        <p className="text-sm font-semibold text-blue-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

interface KycForm {
  approvalMode: "manual" | "auto";
  reviewSlaHours: number;
  expiryDays: number;
  allowResubmission: boolean;
  maxResubmissions: number;
  notifyAdminOnSubmission: boolean;
  adminNotificationEmail: string;
  approvalEmailTemplate: string;
  rejectionEmailTemplate: string;
}

const WORKFLOW_STEPS = [
  {
    label: "Partner submits documents",
    description: "Partner uploads required KYC documents via their portal",
  },
  {
    label: "Admin review",
    description: "Admin team reviews submitted documents within the SLA window",
  },
  {
    label: "Approval / Rejection",
    description: "Partner is notified by email with outcome and any feedback",
  },
  {
    label: "Account activation",
    description: "Approved partners can create turf listings immediately",
  },
];

export default function KycFlowSettings() {
  const [form] = Form.useForm<KycForm>();
  const { data, isLoading, mutate } = useKycSettings();

  const [initialized, setInitialized] = useState(false);
  const [docs, setDocs] = useState<KycDocument[]>([]);

  // Populate form and docs once data arrives — done during render, not in an effect
  if (data && !initialized) {
    setInitialized(true);
    form.setFieldsValue({
      approvalMode: data.approvalMode,
      reviewSlaHours: data.reviewSlaHours,
      expiryDays: data.expiryDays,
      allowResubmission: data.allowResubmission,
      maxResubmissions: data.maxResubmissions,
      notifyAdminOnSubmission: data.notifyAdminOnSubmission,
      adminNotificationEmail: data.adminNotificationEmail,
      approvalEmailTemplate: data.approvalEmailTemplate,
      rejectionEmailTemplate: data.rejectionEmailTemplate,
    });
    setDocs(data.requiredDocuments ?? []);
  }

  const addDoc = () => {
    setDocs((prev) => [
      ...prev,
      {
        id: `doc_${Date.now()}`,
        label: "New Document",
        description: "",
        required: false,
        acceptedTypes: "any",
        maxSizeMb: 5,
      },
    ]);
  };

  const updateDoc = (id: string, updated: KycDocument) =>
    setDocs((prev) => prev.map((d) => (d.id === id ? updated : d)));

  const removeDoc = (id: string) =>
    setDocs((prev) => prev.filter((d) => d.id !== id));

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await saveKycSettings({ ...values, requiredDocuments: docs });
      await mutate();
      message.success("KYC flow settings saved");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error(
        err instanceof Error ? err.message : "Failed to save settings",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} size="small" className={i === 3 ? "xl:col-span-3" : ""}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* ── Workflow overview ──────────────────────────────── */}
        <Card size="small" className="shadow-xs xl:col-span-1">
          <SectionHeader
            icon={<AuditOutlined />}
            title="KYC Workflow"
            subtitle="How partner verification flows through the system"
          />
          <div className="flex flex-col gap-2">
            {WORKFLOW_STEPS.map((s, i) => (
              <WorkflowStep
                key={i}
                step={i + 1}
                label={s.label}
                description={s.description}
              />
            ))}
          </div>
        </Card>

        {/* ── Approval settings + Notifications ─────────────── */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <Card size="small" className="shadow-xs">
            <SectionHeader
              icon={<CheckCircleOutlined />}
              title="Approval Settings"
              subtitle="Configure how KYC submissions are reviewed and approved"
            />

            <SettingRow
              label="Approval mode"
              hint="Manual requires an admin to explicitly approve each submission"
            >
              <Form.Item name="approvalMode" noStyle>
                <Select style={{ width: 160 }}>
                  <Select.Option value="manual">Manual review</Select.Option>
                  <Select.Option value="auto">Auto-approve</Select.Option>
                </Select>
              </Form.Item>
            </SettingRow>

            <SettingRow
              label="Review SLA"
              hint="Target time to complete a KYC review after submission"
            >
              <Form.Item name="reviewSlaHours" noStyle>
                <InputNumber
                  min={1}
                  max={168}
                  addonAfter="hrs"
                  style={{ width: 130 }}
                />
              </Form.Item>
            </SettingRow>

            <SettingRow
              label="KYC approval expiry"
              hint="How long a KYC approval remains valid before re-verification is required"
            >
              <Form.Item name="expiryDays" noStyle>
                <InputNumber
                  min={30}
                  max={730}
                  addonAfter="days"
                  style={{ width: 130 }}
                />
              </Form.Item>
            </SettingRow>

            <SettingRow label="Allow resubmission after rejection">
              <Form.Item
                name="allowResubmission"
                noStyle
                valuePropName="checked"
              >
                <Switch size="small" />
              </Form.Item>
            </SettingRow>

            <Form.Item
              noStyle
              shouldUpdate={(prev, cur) =>
                prev.allowResubmission !== cur.allowResubmission
              }
            >
              {({ getFieldValue }) =>
                getFieldValue("allowResubmission") && (
                  <SettingRow
                    label="Max resubmission attempts"
                    hint="Partner account is suspended after exceeding this limit"
                  >
                    <Form.Item name="maxResubmissions" noStyle>
                      <InputNumber min={1} max={10} style={{ width: 130 }} />
                    </Form.Item>
                  </SettingRow>
                )
              }
            </Form.Item>
          </Card>

          <Card size="small" className="shadow-xs">
            <SectionHeader
              icon={<MailOutlined />}
              title="Notifications"
              subtitle="Email templates and admin alerts for KYC events"
            />

            <SettingRow label="Notify admin on new submission">
              <Form.Item
                name="notifyAdminOnSubmission"
                noStyle
                valuePropName="checked"
              >
                <Switch size="small" />
              </Form.Item>
            </SettingRow>

            <Form.Item
              noStyle
              shouldUpdate={(prev, cur) =>
                prev.notifyAdminOnSubmission !== cur.notifyAdminOnSubmission
              }
            >
              {({ getFieldValue }) =>
                getFieldValue("notifyAdminOnSubmission") && (
                  <SettingRow label="Admin notification email">
                    <Form.Item
                      name="adminNotificationEmail"
                      noStyle
                      rules={[
                        { type: "email", message: "Enter a valid email" },
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined className="text-slate-400" />}
                        placeholder="kyc@example.com"
                        style={{ width: 240 }}
                      />
                    </Form.Item>
                  </SettingRow>
                )
              }
            </Form.Item>

            <Divider className="my-3" />

            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Email Templates
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircleOutlined className="text-green-500 text-xs" />
                  <span className="text-xs font-semibold text-slate-600">
                    Approval email body
                  </span>
                </div>
                <Form.Item name="approvalEmailTemplate" noStyle>
                  <Input.TextArea
                    rows={3}
                    placeholder="Message sent to partner when KYC is approved..."
                    className="text-sm"
                  />
                </Form.Item>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <WarningOutlined className="text-red-500 text-xs" />
                  <span className="text-xs font-semibold text-slate-600">
                    Rejection email body
                  </span>
                </div>
                <Form.Item name="rejectionEmailTemplate" noStyle>
                  <Input.TextArea
                    rows={3}
                    placeholder="Message sent to partner when KYC is rejected..."
                    className="text-sm"
                  />
                </Form.Item>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Required documents ─────────────────────────────── */}
        <Card
          size="small"
          className="shadow-xs xl:col-span-3"
          title={
            <div className="flex items-center justify-between py-1">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <FileTextOutlined />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 leading-tight">
                    Required Documents
                  </p>
                  <p className="text-xs text-slate-400 font-normal mt-0.5">
                    Documents partners must upload to complete KYC verification
                  </p>
                </div>
              </div>
              <Button icon={<PlusOutlined />} type="dashed" onClick={addDoc}>
                Add Document
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {docs.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                onChange={(updated) => updateDoc(doc.id, updated)}
                onRemove={() => removeDoc(doc.id)}
              />
            ))}
            {docs.length === 0 && (
              <div className="lg:col-span-2 text-center py-8 text-slate-400 text-sm">
                No documents configured. Add at least one required document.
              </div>
            )}
          </div>

          {docs.filter((d) => d.required).length === 0 && docs.length > 0 && (
            <Alert
              className="mt-3"
              type="warning"
              showIcon
              message="No required documents"
              description="At least one document should be marked as required for KYC to be meaningful."
            />
          )}
        </Card>
      </div>

      <div className="flex items-center justify-between mt-4">
        {data?.updatedAt && (
          <span className="text-xs text-slate-400">
            Last saved {new Date(data.updatedAt).toLocaleString("en-KE")}
          </span>
        )}
        <Button
          type="primary"
          onClick={handleSave}
          style={{ background: "#2a79b5", marginLeft: "auto" }}
        >
          Save KYC Settings
        </Button>
      </div>
    </Form>
  );
}
