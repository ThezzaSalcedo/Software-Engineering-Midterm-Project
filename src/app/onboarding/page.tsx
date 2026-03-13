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
  "College of Accountancy",
  "College of Agriculture",
  "College of Arts and Sciences",
  "College of Business Administration",
  "College of Communication",
  "College of Informatics and Computing Studies",
  "College of Criminology",
  "College of Education",
  "College of Engineering and Architecture",
  "College of Medical Technology",
  "College of Midwifery",
  "College of Music",
  "College of Nursing",
  "College of Physical Therapy",
  "College of Respiratory Therapy",
  "School of International Relations"
];

const OFFICES = [
  "Administrative Office",
  "Registrar's Office",
  "Human Resources",
  "Finance Department",
  "Research Development Office",
  "IT Services",
  "Library Services",
  "Security Office"
];

export default function OnboardingPage() {
  const { user, profile, updateProfile, loading } = useAuth();
  const [userType, setUserType] = useState<"Student" | "Employee">("Student");
  const [selection, setSelection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (!selection || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateProfile({
        collegeOrOffice: selection,
        isSetupComplete: true,
      });
      router.push("/dashboard");
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  if (loading || !user || profile?.isSetupComplete) return null;

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/30">
      <Card className="w-full max-w-xl shadow-xl border-none">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit">
            <UserCircle className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight">Complete Your Profile</CardTitle>
            <CardDescription className="text-base">Help us personalize your library experience.</CardDescription>
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
                  className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all duration-200"
                >
                  <GraduationCap className="mb-3 h-8 w-8 text-primary" />
                  <span className="font-semibold text-lg">Student / Faculty</span>
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem value="Employee" id="employee" className="peer sr-only" />
                <Label
                  htmlFor="employee"
                  className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all duration-200"
                >
                  <Building2 className="mb-3 h-8 w-8 text-primary" />
                  <span className="font-semibold text-lg">Staff / Guest</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label htmlFor="selection" className="text-base font-semibold">
              Select your {userType === "Student" ? "College or School" : "Office"}:
            </Label>
            <Select onValueChange={setSelection} value={selection}>
              <SelectTrigger className="h-14 border-muted-foreground/20 text-lg rounded-xl">
                <SelectValue placeholder={`Choose ${userType === "Student" ? "College" : "Office"}...`} />
              </SelectTrigger>
              <SelectContent>
                {(userType === "Student" ? COLLEGES : OFFICES).map((item) => (
                  <SelectItem key={item} value={item} className="text-lg py-3">
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="pt-6 border-t bg-muted/10">
          <Button 
            onClick={handleFinish} 
            disabled={!selection || isSubmitting} 
            className="w-full h-14 gap-2 text-xl font-bold rounded-xl"
          >
            {isSubmitting ? "Saving Profile..." : "Continue to Dashboard"}
            {!isSubmitting && <ChevronRight className="w-6 h-6" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
