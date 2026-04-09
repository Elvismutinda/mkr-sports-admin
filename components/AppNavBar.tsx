"use client";

import { Avatar, Button, Dropdown, MenuProps, Popover, Tag } from "antd";
import {
  LogoutOutlined,
  MenuOutlined,
  UserOutlined,
} from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { authActions } from "@/store/slices/auth";
import { clearPermissions } from "@/store/slices/permissionSlice";
// import { getNotificationsCount } from "@/services/api/notifications.service";
// import NotificationModal from "@/app/app/notifications/(Components)/NotificationModal";

interface Props {
  toggleMenu: () => void;
}

export default function AppNavBar({ toggleMenu }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

//   const { data: notificationCount } = getNotificationsCount();
  const [isPopoverOpen, setPopoverOpen] = useState(false);

  // Belt-and-suspenders: if Redux says unauthenticated, send to /auth
  useEffect(() => {
    if (!isAuthenticated) router.replace("/auth");
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    dispatch(authActions.clearSession());
    dispatch(clearPermissions());
    await signOut({ redirect: false });
    router.replace("/auth");
  };

  // Build initials from system user's name (single name string, not first/last)
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
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: <span onClick={handleLogout}>Logout</span>,
      className: "!text-red-500",
      danger: true,
    },
  ];

  return (
    <div className="h-15 shrink-0 z-10 border-b flex flex-row items-center px-4 bg-white/50 backdrop-blur-lg gap-4">
      {/* Sidebar toggle */}
      <Button
        type="text"
        icon={<MenuOutlined />}
        size="large"
        onClick={toggleMenu}
      />

      {/* Right side */}
      <div className="flex grow items-center justify-end gap-4">
        {/* Environment tag */}
        {process.env.NEXT_PUBLIC_ENVIRONMENT && (
          <Tag color="warning">{process.env.NEXT_PUBLIC_ENVIRONMENT}</Tag>
        )}

        {/* Notifications */}
        <Popover
          open={isPopoverOpen}
          onOpenChange={setPopoverOpen}
        //   content={
        //     <NotificationModal handleClose={() => setPopoverOpen(false)} />
        //   }
          trigger="click"
        >
          {/* <Badge count={notificationCount || 0} overflowCount={99}>
            <BellOutlined className="text-2xl! text-gray-400! hover:text-primary! cursor-pointer transition-colors" />
          </Badge> */}
        </Popover>

        {/* User avatar + dropdown */}
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
                style={{ backgroundColor: "#2a79b5" }}
              >
                {initials}
              </Avatar>
            ) : (
              <Avatar
                className="hover:bg-primary transition-colors"
                size="large"
                shape="circle"
                icon={<UserOutlined />}
                style={{ backgroundColor: "#2a79b5" }}
              />
            )}
          </span>
        </Dropdown>
      </div>
    </div>
  );
}