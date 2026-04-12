"use client";

import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { UserSwitchOutlined } from "@ant-design/icons";
import AgentManagement from "./(views)/AgentManagement";

export default function AgentsPage() {
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: (
        <span>
          <UserSwitchOutlined />
          Turf Owners
        </span>
      ),
      children: <AgentManagement />,
    },
  ];

  return (
    <main className="flex min-h-screen flex-col gap-4">
      <h2 className="text-2xl font-bold">Agents</h2>
      <Tabs defaultActiveKey="1" items={items} />
    </main>
  );
}