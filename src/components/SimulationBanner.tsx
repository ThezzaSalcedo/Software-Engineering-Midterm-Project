"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertCircle, X } from "lucide-react";

export function SimulationBanner() {
  const { simulation, stopSimulation } = useAuth();
  const router = useRouter();

  if (!simulation) return null;

  const handleExit = () => {
    stopSimulation();
    router.push("/admin");
  };

  return (
    <div className="bg-orange-500 text-white py-1.5 px-4 flex items-center justify-between sticky top-0 z-[100] shadow-md animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
        <AlertCircle className="w-4 h-4" />
        <span>
          Previewing as <span className="underline decoration-white/50 underline-offset-2">{simulation.role}</span> — 
          Visit Type: <span className="underline decoration-white/50 underline-offset-2">{simulation.visitType}</span>
        </span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleExit}
        className="text-white hover:bg-white/20 h-7 text-[10px] px-3 gap-1 rounded-full border border-white/30"
      >
        <span>Exit Preview</span>
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}
