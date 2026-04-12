export const sendForgotPasswordEmail = async (
  email: string,
): Promise<{ message: string }> => {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const validateResetToken = async (
  token: string,
): Promise<{ valid: boolean }> => {
  const res = await fetch(
    `/api/auth/reset-password?token=${encodeURIComponent(token)}`,
  );
  return res.json();
};

export const resetPassword = async (payload: {
  token: string;
  password: string;
}): Promise<{ message: string }> => {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};
