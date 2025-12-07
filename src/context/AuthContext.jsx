import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../utils/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const session = supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
        // Use browser's localStorage and sessionStorage directly
        // These objects satisfy the storage interface (getItem, setItem, removeItem)
        // expected by Supabase's setPersistence (if supported) or we can rely on default.
        
        // Note: setPersistence might expect a custom object in some versions, 
        // but passing the window storage objects is a common pattern.
        // However, Supabase v2 auth.setPersistence typically takes an array of storage implementations.
        // If this fails, we might need to construct a custom object, but let's try this first.
        
        // Actually, to be safe and avoid "setPersistence is not a function" if it's an older client,
        // we should check if it exists. But the error was about import.
        
        // If we just want to switch between local and session, we can try:
        /*
          if (rememberMe) {
             supabase.auth.setPersistence([localStorage])
          } else {
             supabase.auth.setPersistence([sessionStorage])
          }
        */
       
       // But wait, if we use setPersistence, it returns a promise.
       // And we should pass the storage *provider*, not the storage instance itself sometimes?
       // No, usually it's the storage instance.
       
       // Let's try passing 'local' and 'session' strings? No, that's for Firebase.
       
       // Let's try passing the storage objects.
       
        await supabase.auth.setPersistence(rememberMe ? localStorage : sessionStorage);
        
        return supabase.auth.signInWithPassword({ email, password });
    } catch (err) {
        console.error("Persistence error:", err);
        // Fallback to default login
        return supabase.auth.signInWithPassword({ email, password });
    }
  };

  const logout = () => {
    return supabase.auth.signOut();
  };

  const updateProfile = (data) => {
    return supabase.auth.updateUser({
      data: data
    });
  };

  const value = {
    user,
    login,
    logout,
    updateProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
