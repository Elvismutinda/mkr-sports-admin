"use client";

import { Avatar, Badge, Button, Dropdown, Select, Tag } from "antd";
import type { MenuProps } from "antd";
import {
  BellOutlined,
  LogoutOutlined,
  MenuOutlined,
  SwapOutlined,
  UserOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { partnersAuthActions } from "@/store/slices/partnersAuth";
import { clearPermissions } from "@/store/slices/permissionSlice";
import { signOut } from "next-auth/react";
import { authActions } from "@/store/slices/auth";

interface Props {
  toggleMenu: () => void;
}

export default function PartnerNavBar({ toggleMenu }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  const partnerUser = useAppSelector((state) => state.partnersAuth.user);
  const mainUser = useAppSelector((state) => state.auth.user);
  const user = partnerUser ?? mainUser;

  const isSuperAdmin = useAppSelector(
    (state) => state.permissions.isSuperAdmin,
  );

  const handleLogout = async () => {
    dispatch(partnersAuthActions.clearSession());
    dispatch(authActions.clearSession());
    dispatch(clearPermissions());
    await signOut({ redirect: false });
    router.replace("/auth");
  };

  const initials = user?.name
    ? user.name
        .trim()
        .split(" ")
        .map((n: string) => n[0])
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

        <Badge count={0} overflowCount={99} size="small">
          <BellOutlined className="text-xl text-gray-400 hover:text-primary cursor-pointer transition-colors" />
        </Badge>

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
