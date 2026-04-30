"use client";
import React, { useMemo } from "react";
import { Menu } from "antd";
import type { MenuProps } from "antd";
import {
  AuditOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  TeamOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import Sider from "antd/es/layout/Sider";
import { useRouter, usePathname } from "next/navigation";
import { MKRSportsLogo } from "../MKRSportsLogo";

const EXPANDED_W = 200;
const COLLAPSED_W = 80;

type MenuItem = NonNullable<MenuProps["items"]>[number];

interface SidebarChildItem {
  key: string;
  icon?: React.ReactNode;
  label: React.ReactNode;
  children?: SidebarChildItem[];
}

interface SidebarItem {
  key: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  children?: SidebarChildItem[];
}

interface Props {
  collapsed: boolean;
  onClose?: () => void;
  className?: string;
}

export default function PartnerSideBar({
  collapsed,
  onClose,
  className = "",
}: Readonly<Props>) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems: SidebarItem[] = [
    {
      key: "/partners",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/partners/onboarding",
      icon: <TeamOutlined />,
      label: "Partners",
    },
    {
      key: "/partners/kyc-review",
      icon: <AuditOutlined />,
      label: "KYC Review",
    },
    {
      key: "/partners/analytics",
      icon: <FileTextOutlined />,
      label: "Analytics",
    },
    {
      key: "management",
      icon: <SettingOutlined />,
      label: "Management",
      children: [
        {
          key: "/partners/management/settings",
          icon: <SettingOutlined />,
          label: "Settings",
        },
        {
          key: "/partners/management/logs",
          icon: <HistoryOutlined />,
          label: "Partner Logs",
        },
      ],
    },
  ];

  const mapItem = (item: SidebarChildItem): MenuItem => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    children: item.children?.map(mapItem),
  });

  const antItems: MenuItem[] = menuItems.map(mapItem);

  // Derive selected key from pathname
  const selectedKey = useMemo(() => {
    if (pathname.startsWith("/partners/management/settings"))
      return "/partners/management/settings";
    if (pathname.startsWith("/partners/management/logs"))
      return "/partners/management/logs";
    if (pathname.startsWith("/partners/kyc-review"))
      return "/partners/kyc-review";
    if (pathname.startsWith("/partners/onboarding"))
      return "/partners/onboarding";
    if (pathname.startsWith("/partners/analytics"))
      return "/partners/analytics";
    return pathname;
  }, [pathname]);

  // Derive default open keys from pathname
  const defaultOpenKeys = useMemo(() => {
    const keys: string[] = [];
    if (pathname.startsWith("/partners/management")) keys.push("management");
    return keys;
  }, [pathname]);

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
              defaultOpenKeys={collapsed ? [] : defaultOpenKeys}
              onClick={({ key }) => {
                if (key.startsWith("/")) {
                  router.push(key);
                  if (window.innerWidth < 768) onClose?.();
                }
              }}
              items={antItems}
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
