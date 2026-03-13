
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { LogIn, ShieldCheck } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !loading) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Could not sign in with Google.",
      });
    }
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
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-[4px]" />
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-none">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight text-primary">NEU CampusConnect</CardTitle>
            <CardDescription className="text-base text-balance font-medium">New Era University Library Management</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg border border-primary/10">
            <p className="text-sm text-center text-muted-foreground">
              Unauthorized access is prohibited. Please sign in using your <span className="font-bold text-foreground">@neu.edu.ph</span> institutional email address.
            </p>
          </div>
          <Button 
            onClick={handleLogin} 
            className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 transition-all gap-3 shadow-lg"
          >
            <LogIn className="w-5 h-5" />
            Institutional Login
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 border-t pt-6 bg-muted/30">
          <p className="text-[10px] font-bold tracking-widest uppercase opacity-60">Authorized Access Only • New Era University</p>
        </CardFooter>
      </Card>
    </div>
  );
}
