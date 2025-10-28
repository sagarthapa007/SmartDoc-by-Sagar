import { supabase } from "@/lib/supabase";

export async function fetchOrCreateProfile(user) {
  if (!user) return null;

  // 1️⃣ Try to fetch existing profile (safe version)
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle(); // ✅ prevents 406 Not Acceptable

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching profile:", error.message);
    return null;
  }

  // 2️⃣ If no profile found, create one
  if (!data) {
    const insertData = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email.split("@")[0],
      role: "User",
      verified: false,
      created_at: new Date().toISOString(),
    };

    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .upsert([insertData], { onConflict: "id" })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating profile:", insertError.message);
      return null;
    }

    console.log("✅ Created new profile:", newProfile);
    return newProfile;
  }

  return data;
}
