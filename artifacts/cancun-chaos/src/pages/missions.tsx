import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { getPlayerId } from "@/lib/auth";
import { useListMissions, useCompleteMission } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, CheckCircle, Zap } from "lucide-react";

export default function MissionsPage() {
  const playerId = getPlayerId();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: missions, refetch } = useListMissions();
  const completeMission = useCompleteMission();

  const handleComplete = (missionId: number) => {
    if (!playerId) return;
    completeMission.mutate(
      { id: missionId, data: { playerId } },
      {
        onSuccess: (res) => {
          refetch();
          toast({ title: "Mision completada!", description: `Ganaste $${res.rewardEarned ?? 0} pesos.` });
        },
        onError: (err) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "";
          toast({ variant: "destructive", title: "Error", description: msg === "Mission already completed" ? "Esta mision ya fue completada." : "No se pudo completar la mision." });
        },
      }
    );
  };

  const typeColors: Record<string, string> = {
    community: "bg-secondary/20 text-secondary",
    challenge: "bg-destructive/20 text-destructive",
    mystery: "bg-purple-500/20 text-purple-600",
    social: "bg-accent/20 text-accent",
    work: "bg-primary/20 text-primary",
  };

  const typeLabels: Record<string, string> = {
    community: "Comunidad",
    challenge: "Desafio",
    mystery: "Misterio",
    social: "Social",
    work: "Trabajo",
  };

  const active = missions?.filter((m) => m.status === "active") ?? [];
  const completed = missions?.filter((m) => m.status === "completed") ?? [];

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
      <Button variant="ghost" onClick={() => setLocation("/game")} className="font-bold">
        <ArrowLeft className="mr-2" /> Regresar
      </Button>

      <div className="bg-accent text-accent-foreground rounded-3xl p-6 shadow-lg flex items-center gap-4">
        <Target size={48} />
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Misiones</h1>
          <p className="opacity-80 font-bold">{active.length} activas / {completed.length} completadas</p>
        </div>
      </div>

      {!missions || missions.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Zap size={64} className="mx-auto text-muted-foreground/40" />
          <p className="text-xl font-black text-muted-foreground">No hay misiones disponibles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-black uppercase text-muted-foreground tracking-wider">Activas</h2>
              {active.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-lg leading-tight">{m.title}</h3>
                      <p className="text-muted-foreground text-sm font-medium mb-3">{m.description}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${typeColors[m.type ?? ""] ?? "bg-muted text-muted-foreground"}`}>
                          {typeLabels[m.type ?? ""] ?? m.type}
                        </span>
                        <span className="text-xs font-bold bg-muted px-2 py-1 rounded-full">Premio: ${m.reward}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleComplete(m.id)} disabled={completeMission.isPending} className="font-black shrink-0">
                      Completar
                    </Button>
                  </div>
                </motion.div>
              ))}
            </section>
          )}

          {completed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-black uppercase text-muted-foreground tracking-wider">Completadas</h2>
              {completed.map((m) => (
                <div key={m.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm opacity-50 flex items-center gap-3">
                  <CheckCircle size={20} className="text-accent shrink-0" />
                  <div>
                    <p className="font-black">{m.title}</p>
                    <p className="text-xs text-muted-foreground font-medium">+${m.reward} ganado</p>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
