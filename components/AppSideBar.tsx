"use client";
import React from "react";
import { Menu } from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  UserSwitchOutlined,
  BarsOutlined,
  HistoryOutlined,
  SettingOutlined,
  TrophyOutlined,
  TeamOutlined,
  CreditCardOutlined,
  EnvironmentOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import Sider from "antd/es/layout/Sider";
import Link from "next/link";
import { usePermission } from "@/hooks/usePermission";
import { Permission, PermissionGroups } from "@/_utils/enums/permissions.enum";
import { useRouter } from "next/navigation";
import { MKRSportsLogo } from "./MKRSportsLogo";

type MenuItem = Required<MenuProps>["items"][number];

interface SidebarItem {
  key: string;
  icon: React.ReactNode;
  label?: React.ReactNode;
  hasPermission: boolean;
  children?: SidebarChildItem[];
}

interface SidebarChildItem {
  key: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  hasPermission: boolean;
}

const siderStyle: React.CSSProperties = {
  overflow: "auto",
  height: "100vh",
  insetInlineStart: 0,
  top: 0,
  bottom: 0,
  scrollbarWidth: "thin",
  scrollbarGutter: "stable",
};

export default function AppSideBar({
  collapsed = false,
  className = "",
}: Readonly<{
  className: string;
  collapsed: boolean;
}>) {
  const router = useRouter();
  const { hasAnyPermission, hasPermission } = usePermission();

  const menuItems: SidebarItem[] = [
    {
      key: "/app/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      hasPermission: hasAnyPermission(PermissionGroups.Dashboard),
    },
    {
      key: "users",
      icon: <TeamOutlined />,
      label: "Users",
      hasPermission: hasAnyPermission(PermissionGroups.User),
      children: [
        {
          key: "/app/users",
          icon: <UserOutlined />,
          label: "Players",
          hasPermission: hasPermission(Permission.VIEW_USER),
        },
        {
          key: "/app/users/player-stats",
          icon: <LineChartOutlined />,
          label: "Player Stats",
          hasPermission: hasPermission(Permission.VIEW_USER),
        },
        {
          key: "/app/agents",
          icon: <UserSwitchOutlined />,
          label: "Agents (Turf Owners)",
          hasPermission: hasPermission(Permission.VIEW_USER),
        },
      ],
    },
    {
      key: "/app/turfs",
      icon: <EnvironmentOutlined />,
      label: "Turfs",
      hasPermission: hasAnyPermission(PermissionGroups.Turf),
    },
    {
      key: "/app/teams",
      icon: <TeamOutlined />,
      label: "Teams",
      hasPermission: hasAnyPermission(PermissionGroups.Team),
    },
    {
      key: "/app/tournaments",
      icon: <TrophyOutlined />,
      label: "Tournaments",
      hasPermission: hasAnyPermission(PermissionGroups.Tournament),
    },
    {
      key: "/app/matches",
      icon: <ThunderboltOutlined />,
      label: "Matches",
      hasPermission: hasAnyPermission(PermissionGroups.Match),
    },
    {
      key: "/app/transactions",
      icon: <CreditCardOutlined />,
      label: "Transactions",
      hasPermission: hasAnyPermission(PermissionGroups.Transaction),
    },
    {
      key: "/app/reports",
      icon: <BarsOutlined />,
      label: <Link href="/app/reports">Reports</Link>,
      hasPermission: hasAnyPermission(PermissionGroups.Report),
    },
    {
      key: "/app/system-logs",
      icon: <HistoryOutlined />,
      label: <Link href="/app/system-logs">System Logs</Link>,
      hasPermission: hasPermission(Permission.VIEW_SYSTEM_LOG),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
      hasPermission: true,
      children: [
        {
          key: "/app/settings",
          icon: <SettingOutlined />,
          label: <Link href="/app/settings">General</Link>,
          hasPermission: hasAnyPermission(PermissionGroups.Settings),
        },
        {
          key: "/app/profile",
          icon: <UserOutlined />,
          label: <Link href="/app/profile">My Profile</Link>,
          hasPermission: hasAnyPermission(PermissionGroups.Settings),
        },
      ],
    },
  ];

  // Build Ant Design MenuItem array, fully typed
  const filtered: MenuItem[] = menuItems
    .filter((item) => item.hasPermission)
    .map((item): MenuItem => {
      if (item.children) {
        return {
          key: item.key,
          icon: item.icon,
          label: item.label,
          children: item.children
            .filter((child) => child.hasPermission)
            .map(
              (child): MenuItem => ({
                key: child.key,
                icon: child.icon,
                label: child.label,
              }),
            ),
        };
      }
      return {
        key: item.key,
        icon: item.icon,
        label: item.label,
      };
    });

  const firstKey =
    (filtered[0] as { key?: string } | null)?.key ?? "/app/dashboard";

  return (
    <div
      className={`h-screen shrink-0 z-10 flex relative flex-col overflow-y-auto ${
        !collapsed ? "w-50" : "w-20"
      } ${className}`}
    >
      <div
        className={`fixed h-full bg-white border-e ${
          !collapsed ? "w-50" : "w-20"
        }`}
      >
        <div
          className={"flex flex-col items-center justify-center px-4 font-bold text-white bg-primary h-15"}
        >
          <MKRSportsLogo collapsed={collapsed} />
          {!collapsed && (
            <span className="text-xs font-semibold tracking-widest uppercase mt-1 text-white/80">
              Admin
            </span>
          )}
        </div>

        <Sider
          style={{
            ...siderStyle,
            height: "calc(100vh - 60px)",
            overflowY: "auto",
            overflowX: "hidden",
          }}
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="bg-white"
        >
          <Menu
            mode="inline"
            onClick={({ key }) => router.push(key)}
            defaultSelectedKeys={[firstKey]}
            items={filtered}
          />
        </Sider>
      </div>
    </div>
  );
}