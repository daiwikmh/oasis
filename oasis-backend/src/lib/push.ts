interface PushPayload {
  title: string;
  body:  string;
  data?: Record<string, unknown>;
}

export async function sendExpoPush(token: string, payload: PushPayload): Promise<void> {
  if (!token.startsWith("ExponentPushToken")) return;
  await fetch("https://exp.host/--/api/v2/push/send", {
    method:  "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body:    JSON.stringify({ to: token, sound: "default", ...payload }),
  }).catch(() => {});
}
