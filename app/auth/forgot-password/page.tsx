"use client";

import { Button, Form, Input, message } from "antd";
import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import { useState } from "react";
import Link from "next/link";
import { sendForgotPasswordEmail } from "@/services/api/auth.service";

interface FormValues {
  email: string;
}

export default function ForgotPasswordPage() {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { email } = await form.validateFields();
      await sendForgotPasswordEmail(email);
      setSent(true);
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      const err = e as { error?: string };
      message.open({
        type: "error",
        content: err?.error ?? "Something went wrong. Please try again.",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-4 w-125 max-w-full p-2">
        <h2 className="text-3xl font-bold">Check Your Email</h2>
        <p className="text-sm text-gray-500">
          If an account exists with that address, we&apos;ve sent a reset link.
          It expires in 30 minutes.
        </p>
        <Link href="/auth">
          <ArrowLeftOutlined className="mr-1" />
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-125 max-w-full p-2">
      <h2 className="text-3xl font-bold">Forgot Password</h2>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
        className="max-w-3xl flex flex-col gap-0"
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
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            className="w-full"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </Form.Item>
      </Form>
      <Link href="/auth">
        <ArrowLeftOutlined className="mr-1" />
        Back to Sign In
      </Link>
    </div>
  );
}
