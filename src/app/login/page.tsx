
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { LogIn, ShieldCheck } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    await login();
  };

  const bgImage = PlaceHolderImages.find(img => img.id === "login-bg")?.imageUrl || "";

  if (loading || (user && !loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center justify-center min-h-screen p-4 bg-cover bg-center"
      style={{ backgroundImage: `url('${bgImage}')` }}
    >
      <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px]" />
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-none">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight text-primary">NEU CampusConnect</CardTitle>
            <CardDescription className="text-base">Library Visitor Management System</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-center text-muted-foreground px-4">
            Access to the library visitor system requires a verified institutional account.
          </p>
          <Button 
            onClick={handleLogin} 
            className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 transition-all gap-3"
          >
            <LogIn className="w-5 h-5" />
            Institutional Google Login
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 border-t pt-6 bg-muted/30">
          <p className="text-xs text-muted-foreground">Authorized Access Only</p>
          <div className="flex gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
             <span className="text-[10px] font-bold tracking-widest uppercase">Northeastern University</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
