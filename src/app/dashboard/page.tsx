
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, BookOpen, Clock, CheckCircle2, MapPin, ShieldAlert, Sparkles, X } from "lucide-react";
import { collection } from "firebase/firestore";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const { user, profile, logout, loading } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

    setIsSubmitting(true);
    
    const visitsCollection = collection(db, "userProfiles", profile.id, "libraryVisits");
    
    addDocumentNonBlocking(visitsCollection, {
      userId: profile.id,
      displayName: profile.displayName,
      email: profile.email,
      collegeOrOffice: profile.collegeOrOffice,
      reasonForVisit: reason,
      visitDateTime: new Date().toISOString(),
    });

    setReason("");
    setShowSuccess(true);
    setIsSubmitting(false);

    // Auto-hide success message after 5 seconds
    setTimeout(() => setShowSuccess(false), 5000);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-muted/20 relative">
      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/20 backdrop-blur-sm animate-in fade-in zoom-in duration-300 p-4">
          <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden text-center relative">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSuccess(false)}
              className="absolute right-2 top-2"
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="bg-primary p-8 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tight">SUCCESS!</h3>
            </div>
            <CardContent className="p-8 space-y-4">
              <h2 className="text-2xl font-bold text-primary italic">Welcome to NEU Library!</h2>
              <p className="text-muted-foreground">Your visit has been recorded. Enjoy your study session and make the most of our resources.</p>
              <Button onClick={() => setShowSuccess(false)} className="w-full h-12 font-bold text-lg">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-primary">NEU CampusConnect</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold">{profile?.displayName}</span>
              <span className="text-xs text-muted-foreground">{profile?.collegeOrOffice}</span>
            </div>
            <Avatar className="border-2 border-primary/20">
              <AvatarImage src={profile?.photoURL} />
              <AvatarFallback>{profile?.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 py-12 space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.displayName?.split(' ')[0]}!</h2>
          <p className="text-muted-foreground">Please record your purpose for visiting the university library today.</p>
        </div>

        {profile?.isBlocked ? (
          <Card className="border-destructive/30 bg-destructive/5 shadow-lg">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-destructive">Access Restricted</CardTitle>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We're sorry, but your library access has been temporarily restricted. 
                  Please contact the administration office or library head to resolve this status.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 shadow-xl border-none">
              <CardHeader>
                <CardTitle>Library Entry Log</CardTitle>
                <CardDescription>Select the primary reason for your visit.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="reason" className="text-base font-semibold">Reason for Visiting</Label>
                  <Select onValueChange={setReason} value={reason}>
                    <SelectTrigger id="reason" className="h-14 text-lg rounded-xl focus:ring-primary">
                      <SelectValue placeholder="What brings you to the library?" />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIT_REASONS.map((r) => (
                        <SelectItem key={r} value={r} className="text-lg py-3">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    By clicking confirm, you agree to follow the library's rules and regulations, 
                    including maintaining silence and taking care of the facilities.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  onClick={handleSubmit} 
                  disabled={!reason || isSubmitting}
                  className="w-full h-14 text-xl font-black gap-2 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isSubmitting ? "RECORDING VISIT..." : "CONFIRM LIBRARY ENTRY"}
                  {!isSubmitting && <CheckCircle2 className="w-6 h-6" />}
                </Button>
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <Card className="border-accent/20 bg-accent/5 shadow-sm">
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium flex items-center gap-2">
                     <MapPin className="w-4 h-4" />
                     Location
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-lg font-bold">Main University Library</p>
                   <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Level 1 - Research Hall</p>
                 </CardContent>
              </Card>

              <Card className="border-primary/20 shadow-sm">
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium flex items-center gap-2">
                     <Clock className="w-4 h-4" />
                     Service Hours
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-3 pt-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Mon - Fri</span>
                     <span className="font-bold">08:00 - 21:00</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Saturday</span>
                     <span className="font-bold">09:00 - 17:00</span>
                   </div>
                   <div className="pt-2 border-t">
                     <p className="text-[10px] text-muted-foreground italic">Current: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                   </div>
                 </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      
      <footer className="border-t py-8 bg-white/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
             <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
             </div>
             <span className="font-bold tracking-tight text-primary/60">NEU LIBRARY SYSTEM V2.0</span>
          </div>
          <p>&copy; {new Date().getFullYear()} New Era University. All institutional rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
