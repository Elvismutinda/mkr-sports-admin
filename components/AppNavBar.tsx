"use client";

import { Avatar, Badge, Button, Dropdown, Popover, Select, Tag } from "antd";
import type { MenuProps } from "antd";
import {
  BellOutlined,
  LogoutOutlined,
  MenuOutlined,
  SwapOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { authActions } from "@/store/slices/auth";
import { clearPermissions } from "@/store/slices/permissionSlice";
import { useNotifications } from "@/services/api/notifications.service";
import NotificationModal from "@/components/NotificationModal";

interface Props {
  toggleMenu: () => void;
}

export default function AppNavBar({ toggleMenu }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const isSuperAdmin = useAppSelector(
    (state) => state.permissions.isSuperAdmin,
  );

  const [isPopoverOpen, setPopoverOpen] = useState(false);

  const { data: notifData, mutate: mutateNotifications } = useNotifications();
  const unreadCount = notifData?.unreadCount ?? 0;

  useEffect(() => {
    if (!isAuthenticated) router.replace("/auth");
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    dispatch(authActions.clearSession());
    dispatch(clearPermissions());
    await signOut({ redirect: false });
    router.replace("/auth");
  };

  const initials = user?.name
    ? user.name
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : null;

  const dropdownItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: <Link href="/app/profile">My Profile</Link>,
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: <span onClick={handleLogout}>Logout</span>,
      danger: true,
    },
  ];

  return (
    <div className="h-15 shrink-0 z-10 border-b border-slate-800/10 flex flex-row items-center px-4 bg-white/50 backdrop-blur-lg gap-4">
      <Button
        type="text"
        icon={<MenuOutlined />}
        size="large"
        onClick={toggleMenu}
      />

      <div className="flex grow items-center justify-end gap-4">
        {process.env.NEXT_PUBLIC_ENVIRONMENT && (
          <Tag color="warning">{process.env.NEXT_PUBLIC_ENVIRONMENT}</Tag>
        )}

        {isSuperAdmin && (
          <Select
            value={pathname?.startsWith("/partners") ? "partner" : "main"}
            onChange={(value) =>
              router.push(value === "partner" ? "/partners" : "/app")
            }
            style={{ minWidth: 160 }}
            suffixIcon={<SwapOutlined />}
            options={[
              { label: "Main Portal", value: "main" },
              { label: "Partner Admin", value: "partner" },
            ]}
          />
        )}

        <Popover
          open={isPopoverOpen}
          onOpenChange={(open) => {
            setPopoverOpen(open);
            if (open) mutateNotifications();
          }}
          content={<NotificationModal onClose={() => setPopoverOpen(false)} />}
          trigger="click"
          placement="bottomRight"
          styles={{
            root: { padding: 0 },
            container: { padding: "12px 12px 8px" },
          }}
        >
          <Badge count={unreadCount} overflowCount={99} size="small">
            <BellOutlined className="text-xl text-gray-400 hover:text-primary cursor-pointer transition-colors" />
          </Badge>
        </Popover>

        <Dropdown
          menu={{ items: dropdownItems }}
          placement="bottomRight"
          styles={{ root: { width: 200 } }}
          trigger={["click"]}
        >
          <span className="inline-flex cursor-pointer">
            {initials ? (
              <Avatar
                className="hover:bg-primary transition-colors uppercase"
                size="large"
                shape="circle"
                style={{ backgroundColor: "#2a79b5", fontWeight: 700 }}
              >
                {initials}
              </Avatar>
            ) : (
              <Avatar
                className="hover:bg-primary transition-colors"
                size="large"
                shape="circle"
                icon={<UserOutlined />}
                style={{ backgroundColor: "#2a79b5", fontWeight: 700}}
              />
            )}
          </span>
        </Dropdown>
      </div>
    </div>
  );
}
