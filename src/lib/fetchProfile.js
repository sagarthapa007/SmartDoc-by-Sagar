import { supabase } from "@/lib/supabase";

export async function fetchOrCreateProfile(user) {
  if (!user) return null;

  // 1️⃣ Try to fetch existing profile
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching profile:", error.message);
    return null;
  }

  // 2️⃣ If not found, insert one
  if (!data) {
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert([
        {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email.split("@")[0],
          role: "User",
          verified: false,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Error creating profile:", insertError.message);
      return null;
    }

    return newProfile;
  }

  return data;
}
