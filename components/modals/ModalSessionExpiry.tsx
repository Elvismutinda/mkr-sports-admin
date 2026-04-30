"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "antd";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { authActions } from "@/store/slices/auth";
import { clearPermissions } from "@/store/slices/permissionSlice";

const WARNING_BEFORE_EXPIRY_MS = 60 * 1000; // 60s before expiry
const TICK_INTERVAL_MS = 1000;

export default function ModalSessionExpiry() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [isOpen, setIsOpen] = useState(false);
  const [remainingSecs, setRemainingSecs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const expires = session?.expires;

  // Memoize expiry timestamp (prevents recalculation every tick)
  const expiryMs = useMemo(() => {
    if (!expires) return null;
    return new Date(expires).getTime();
  }, [expires]);

  const handleLogout = useCallback(async () => {
    dispatch(authActions.clearSession());
    dispatch(clearPermissions());
    setIsOpen(false);

    await signOut({ redirect: false });
    router.replace("/auth");
  }, [dispatch, router]);

  useEffect(() => {
    if (status !== "authenticated" || !expiryMs) return;

    const tick = () => {
      const now = Date.now();
      const msLeft = expiryMs - now;

      if (msLeft <= 0) {
        setIsOpen(false);
        handleLogout();
        return;
      }

      const secs = Math.ceil(msLeft / 1000);
      setRemainingSecs(secs);

      // Only open once (prevents re-renders loop)
      if (msLeft <= WARNING_BEFORE_EXPIRY_MS) {
        setIsOpen(true);
      }
    };

    tick(); // run immediately

    const interval = setInterval(tick, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status, expiryMs, handleLogout]);

  const handleStayLoggedIn = async () => {
    setIsLoading(true);
    try {
      await update(); // refresh session
      setIsOpen(false);
    } catch {
      await handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if not authenticated
  if (status !== "authenticated") return null;

  return (
    <Modal
      title={remainingSecs > 0 ? "Still with us?" : "Session Expired"}
      open={isOpen}
      okText={remainingSecs > 0 ? "I'm still here" : "Log back in"}
      cancelText="Log out"
      confirmLoading={isLoading}
      onOk={remainingSecs > 0 ? handleStayLoggedIn : handleLogout}
      onCancel={handleLogout}
      mask={{ closable: false }}
      closable={false}
    >
      {remainingSecs > 0 ? (
        <p>
          For your security, you will be logged out in{" "}
          <b className="text-2xl">{remainingSecs}s</b>. Click below to stay
          logged in.
        </p>
      ) : (
        <p>Your session has expired. Please log back in to continue.</p>
      )}
    </Modal>
  );
}