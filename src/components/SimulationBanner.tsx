"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * SimulationBanner: A persistent UI element that appears only during preview mode.
 * It provides clear feedback on the current simulated role and a robust way to exit.
 */
export function SimulationBanner() {
  const { simulation, stopSimulation } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Ensure hydration consistency before rendering interactive elements
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !simulation) return null;

  const handleExit = () => {
    // 1. Clear session storage immediately
    sessionStorage.removeItem("neu_lib_simulation_state");
    
    // 2. Update context state
    stopSimulation();
    
    // 3. Force hard navigation to return to Admin Dashboard
    // This is the most reliable way to purge simulation memory in preview frames
    window.location.href = "/admin";
  };

  return (
    <div className="bg-[#E65100] text-white py-2 px-4 flex items-center justify-between sticky top-0 z-[99999] shadow-2xl border-b border-white/20 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3 text-[10px] sm:text-xs font-black uppercase tracking-widest">
        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
          <AlertCircle className="w-4 h-4" />
        </div>
        <span className="pointer-events-none">
          PREVIEW MODE: <span className="underline decoration-white/50 underline-offset-4">{simulation.role}</span> — 
          VISIT: <span className="underline decoration-white/50 underline-offset-4">{simulation.visitType}</span>
        </span>
      </div>
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={handleExit}
        className="bg-white text-[#E65100] hover:bg-white/90 h-8 text-[10px] px-4 gap-2 rounded-full font-black uppercase transition-all shadow-md cursor-pointer z-[100000]"
      >
        <span>Exit Preview</span>
        <LogOut className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
