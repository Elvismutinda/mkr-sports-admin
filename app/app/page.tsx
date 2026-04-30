"use client";

import { useRouter } from "next/navigation";
import { Card } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  DownSquareOutlined,
  PieChartOutlined,
  TransactionOutlined,
  BarsOutlined,
  HistoryOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { PermissionGroups } from "@/_utils/enums/permissions.enum";
import { useAppSelector } from "@/store/hooks";

export default function Home() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const { hasAnyPermission } = usePermission();

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getUserName = () => {
    if (user?.name) {
      return user.name;
    }
    return "Admin"; // Fallback if no name is available
  };

  const navigationCards = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <DashboardOutlined className="text-4xl text-black" />,
      description: "Overview and analytics",
      path: "/app/dashboard",
      color: "border-gray-300 hover:border-black hover:shadow-gray-200",
      hasPermission: hasAnyPermission(PermissionGroups.Dashboard),
    },
    {
      id: "users",
      title: "Users",
      icon: <UserOutlined className="text-4xl text-black" />,
      description: "User management",
      path: "/app/users",
      color: "border-gray-300 hover:border-black hover:shadow-gray-200",
      hasPermission: hasAnyPermission(PermissionGroups.User),
    },
    {
      id: "turfs",
      title: "Turfs",
      icon: <DownSquareOutlined className="text-4xl text-black" />,
      description: "Manage turfs and availability",
      path: "/app/turfs",
      color: "border-gray-300 hover:border-black hover:shadow-gray-200",
      hasPermission: hasAnyPermission(PermissionGroups.Turf),
    },
    {
      id: "teams",
      title: "Teams",
      icon: <TeamOutlined className="text-4xl text-black" />,
      description: "Team management",
      path: "/app/teams",
      color: "border-gray-300 hover:border-black hover:shadow-gray-200",
      hasPermission: hasAnyPermission(PermissionGroups.Team),
    },
    {
      id: "tournaments",
      title: "Tournaments",
      icon: <TrophyOutlined className="text-4xl text-black" />,
      description: "Organize and manage tournaments",
      path: "/app/tournaments",
      color: "border-gray-300 hover:border-black hover:shadow-gray-200",
      hasPermission: hasAnyPermission(PermissionGroups.Tournament),
    },
    {
      id: "matches",
      title: "Matches",
      icon: <PieChartOutlined className="text-4xl text-black" />,
      description: "View and manage matches",
      path: "/app/matches",
      color: "border-gray-300 hover:border-black hover:shadow-gray-200",
      hasPermission: hasAnyPermission(PermissionGroups.Match),
    },
    {
      id: "transactions",
      title: "Transactions",
      icon: <TransactionOutlined className="text-4xl text-black" />,
      description: "View and manage transactions",
      path: "/app/transactions",
      color: "border-gray-300 hover:border-black hover:shadow-gray-200",
      hasPermission: hasAnyPermission(PermissionGroups.Transaction),
    },
    {
      id: "reports",
      title: "Reports",
      icon: <BarsOutlined className="text-4xl text-black" />,
      description: "Generate reports",
      path: "/app/reports",
      color: "border-gray-300 hover:border-black hover:shadow-gray-200",
      hasPermission: hasAnyPermission(PermissionGroups.Report),
    },
    {
      id: "system-logs",
      title: "System Logs",
      icon: <HistoryOutlined className="text-4xl text-black" />,
      description: "System activity logs",
      path: "/app/system-logs",
      color: "border-gray-300 hover:border-black hover:shadow-gray-200",
      hasPermission: false, // System logs might not have specific permissions, defaulting to true
    },
    {
      id: "settings",
      title: "Settings",
      icon: <SettingOutlined className="text-4xl text-black" />,
      description: "System configuration",
      path: "/app/settings",
      color: "border-gray-300 hover:border-black hover:shadow-gray-200",
      hasPermission: hasAnyPermission(PermissionGroups.Settings),
    },
  ];

  const handleCardClick = (path: string) => {
    router.push(path);
  };

  // Filter cards based on permissions
  const availableCards = navigationCards.filter((card) => card.hasPermission);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {getTimeOfDayGreeting()}, {getUserName()}! 👋
        </h1>
        <p className="text-gray-600">
          Welcome to MKR Sports Admin. Select a module to get started
        </p>
      </div>

      {availableCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {availableCards.map((card) => (
            <Card
              key={card.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 border-none ${card.color}`}
              styles={{ body: { padding: "24px" } }}
              onClick={() => handleCardClick(card.path)}
            >
              <div className="text-center">
                <div className="mb-4 flex justify-center">{card.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600">{card.description}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="mb-4">
            <SettingOutlined className="text-6xl text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No modules available
          </h3>
          <p className="text-gray-500">
            You don&apos;t have permission to access any modules. Please contact
            your administrator.
          </p>
        </div>
      )}
    </div>
  );
}
