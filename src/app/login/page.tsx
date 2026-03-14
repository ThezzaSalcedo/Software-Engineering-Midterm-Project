"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Mail, Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function LoginPage() {
  const { login, loginWithEmail, signUpWithEmail, user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginView, setIsLoginView] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await login();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Could not sign in with Google.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitting(true);
    try {
      if (isLoginView) {
        await loginWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Credential error.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 md:px-20 lg:px-24 py-12 lg:py-0 space-y-8 md:space-y-12 bg-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6 md:w-10 md:h-10 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl md:text-2xl font-black tracking-tighter text-[#1A237E]">NEU LIBRARY</span>
              <span className="text-xl md:text-2xl font-black tracking-tighter text-accent">CONNECT</span>
            </div>
            <p className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Official University Portal</p>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] md:leading-[0.9] text-[#1A237E]">
            WELCOME TO <br />
            <span className="italic">NEU LIBRARY.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
            Secure digital access for New Era University members. Explore resources, research databases, and study areas.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 md:gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-accent" />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Verified Access</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Mail className="w-4 h-4 md:w-5 md:h-5 text-accent" />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Student Portal</span>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-muted/20 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <Card className="w-full max-w-md overflow-hidden shadow-2xl border-none">
          <div className="relative h-48 sm:h-56 w-full bg-[#1A237E]">
             <Image 
                src="https://storage.googleapis.com/test-872f2.appspot.com/a9c1e95c-37e4-42b7-872e-067964402636/IMG_0047.jpg" 
                fill 
                className="object-cover opacity-60 mix-blend-overlay" 
                alt="New Era University Library Exterior"
                data-ai-hint="university library"
              />
             <div className="absolute bottom-6 left-8">
               <div className="w-8 h-1 bg-accent mb-2" />
               <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Welcome, Visitor</h2>
             </div>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6 sm:space-y-8">
            <Button 
              onClick={handleGoogleLogin} 
              variant="outline"
              disabled={isSubmitting}
              className="w-full h-12 sm:h-14 gap-3 font-bold border-muted-foreground/20 hover:bg-muted/50 transition-all rounded-xl"
            >
              <svg className="w-5 h-5 sm:w-6 h-6" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Log in with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                <span className="bg-white px-3 text-muted-foreground">Or Email Access</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="institutional@neu.edu.ph" 
                    className="pl-10 h-11 sm:h-12 bg-muted/30 border-none rounded-xl"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Security Password" 
                    className="pl-10 h-11 sm:h-12 bg-muted/30 border-none rounded-xl"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 sm:h-14 bg-[#1A237E] hover:bg-[#0D1642] text-white font-bold text-base sm:text-lg rounded-xl flex items-center justify-between px-6 transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      {isLoginView ? "LOG IN" : "CREATE ACCOUNT"}
                    </div>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-2">
              <button 
                onClick={() => setIsLoginView(!isLoginView)}
                className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase text-[#1A237E] hover:underline transition-all"
              >
                {isLoginView ? "New here? Create institutional account" : "Already registered? Log in here"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-6 left-6 z-50 hidden sm:flex">
        <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg shadow-xl">
          N
        </div>
      </div>
    </div>
  );
}
