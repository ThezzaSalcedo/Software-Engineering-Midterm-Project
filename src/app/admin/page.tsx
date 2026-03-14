"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Activity, BarChart3, Search, Calendar as CalendarIcon, RotateCcw, Loader2, ShieldAlert, CalendarDays, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, isToday, isWithinInterval, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [period, setPeriod] = useState<string>("custom");
  const [month, setMonth] = useState<Date>(new Date());

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (profile && profile.role !== "Admin") {
        router.push("/dashboard");
      }
    }
  }, [user, profile, authLoading, router]);

  const visitorLogsQuery = useMemoFirebase(() => {
    if (!db || !user || !profile || profile.role !== "Admin") return null;
    return query(
      collection(db, "visit_logs"),
      orderBy("visitDateTime", "desc"),
      limit(1000)
    );
  }, [db, user, profile?.role]);

  const { data: visitsData, isLoading: visitsLoading } = useCollection<VisitRecord>(visitorLogsQuery);
  const visits = (visitsData || []) as VisitRecord[];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setPeriod("custom");
    setDate({
      from: subDays(new Date(), 7),
      to: new Date(),
    });
    setMonth(new Date());
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    const now = new Date();
    let from: Date;
    let to: Date = now;

    if (value === 'today') {
      from = startOfDay(now);
      to = endOfDay(now);
    } else if (value === 'week') {
      from = startOfWeek(now, { weekStartsOn: 0 });
      to = endOfWeek(now, { weekStartsOn: 0 });
    } else if (value === 'month') {
      from = startOfMonth(now);
      to = endOfMonth(now);
    } else {
      return; // Keep custom range
    }
    setDate({ from, to });
    setMonth(from);
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
    const now = new Date();
    const todayCount = visits.filter(v => isToday(new Date(v.visitDateTime))).length;
    const weekCount = visits.filter(v => {
      const d = new Date(v.visitDateTime);
      return isWithinInterval(d, { start: startOfWeek(now), end: endOfWeek(now) });
    }).length;
    const monthCount = visits.filter(v => isSameMonth(new Date(v.visitDateTime), now)).length;
    
    return {
      todayCount,
      weekCount,
      monthCount,
      totalCount: visits.length,
      filteredCount: filteredVisits.length
    };
  }, [visits, filteredVisits]);

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

      <main className="max-w-7xl mx-auto p-4 py-8 space-y-6">
        {/* Simple Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-none border bg-white rounded-xl">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-accent/10 rounded-lg text-accent">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Today</p>
                <p className="text-2xl font-black text-primary">{stats.todayCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-white rounded-xl">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Weekly</p>
                <p className="text-2xl font-black text-primary">{stats.weekCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-white rounded-xl">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <History className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Monthly</p>
                <p className="text-2xl font-black text-primary">{stats.monthCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-primary text-primary-foreground rounded-xl">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold opacity-80 uppercase">Results</p>
                <p className="text-2xl font-black">{stats.filteredCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card className="shadow-sm border-none rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-end">
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
                <label className="text-xs font-bold uppercase text-muted-foreground">Quick Filters</label>
                <Tabs value={period} onValueChange={handlePeriodChange} className="w-full">
                  <TabsList className="h-12 bg-muted/20 p-1 rounded-xl w-full lg:w-auto">
                    <TabsTrigger value="today" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Today</TabsTrigger>
                    <TabsTrigger value="week" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Week</TabsTrigger>
                    <TabsTrigger value="month" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Month</TabsTrigger>
                    <TabsTrigger value="custom" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Custom</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="w-full lg:w-auto space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Date Range</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full lg:w-[260px] justify-start text-left h-12 rounded-xl border-muted/50 bg-white">
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
                    <PopoverContent className="w-auto p-0 border-none shadow-2xl" align="end">
                      <Calendar 
                        mode="range" 
                        selected={date} 
                        onSelect={(newDate) => {
                          setDate(newDate);
                          setPeriod("custom");
                        }} 
                        month={month}
                        onMonthChange={setMonth}
                        numberOfMonths={1} 
                        onTodayClick={() => {
                          const today = new Date();
                          setDate({ from: today, to: today });
                          setMonth(today);
                          setPeriod("today");
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-12 w-12 rounded-xl border border-dashed text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                    onClick={handleResetFilters}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
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
                      <TableRow key={visit.id} className="hover:bg-muted/5 transition-colors">
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
                        {visitsLoading ? (
                           <div className="flex flex-col items-center gap-2">
                             <Loader2 className="w-6 h-6 animate-spin" />
                             <span className="text-xs">Loading records...</span>
                           </div>
                        ) : "No records found for the selected period."}
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
