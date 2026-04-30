"use client";

import React from "react";
import { Badge, Menu } from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  BarsOutlined,
  HistoryOutlined,
  SettingOutlined,
  TrophyOutlined,
  TeamOutlined,
  CreditCardOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import Sider from "antd/es/layout/Sider";
import { usePermission } from "@/hooks/usePermission";
import { Permission, PermissionGroups } from "@/_utils/enums/permissions.enum";
import { usePathname, useRouter } from "next/navigation";
import { MKRSportsLogo } from "./MKRSportsLogo";
import { useModuleCounts } from "@/services/api/notifications.service";

const EXPANDED_W = 220;
const COLLAPSED_W = 64;

type MenuItem = NonNullable<MenuProps["items"]>[number];

interface SidebarItem {
  key: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  hasPermission: boolean;
  children?: SidebarChildItem[];
}

interface SidebarChildItem {
  key: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  hasPermission: boolean;
}

function BadgeLabel({ label, count }: { label: string; count: number }) {
  return (
    <span className="flex items-center gap-2">
      {label}
      {count > 0 && <Badge size="small" count={count} overflowCount={99} />}
    </span>
  );
}

interface Props {
  collapsed: boolean;
  onClose?: () => void; // called when the mobile overlay backdrop is clicked
  className?: string;
}

export default function AppSideBar({
  collapsed,
  onClose,
  className = "",
}: Readonly<Props>) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasAnyPermission, hasPermission } = usePermission();
  const { data: counts } = useModuleCounts();

  const menuItems: SidebarItem[] = [
    {
      key: "/app/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      hasPermission: hasAnyPermission(PermissionGroups.Dashboard),
    },
    {
      key: "/app/users",
      icon: <TeamOutlined />,
      label: <BadgeLabel label="Users" count={counts?.users ?? 0} />,
      hasPermission: hasAnyPermission(PermissionGroups.User),
    },
    {
      key: "/app/turfs",
      icon: <EnvironmentOutlined />,
      label: <BadgeLabel label="Turfs" count={counts?.turfs ?? 0} />,
      hasPermission: hasAnyPermission(PermissionGroups.Turf),
    },
    {
      key: "/app/teams",
      icon: <TeamOutlined />,
      label: <BadgeLabel label="Teams" count={counts?.teams ?? 0} />,
      hasPermission: hasAnyPermission(PermissionGroups.Team),
    },
    {
      key: "/app/tournaments",
      icon: <TrophyOutlined />,
      label: <BadgeLabel label="Tournaments" count={counts?.tournaments ?? 0} />,
      hasPermission: hasAnyPermission(PermissionGroups.Tournament),
    },
    {
      key: "/app/matches",
      icon: <ThunderboltOutlined />,
      label: <BadgeLabel label="Matches" count={counts?.matches ?? 0} />,
      hasPermission: hasAnyPermission(PermissionGroups.Match),
    },
    {
      key: "/app/transactions",
      icon: <CreditCardOutlined />,
      label: <BadgeLabel label="Transactions" count={counts?.payments ?? 0} />,
      hasPermission: hasAnyPermission(PermissionGroups.Transaction),
    },
    {
      key: "/app/reports",
      icon: <BarsOutlined />,
      label: "Reports",
      hasPermission: hasAnyPermission(PermissionGroups.Report),
    },
    {
      key: "/app/system-logs",
      icon: <HistoryOutlined />,
      label: "System Logs",
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
          label: "General",
          hasPermission: hasAnyPermission(PermissionGroups.Settings),
        },
        {
          key: "/app/profile",
          icon: <UserOutlined />,
          label: "My Profile",
          hasPermission: true,
        },
      ],
    },
  ];

  const filtered: MenuItem[] = menuItems
  .filter((item): item is SidebarItem => !!item && item.hasPermission)
  .map((item): MenuItem => {
      if (item.children) {
        return {
          key: item.key,
          icon: item.icon,
          label: item.label,
          children: item.children
            .filter((child) => child.hasPermission)
            .map((child): MenuItem => ({
              key: child.key,
              icon: child.icon,
              label: child.label,
            })),
        };
      }
      return { key: item.key, icon: item.icon, label: item.label };
    });

  // Derive selected key from current pathname
  const selectedKey = (() => {
    // Exact match first
    const exact = filtered.find((item) => {
  if (!item) return false; // 👈 fix

  if ("key" in item && item.key === pathname) return true;
  const children = (item as { children?: { key: unknown }[] }).children;
  return children?.some((c) => c.key === pathname);
});
    if (exact) return pathname;
    // Prefix match (e.g. /app/users/123 → /app/users)
    const segments = pathname.split("/").filter(Boolean);
    while (segments.length > 1) {
      segments.pop();
      const candidate = "/" + segments.join("/");
      const found = filtered.some((item) => {
        if (!item) return false;

        if ("key" in item && item.key === candidate) return true;
        const children = (item as { children?: { key: unknown }[] }).children;
        return children?.some((c) => c.key === candidate);
      });
      if (found) return candidate;
    }
    return pathname;
  })();

  const width = collapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <>
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/30 z-10 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <div
        className={`fixed top-0 left-0 h-screen z-20 flex flex-col bg-white border-e border-slate-800/10 shadow-sm
          transition-[width] duration-300 ease-in-out overflow-hidden ${className}`}
        style={{ width }}
      >
        <div
          className="flex flex-col items-center justify-center font-bold text-white bg-primary shrink-0 overflow-hidden"
          style={{ height: 60, minHeight: 60 }}
        >
          <MKRSportsLogo collapsed={collapsed} />
          <span
            className="text-xs font-semibold tracking-widest uppercase text-white/80 mt-1
              transition-opacity duration-200"
            style={{ opacity: collapsed ? 0 : 1, height: collapsed ? 0 : "auto" }}
          >
            Admin
          </span>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            collapsedWidth={COLLAPSED_W}
            width={EXPANDED_W}
            className="bg-white! min-h-0! h-auto!"
            style={{ background: "white" }}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              defaultOpenKeys={collapsed ? [] : ["users", "settings"]}
              onClick={({ key }) => {
                router.push(key);
                // Auto-close on mobile after navigation
                if (window.innerWidth < 768) onClose?.();
              }}
              items={filtered}
              className="border-none!"
              inlineCollapsed={collapsed}
            />
          </Sider>
        </div>
      </div>

      <div
        className="shrink-0 transition-[width] duration-300 ease-in-out"
        style={{ width }}
        aria-hidden
      />
    </>
  );
}