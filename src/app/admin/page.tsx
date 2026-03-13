
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Activity, BarChart3, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface VisitRecord {
  id: string;
  displayName: string;
  email: string;
  collegeOrOffice: string;
  reason: string;
  timestamp: string;
}

export default function AdminPage() {
  const { profile, logout, loading: authLoading } = useAuth();
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!profile || profile.role !== "Admin") {
        router.push("/dashboard");
      }
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    const q = query(collection(db, "visits"), orderBy("timestamp", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VisitRecord[];
      setVisits(records);
    });
    return unsubscribe;
  }, []);

  const filteredVisits = visits.filter(v => 
    v.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.collegeOrOffice.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || profile?.role !== "Admin") return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary text-primary-foreground p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Admin Console</h1>
          </div>
          <Button variant="secondary" onClick={logout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visits.length}</div>
              <p className="text-xs text-muted-foreground">+12% from last hour</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">14:00 - 15:00</div>
              <p className="text-xs text-muted-foreground">Most active period today</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-none">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Visitor Log</CardTitle>
              <CardDescription>Live feed of institutional members entering the library.</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or college..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor Name</TableHead>
                    <TableHead>College/Office</TableHead>
                    <TableHead>Purpose of Visit</TableHead>
                    <TableHead className="text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.length > 0 ? (
                    filteredVisits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{visit.displayName}</span>
                            <span className="text-xs text-muted-foreground">{visit.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{visit.collegeOrOffice}</TableCell>
                        <TableCell className="max-w-xs truncate">{visit.reason}</TableCell>
                        <TableCell className="text-right">
                          {format(new Date(visit.timestamp), "MMM d, h:mm a")}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                        No visitor records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
