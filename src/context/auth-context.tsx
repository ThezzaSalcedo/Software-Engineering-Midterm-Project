
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useAuth as useFirebaseAuth, useFirestore, useUser, setDocumentNonBlocking } from "@/firebase";

export type UserRole = "Admin" | "User";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  collegeOrOffice?: string;
  isSetupComplete: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "userProfiles", user.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    }
    
    if (!isUserLoading) {
      fetchProfile();
    }
  }, [user, isUserLoading, db]);

  const login = async () => {
    const googleProvider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, googleProvider);
    const email = result.user.email || "";

    // Restrict login to New Era University institutional domain
    if (!email.endsWith("@neu.edu.ph")) {
      await signOut(auth);
      throw new Error("Access denied. Please use your @neu.edu.ph institutional email.");
    }

    const userRef = doc(db, "userProfiles", result.user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const newProfile: UserProfile = {
        id: result.user.uid,
        email: email,
        displayName: result.user.displayName || "User",
        photoURL: result.user.photoURL || "",
        role: "User",
        isSetupComplete: false,
        createdAt: new Date().toISOString(),
      };
      
      setDocumentNonBlocking(userRef, newProfile, { merge: true });
      setProfile(newProfile);
    } else {
      setProfile(userDoc.data() as UserProfile);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;
    const updated = { ...profile, ...data } as UserProfile;
    const userRef = doc(db, "userProfiles", user.uid);
    
    setDocumentNonBlocking(userRef, updated, { merge: true });
    setProfile(updated);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading: loading || isUserLoading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
