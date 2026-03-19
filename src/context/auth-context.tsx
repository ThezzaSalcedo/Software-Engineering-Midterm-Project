"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  GoogleAuthProvider, 
  signInWithRedirect, 
  getRedirectResult,
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useAuth as useFirebaseAuth, useFirestore, useUser, setDocumentNonBlocking } from "@/firebase";

export type UserRole = "Admin" | "User";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  userType?: "Student" | "Faculty";
  collegeOrOffice?: string;
  isBlocked?: boolean;
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

  // Persistence and Redirect Result Handling
  useEffect(() => {
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await syncProfile(result.user);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      }
    };
    initAuth();
  }, [auth]);

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    if (user && !isUserLoading) {
      const userRef = doc(db, "users", user.uid);
      
      unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }, (error) => {
        setLoading(false);
      });
    } else if (!isUserLoading) {
      setProfile(null);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [user, isUserLoading, db]);

  const validateEmail = (email: string) => {
    if (!email.toLowerCase().endsWith("@neu.edu.ph")) {
      throw new Error("Access denied. Please use your @neu.edu.ph institutional email.");
    }
  };

  const syncProfile = async (firebaseUser: any) => {
    const email = firebaseUser.email?.toLowerCase();
    const isAdminEmail = email === "admin1@neu.edu.ph";
    const role: UserRole = isAdminEmail ? "Admin" : "User";

    if (isAdminEmail) {
      const adminRoleRef = doc(db, "roles_admin", firebaseUser.uid);
      setDocumentNonBlocking(adminRoleRef, { 
        id: firebaseUser.uid,
        email: email,
        assignedAt: new Date().toISOString()
      }, { merge: true });
    }

    const userRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const newProfile: UserProfile = {
        id: firebaseUser.uid,
        email: email || "",
        displayName: firebaseUser.displayName || email?.split('@')[0] || (isAdminEmail ? "Super Admin" : "User"),
        photoURL: firebaseUser.photoURL || "",
        role: role,
        isBlocked: false,
        isSetupComplete: isAdminEmail,
        createdAt: new Date().toISOString(),
      };
      
      setDocumentNonBlocking(userRef, newProfile, { merge: true });
    } else {
      const existingData = userDoc.data() as UserProfile;
      if (isAdminEmail && existingData.role !== "Admin") {
        setDocumentNonBlocking(userRef, { role: "Admin", isSetupComplete: true }, { merge: true });
      }
    }
  };

  const login = async () => {
    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ hd: 'neu.edu.ph' });
    // Use Redirect to ensure it works in preview environment
    await signInWithRedirect(auth, googleProvider);
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
    const userRef = doc(db, "users", user.uid);
    setDocumentNonBlocking(userRef, data, { merge: true });
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
