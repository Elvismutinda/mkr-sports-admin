"use client";

import { Tabs } from "antd";
import {
  AuditOutlined,
  EnvironmentOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import PartnerPortalSettings from "./(components)/PartnerPortalSettings";
import TurfSettings from "./(components)/TurfSettings";
import KycFlowSettings from "./(components)/KycFlowSettings";


const TABS = [
  {
    key: "portal",
    label: (
      <span className="flex items-center gap-1.5">
        <SettingOutlined />
        Partner Portal
      </span>
    ),
    children: <PartnerPortalSettings />,
  },
  {
    key: "turf",
    label: (
      <span className="flex items-center gap-1.5">
        <EnvironmentOutlined />
        Turf Settings
      </span>
    ),
    children: <TurfSettings />,
  },
  {
    key: "kyc",
    label: (
      <span className="flex items-center gap-1.5">
        <AuditOutlined />
        KYC Flow
      </span>
    ),
    children: <KycFlowSettings />,
  },
];

export default function PartnerSettingsPage() {
  return (
    <main className="flex flex-col gap-4 min-h-screen">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold">Partner Management Settings</h2>
      </div>

      <Tabs
        defaultActiveKey="portal"
        items={TABS}
        destroyOnHidden={false}
        className="bg-transparent"
      />
    </main>
  );
}