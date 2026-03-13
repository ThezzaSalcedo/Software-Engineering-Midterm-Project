
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (profile && !profile.isSetupComplete) {
        router.push("/onboarding");
      } else if (profile && profile.role === "Admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, profile, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 space-y-4">
      <Skeleton className="h-12 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <p className="text-muted-foreground animate-pulse">Initializing NEU CampusConnect...</p>
    </div>
  );
}
