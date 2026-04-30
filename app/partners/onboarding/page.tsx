"use client";

import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { UserSwitchOutlined } from "@ant-design/icons";
import TurfManagement from "./(views)/TurfManagement";

export default function PartnersPage() {
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: (
        <span>
          <UserSwitchOutlined />
          Turf Managers
        </span>
      ),
      children: <TurfManagement />,
    },
  ];

  return (
    <main className="flex min-h-screen flex-col gap-4">
      <h2 className="text-2xl font-bold">Partners Management</h2>
      <Tabs defaultActiveKey="1" items={items} />
    </main>
  );
}