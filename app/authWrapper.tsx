"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { useEffect } from "react";
import { authActions } from "@/store/slices/auth";
import { loadPermissionsFromArray } from "@/store/slices/permissionSlice";
import { useCurrentUser } from "@/hooks/use-current-user";

const AUTH_PATH = "/auth";
const DEFAULT_AFTER_LOGIN = "/app/dashboard";

function isAuthPage(pathname: string) {
  return pathname === AUTH_PATH || pathname.startsWith(AUTH_PATH + "/");
}

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, status } = useCurrentUser();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Sync next-auth session → Redux ──────────────────────
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && user) {

      dispatch(
        authActions.syncFromSession({
          user: {
            id: user.id ?? "",
            name: user.name ?? null,
            email: user.email ?? null,
            image: user.image ?? null,
            permissions: user.permissions ?? [],
          },
          token: null,
        }),
      );

      dispatch(loadPermissionsFromArray(user.permissions ?? []));
    }

    if (status === "unauthenticated") {
      dispatch(authActions.clearSession());
    }
  }, [dispatch, status, user]);

  // ── Redirect logic ───────────────────────────────────────
  useEffect(() => {
    if (status === "loading") return;

    const authenticated = status === "authenticated";

    if (!authenticated && !isAuthPage(pathname)) {
      router.replace(`${AUTH_PATH}?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (authenticated && isAuthPage(pathname)) {
      const returnUrl = searchParams.get("returnUrl");
      const destination =
        returnUrl && !isAuthPage(returnUrl) ? returnUrl : DEFAULT_AFTER_LOGIN;
      router.replace(destination);
    }
  }, [pathname, router, searchParams, status]);

  // Suppress flash of admin UI while session resolves
  if (status === "loading" && !isAuthPage(pathname)) {
    return null;
  }

  return <>{children}</>;
}