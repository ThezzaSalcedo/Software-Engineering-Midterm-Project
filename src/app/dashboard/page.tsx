"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, BookOpen, Clock, CheckCircle2, MapPin, ShieldAlert, Sparkles, X, LayoutDashboard, Ban, Loader2 } from "lucide-react";
import { collection, query, where, limit } from "firebase/firestore";
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

const VISIT_REASONS = [
  "Reading",
  "Research",
  "Use of Computer",
  "Studying",
  "Group Discussion",
  "Thesis Consult",
  "Borrowing/Returning Books",
  "Other"
];

export default function DashboardPage() {
  const { user, profile, logout, loading, simulation } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const userVisitsQuery = useMemoFirebase(() => {
    if (!db || !profile?.id || simulation) return null;
    return query(
      collection(db, "visit_logs"),
      where("userId", "==", profile.id),
      limit(1)
    );
  }, [db, profile?.id, simulation]);

  const { data: userVisits, isLoading: visitsLoading } = useCollection(userVisitsQuery);

  useEffect(() => {
    if (!loading) {
      if (!user && !simulation) {
        router.push("/login");
      } else if (profile?.role === "Admin" && !simulation) {
        router.push("/admin");
      }
    }
  }, [user, profile, loading, router, simulation]);

  const handleSubmit = async () => {
    if (!reason || !profile) return;
    
    if (profile.isBlocked) {
      toast({
        variant: "destructive",
        title: "Access Restricted",
        description: "Your library access has been temporarily blocked. Please see an administrator.",
      });
      return;
    }

    if (simulation) {
      setReason("");
      setShowSuccess(true);
      return;
    }

    setIsSubmitting(true);
    const visitsCollection = collection(db, "visit_logs");
    addDocumentNonBlocking(visitsCollection, {
      userId: profile.id,
      displayName: profile.displayName,
      email: profile.email,
      userType: profile.userType,
      collegeOrOffice: profile.collegeOrOffice,
      reasonForVisit: reason,
      visitDateTime: new Date().toISOString(),
    });

    setReason("");
    setShowSuccess(true);
    setIsSubmitting(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (loading || (!user && !simulation) || (profile?.role === "Admin" && !simulation)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isFirstTime = useMemo(() => {
    if (simulation) return simulation.visitType === "First-Time";
    return !userVisits || userVisits.length === 0;
  }, [simulation, userVisits]);

  const firstName = profile?.displayName?.split(' ')[0] || "User";

  return (
    <div className="min-h-screen flex flex-col bg-muted/20 relative">
      {showSuccess && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-primary/20 backdrop-blur-sm animate-in fade-in zoom-in duration-300 p-4">
          <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden text-center relative rounded-3xl">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSuccess(false)}
              className="absolute right-4 top-4 text-white hover:bg-white/20 rounded-full z-[160]"
            >
              <X className="w-6 h-6" />
            </Button>
            <div className="bg-primary p-12 flex flex-col items-center gap-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center animate-bounce shadow-inner">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-4xl font-black text-white tracking-tight uppercase font-headline">Visit Logged!</h3>
            </div>
            <CardContent className="p-10 space-y-6">
              <h2 className="text-2xl font-bold text-primary italic font-headline">Welcome to NEU Library!</h2>
              <p className="text-muted-foreground leading-relaxed font-medium">Your visit has been recorded successfully. Please maintain silence and follow library protocols.</p>
              <Button onClick={() => setShowSuccess(false)} className="w-full h-14 font-black text-xl rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all">
                Got it, thanks!
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-lg sm:text-xl tracking-tight text-primary hidden sm:block font-headline">NEW ERA UNIVERSITY LIBRARY</h1>
            <h1 className="font-bold text-lg sm:text-xl tracking-tight text-primary sm:hidden font-headline">NEU LIBRARY</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold">{profile?.displayName}</span>
              <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{profile?.collegeOrOffice}</span>
            </div>
            <Avatar className="border-2 border-primary/20 w-10 h-10">
              <AvatarImage src={profile?.photoURL} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{profile?.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 py-8 sm:py-16 space-y-8 sm:space-y-12">
        <div className="space-y-3 text-center sm:text-left">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-[#1A237E] font-headline uppercase">
            {visitsLoading ? (
              <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
            ) : isFirstTime ? (
              <>
                WELCOME, <br className="hidden sm:block" />
                <span className="text-accent italic">{firstName}!</span>
              </>
            ) : (
              <>
                WELCOME BACK, <br className="hidden sm:block" />
                <span className="text-accent italic">{firstName}!</span>
              </>
            )}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl font-medium">Please record your purpose for visiting the university library today.</p>
        </div>

        {profile?.isBlocked ? (
          <Card className="border-destructive/30 bg-white shadow-2xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-destructive/10 p-8 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Ban className="w-12 h-12" />
              </div>
              <div className="space-y-3">
                <CardTitle className="text-3xl font-black text-destructive uppercase tracking-tighter font-headline">Account Restricted</CardTitle>
                <p className="text-muted-foreground max-w-md mx-auto text-lg leading-relaxed">
                  We're sorry, but your library access has been temporarily restricted by the administration. 
                </p>
                <div className="bg-destructive/5 border border-destructive/10 rounded-2xl p-6 mt-6">
                  <p className="text-sm font-bold text-destructive flex items-center justify-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    CONTACT THE LIBRARY OFFICE TO RESOLVE
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <Card className="md:col-span-2 shadow-2xl border-none rounded-3xl overflow-hidden bg-white">
              <CardHeader className="bg-muted/30 pb-8 pt-10 px-8">
                <CardTitle className="text-2xl font-black tracking-tight text-primary font-headline">ENTRY LOG FORM</CardTitle>
                <CardDescription className="text-base font-medium">Select the primary reason for your visit today.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                <div className="space-y-4">
                  <Label htmlFor="reason" className="text-sm font-black uppercase tracking-widest text-muted-foreground">Purpose of Visit</Label>
                  <Select onValueChange={setReason} value={reason}>
                    <SelectTrigger id="reason" className="h-16 text-xl rounded-2xl border-2 border-muted hover:border-primary/20 transition-all focus:ring-primary shadow-sm bg-muted/10 font-bold">
                      <SelectValue placeholder="Select purpose..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      {VISIT_REASONS.map((r) => (
                        <SelectItem key={r} value={r} className="text-lg py-4 px-6 focus:bg-primary focus:text-white transition-colors">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-accent/5 border border-accent/10 rounded-2xl p-5 flex items-start gap-4">
                  <div className="mt-1">
                    <CheckCircle2 className="w-6 h-6 text-accent" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    By confirming your entry, you acknowledge institutional library policies and agree to maintain a quiet environment.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button 
                  onClick={handleSubmit} 
                  disabled={!reason || isSubmitting}
                  className="w-full h-16 text-2xl font-black gap-3 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] bg-primary hover:bg-[#1A237E]"
                >
                  {isSubmitting ? "PROCESSING..." : "CONFIRM ENTRY"}
                  {!isSubmitting && <CheckCircle2 className="w-7 h-7" />}
                </Button>
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <Card className="border-accent/20 bg-white shadow-lg rounded-2xl overflow-hidden">
                 <div className="bg-accent h-2 w-full" />
                 <CardHeader className="pb-2 pt-6">
                   <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-accent">
                     <MapPin className="w-4 h-4" />
                     Your Location
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="pb-6">
                   <p className="text-xl font-bold text-primary">Main Campus Library</p>
                   <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-1">Level 1 - General Circulation</p>
                 </CardContent>
              </Card>

              <Card className="border-primary/20 bg-white shadow-lg rounded-2xl overflow-hidden">
                 <div className="bg-primary h-2 w-full" />
                 <CardHeader className="pb-2 pt-6">
                   <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                     <Clock className="w-4 h-4" />
                     Service Schedule
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4 pt-2 pb-6">
                   <div className="flex justify-between items-center text-sm border-b border-muted pb-3">
                     <span className="text-muted-foreground font-bold">Weekdays</span>
                     <span className="font-black text-primary">08:00 - 21:00</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-muted-foreground font-bold">Saturdays</span>
                     <span className="font-black text-primary">09:00 - 17:00</span>
                   </div>
                 </CardContent>
              </Card>

              <div className="bg-muted/10 border-2 border-dashed border-muted rounded-2xl p-6 text-center space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Powered By</p>
                 <p className="text-sm font-black text-primary/40 font-headline">NEU CAMPUS CONNECT</p>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="border-t py-10 bg-white/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 opacity-30">
            <BookOpen className="w-5 h-5" />
            <p className="font-black tracking-widest text-primary uppercase text-xs">NEU LIBRARY SYSTEM V2.5</p>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            &copy; {new Date().getFullYear()} New Era University. Official Institutional Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
