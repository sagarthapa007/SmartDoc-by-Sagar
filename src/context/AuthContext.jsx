import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchOrCreateProfile } from "@/lib/fetchProfile.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data?.session;
      setSession(currentSession);
      setUser(currentSession?.user || null);

      if (currentSession?.user) {
        const prof = await fetchOrCreateProfile(currentSession.user);
        setProfile(prof);
      }

      setLoading(false);
    };
    initializeAuth();

    // 🔁 Listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_evt, session) => {
        setSession(session);
        const activeUser = session?.user || null;
        setUser(activeUser);
        if (activeUser) {
          const prof = await fetchOrCreateProfile(activeUser);
          setProfile(prof);
        } else {
          setProfile(null);
        }
      },
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  // ✅ Registration
  async function register(email, password, fullName = "") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    if (data?.user) {
      const prof = await fetchOrCreateProfile(data.user);
      setProfile(prof);
    }
    return data;
  }

  // ✅ Login
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data?.user) {
      const prof = await fetchOrCreateProfile(data.user);
      setProfile(prof);
    }
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
