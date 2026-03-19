"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LogOut, Users, Activity, BarChart3, Search, 
  Calendar as CalendarIcon, RotateCcw, Loader2, 
  ShieldAlert, GraduationCap, Building2,
  PieChart as PieChartIcon, BarChart as BarChartIcon,
  ChevronDown, ChevronUp, Ban, UserCheck, Download,
  Eye, MonitorSmartphone
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, isToday, isWithinInterval, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, 
  Pie, PieChart, Cell, Legend 
} from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface VisitRecord {
  id: string;
  displayName?: string;
  email?: string;
  userType?: "Student" | "Faculty";
  collegeOrOffice?: string;
  reasonForVisit: string;
  visitDateTime: string;
  userId: string;
}

interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  role: string;
  userType?: "Student" | "Faculty";
  collegeOrOffice?: string;
  isBlocked?: boolean;
  isSetupComplete: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const { user, profile, logout, loading: authLoading, startSimulation, stopSimulation, simulation } = useAuth();
  const router = useRouter();
  const db = useFirestore();

  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [period, setPeriod] = useState<string>("custom");
  const [month, setMonth] = useState<Date | undefined>(undefined);

  // Simulation UI State
  const [isSimDialogOpen, setIsSimDialogOpen] = useState(false);
  const [tempSimRole, setTempSimRole] = useState<"Student" | "Faculty" | null>(null);

  // Initialize dates after hydration to prevent mismatches
  useEffect(() => {
    const today = new Date();
    setDate({
      from: subDays(today, 7),
      to: today,
    });
    setMonth(today);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (profile && profile.role !== "Admin" && !simulation) {
        router.push("/dashboard");
      }
    }
  }, [user, profile, authLoading, router, simulation]);

  // Queries
  const visitorLogsQuery = useMemoFirebase(() => {
    if (!db || !user || !profile || profile.role !== "Admin") return null;
    return query(collection(db, "visit_logs"), orderBy("visitDateTime", "desc"), limit(2000));
  }, [db, user, profile?.role]);

  const usersQuery = useMemoFirebase(() => {
    if (!db || !user || !profile || profile.role !== "Admin") return null;
    return query(collection(db, "users"), orderBy("createdAt", "desc"));
  }, [db, user, profile?.role]);

  const { data: visitsData, isLoading: visitsLoading } = useCollection<VisitRecord>(visitorLogsQuery);
  const { data: usersData, isLoading: usersLoading } = useCollection<UserRecord>(usersQuery);

  const visits = (visitsData || []) as VisitRecord[];
  const allUsers = (usersData || []) as UserRecord[];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setPeriod("custom");
    const today = new Date();
    setDate({ from: subDays(today, 7), to: today });
    setMonth(today);
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
      return;
    }
    setDate({ from, to });
    setMonth(from);
  };

  const toggleUserBlock = (userId: string, currentStatus: boolean) => {
    const userRef = doc(db, "users", userId);
    updateDocumentNonBlocking(userRef, { isBlocked: !currentStatus });
  };

  const handleSimSelect = (role: "Student" | "Faculty") => {
    // Small delay to ensure the dropdown menu closes fully before the dialog opens
    // This prevents potential Radix UI focus/scroll conflicts
    setTimeout(() => {
      setTempSimRole(role);
      setIsSimDialogOpen(true);
    }, 50);
  };

  const finalizeSimulation = (visitType: "First-Time" | "Returning") => {
    if (!tempSimRole) return;
    
    // Set UI state to closed first to ensure cleanup
    setIsSimDialogOpen(false);
    
    // Start simulation state
    startSimulation({
      role: tempSimRole,
      visitType
    });
    
    // Navigation after state push
    setTimeout(() => {
      if (visitType === "First-Time") {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    }, 100);
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

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const searchLower = userSearchTerm.toLowerCase();
      return (u.displayName || "").toLowerCase().includes(searchLower) ||
             (u.email || "").toLowerCase().includes(searchLower);
    });
  }, [allUsers, userSearchTerm]);

  const stats = useMemo(() => {
    const todayCount = visits.filter(v => isToday(new Date(v.visitDateTime))).length;
    const studentCount = visits.filter(v => v.userType === 'Student').length;
    const facultyCount = visits.filter(v => v.userType === 'Faculty').length;
    
    return {
      todayCount,
      studentCount,
      facultyCount,
      totalVisits: visits.length,
      blockedUsers: allUsers.filter(u => u.isBlocked).length,
      totalRegisteredUsers: allUsers.length
    };
  }, [visits, allUsers]);

  const chartData = useMemo(() => {
    const userTypeData = [
      { name: 'Students', value: stats.studentCount, color: 'hsl(var(--primary))' },
      { name: 'Faculty', value: stats.facultyCount, color: 'hsl(var(--accent))' },
    ];

    const reasonsMap: Record<string, number> = {};
    visits.forEach(v => {
      reasonsMap[v.reasonForVisit] = (reasonsMap[v.reasonForVisit] || 0) + 1;
    });
    
    const reasonData = Object.entries(reasonsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return { userTypeData, reasonData };
  }, [stats, visits]);

  const generateDailyPDF = () => {
    if (profile?.email !== 'admin1@neu.edu.ph') return;

    const doc = new jsPDF();
    const today = new Date();
    const dateStr = format(today, "PPPP");
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(26, 35, 126); 
    doc.text("NEU Library Daily Activity Report", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Report Date: ${dateStr}`, 14, 30);

    const todayVisits = visits.filter(v => isToday(new Date(v.visitDateTime)));
    const todayStudents = todayVisits.filter(v => v.userType === 'Student').length;
    const todayFaculty = todayVisits.filter(v => v.userType === 'Faculty').length;

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("Daily Summary", 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Count']],
      body: [
        ['Total Visitors', todayVisits.length.toString()],
        ['Student Count', todayStudents.toString()],
        ['Professor (Faculty) Count', todayFaculty.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [26, 35, 126] }
    });

    const reasonsMap: Record<string, number> = {};
    todayVisits.forEach(v => {
      reasonsMap[v.reasonForVisit] = (reasonsMap[v.reasonForVisit] || 0) + 1;
    });
    const reasonData = Object.entries(reasonsMap)
      .map(([name, count]) => [name, count.toString()])
      .sort((a, b) => parseInt(b[1]) - parseInt(a[1]));

    doc.setFontSize(16);
    doc.text("Purpose of Visit Statistics", 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Reason for Visit', 'Frequency']],
      body: reasonData.length > 0 ? reasonData : [['No data', '0']],
      theme: 'grid',
      headStyles: { fillColor: [26, 35, 126] }
    });

    doc.setFontSize(16);
    doc.text("Detailed Activity Log", 14, (doc as any).lastAutoTable.finalY + 15);
    
    const tableData = todayVisits.map(v => [
      v.displayName || "N/A",
      v.userType || "N/A",
      v.reasonForVisit,
      format(new Date(v.visitDateTime), "h:mm a")
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Visitor Name', 'Type', 'Reason for Visit', 'Time']],
      body: tableData.length > 0 ? tableData : [['No visits recorded today', '-', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [26, 35, 126] }
    });

    doc.save(`NEU_Library_Report_${format(today, "yyyy-MM-dd")}.pdf`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (profile && profile.role !== "Admin" && !simulation)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/5">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-headline text-destructive">Unauthorized Access</h1>
        <p className="text-muted-foreground text-center max-w-md mt-2">
          You do not have administrative privileges to access this console. 
        </p>
      </div>
    );
  }

  const isSuperAdmin = profile?.email === 'admin1@neu.edu.ph';

  return (
    <div className="min-h-screen bg-muted/5 font-body">
      <header className="border-b bg-primary text-primary-foreground p-4 shadow-sm sticky top-0 z-[40]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight uppercase font-headline">NEU Library Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white rounded-xl gap-2 font-bold uppercase text-[10px]">
                  <Eye className="w-3 h-3" />
                  Preview As
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl border-none shadow-2xl z-[100]">
                <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Select Simulation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { if(simulation) stopSimulation(); }} className="gap-2 font-bold cursor-pointer">
                  <MonitorSmartphone className="w-4 h-4 text-primary" />
                  Admin (Default)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSimSelect("Student")} className="gap-2 font-bold cursor-pointer">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  Student
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSimSelect("Faculty")} className="gap-2 font-bold cursor-pointer">
                  <Building2 className="w-4 h-4 text-primary" />
                  Professor / Faculty
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isSuperAdmin && (
              <Button 
                variant="outline" 
                onClick={generateDailyPDF} 
                className="gap-2 font-bold rounded-xl bg-white text-primary border-none hover:bg-white/90 hidden sm:flex"
              >
                <Download className="w-4 h-4" />
                Download Daily Report
              </Button>
            )}
            <Button variant="secondary" onClick={handleLogout} className="gap-2 font-semibold rounded-xl">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <Dialog open={isSimDialogOpen} onOpenChange={setIsSimDialogOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl max-w-sm z-[110]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-black tracking-tight text-primary uppercase font-headline">Simulate Visit History</DialogTitle>
            <DialogDescription className="text-sm font-medium">
              Choose the visit state for the simulated <span className="font-bold text-primary">{tempSimRole}</span> user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-4">
            <Button 
              onClick={() => finalizeSimulation("First-Time")}
              className="h-16 rounded-2xl font-black text-lg gap-3 bg-muted hover:bg-muted/80 text-foreground border-2 border-transparent hover:border-primary/20 transition-all"
            >
              <Eye className="w-5 h-5" />
              First-Time Visitor
            </Button>
            <Button 
              onClick={() => finalizeSimulation("Returning")}
              className="h-16 rounded-2xl font-black text-lg gap-3 bg-primary hover:bg-[#1A237E] shadow-xl"
            >
              <RotateCcw className="w-5 h-5" />
              Returning Visitor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="max-w-7xl mx-auto p-4 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-none border bg-white rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg text-accent hidden sm:block">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Today's Entries</p>
                <p className="text-xl sm:text-2xl font-black text-primary">{stats.todayCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-white rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary hidden sm:block">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Student Visits</p>
                <p className="text-xl sm:text-2xl font-black text-primary">{stats.studentCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-white rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg text-accent hidden sm:block">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Faculty Visits</p>
                <p className="text-xl sm:text-2xl font-black text-primary">{stats.facultyCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-primary text-primary-foreground rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg hidden sm:block">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold opacity-80 uppercase">Total Logged Visits</p>
                <p className="text-xl sm:text-2xl font-black">{stats.totalVisits}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Collapsible open={showAnalytics} onOpenChange={setShowAnalytics} className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                 <BarChartIcon className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="font-bold text-sm">Analytics Overview</h3>
                 <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Visual insights into library traffic</p>
               </div>
             </div>
             <CollapsibleTrigger asChild>
               <Button variant="outline" size="sm" className="gap-2 rounded-lg font-bold uppercase text-[10px] h-9 px-4">
                 {showAnalytics ? (
                   <>Hide Analytics <ChevronUp className="w-3 h-3" /></>
                 ) : (
                   <>Show Analytics <ChevronDown className="w-3 h-3" /></>
                 )}
               </Button>
             </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 shadow-sm border-none rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-primary" />
                    User Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.userTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.userTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 shadow-sm border-none rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BarChartIcon className="w-4 h-4 text-primary" />
                    Purpose of Visit (Top Reasons)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.reasonData}>
                      <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Tabs defaultValue="visits" className="space-y-6">
          <TabsList className="bg-white border p-1 rounded-xl w-full sm:w-auto h-12">
            <TabsTrigger value="visits" className="flex-1 sm:flex-none px-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Visit Logs
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 sm:flex-none px-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visits" className="space-y-6">
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
                    <div className="flex flex-wrap gap-2">
                      {['today', 'week', 'month', 'custom'].map((p) => (
                        <Button 
                          key={p}
                          variant={period === p ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePeriodChange(p)}
                          className="rounded-lg font-bold uppercase text-[10px] h-10 px-4"
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
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

            <Card className="shadow-lg border-none bg-white rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="font-bold py-4 px-6">Visitor</TableHead>
                        <TableHead className="font-bold py-4 px-6">Category</TableHead>
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
                              <Badge variant="outline" className="gap-1 rounded-full px-3 text-[10px] uppercase font-bold">
                                {visit.userType === 'Student' ? <GraduationCap className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                                {visit.userType || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <span className="text-xs">{visit.collegeOrOffice}</span>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <span className="text-xs italic">{visit.reasonForVisit}</span>
                            </TableCell>
                            <TableCell className="text-right py-4 px-6">
                              <span className="text-xs font-bold text-primary">
                                {visit.visitDateTime ? format(new Date(visit.visitDateTime), "LLL dd, h:mm a") : "N/A"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
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
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="shadow-sm border-none rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2 w-full">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Search Users</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search by name or email..." 
                        className="pl-10 h-12 bg-muted/20 border-none rounded-xl"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                      />
                    </div>
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
                        <TableHead className="font-bold py-4 px-6">User Details</TableHead>
                        <TableHead className="font-bold py-4 px-6">Type</TableHead>
                        <TableHead className="font-bold py-4 px-6">College/Office</TableHead>
                        <TableHead className="font-bold py-4 px-6">Status</TableHead>
                        <TableHead className="text-right font-bold py-4 px-6">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => (
                          <TableRow key={u.id} className="hover:bg-muted/5 transition-colors">
                            <TableCell className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">{u.displayName}</span>
                                <span className="text-[10px] text-muted-foreground">{u.email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <Badge variant="secondary" className="gap-1 rounded-full px-3 text-[10px] uppercase font-bold">
                                {u.userType === 'Student' ? <GraduationCap className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                                {u.userType || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <span className="text-xs">{u.collegeOrOffice || "N/A"}</span>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              {u.isBlocked ? (
                                <Badge variant="destructive" className="gap-1 rounded-full px-3">
                                  <Ban className="w-3 h-3" />
                                  Blocked
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1 border-accent text-accent rounded-full px-3">
                                  <UserCheck className="w-3 h-3" />
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right py-4 px-6">
                              <div className="flex items-center justify-end gap-3">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground hidden sm:inline">
                                  {u.isBlocked ? "Unblock" : "Block User"}
                                </span>
                                <Switch 
                                  checked={!u.isBlocked} 
                                  onCheckedChange={() => toggleUserBlock(u.id, !!u.isBlocked)}
                                  disabled={u.email === 'admin1@neu.edu.ph'} 
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                            {usersLoading ? "Loading users..." : "No users found."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
