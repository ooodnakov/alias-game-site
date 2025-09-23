interface VerificationResult {
  success: boolean;
  error?: string;
}

function getEnv(key: string) {
  const value = process.env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function verifyCaptchaToken(
  token: string | undefined,
  remoteIp?: string | null,
): Promise<VerificationResult> {
  const secret = getEnv("HCAPTCHA_SECRET_KEY");

  if (!secret) {
    return { success: true };
  }

  if (!token) {
    return { success: false, error: "missing-token" };
  }

  const params = new URLSearchParams();
  params.set("secret", secret);
  params.set("response", token);
  if (remoteIp) {
    params.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      return { success: false, error: "verification-failed" };
    }

    const payload = (await response.json()) as { success: boolean; "error-codes"?: string[] };
    if (!payload.success) {
      const code = payload["error-codes"]?.[0];
      return { success: false, error: code ?? "verification-failed" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "verification-failed" };
  }
}
