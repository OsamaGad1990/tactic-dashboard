"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ================================
 1) الأنواع (Types)
================================ */

export interface UserSettings {
  default_region: string[] | null;
  allowed_markets: string[] | null;
  Team_leader: string[] | null;
}

interface AppUser {
  id: string; // ⬅️ لسه هو auth_user_id من Supabase Auth
  email?: string;
  name?: string | null;
  arabic_name?: string | null;
  settings: UserSettings | null;
}

interface UserContextType {
  user: AppUser | null;
  loading: boolean;
}

// النوع 'UsersRow' تم حذفه لأنه غير مستخدم

type UserSettingsRow =
  | {
      default_region: string[] | null;
      allowed_markets: string[] | null;
      Team_leader: string[] | null;
    }
  | null;

/* ================================
 2) الـ Context
================================ */
const UserContext = createContext<UserContextType | undefined>(undefined);

/* ================================
 3) الـ Provider
================================ */
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const currentUser = session.user;

        // ==========================
        // 1) جلب / إنشاء بروفايل Users
        // ==========================
        let userProfile:
          | {
              id: string;
              name: string | null;
              arabic_name: string | null;
            }
          | null = null;

        // جرّب تجيب البروفايل الموجود
        const { data: existingProfile, error: profileError } = await supabase
          .from("Users")
          .select("id, name, arabic_name")
          .eq("auth_user_id", currentUser.id) // ⬅️⬅️ السطر الحاسم زي ما هو
          .maybeSingle();

        if (profileError) {
          console.warn("UserProvider: error fetching profile, will try to create one.", profileError);
        }

        if (!existingProfile) {
          // مفيش صف في Users → نحاول ننشئ واحد تلقائيًا
          const defaultName =
            (currentUser.user_metadata && (currentUser.user_metadata.full_name || currentUser.user_metadata.name)) ||
            (currentUser.email ? currentUser.email.split("@")[0] : null);

          const { data: createdProfile, error: createError } = await supabase
            .from("Users")
            .insert({
              auth_user_id: currentUser.id,
              name: defaultName,
              arabic_name: null,
            })
            .select("id, name, arabic_name")
            .single();

          if (createError || !createdProfile) {
            console.error("UserProvider: Failed to create profile in Users.", createError);
            setLoading(false);
            return;
          }

          userProfile = createdProfile;
        } else {
          // البروفايل موجود
          userProfile = existingProfile;
        }

        // لو لسبب ما لسه مفيش userProfile، نوقف
        if (!userProfile) {
          console.error("UserProvider: Profile not found or could not be created.");
          setLoading(false);
          return;
        }

        // ==========================
        // 2) جلب إعدادات المستخدم user_settings
        // ==========================
        const { data: userSettings, error: settingsError } = await supabase
          .from("user_settings")
          .select("default_region, allowed_markets, Team_leader")
          .eq("user_id", userProfile.id) // ⬅️⬅️ لسه مستخدمين userProfile.id
          .maybeSingle<UserSettingsRow>();

        if (settingsError) {
          console.warn("UserProvider: Could not fetch user settings.", settingsError);
        }

        const settingsData = (userSettings ?? null) as UserSettingsRow;

        // ==========================
        // 3) بناء كائن AppUser كما كان
        // ==========================
        const appUser: AppUser = {
          id: currentUser.id, // ⬅️ لسه الـ id = auth_user_id (ما غيرناهاش)
          email: currentUser.email || undefined,
          name: userProfile.name ?? null,
          arabic_name: userProfile.arabic_name ?? null,
          settings: settingsData
            ? {
                default_region: settingsData.default_region ?? null,
                allowed_markets: settingsData.allowed_markets ?? null,
                Team_leader: settingsData.Team_leader ?? null,
              }
            : null,
        };

        setUser(appUser);
      }

      setLoading(false);
    };

    fetchUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        fetchUserData();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value: UserContextType = { user, loading };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/* ================================
 4) الـ Hook
================================ */
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
