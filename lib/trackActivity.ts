import { isSupabaseConfigured, supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

export async function trackActivity(
  page: string,
  eventType: string
) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    let sessionId = localStorage.getItem("session_id");

    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem("session_id", sessionId);
    }

    const userAgent = navigator.userAgent;

    let browser = "Unknown";
    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";

    let os = "Unknown";
    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac")) os = "MacOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iPhone")) os = "iOS";

    const device = /Mobi|Android/i.test(userAgent) ? "Mobile" : "Desktop";

    // ─── Location + IP Tracking ────────────────────────
    let country    = "Unknown";
    let city       = "Unknown";
    let ip_address = "Unknown";

    try {
      const locationRes  = await fetch("https://ipapi.co/json/");
      const locationData = await locationRes.json();

      country    = locationData.country_name || "Unknown";
      city       = locationData.city         || "Unknown";
      ip_address = locationData.ip           || "Unknown";
    } catch (err) {
      console.log("Location fetch failed");
    }

    // ─── Insert Into Supabase ──────────────────────────
    const { data, error } = await supabase
      .from("user_activity")
      .insert([
        {
          session_id: sessionId,
          page,
          event_type: eventType,
          browser,
          os,
          device,
          country,
          city,
          ip_address,
        },
      ]);

    console.log("SUPABASE DATA:", data);

    if (error) {
      console.error("SUPABASE ERROR FULL:", JSON.stringify(error, null, 2));
    } else {
      console.log("Activity tracked successfully");
    }

  } catch (error) {
    console.error("Tracking failed:", error);
  }
}