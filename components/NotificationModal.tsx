"use client";

import { Button, Spin, Tag } from "antd";
import { BellOutlined, CheckOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  markAllNotificationsRead,
  markNotificationRead,
  useNotifications,
} from "@/services/api/notifications.service";
import type { AdminNotification, NotificationType, } from "@/services/_types";

dayjs.extend(relativeTime);

const TYPE_COLORS: Record<NotificationType, string> = {
  MATCH_REMINDER: "blue",
  PAYMENT_CONFIRMED: "green",
  TOURNAMENT_UPDATE: "purple",
  TEAM_INVITE: "cyan",
  GENERAL: "default",
};

interface Props {
  onClose: () => void;
}

export default function NotificationModal({ onClose }: Props) {
  const { data, isLoading, mutate } = useNotifications({ page: 1 });

  const handleMarkRead = async (n: AdminNotification) => {
    if (n.isRead) return;
    await markNotificationRead(n.id);
    await mutate();
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    await mutate();
  };

  return (
    <div className="w-80 max-h-120 flex flex-col">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <span className="font-bold text-sm">Notifications</span>
        {(data?.unreadCount ?? 0) > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={handleMarkAll}
            className="text-xs p-0!"
          >
            Mark all read
          </Button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 mt-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spin size="small" />
          </div>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center py-10 gap-2 text-slate-400">
            <BellOutlined className="text-3xl" />
            <p className="text-xs">No notifications yet</p>
          </div>
        ) : (
          data.data.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkRead(n)}
              className={`flex gap-3 px-2 py-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 ${
                !n.isRead ? "bg-blue-50/50" : ""
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {!n.isRead && (
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                )}
                {n.isRead && (
                  <span className="inline-block w-2 h-2 rounded-full bg-transparent" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Tag
                    color={TYPE_COLORS[n.type]}
                    className="text-[10px] px-1 py-0 m-0 leading-4"
                  >
                    {n.type.replace(/_/g, " ")}
                  </Tag>
                </div>
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {n.title}
                </p>
                {n.body && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {n.body}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  {dayjs(n.createdAt).fromNow()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {(data?.pagination.total ?? 0) > (data?.data.length ?? 0) && (
        <div className="pt-2 border-t border-gray-100 text-center">
          <Button type="link" size="small" className="text-xs" onClick={onClose}>
            View all notifications
          </Button>
        </div>
      )}
    </div>
  );
}