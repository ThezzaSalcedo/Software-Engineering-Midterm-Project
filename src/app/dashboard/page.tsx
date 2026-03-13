
"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, BookOpen, Clock, CheckCircle2, MapPin } from "lucide-react";
import { collection } from "firebase/firestore";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { profile, logout } = useAuth();
  const db = useFirestore();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason.trim() || !profile) return;
    setIsSubmitting(true);
    
    // As per backend.json, library visits are nested under userProfiles/{userId}/libraryVisits
    const visitsCollection = collection(db, "userProfiles", profile.id, "libraryVisits");
    
    addDocumentNonBlocking(visitsCollection, {
      userId: profile.id,
      reasonForVisit: reason,
      visitDateTime: new Date().toISOString(),
    });

    setReason("");
    toast({
      title: "Check-in Successful",
      description: "Welcome to the NEU Library!",
    });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-primary">CampusConnect</h1>
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
            <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 py-12 space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Welcome back!</h2>
          <p className="text-muted-foreground">Log your library visit by specifying your purpose today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 shadow-xl border-none">
            <CardHeader>
              <CardTitle>Reason for Visit</CardTitle>
              <CardDescription>What brings you to the library today?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Detailed Purpose</Label>
                <Textarea 
                  id="reason" 
                  placeholder="Example: Researching for Thesis, Using Lab Facilities, Individual Study..." 
                  className="min-h-[150px] text-base resize-none"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 pt-6">
              <Button 
                onClick={handleSubmit} 
                disabled={!reason.trim() || isSubmitting}
                className="w-full h-12 text-lg font-bold gap-2"
              >
                {isSubmitting ? "Processing..." : "Confirm Library Entry"}
                {!isSubmitting && <CheckCircle2 className="w-5 h-5" />}
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <Card className="border-accent/20 bg-accent/5">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium flex items-center gap-2">
                   <MapPin className="w-4 h-4" />
                   Location
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-lg font-bold">Main University Library</p>
                 <p className="text-xs text-muted-foreground">Central Campus - Tower 2</p>
               </CardContent>
            </Card>

            <Card className="border-primary/20">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium flex items-center gap-2">
                   <Clock className="w-4 h-4" />
                   Library Hours
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-2">
                 <div className="flex justify-between text-sm">
                   <span>Mon - Fri</span>
                   <span className="font-semibold">08:00 - 21:00</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span>Saturday</span>
                   <span className="font-semibold">09:00 - 17:00</span>
                 </div>
               </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <footer className="border-t py-6 bg-white/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Northeastern University Library System
        </div>
      </footer>
    </div>
  );
}
