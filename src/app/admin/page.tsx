
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { collectionGroup, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Activity, BarChart3, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface VisitRecord {
  id: string;
  displayName?: string;
  email?: string;
  collegeOrOffice?: string;
  reasonForVisit: string;
  visitDateTime: string;
}

export default function AdminPage() {
  const { user, profile, logout, loading: authLoading } = useAuth();
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const db = useFirestore();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (!profile || profile.role !== "Admin") {
        router.push("/dashboard");
      }
    }
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    if (!profile || profile.role !== "Admin") return;

    // Use collectionGroup to query all 'libraryVisits' across all user profiles
    const q = query(
      collectionGroup(db, "libraryVisits"), 
      orderBy("visitDateTime", "desc"), 
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VisitRecord[];
      setVisits(records);
    }, (error) => {
      console.error("Admin visitor log error:", error);
    });

    return unsubscribe;
  }, [db, profile]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const filteredVisits = visits.filter(v => 
    (v.displayName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.collegeOrOffice || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.reasonForVisit || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || !user || profile?.role !== "Admin") return null;

  return (
    <div className="min-h-screen bg-muted/10">
      <header className="border-b bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight">New Era University - Admin Console</h1>
          </div>
          <Button variant="secondary" onClick={handleLogout} className="gap-2 font-semibold">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Recent Visitors</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{visits.length}</div>
              <p className="text-xs text-muted-foreground">Showing last {visits.length} records</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Live</div>
              <p className="text-xs text-muted-foreground">System is monitoring visitors</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-none bg-white">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
            <div>
              <CardTitle className="text-xl font-bold">Visitor Access Log</CardTitle>
              <CardDescription>Real-time list of New Era University members entering the library.</CardDescription>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, college, or purpose..." 
                className="pl-10 h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold">Visitor</TableHead>
                    <TableHead className="font-bold">Affiliation</TableHead>
                    <TableHead className="font-bold">Purpose</TableHead>
                    <TableHead className="text-right font-bold">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.length > 0 ? (
                    filteredVisits.map((visit) => (
                      <TableRow key={visit.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{visit.displayName || "Unknown User"}</span>
                            <span className="text-xs text-muted-foreground">{visit.email || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{visit.collegeOrOffice || "N/A"}</span>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <span className="text-sm line-clamp-2 italic text-muted-foreground">
                             &ldquo;{visit.reasonForVisit}&rdquo;
                          </span>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <span className="text-xs font-mono font-bold bg-muted px-2 py-1 rounded">
                            {visit.visitDateTime ? format(new Date(visit.visitDateTime), "MMM d, h:mm a") : "N/A"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 opacity-20" />
                          <p className="text-lg">No visitor records found.</p>
                        </div>
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
