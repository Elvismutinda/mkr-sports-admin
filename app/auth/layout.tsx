"use client";
import React from "react";
import { AuthNavbar } from "@/components/AuthNavbar";

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={
        "flex flex-wrap flex-col items-center justify-center min-h-screen"
      }
    >
      <AuthNavbar />
      {children}
    </div>
  );
}

export default AuthLayout;
