// src/lib/supabase.js
// ⚙️ Centralized Supabase client setup for SmartDoc Enterprise

import { createClient } from "@supabase/supabase-js";

/**
 * Environment-based credentials.
 * These must be defined in your `.env` file:
 * 
 * VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
 * VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase environment variables!");
  throw new Error("Supabase URL or Anon Key not configured in .env file.");
}

/**
 * 🚀 Create a Supabase client instance
 * - Auto-refreshes tokens
 * - Persists sessions in localStorage
 * - Detects sessions in URL redirects (for email verification links)
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "smartdoc-supabase-session",
  },
});

/**
 * 🧠 Optional Helper Wrappers (you can remove these if unused)
 * These functions make your imports cleaner across SmartDoc modules.
 */

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signUp(email, password, fullName = "", organization = "", country = "") {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, organization, country },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

/**
 * 🔍 Fetch user profile
 * Make sure the 'profiles' table exists and has RLS enabled.
 */
export async function fetchUserProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

/**
 * 📝 Update user profile
 */
export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select();
  if (error) throw error;
  return data;
}

console.log("✅ Supabase client initialized:", SUPABASE_URL);
