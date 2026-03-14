
"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Activity, BarChart3, Search, Calendar as CalendarIcon, FilterX, Loader2, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, isToday, isWithinInterval, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

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
  const router = useRouter();
  const db = useFirestore();

  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (profile && profile.role !== "Admin") {
        router.push("/dashboard");
      }
    }
  }, [user, profile, authLoading, router]);

  // Updated to query the flat 'visit_logs' collection directly
  const visitorLogsQuery = useMemoFirebase(() => {
    if (!db || !user || !profile || profile.role !== "Admin") return null;
    return query(
      collection(db, "visit_logs"),
      orderBy("visitDateTime", "desc"),
      limit(500)
    );
  }, [db, user, profile?.role]);

  const { data: visitsData, isLoading: visitsLoading, error: visitsError } = useCollection<VisitRecord>(visitorLogsQuery);
  const visits = (visitsData || []) as VisitRecord[];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (v.displayName || "").toLowerCase().includes(searchLower) ||
        (v.email || "").toLowerCase().includes(searchLower);
      
      if (!date?.from) return matchesSearch;
      
      const visitDate = new Date(v.visitDateTime);
      const start = startOfDay(date.from);
      const end = date.to ? endOfDay(date.to) : endOfDay(date.from);
      
      const matchesDate = isWithinInterval(visitDate, { start, end });
      
      return matchesSearch && matchesDate;
    });
  }, [visits, searchTerm, date]);

  const stats = useMemo(() => {
    const todayCount = visits.filter(v => isToday(new Date(v.visitDateTime))).length;
    const periodTotal = filteredVisits.length;
    
    return {
      todayCount,
      periodTotal,
      periodLabel: date?.from && date?.to 
        ? `${format(date.from, "MMM d")} - ${format(date.to, "MMM d")}`
        : "Selected Period"
    };
  }, [visits, filteredVisits, date]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (profile && profile.role !== "Admin")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/5">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Unauthorized Access</h1>
        <p className="text-muted-foreground text-center max-w-md mt-2">
          You do not have the required administrative privileges to view this console. 
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/5 font-body">
      <header className="border-b bg-primary text-primary-foreground p-4 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight uppercase">NEU Library Admin</h1>
          </div>
          <Button variant="secondary" onClick={handleLogout} className="gap-2 font-semibold rounded-xl">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 py-8 space-y-8">
        {visitsError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-4 text-destructive">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div className="text-sm">
                <p className="font-bold">Permission Synchronization</p>
                <p className="opacity-80">Initial administrative credentials are being validated. Please refresh in a few moments.</p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => window.location.reload()}>Refresh</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm border-none bg-white rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Visitors Today</CardTitle>
              <Activity className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-primary">{stats.todayCount}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-none bg-primary text-primary-foreground rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium opacity-90">Period Analytics</CardTitle>
              <Users className="w-4 h-4 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black">{stats.periodTotal}</div>
              <p className="text-xs opacity-70 mt-1">Total during {stats.periodLabel}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-none rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              <div className="w-full lg:flex-1 space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Search Visitors</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name or email..." 
                    className="pl-10 h-12 bg-muted/20 border-none rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-full lg:w-auto space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Date Range Filter</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full lg:w-[300px] justify-start text-left h-12 rounded-xl">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date?.from ? (
                        date.to ? (
                          <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}</>
                        ) : (
                          format(date.from, "LLL dd")
                        )
                      ) : (
                        <span>Pick range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold py-4 px-6">Visitor</TableHead>
                    <TableHead className="font-bold py-4 px-6">College/Office</TableHead>
                    <TableHead className="font-bold py-4 px-6">Purpose</TableHead>
                    <TableHead className="text-right font-bold py-4 px-6">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.length > 0 ? (
                    filteredVisits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{visit.displayName}</span>
                            <span className="text-[10px] text-muted-foreground">{visit.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="text-xs">{visit.collegeOrOffice}</span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="text-xs italic">{visit.reasonForVisit}</span>
                        </TableCell>
                        <TableCell className="text-right py-4 px-6">
                          <span className="text-xs font-bold text-primary">
                            {visit.visitDateTime ? format(new Date(visit.visitDateTime), "h:mm a") : "N/A"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                        No records found.
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
