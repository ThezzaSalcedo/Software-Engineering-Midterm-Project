
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
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
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
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

  const validateEmail = (email: string) => {
    if (!email.endsWith("@neu.edu.ph")) {
      throw new Error("Access denied. Please use your @neu.edu.ph institutional email.");
    }
  };

  const syncProfile = async (firebaseUser: any) => {
    const userRef = doc(db, "userProfiles", firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    
    // Check if this specific email is the designated Super Admin
    const isAdminEmail = firebaseUser.email === "admin1@neu.edu.ph";
    const role: UserRole = isAdminEmail ? "Admin" : "User";

    // If this is the designated admin email, we MUST ensure the record in roles_admin exists.
    // This is the source of truth for administrative authorization in security rules.
    if (isAdminEmail) {
      const adminRoleRef = doc(db, "roles_admin", firebaseUser.uid);
      setDocumentNonBlocking(adminRoleRef, { 
        id: firebaseUser.uid,
        email: firebaseUser.email,
        assignedAt: new Date().toISOString()
      }, { merge: true });
    }

    if (!userDoc.exists()) {
      const newProfile: UserProfile = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || (isAdminEmail ? "Super Admin" : "User"),
        photoURL: firebaseUser.photoURL || "",
        role: role,
        isSetupComplete: isAdminEmail, // Admin 1 bypasses onboarding
        createdAt: new Date().toISOString(),
      };
      
      setDocumentNonBlocking(userRef, newProfile, { merge: true });
      setProfile(newProfile);
    } else {
      const existingData = userDoc.data() as UserProfile;
      
      // If the email is the admin email but the profile isn't marked as admin, update it.
      if (isAdminEmail && existingData.role !== "Admin") {
        const updated = { ...existingData, role: "Admin" as UserRole, isSetupComplete: true };
        setDocumentNonBlocking(userRef, updated, { merge: true });
        setProfile(updated);
        return;
      }
      
      setProfile(existingData);
    }
  };

  const login = async () => {
    const googleProvider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, googleProvider);
    validateEmail(result.user.email || "");
    await syncProfile(result.user);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    validateEmail(email);
    const result = await signInWithEmailAndPassword(auth, email, pass);
    await syncProfile(result.user);
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    validateEmail(email);
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await syncProfile(result.user);
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
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading: loading || isUserLoading, 
      login, 
      loginWithEmail,
      signUpWithEmail,
      logout, 
      updateProfile 
    }}>
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
