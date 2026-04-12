"use client";

import { useRouter } from "next/navigation";
import { ArrowRightOutlined } from "@ant-design/icons";
import { Button, Tag } from "antd";
import { useAppSelector } from "@/store/hooks";

export function AuthNavbar() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <div className="fixed top-0 w-full z-50 flex flex-row justify-between items-center border-b border-white/10 bg-slate-700 px-3 md:px-6 2xl:px-56 backdrop-blur-xl">
      <div className="flex items-center h-16 pe-4 flex-none">
        <div className="flex items-center">
          <span className="text-2xl font-black text-white italic tracking-tighter">
            MKR
          </span>
          <svg
            className="w-6 h-6 fill-[#ffea00] animate-bolt-flash mx-0.5"
            viewBox="0 0 24 24"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="text-sm font-bold text-[#ffea00] uppercase tracking-[0.2em] ml-1">
            Sports
          </span>
        </div>

        <div className="flex mx-4 gap-2">
          <Tag color="#2a79b5">ADMIN PORTAL</Tag>
          {process.env.NEXT_PUBLIC_ENVIRONMENT && (
            <Tag color="warning">{process.env.NEXT_PUBLIC_ENVIRONMENT}</Tag>
          )}
        </div>
      </div>

      <div className="flex items-center gap-5">
        {!isAuthenticated ? (
          <Button type="primary" onClick={() => router.push("/auth")}>
            Login
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={() => router.push("/app")}
            icon={<ArrowRightOutlined />}
          >
            Back<span className="hidden sm:inline-block">&nbsp;to my account</span>
          </Button>
        )}
      </div>
    </div>
  );
}