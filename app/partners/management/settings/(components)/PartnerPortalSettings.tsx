"use client";

import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Skeleton,
  Switch,
  Tooltip,
  message,
} from "antd";
import {
  InfoCircleOutlined,
  MailOutlined,
  SafetyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useEffect } from "react";
import {
  usePartnerSettings,
  savePartnerSettings,
} from "@/services/api/partners.service";

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

interface PortalSettingsForm {
  sessionTimeoutMinutes: number;
  maxFailedLogins: number;
  autoSuspendAfterDays: number;
  passwordMinLength: number;
  requirePasswordSpecialChar: boolean;
  requirePasswordNumber: boolean;
  notifyOnBookingConfirmed: boolean;
  notifyOnPaymentReceived: boolean;
  notifyOnTurfReview: boolean;
  notifyOnAccountSuspended: boolean;
  notifyOnKycApproved: boolean;
  notifyOnKycRejected: boolean;
  supportEmail: string;
  defaultCurrency: string;
  defaultCommissionPercent: number;
}

export default function PartnerPortalSettings() {
  const [form] = Form.useForm<PortalSettingsForm>();
  const { data, isLoading, mutate } = usePartnerSettings();

  // Populate form once data arrives
  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      ...data,
      // numeric comes back as string from Postgres — coerce to number for InputNumber
      defaultCommissionPercent: parseFloat(data.defaultCommissionPercent),
    });
  }, [data, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await savePartnerSettings({
        ...values,
        defaultCommissionPercent: values.defaultCommissionPercent.toString(),
      });
      await mutate(); // revalidate SWR cache
      message.success("Partner portal settings saved");
    } catch (err: unknown) {
      // validateFields throws on invalid fields — don't toast for that
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error(
        err instanceof Error ? err.message : "Failed to save settings",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} size="small">
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* ── Access & Security ─────────────────────────────── */}
        <Card size="small" className="shadow-xs">
          <SectionHeader
            icon={<SafetyOutlined />}
            title="Access & Security"
            subtitle="Session and password policy for partner accounts"
          />

          <SettingRow
            label="Session timeout"
            hint="Partners are logged out after this many minutes of inactivity"
          >
            <Form.Item name="sessionTimeoutMinutes" noStyle>
              <InputNumber min={15} max={480} addonAfter="min" style={{ width: 130 }} />
            </Form.Item>
          </SettingRow>

          <SettingRow
            label="Max failed login attempts"
            hint="Account is temporarily locked after this many consecutive failures"
          >
            <Form.Item name="maxFailedLogins" noStyle>
              <InputNumber min={3} max={20} style={{ width: 130 }} />
            </Form.Item>
          </SettingRow>

          <SettingRow
            label="Auto-suspend after inactivity"
            hint="Suspend partner accounts that haven't logged in within this period"
          >
            <Form.Item name="autoSuspendAfterDays" noStyle>
              <InputNumber min={30} max={365} addonAfter="days" style={{ width: 130 }} />
            </Form.Item>
          </SettingRow>

          <Divider className="my-3" />

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
            Password Policy
          </p>

          <SettingRow label="Minimum password length">
            <Form.Item name="passwordMinLength" noStyle>
              <InputNumber min={6} max={32} addonAfter="chars" style={{ width: 130 }} />
            </Form.Item>
          </SettingRow>

          <SettingRow label="Require special character">
            <Form.Item name="requirePasswordSpecialChar" noStyle valuePropName="checked">
              <Switch size="small" />
            </Form.Item>
          </SettingRow>

          <SettingRow label="Require number">
            <Form.Item name="requirePasswordNumber" noStyle valuePropName="checked">
              <Switch size="small" />
            </Form.Item>
          </SettingRow>
        </Card>

        {/* ── Email Notifications ───────────────────────────── */}
        <Card size="small" className="shadow-xs">
          <SectionHeader
            icon={<MailOutlined />}
            title="Email Notifications"
            subtitle="Control which events trigger emails to partners"
          />

          {(
            [
              ["notifyOnBookingConfirmed", "Booking confirmed"],
              ["notifyOnPaymentReceived", "Payment received"],
              ["notifyOnTurfReview", "New turf review posted"],
              ["notifyOnAccountSuspended", "Account suspended"],
              ["notifyOnKycApproved", "KYC approved"],
              ["notifyOnKycRejected", "KYC rejected"],
            ] as const
          ).map(([name, label]) => (
            <SettingRow key={name} label={label}>
              <Form.Item name={name} noStyle valuePropName="checked">
                <Switch size="small" />
              </Form.Item>
            </SettingRow>
          ))}

          <Divider className="my-3" />

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Support Contact
          </p>

          <Form.Item
            name="supportEmail"
            rules={[{ type: "email", message: "Enter a valid email" }]}
            className="mb-0"
          >
            <Input
              prefix={<MailOutlined className="text-slate-400" />}
              placeholder="partners@example.com"
            />
          </Form.Item>
        </Card>

        {/* ── Revenue & Commission ──────────────────────────── */}
        <Card size="small" className="shadow-xs xl:col-span-2">
          <SectionHeader
            icon={<UserOutlined />}
            title="Revenue & Commission"
            subtitle="Default financial settings applied to new partner accounts"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <SettingRow
              label="Default currency"
              hint="Currency used for all partner transactions"
            >
              <Form.Item name="defaultCurrency" noStyle>
                <Select style={{ width: 200 }}>
                  <Select.Option value="KES">KES — Kenyan Shilling</Select.Option>
                  <Select.Option value="USD">USD — US Dollar</Select.Option>
                  <Select.Option value="EUR">EUR — Euro</Select.Option>
                </Select>
              </Form.Item>
            </SettingRow>

            <SettingRow
              label="Default platform commission"
              hint="Percentage of each booking taken by the platform. Can be overridden per partner."
            >
              <Form.Item name="defaultCommissionPercent" noStyle>
                <InputNumber min={0} max={50} addonAfter="%" style={{ width: 130 }} />
              </Form.Item>
            </SettingRow>
          </div>

          <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 flex items-start gap-2">
            <InfoCircleOutlined className="mt-0.5 shrink-0" />
            <span>
              Commission changes only apply to <strong>new</strong> partners. Existing
              partner commission rates must be updated individually from their profile page.
            </span>
          </div>
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
          Save Portal Settings
        </Button>
      </div>
    </Form>
  );
}