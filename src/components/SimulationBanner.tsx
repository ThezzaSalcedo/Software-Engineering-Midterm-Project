"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogOut } from "lucide-react";

export function SimulationBanner() {
  const { simulation, stopSimulation } = useAuth();

  if (!simulation) return null;

  const handleExit = () => {
    // 1. Clear state locally for immediate UI update
    stopSimulation();
    // 2. Perform a hard redirect to ensure the app re-initializes 
    // without any simulated memory remaining.
    window.location.href = "/admin";
  };

  return (
    <div className="bg-[#FB8C00] text-white py-2 px-4 flex items-center justify-between sticky top-0 z-[200] shadow-xl border-b border-white/20 animate-in slide-in-from-top duration-300 pointer-events-auto">
      <div className="flex items-center gap-3 text-[10px] sm:text-xs font-black uppercase tracking-widest pointer-events-none">
        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
          <AlertCircle className="w-4 h-4" />
        </div>
        <span>
          PREVIEW MODE: <span className="underline decoration-white/50 underline-offset-4">{simulation.role}</span> — 
          VISIT: <span className="underline decoration-white/50 underline-offset-4">{simulation.visitType}</span>
        </span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleExit}
        className="bg-white text-[#FB8C00] hover:bg-white/90 h-8 text-[10px] px-4 gap-2 rounded-full font-black uppercase transition-all shadow-md pointer-events-auto cursor-pointer"
      >
        <span>Exit Preview</span>
        <LogOut className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}