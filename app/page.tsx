"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import isAuth from "@/components/IsAuth";


/**
 * This page is hit after a successful sign-in when next-auth redirects back.
 * It reads the returnUrl param and bounces the user to the right place.
 * Wrapped in isAuth so unauthenticated users who land here directly are
 * sent to the login page instead.
 */
function CallbackPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status !== "authenticated") return;

    const returnUrl = searchParams.get("returnUrl");

    // Only honour returnUrl if it's an internal admin path
    if (returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("/auth")) {
      router.replace(returnUrl);
    } else {
      router.replace("/app/dashboard");
    }
  }, [status, router, searchParams]);

  return null;
}

export default isAuth(CallbackPage);