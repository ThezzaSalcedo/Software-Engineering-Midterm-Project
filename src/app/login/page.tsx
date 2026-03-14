
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, ShieldCheck, Mail, Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react";
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
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Column: Branding */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-24 py-12 space-y-12">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tighter text-[#1A237E]">NEU LIBRARY</span>
              <span className="text-2xl font-black tracking-tighter text-accent">CONNECT</span>
            </div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Official Department Portal</p>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-[0.9] text-[#1A237E]">
            WELCOME TO <br />
            <span className="italic">NEU LIBRARY.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
            Secure digital check-in for New Era University students and faculty. Access resources, research, and quiet study spaces.
          </p>
        </div>

        <div className="flex flex-wrap gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Verified Access</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Institutional Portal</span>
          </div>
        </div>
      </div>

      {/* Right Column: Login Card */}
      <div className="flex-1 bg-muted/30 flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md overflow-hidden shadow-2xl border-none">
          <div className="relative h-56 w-full bg-[#1A237E]">
             <Image 
                src="https://picsum.photos/seed/library-interior/600/400" 
                fill 
                className="object-cover opacity-60 mix-blend-overlay" 
                alt="New Era University Library"
                data-ai-hint="library interior"
              />
             <div className="absolute bottom-6 left-8">
               <div className="w-8 h-1 bg-accent mb-2" />
               <h2 className="text-2xl font-black text-white uppercase tracking-tight">Welcome, Visitor</h2>
             </div>
          </div>

          <CardContent className="p-8 space-y-8">
            <Button 
              onClick={handleGoogleLogin} 
              variant="outline"
              disabled={isSubmitting}
              className="w-full h-14 gap-3 font-bold border-muted-foreground/20 hover:bg-muted/50 transition-all rounded-xl"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
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
              Sign in with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                <span className="bg-white px-3 text-muted-foreground">Or Institutional ID</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="institutional@neu.edu.ph" 
                    className="pl-10 h-12 bg-muted/30 border-none rounded-xl"
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
                    className="pl-10 h-12 bg-muted/30 border-none rounded-xl"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-[#9FA8DA] hover:bg-[#7986CB] text-white font-bold text-lg rounded-xl flex items-center justify-between px-6 transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-5 h-5 rotate-180" />
                      {isLoginView ? "SIGN IN" : "CREATE ACCOUNT"}
                    </div>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <button 
                onClick={() => setIsLoginView(!isLoginView)}
                className="text-[10px] font-black tracking-widest uppercase text-[#1A237E] hover:underline"
              >
                {isLoginView ? "Don't have an account? Create one" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-6 left-6 z-50">
        <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg shadow-xl">
          N
        </div>
      </div>
    </div>
  );
}
