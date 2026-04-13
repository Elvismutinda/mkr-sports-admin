"use client";

import React, { useState } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App as AntdApp, ConfigProvider, theme as antdTheme } from "antd";
import { SessionProvider } from "next-auth/react";
import ReduxProvider from "@/store/ReduxProvider";
import AuthWrapper from "@/app/authWrapper";
import ModalSessionExpiry from "@/components/modals/ModalSessionExpiry";

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDarkMode] = useState(false);

  return (
    <SessionProvider>
      <AntdRegistry>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#2a79b5",
            },
            algorithm: isDarkMode
              ? antdTheme.darkAlgorithm
              : antdTheme.defaultAlgorithm,
          }}
        >
          <AntdApp>
            <ReduxProvider>
              <AuthWrapper>{children}</AuthWrapper>
              <ModalSessionExpiry />
            </ReduxProvider>
          </AntdApp>
        </ConfigProvider>
      </AntdRegistry>
    </SessionProvider>
  );
}