"use client";

import { useState } from "react";
import { Tabs, Badge } from "antd";
import KycReviews from "./(components)/KycReviews";
import UnverifiedDocuments from "./(components)/UnverifiedDocuments";
import { useKycSubmissions } from "@/services/api/partners.service";

export default function KycReviewPage() {
  const [activeTab, setActiveTab] = useState("reviews");

  // Fetch pending count for the badge on Unverified documents tab
  const { data: pendingData } = useKycSubmissions({ status: "pending", limit: 1 });
  const pendingCount = pendingData?.pagination.total ?? 0;

  return (
    <main className="flex flex-col gap-5 min-h-screen">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">KYC Review</h2>
        <p className="text-sm text-slate-500 mt-1">
          Review and manage partner KYC submissions and document verification
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="kyc-review-tabs"
          tabBarStyle={{ paddingLeft: 24, paddingRight: 24, marginBottom: 0 }}
          items={[
            {
              key: "reviews",
              label: "KYC Reviews",
              children: <KycReviews />,
            },
            {
              key: "unverified",
              label: (
                <span className="flex items-center gap-2">
                  Unverified documents
                  <Badge
                    count={pendingCount}
                    style={{ backgroundColor: pendingCount > 0 ? "#f59e0b" : "#94a3b8" }}
                    showZero
                  />
                </span>
              ),
              children: <UnverifiedDocuments />,
            },
          ]}
        />
      </div>
    </main>
  );
}