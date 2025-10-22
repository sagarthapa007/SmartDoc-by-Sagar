import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load session + profile
  useEffect(() => {
    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user || null);
      if (data.session?.user) fetchProfile(data.session.user.id);
      setLoading(false);
    };
    getInitialSession();

    // ✅ Listen to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // ✅ Profile fetcher
  async function fetchProfile(userId) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!error) setProfile(data);
  }

  // ✅ Registration
  async function register(email, password, fullName = "") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  }

  // ✅ Login
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  // ✅ Logout
  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
