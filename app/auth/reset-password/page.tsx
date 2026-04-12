"use client";

import { Button, Form, Input, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword, validateResetToken } from "@/services/api/auth.service";

interface FormValues {
  password: string;
  confirm: string;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      return;
    }
    validateResetToken(token)
      .then(({ valid }) => setTokenValid(valid))
      .catch(() => setTokenValid(false))
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { password, confirm } = await form.validateFields();
      if (password !== confirm) {
        message.open({ type: "error", content: "Passwords do not match." });
        return;
      }
      await resetPassword({ token, password });
      setDone(true);
      message.open({ type: "success", content: "Password updated. Redirecting..." });
      setTimeout(() => router.replace("/auth"), 2000);
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      const err = e as { error?: string };
      message.open({
        type: "error",
        content: err?.error ?? "Could not reset password. Please try again.",
        duration: 6,
      });
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="flex flex-col gap-4 w-125 max-w-full p-2">
        <p className="text-sm text-gray-500">Validating link...</p>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="flex flex-col gap-4 w-125 max-w-full p-2">
        <h2 className="text-3xl font-bold">Link Expired</h2>
        <p className="text-sm text-gray-500">
          This reset link is invalid or has already been used.
        </p>
        <Link href="/auth/forgot-password">Request a new link →</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4 w-125 max-w-full p-2">
        <h2 className="text-3xl font-bold">Password Updated</h2>
        <p className="text-sm text-gray-500">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-125 max-w-full p-2">
      <h2 className="text-3xl font-bold">Reset Password</h2>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
        className="max-w-3xl flex flex-col gap-0"
      >
        <Form.Item
          label="New Password"
          name="password"
          rules={[
            { required: true, message: "Password is required" },
            { min: 8, message: "At least 8 characters" },
          ]}
        >
          <Input.Password
            size="large"
            placeholder="Enter new password"
            prefix={<LockOutlined />}
            autoComplete="new-password"
          />
        </Form.Item>
        <Form.Item
          label="Confirm Password"
          name="confirm"
          rules={[{ required: true, message: "Please confirm your password" }]}
        >
          <Input.Password
            size="large"
            placeholder="Confirm new password"
            prefix={<LockOutlined />}
            autoComplete="new-password"
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
            {loading ? "Updating..." : "Set Password"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}