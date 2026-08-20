import { isSupabaseConfigured, supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

/**
 * Records coarse, consent-gated product activity. No IP address or location data
 * is collected, and analytics remain disabled unless explicitly enabled.
 */
export async function trackActivity(page: string, eventType: string) {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true" || !isSupabaseConfigured || !supabase) {
    return;
  }

  try {
    let sessionId = localStorage.getItem("session_id");
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem("session_id", sessionId);
    }

    const userAgent = navigator.userAgent;
    const browser = userAgent.includes("Chrome") ? "Chrome"
      : userAgent.includes("Firefox") ? "Firefox"
      : userAgent.includes("Safari") ? "Safari"
      : userAgent.includes("Edge") ? "Edge" : "Unknown";
    const os = userAgent.includes("Windows") ? "Windows"
      : userAgent.includes("Mac") ? "MacOS"
      : userAgent.includes("Linux") ? "Linux"
      : userAgent.includes("Android") ? "Android"
      : userAgent.includes("iPhone") ? "iOS" : "Unknown";
    const device = /Mobi|Android/i.test(userAgent) ? "Mobile" : "Desktop";

    const { error } = await supabase.from("user_activity").insert([{
      session_id: sessionId,
      page,
      event_type: eventType,
      browser,
      os,
      device,
    }]);

    if (error) {
      console.error("Activity tracking failed.", { code: error.code, message: error.message });
    }
  } catch (error) {
    console.error("Activity tracking failed.", { error });
  }
}
