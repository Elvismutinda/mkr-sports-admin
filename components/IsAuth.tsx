"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { authActions } from "@/store/slices/auth";
import { loadPermissionsFromArray } from "@/store/slices/permissionSlice";
import { useCurrentUser } from "@/hooks/use-current-user";

const AUTH_PATH = "/auth";

/**
 * Higher-order component that guards any page requiring authentication.
 *
 * Usage:
 *   export default isAuth(MyPage);
 *
 * What it does:
 * - Redirects unauthenticated users to /auth?returnUrl=<current path>
 * - Syncs the next-auth session into Redux on mount and on session changes
 * - Renders null while the session is loading to prevent content flash
 */
export default function isAuth<P extends object>(Component: React.ComponentType<P>) {
  return function IsAuth(props: P) {
    const { user, status } = useCurrentUser();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    // Build the full path including query string for returnUrl
    const fullPath = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // Redirect if unauthenticated
    useEffect(() => {
      if (status === "loading") return;

      if (status === "unauthenticated") {
        dispatch(authActions.clearSession());
        router.replace(`${AUTH_PATH}?returnUrl=${encodeURIComponent(fullPath)}`);
      }
    }, [router, fullPath, dispatch, status]);

    // Sync session → Redux
    useEffect(() => {
      if (status !== "authenticated" || !user) return;

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
    }, [dispatch, status, user]);

    // Suppress content flash while resolving
    if (status === "loading" || status === "unauthenticated") {
      return null;
    }

    return <Component {...props} />;
  };
}