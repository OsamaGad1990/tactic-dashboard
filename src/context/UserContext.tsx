"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient'; 

/* ================================
 1) الأنواع (Types)
================================ */

export interface UserSettings {
 default_region: string[] | null;
 allowed_markets: string[] | null;
 Team_leader: string[] | null;
}

interface AppUser {
 id: string; 
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

type UserSettingsRow = {
 default_region: string[] | null;
 allowed_markets: string[] | null;
 Team_leader: string[] | null;
} | null;

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
   const { data: { session } } = await supabase.auth.getSession();

   if (session?.user) {
    const currentUser = session.user; 

// 1. اجلب بروفايل المستخدم
const { data: userProfile, error: profileError } = await supabase
  .from('Users')
  .select('id, name, arabic_name') 
  .eq('auth_user_id', currentUser.id) // ⬅️⬅️ هذا هو السطر الحاسم
  .single();
        
        if (profileError || !userProfile) {
          console.error("UserProvider: Profile not found or error.", profileError);
          setLoading(false);
          return; 
        }
        
        // 2. استخدم الـ ID الأساسي لجلب الإعدادات
        const { data: userSettings, error: settingsError } = await supabase
          .from('user_settings')
          .select('default_region, allowed_markets, Team_leader')
          .eq('user_id', userProfile.id) // ⬅️⬅️ نستخدم 'userProfile.id'
          .single();
        
        // استخدام متغير الخطأ (لإصلاح تحذير Linter)
        if (settingsError) {
            console.warn("UserProvider: Could not fetch user settings.", settingsError);
        }

        const settingsData = (userSettings ?? null) as UserSettingsRow;

    const appUser: AppUser = {
     id: currentUser.id, 
     email: currentUser.email,
     name: userProfile.name ?? null,
     arabic_name: userProfile.arabic_name ?? null, // ⬅️ تم إصلاح خطأ 'Parsing'
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
   if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
    fetchUserData();
   } else if (event === 'SIGNED_OUT') {
    setUser(null);
   }
  });

  return () => {
   authListener?.subscription.unsubscribe();
  };
 }, []);

 const value: UserContextType = { user, loading };

 return (
  <UserContext.Provider value={value}>
   {children}
  </UserContext.Provider>
 );
}

/* ================================
 4) الـ Hook
================================ */
export function useUser() {
 const context = useContext(UserContext);
 if (context === undefined) {
  throw new Error('useUser must be used within a UserProvider');
 }
 return context;
}