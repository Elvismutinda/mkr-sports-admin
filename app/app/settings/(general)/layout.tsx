"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Tabs } from "antd";
import {
  QuestionCircleOutlined,
  SecurityScanOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const tabItems = [
    {
      key: "/app/settings",
      label: "User Management",
      icon: <UserSwitchOutlined />,
      path: "/app/settings",
    },
    {
      key: "/app/settings/user-management",
      label: "User Management",
      icon: <UserSwitchOutlined />,
      path: "/app/settings/user-management",
    },
    {
      key: "/app/settings/roles-permissions",
      label: "Roles & Permissions",
      icon: <SecurityScanOutlined />,
      path: "/app/settings/roles-permissions",
    },
    {
      key: "/app/settings/general-faqs",
      label: "General FAQs",
      icon: <QuestionCircleOutlined />,
      path: "/app/settings/general-faqs",
    },
  ];

  const activeKey =
    pathname === "/app/settings" ? "/app/settings/user-management" : pathname;

  const handleTabChange = (key: string) => {
    router.push(key);
  };

  return (
    <main className="flex min-h-screen flex-col gap-4">
      <Tabs
        activeKey={activeKey}
        items={tabItems
          .filter((item) => item.key !== "/app/settings")
          .map((item) => ({
            key: item.key,
            label: (
              <Link
                href={item.path}
                className="flex items-center gap-2 text-inherit!"
              >
                {item.icon}
                {item.label}
              </Link>
            ),
          }))}
        onChange={handleTabChange}
      />
      {children}
    </main>
  );
}
