
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, GraduationCap, Building2, UserCircle } from "lucide-react";

const COLLEGES = [
  "College of Computer Studies",
  "College of Engineering",
  "College of Business & Accountancy",
  "College of Education",
  "College of Arts and Sciences",
  "Graduate School"
];

const OFFICES = [
  "Administrative Office",
  "Registrar's Office",
  "Human Resources",
  "Finance Department",
  "Research Development Office",
  "IT Services"
];

export default function OnboardingPage() {
  const { user, profile, updateProfile, loading } = useAuth();
  const [userType, setUserType] = useState<"Student" | "Employee">("Student");
  const [selection, setSelection] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (profile?.isSetupComplete) {
        router.push("/dashboard");
      }
    }
  }, [user, profile, loading, router]);

  const handleFinish = async () => {
    if (!selection) return;
    await updateProfile({
      collegeOrOffice: selection,
      isSetupComplete: true,
    });
    router.push("/dashboard");
  };

  if (loading || !user) return null;

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-xl shadow-lg border-primary/10">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="p-3 rounded-xl bg-accent/10">
                <UserCircle className="w-8 h-8 text-accent" />
             </div>
             <div>
                <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
                <CardDescription>We need a few more details before you can access the library system.</CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <Label className="text-base font-semibold">I am a:</Label>
            <RadioGroup 
              value={userType} 
              onValueChange={(val) => {
                setUserType(val as any);
                setSelection("");
              }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="relative">
                <RadioGroupItem value="Student" id="student" className="peer sr-only" />
                <Label
                  htmlFor="student"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <GraduationCap className="mb-3 h-6 w-6" />
                  Student / Faculty
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem value="Employee" id="employee" className="peer sr-only" />
                <Label
                  htmlFor="employee"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <Building2 className="mb-3 h-6 w-6" />
                  Employee / Staff
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label htmlFor="selection" className="text-base font-semibold">
              Select your {userType === "Student" ? "College" : "Office"}:
            </Label>
            <Select onValueChange={setSelection} value={selection}>
              <SelectTrigger className="h-12 border-muted-foreground/20">
                <SelectValue placeholder={`Select ${userType === "Student" ? "College" : "Office"}...`} />
              </SelectTrigger>
              <SelectContent>
                {(userType === "Student" ? COLLEGES : OFFICES).map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="pt-6 border-t">
          <Button 
            onClick={handleFinish} 
            disabled={!selection} 
            className="w-full h-12 gap-2 text-lg"
          >
            Continue to Dashboard
            <ChevronRight className="w-5 h-5" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
