"use client";

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Skeleton,
  Switch,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import {
  useTurfSettings,
  saveTurfSettings,
} from "@/services/api/partners.service";

function AmenityManager({
  amenities,
  onChange,
}: {
  amenities: string[];
  onChange: (updated: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed || amenities.includes(trimmed)) return;
    onChange([...amenities, trimmed]);
    setInput("");
  };

  const remove = (a: string) => onChange(amenities.filter((x) => x !== a));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={add}
          placeholder="Add amenity label..."
          prefix={<TagOutlined className="text-slate-400" />}
          maxLength={40}
        />
        <Button icon={<PlusOutlined />} onClick={add} type="dashed">
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-10">
        {amenities.map((a) => (
          <Tag
            key={a}
            closable
            onClose={() => remove(a)}
            className="text-sm py-0.5 px-2 rounded-full"
            color="blue"
            icon={<TagOutlined />}
          >
            {a}
          </Tag>
        ))}
        {amenities.length === 0 && (
          <span className="text-xs text-slate-400 italic">
            No amenities defined yet.
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400">
        {amenities.length} amenity option{amenities.length !== 1 ? "s" : ""} available to
        partners when listing a turf.
      </p>
    </div>
  );
}

const SURFACES = [
  { value: "natural_grass", label: "Natural Grass" },
  { value: "artificial_turf", label: "Artificial Turf" },
  { value: "futsal_floor", label: "Futsal Floor" },
  { value: "indoor", label: "Indoor" },
];

function SurfacePricingTable({
  prices,
  onChange,
}: {
  prices: Record<string, number>;
  onChange: (updated: Record<string, number>) => void;
}) {
  const update = (surface: string, price: number) =>
    onChange({ ...prices, [surface]: price });

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div
        className="grid text-xs font-bold text-slate-400 uppercase tracking-widest px-4 py-2 bg-slate-50 border-b border-slate-200"
        style={{ gridTemplateColumns: "1fr 180px" }}
      >
        <span>Surface Type</span>
        <span>Default Price / Hour</span>
      </div>
      {SURFACES.map(({ value, label }) => (
        <div
          key={value}
          className="grid items-center px-4 py-2.5 border-b border-slate-100 last:border-0"
          style={{ gridTemplateColumns: "1fr 180px" }}
        >
          <span className="text-sm text-slate-700">{label}</span>
          <InputNumber
            value={prices[value] ?? 0}
            onChange={(v) => update(value, v ?? 0)}
            min={0}
            step={100}
            prefix="KES"
            style={{ width: 160 }}
          />
        </div>
      ))}
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

interface TurfSettingsForm {
  minBookingHours: number;
  maxBookingHours: number;
  advanceBookingDays: number;
  cancellationHours: number;
  autoApproveListings: boolean;
  requireCapacity: boolean;
  requireSurface: boolean;
  requireImages: boolean;
  minImages: number;
  amenityOptions: string[];
  surfacePriceDefaults: Record<string, number>;
}

export default function TurfSettings() {
  const [form] = Form.useForm<TurfSettingsForm>();
  const { data, isLoading, mutate } = useTurfSettings();

  // Populate form once data arrives
  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      minBookingHours: parseFloat(data.minBookingHours),
      maxBookingHours: parseFloat(data.maxBookingHours),
      advanceBookingDays: data.advanceBookingDays,
      cancellationHours: data.cancellationHours,
      autoApproveListings: data.autoApproveListings,
      requireCapacity: data.requireCapacity,
      requireSurface: data.requireSurface,
      requireImages: data.requireImages,
      minImages: data.minImages,
      amenityOptions: data.amenityOptions ?? [],
      surfacePriceDefaults: data.surfacePriceDefaults ?? {},
    });
  }, [data, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await saveTurfSettings({
        ...values,
        // coerce back to strings to match the service signature
        minBookingHours: String(values.minBookingHours),
        maxBookingHours: String(values.maxBookingHours),
      });
      await mutate();
      message.success("Turf settings saved");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error(
        err instanceof Error ? err.message : "Failed to save settings",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} size="small">
            <Skeleton active paragraph={{ rows: 5 }} />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* ── Booking Rules ──────────────────────────────────── */}
        <Card size="small" className="shadow-xs">
          <SectionHeader
            icon={<ClockCircleOutlined />}
            title="Booking Rules"
            subtitle="Constraints applied to all turf bookings system-wide"
          />

          <SettingRow
            label="Minimum booking duration"
            hint="Shortest slot a player can book"
          >
            <Form.Item name="minBookingHours" noStyle>
              <InputNumber min={0.5} max={4} step={0.5} addonAfter="hrs" style={{ width: 130 }} />
            </Form.Item>
          </SettingRow>

          <SettingRow
            label="Maximum booking duration"
            hint="Longest uninterrupted slot allowed"
          >
            <Form.Item name="maxBookingHours" noStyle>
              <InputNumber min={1} max={24} addonAfter="hrs" style={{ width: 130 }} />
            </Form.Item>
          </SettingRow>

          <SettingRow
            label="Advance booking window"
            hint="How far in advance players can book a slot"
          >
            <Form.Item name="advanceBookingDays" noStyle>
              <InputNumber min={1} max={365} addonAfter="days" style={{ width: 130 }} />
            </Form.Item>
          </SettingRow>

          <SettingRow
            label="Cancellation notice"
            hint="Minimum hours before a booking that cancellation is allowed"
          >
            <Form.Item name="cancellationHours" noStyle>
              <InputNumber min={0} max={72} addonAfter="hrs" style={{ width: 130 }} />
            </Form.Item>
          </SettingRow>
        </Card>

        {/* ── Listing Requirements ──────────────────────────── */}
        <Card size="small" className="shadow-xs">
          <SectionHeader
            icon={<EnvironmentOutlined />}
            title="Listing Requirements"
            subtitle="Fields a partner must complete before a turf goes live"
          />

          <SettingRow
            label="Auto-approve new listings"
            hint="If off, an admin must manually approve each new turf before it's visible to players"
          >
            <Form.Item name="autoApproveListings" noStyle valuePropName="checked">
              <Switch size="small" />
            </Form.Item>
          </SettingRow>

          <SettingRow label="Require capacity">
            <Form.Item name="requireCapacity" noStyle valuePropName="checked">
              <Switch size="small" />
            </Form.Item>
          </SettingRow>

          <SettingRow label="Require surface type">
            <Form.Item name="requireSurface" noStyle valuePropName="checked">
              <Switch size="small" />
            </Form.Item>
          </SettingRow>

          <SettingRow label="Require photos">
            <Form.Item name="requireImages" noStyle valuePropName="checked">
              <Switch size="small" />
            </Form.Item>
          </SettingRow>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.requireImages !== cur.requireImages}
          >
            {({ getFieldValue }) =>
              getFieldValue("requireImages") && (
                <SettingRow label="Minimum number of photos">
                  <Form.Item name="minImages" noStyle>
                    <InputNumber min={1} max={20} style={{ width: 130 }} />
                  </Form.Item>
                </SettingRow>
              )
            }
          </Form.Item>
        </Card>

        {/* ── Default Pricing by Surface ────────────────────── */}
        <Card size="small" className="shadow-xs">
          <SectionHeader
            icon={<TagOutlined />}
            title="Default Pricing by Surface"
            subtitle="Suggested price per hour shown to partners when creating a listing"
          />
          <Form.Item noStyle name="surfacePriceDefaults">
            <SurfacePricingTable prices={form.getFieldValue("surfacePriceDefaults") ?? {}} onChange={(prices) => form.setFieldValue("surfacePriceDefaults", prices)} />
          </Form.Item>
          <p className="text-xs text-slate-400 mt-3">
            Partners can override these defaults when setting up their turf listing.
          </p>
        </Card>

        {/* ── Amenity Options ───────────────────────────────── */}
        <Card size="small" className="shadow-xs">
          <SectionHeader
            icon={<TagOutlined />}
            title="Amenity Options"
            subtitle="Controlled vocabulary partners can pick from when tagging their turf"
          />
          <Form.Item noStyle name="amenityOptions">
            <AmenityManager amenities={form.getFieldValue("amenityOptions") ?? []} onChange={(amenities) => form.setFieldValue("amenityOptions", amenities)} />
          </Form.Item>
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
          Save Turf Settings
        </Button>
      </div>
    </Form>
  );
}