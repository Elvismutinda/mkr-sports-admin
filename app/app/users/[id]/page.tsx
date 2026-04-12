"use client";

import { Button, Spin, Tabs, Tag } from "antd";
import type { TabsProps } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  useRouter,
  useSearchParams,
  usePathname,
  useParams,
} from "next/navigation";
import { useMemo } from "react";
import { useUser } from "@/services/api/users.service";
import Stats from "../(components)/Stats";
import UserDetails from "../(components)/UserDetails";

const TAB_MAP: Record<string, string> = { "1": "details", "2": "stats" };
const TAB_KEY_MAP: Record<string, string> = { details: "1", stats: "2" };

export default function UserDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { id } = useParams<{ id: string }>();

  const { data: user, isLoading, mutate } = useUser(id);

  const activeKey = useMemo(() => {
    const tab = searchParams.get("tab");
    return tab && TAB_KEY_MAP[tab] ? TAB_KEY_MAP[tab] : "1";
  }, [searchParams]);

  const handleTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", TAB_MAP[key] ?? key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-red-500 p-8">User not found.</p>;
  }

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Details",
      children: <UserDetails user={user} onUpdated={() => mutate()} />,
    },
    {
      key: "2",
      label: "Stats & Attributes",
      children: <Stats user={user} onUpdated={() => mutate()} />,
    },
  ];

  return (
    <main className="flex flex-col gap-4">
      <div className="flex gap-4 items-center">
        <Button onClick={() => router.push("/app/users")} icon={<ArrowLeftOutlined />} />
        <h2 className="text-2xl font-bold grow">{user.name}</h2>
        <Tag color={user.isActive ? "green" : "red"}>
          {user.isActive ? "Active" : "Inactive"}
        </Tag>
        <Tag color="blue" className="capitalize">
          {user.role}
        </Tag>
      </div>
      <Tabs activeKey={activeKey} items={items} onChange={handleTabChange} size="small" />
    </main>
  );
}
