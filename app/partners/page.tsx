"use client";

import { Alert, Card, Col, Row, Statistic, Typography } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";
// import { getPartnerOnboardingList, getSystemAlerts } from "@/services/api/partners.service";

const { Title } = Typography;

export default function PartnersDashboard() {
//   const { data: onboardingData } = getPartnerOnboardingList();
//   const { data: alertsData } = getSystemAlerts();

//   const partners = onboardingData?.data || [];
//   const alerts = alertsData?.data || [];

//   const stats = {
//     totalPartners: partners.length,
//     pendingKYC: partners.filter((p: any) => p.status === "PENDING_REVIEW").length,
//     activePartners: partners.filter((p: any) => p.status === "APPROVED").length,
//     criticalAlerts: alerts.filter((a: any) => a.severity === "CRITICAL" && a.status === "NEW").length,
//   };

    const stats = {
        totalPartners: 0,
        pendingKYC: 0,
        activePartners: 0,
        criticalAlerts: 0,
    };

  return (
    <main className="flex flex-col gap-6">
      <Alert
        title="Beta Version - Do Not Use"
        description="This Partner Portal is currently in beta testing phase. Please do not use this system for production purposes. Features may be incomplete, unstable, or subject to change without notice."
        type="warning"
        icon={<WarningOutlined />}
        showIcon
        className="mb-4"
        banner
      />

      <div>
        <Title level={2}>Partner Dashboard</Title>
        <p className="text-gray-600">Overview of partner operations and status</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Statistic
              title="Total Partners"
              value={stats.totalPartners}
              prefix={<TeamOutlined className="text-blue-600" />}
              styles={{ content: { color: "#1890ff" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Statistic
              title="Pending KYC"
              value={stats.pendingKYC}
              prefix={<ClockCircleOutlined className="text-orange-600" />}
              styles={{ content: { color: "#fa8c16" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Statistic
              title="Active Partners"
              value={stats.activePartners}
              prefix={<CheckCircleOutlined className="text-green-600" />}
              styles={{ content: { color: "#52c41a" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Statistic
              title="Critical Alerts"
              value={stats.criticalAlerts}
              prefix={<DollarOutlined className="text-red-600" />}
              styles={{ content: { color: "#ff4d4f" } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Activity" className="shadow-lg">
            <p className="text-gray-500">Activity feed will be displayed here</p>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Quick Actions" className="shadow-lg">
            <div className="flex flex-col gap-2">
              <a href="/partners/onboarding" className="text-blue-600 hover:underline">
                Add New Partner
              </a>
              <a href="/partners/kyc-review" className="text-blue-600 hover:underline">
                Review Pending KYC
              </a>
              <a href="/partners/analytics" className="text-blue-600 hover:underline">
                View Analytics
              </a>
            </div>
          </Card>
        </Col>
      </Row>
    </main>
  );
}

