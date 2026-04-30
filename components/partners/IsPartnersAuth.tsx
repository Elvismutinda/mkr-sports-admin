"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { partnersAuthActions } from "@/store/slices/partnersAuth";

const PARTNERS_LOGIN = "/auth";

export default function isPartnersAuth<P extends object>(
  Component: React.ComponentType<P>,
) {
  return function IsPartnersAuth(props: P) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    const isMainAuthenticated = useAppSelector(
      (state) => state.auth.isAuthenticated ?? false,
    );
    const isPartnerAuthenticated = useAppSelector(
      (state) => state.partnersAuth.isAuthenticated ?? false,
    );
    const isSuperAdmin = useAppSelector(
      (state) => state.permissions.isSuperAdmin ?? false,
    );

    const isAuthenticated = isMainAuthenticated || isPartnerAuthenticated;

    // Wait one tick for redux-persist to rehydrate before acting
    const [rehydrated, setRehydrated] = useState(false);
    useEffect(() => {
      setRehydrated(true);
    }, []);

    const fullPath = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    const isOnLoginPage =
      pathname === PARTNERS_LOGIN || pathname.startsWith(PARTNERS_LOGIN + "/");

    useEffect(() => {
      if (!rehydrated) return;

      // On the login page — redirect into partners if super admin, /app otherwise
      if (isOnLoginPage) {
        if (isAuthenticated) {
          router.replace(isSuperAdmin ? "/partners" : "/app");
        }
        return;
      }

      // Not authenticated at all — send to login
      if (!isAuthenticated) {
        dispatch(partnersAuthActions.clearSession());
        router.replace(
          `${PARTNERS_LOGIN}?returnUrl=${encodeURIComponent(fullPath)}`,
        );
        return;
      }

      // Authenticated but not super admin — redirect to /app
      if (!isSuperAdmin) {
        router.replace("/app");
      }
    }, [
      rehydrated,
      isAuthenticated,
      isSuperAdmin,
      isOnLoginPage,
      router,
      fullPath,
      dispatch,
    ]);

    // Suppress flash while rehydrating or a redirect is in-flight
    if (!rehydrated) return null;
    if (!isAuthenticated && !isOnLoginPage) return null;
    if (isAuthenticated && !isSuperAdmin) return null;

    return <Component {...props} />;
  };
}
