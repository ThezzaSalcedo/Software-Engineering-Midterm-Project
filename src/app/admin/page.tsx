
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { collectionGroup, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Activity, BarChart3, Search, Calendar as CalendarIcon, FilterX } from "lucide-react";
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
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  
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
    // We fetch a larger limit to ensure stats are accurate for recent periods
    const q = query(
      collectionGroup(db, "libraryVisits"), 
      orderBy("visitDateTime", "desc"), 
      limit(500)
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

  // Filter calculations
  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const matchesSearch = 
        (v.displayName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!date?.from) return matchesSearch;
      
      const visitDate = new Date(v.visitDateTime);
      const start = startOfDay(date.from);
      const end = date.to ? endOfDay(date.to) : endOfDay(date.from);
      
      const matchesDate = isWithinInterval(visitDate, { start, end });
      
      return matchesSearch && matchesDate;
    });
  }, [visits, searchTerm, date]);

  // Stat calculations
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

  if (authLoading || !user || profile?.role !== "Admin") return null;

  return (
    <div className="min-h-screen bg-muted/5">
      <header className="border-b bg-primary text-primary-foreground p-4 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">NEU Library Admin</h1>
              <p className="text-[10px] uppercase tracking-widest opacity-70 font-semibold">Management Console</p>
            </div>
          </div>
          <Button variant="secondary" onClick={handleLogout} className="gap-2 font-semibold h-9">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 py-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Visitors Today</CardTitle>
              <Activity className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-primary">{stats.todayCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Real-time count for {format(new Date(), "MMMM d")}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-none bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium opacity-90">Period Analytics</CardTitle>
              <Users className="w-4 h-4 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black">{stats.periodTotal}</div>
              <p className="text-xs opacity-70 mt-1">Total visitors during {stats.periodLabel}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white hidden lg:block">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">Operational</div>
              <p className="text-xs text-muted-foreground mt-1">Monitoring live entrance logs</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Controls */}
        <Card className="shadow-sm border-none">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              <div className="w-full lg:flex-1 space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Search Visitors</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name or institutional email..." 
                    className="pl-10 h-11 bg-muted/20 border-none rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-full lg:w-auto space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Date Range Filter</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full lg:w-[300px] justify-start text-left font-normal h-11 rounded-xl border-dashed",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                          date.to ? (
                            <>
                              {format(date.from, "LLL dd, y")} -{" "}
                              {format(date.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(date.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-11 w-11 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setDate({ from: subDays(new Date(), 7), to: new Date() });
                      setSearchTerm("");
                    }}
                    title="Reset Filters"
                  >
                    <FilterX className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Period Selectors */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="secondary" size="sm" className="rounded-full text-[10px] font-bold h-7" onClick={() => setDate({ from: new Date(), to: new Date() })}>TODAY</Button>
              <Button variant="secondary" size="sm" className="rounded-full text-[10px] font-bold h-7" onClick={() => setDate({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) })}>THIS WEEK</Button>
              <Button variant="secondary" size="sm" className="rounded-full text-[10px] font-bold h-7" onClick={() => setDate({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>THIS MONTH</Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="shadow-lg border-none bg-white overflow-hidden">
          <CardHeader className="bg-primary/5 border-b py-4">
             <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Entry Logs</CardTitle>
                  <CardDescription className="text-xs">Displaying {filteredVisits.length} records for the selected period.</CardDescription>
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold py-4">Visitor Profile</TableHead>
                    <TableHead className="font-bold py-4">College/Office</TableHead>
                    <TableHead className="font-bold py-4">Purpose</TableHead>
                    <TableHead className="text-right font-bold py-4">Time of Entry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.length > 0 ? (
                    filteredVisits.map((visit) => (
                      <TableRow key={visit.id} className="hover:bg-muted/20 transition-colors border-b last:border-0">
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-sm">{visit.displayName || "Unknown Visitor"}</span>
                            <span className="text-[10px] text-muted-foreground tracking-tight">{visit.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-xs font-semibold px-2 py-1 bg-muted rounded-md text-muted-foreground">
                            {visit.collegeOrOffice || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 max-w-xs">
                          <span className="text-xs text-foreground italic bg-accent/5 px-2 py-1 rounded-lg border border-accent/10">
                             {visit.reasonForVisit}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-primary">
                              {visit.visitDateTime ? format(new Date(visit.visitDateTime), "h:mm a") : "N/A"}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase font-black">
                              {visit.visitDateTime ? format(new Date(visit.visitDateTime), "MMM dd, yyyy") : ""}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 bg-muted rounded-full">
                            <Search className="w-8 h-8 opacity-20" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-bold">No records found</p>
                            <p className="text-sm">Try adjusting your search terms or date range filters.</p>
                          </div>
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

      <footer className="py-10 text-center border-t bg-white">
         <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">NEU Library Management System • Secure Admin Interface</p>
      </footer>
    </div>
  );
}
