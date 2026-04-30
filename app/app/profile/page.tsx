"use client";

import {
  Alert,
  Avatar,
  Button,
  Form,
  Input,
  message,
  Skeleton,
  Tag,
} from "antd";
import {
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { authActions } from "@/store/slices/auth";
import useSWR from "swr";
import { fetcher } from "@/services/_fetcher";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: "active" | "inactive" | "suspended";
  roleId: string | null;
  roleName: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

interface ProfileFormValues {
  name: string;
  phone?: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { update: updateSession } = useSession();
  const reduxUser = useAppSelector((state) => state.auth.user);

  const { data: profile, isLoading, mutate } = useSWR<ProfileData>(
    "/api/admin/profile",
    fetcher,
  );

  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();

  // Populate form once profile loads
  useEffect(() => {
    if (profile) {
      profileForm.setFieldsValue({
        name: profile.name,
        phone: profile.phone ?? undefined,
      });
    }
  }, [profile, profileForm]);

  const initials = profile?.name
    ? profile.name
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const handleProfileSave = async () => {
    setProfileSubmitting(true);
    try {
      const values = await profileForm.validateFields();

      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw data;

      // Sync the updated name into Redux so the navbar initials update immediately
      if (values.name && reduxUser) {
        dispatch(
          authActions.syncFromSession({
            user: { ...reduxUser, name: values.name },
            token: null,
          }),
        );
      }

      // Trigger next-auth session refresh so the JWT name is also updated
      await updateSession();
      await mutate();

      message.open({ type: "success", content: "Profile updated." });
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      const err = e as { error?: string };
      message.open({
        type: "error",
        content: err?.error ?? "Could not update profile.",
        duration: 5,
      });
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordSubmitting(true);
    try {
      const values = await passwordForm.validateFields();

      if (values.newPassword !== values.confirmPassword) {
        message.open({ type: "error", content: "Passwords do not match." });
        return;
      }

      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw data;

      message.open({ type: "success", content: "Password changed successfully." });
      passwordForm.resetFields();
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      const err = e as { error?: string };
      message.open({
        type: "error",
        content: err?.error ?? "Could not change password.",
        duration: 5,
      });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const STATUS_COLORS: Record<ProfileData["status"], string> = {
    active: "green",
    inactive: "orange",
    suspended: "red",
  };

  return (
    <main className="flex flex-col gap-6 min-h-screen">
      <h2 className="text-2xl font-bold">My Profile</h2>

      <div className="flex flex-row items-center gap-5 bg-white rounded-xl p-5 border border-slate-800/20">
        {isLoading ? (
          <Skeleton.Avatar size={72} active />
        ) : (
          <Avatar
            size={72}
            style={{ backgroundColor: "#2a79b5", fontSize: 28, fontWeight: 700 }}
            className="uppercase shrink-0"
          >
            {initials}
          </Avatar>
        )}

        <div className="flex flex-col gap-1">
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: 200 }} />
          ) : (
            <>
              <p className="text-xl font-bold">{profile?.name}</p>
              <p className="text-sm text-slate-500">{profile?.email}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                {profile?.roleName && (
                  <Tag color="blue">{profile.roleName}</Tag>
                )}
                <Tag
                  color={STATUS_COLORS[profile?.status ?? "active"]}
                  className="capitalize"
                >
                  {profile?.status}
                </Tag>
              </div>
            </>
          )}
        </div>

        {profile && (
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-xs text-slate-400">Last login</p>
            <p className="text-sm text-slate-600 font-medium">
              {profile.lastLoginAt
                ? new Date(profile.lastLoginAt).toLocaleString("en-KE")
                : "Never"}
            </p>
            <p className="text-xs text-slate-400 mt-2">Member since</p>
            <p className="text-sm text-slate-600 font-medium">
              {new Date(profile.createdAt).toLocaleDateString("en-KE")}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4 bg-white rounded-xl p-5 border border-slate-800/20">
          <div className="border-b pb-3">
            <p className="text-base font-bold">Edit Profile</p>
            <p className="text-sm text-slate-500">Update your personal information</p>
          </div>

          {isLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <Form
              form={profileForm}
              layout="vertical"
              requiredMark={false}
              className="max-w-md"
            >
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: "Name is required" }]}
              >
                <Input
                  prefix={<UserOutlined className="text-slate-400" />}
                  placeholder="Your full name"
                />
              </Form.Item>

              <Form.Item label="Email" name="email">
                <Input
                  prefix={<MailOutlined className="text-slate-400" />}
                  value={profile?.email}
                  disabled
                  className="bg-slate-50!"
                />
              </Form.Item>

              <Form.Item label="Phone" name="phone">
                <Input
                  prefix={<PhoneOutlined className="text-slate-400" />}
                  placeholder="+254 7XX XXX XXX"
                />
              </Form.Item>

              <div className="flex gap-3 pt-2">
                <Button
                  type="primary"
                  loading={profileSubmitting}
                  onClick={handleProfileSave}
                  style={{ background: "#2a79b5" }}
                >
                  Save Changes
                </Button>
                <Button onClick={() => profileForm.resetFields()}>
                  Reset
                </Button>
              </div>
            </Form>
          )}
        </div>

        <div className="flex flex-col gap-4 bg-white rounded-xl p-5 border border-slate-800/20">
          <div className="border-b pb-3">
            <p className="text-base font-bold">Password Settings</p>
            <p className="text-sm text-slate-500">
              Change your account password
            </p>
          </div>

          <Form
            form={passwordForm}
            layout="vertical"
            requiredMark={false}
            className="max-w-md"
          >
            <Form.Item
              label="Current Password"
              name="currentPassword"
              rules={[{ required: true, message: "Enter your current password" }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[
                { required: true, message: "Enter a new password" },
                { min: 8, message: "At least 8 characters" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              label="Confirm New Password"
              name="confirmPassword"
              rules={[{ required: true, message: "Confirm your new password" }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Form.Item>

            <Alert
              showIcon
              type="info"
              className="mb-4 text-xs"
              title="You will remain logged in after changing your password."
            />

            <div className="flex gap-3 mt-4">
              <Button
                type="primary"
                loading={passwordSubmitting}
                onClick={handlePasswordChange}
                style={{ background: "#2a79b5" }}
              >
                Change Password
              </Button>
              <Button
                danger
                onClick={() => passwordForm.resetFields()}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </main>
  );
}