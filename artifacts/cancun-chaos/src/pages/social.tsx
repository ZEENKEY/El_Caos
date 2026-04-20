import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { getPlayerId } from "@/lib/auth";
import { useListGossip, useGenerateGossip, useGetPlayerDecisions, useMakeDecision } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, GitBranch, Zap, RefreshCw } from "lucide-react";

export default function SocialPage() {
  const playerId = getPlayerId();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: gossip, refetch: refetchGossip } = useListGossip({ limit: 30 });
  const { data: decisions, refetch: refetchDecisions } = useGetPlayerDecisions(playerId!, {
    query: { enabled: !!playerId },
  });

  const generateGossip = useGenerateGossip();
  const makeDecision = useMakeDecision();
  const [activeTab, setActiveTab] = useState<"gossip" | "decisions">("gossip");

  const handleGenerate = () => {
    if (!playerId) return;
    generateGossip.mutate(
      { data: { playerId } },
      {
        onSuccess: () => {
          refetchGossip();
          toast({ title: "Chisme generado!", description: "El barrio ya sabe." });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "No se pudo generar el chisme." });
        },
      }
    );
  };

  const handleDecision = (decisionId: number, choice: "A" | "B") => {
    if (!playerId) return;
    makeDecision.mutate(
      { playerId, data: { decisionId, choice } },
      {
        onSuccess: (res) => {
          refetchDecisions();
          toast({ title: "Decision tomada!", description: res.consequence ?? "Consecuencias inminentes." });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "No se pudo procesar la decision." });
        },
      }
    );
  };

  const pendingDecisions = decisions?.filter((d) => !d.isResolved) ?? [];

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
      <Button variant="ghost" onClick={() => setLocation("/game")} className="font-bold">
        <ArrowLeft className="mr-2" /> Regresar
      </Button>

      <div className="bg-secondary text-secondary-foreground rounded-3xl p-6 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MessageSquare size={48} />
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Social</h1>
            <p className="opacity-80 font-bold">Chismes y decisiones</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generateGossip.isPending}
          className="font-black border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10"
        >
          <RefreshCw size={16} className={generateGossip.isPending ? "animate-spin" : ""} />
          <span className="ml-1.5 hidden sm:inline">Generar Chisme</span>
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant={activeTab === "gossip" ? "default" : "outline"} onClick={() => setActiveTab("gossip")} className="font-black flex-1">
          <MessageSquare size={16} className="mr-1.5" /> Chismes
        </Button>
        <Button variant={activeTab === "decisions" ? "default" : "outline"} onClick={() => setActiveTab("decisions")} className="font-black flex-1 relative">
          <GitBranch size={16} className="mr-1.5" /> Decisiones
          {pendingDecisions.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
              {pendingDecisions.length}
            </span>
          )}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "gossip" && (
          <motion.div key="gossip" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {!gossip || gossip.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Zap size={52} className="mx-auto text-muted-foreground/40" />
                <p className="text-xl font-black text-muted-foreground">Sin chismes aun</p>
                <p className="text-muted-foreground text-sm">Genera el primero, el barrio esta aburrido.</p>
              </div>
            ) : (
              gossip.map((g, i) => (
                <motion.div key={g.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                  <p className="font-medium leading-snug">{g.text}</p>
                  {g.aboutPlayerName && <p className="text-xs text-muted-foreground mt-1.5 font-bold">Sobre: {g.aboutPlayerName}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {g.createdAt ? new Date(g.createdAt).toLocaleString("es-MX") : ""}
                  </p>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "decisions" && (
          <motion.div key="decisions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {pendingDecisions.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <GitBranch size={52} className="mx-auto text-muted-foreground/40" />
                <p className="text-xl font-black text-muted-foreground">Sin decisiones pendientes</p>
                <p className="text-muted-foreground text-sm">Explora el mapa para que pasen cosas.</p>
              </div>
            ) : (
              pendingDecisions.map((d, i) => (
                <motion.div key={d.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} className="bg-card rounded-2xl p-5 border border-border shadow space-y-4">
                  <h3 className="font-black text-lg">{d.title}</h3>
                  {d.description && <p className="text-muted-foreground text-sm font-medium">{d.description}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDecision(d.id, "A")}
                      disabled={makeDecision.isPending}
                      className="bg-primary/10 hover:bg-primary/20 border-2 border-primary/30 text-primary rounded-xl p-4 text-left transition-colors disabled:opacity-50"
                    >
                      <p className="font-black text-xs uppercase mb-1">Opcion A</p>
                      <p className="font-bold text-sm">{d.optionA}</p>
                    </button>
                    <button
                      onClick={() => handleDecision(d.id, "B")}
                      disabled={makeDecision.isPending}
                      className="bg-secondary/10 hover:bg-secondary/20 border-2 border-secondary/30 text-secondary rounded-xl p-4 text-left transition-colors disabled:opacity-50"
                    >
                      <p className="font-black text-xs uppercase mb-1">Opcion B</p>
                      <p className="font-bold text-sm">{d.optionB}</p>
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
