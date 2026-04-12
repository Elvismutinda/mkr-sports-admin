"use client";

import { Button, Form, Input, message } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

interface LoginFields {
  email: string;
  password: string;
}

export default function AuthPage() {
  const [form] = Form.useForm<LoginFields>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") ?? "/app/dashboard";

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { email, password } = await form.validateFields();

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        message.open({
          type: "error",
          content: "Invalid credentials. Access denied.",
          duration: 5,
        });
        return;
      }

      message.open({
        type: "success",
        content: "Authenticated. Redirecting...",
        duration: 1.5,
      });

      router.replace(returnUrl);
    } catch (e: unknown) {
      // validateFields throws on validation failure — don't show a toast for that
      if (e && typeof e === "object" && "errorFields" in e) return;
      message.open({
        type: "error",
        content: "Something went wrong. Please try again.",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-125 max-w-full p-2">
      <h2 className={"text-3xl font-bold"}>Login</h2>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleLogin}
        className={"max-w-3xl flex flex-col gap-0"}
      >
        <Form.Item
          label="Email Address"
          name="email"
          rules={[
            { required: true, message: "Email is required" },
            { type: "email", message: "Enter a valid email" },
          ]}
        >
          <Input
            size="large"
            placeholder="Enter email"
            prefix={<MailOutlined />}
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Password is required" }]}
        >
          <Input.Password
            size="large"
            placeholder="Enter password"
            prefix={<LockOutlined />}
          />
        </Form.Item>

        <Link href={"/auth/forgot-password"} className="mb-4 block">
          Forgot Password?
        </Link>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            className="w-full"
          >
            {loading ? "Authenticating..." : "Authenticate"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
