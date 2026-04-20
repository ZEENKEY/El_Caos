import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { getPlayerId } from "@/lib/auth";
import { useListMinigames, usePlayMinigame } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gamepad2, Trophy, Zap } from "lucide-react";

type Phase = "intro" | "playing" | "result";

export default function MinigamePage() {
  const { id } = useParams();
  const [_, setLocation] = useLocation();
  const playerId = getPlayerId();
  const { toast } = useToast();

  const { data: minigames } = useListMinigames();
  const playMinigame = usePlayMinigame();

  const minigame = minigames?.find((m) => m.id === parseInt(id ?? "0", 10));

  const [phase, setPhase] = useState<Phase>("intro");
  const [barPos, setBarPos] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastAccuracy, setLastAccuracy] = useState("");
  const [reward, setReward] = useState(0);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);
  const dirRef = useRef(1);

  const config = minigame?.config as {
    speed?: number;
    zones?: { perfect?: number; good?: number; ok?: number };
  } | null;
  const speed = config?.speed ?? 1.5;
  const zones = config?.zones ?? { perfect: 0.1, good: 0.25, ok: 0.4 };

  const animate = useCallback(() => {
    posRef.current += dirRef.current * speed * 0.008;
    if (posRef.current >= 1) { posRef.current = 1; dirRef.current = -1; }
    else if (posRef.current <= 0) { posRef.current = 0; dirRef.current = 1; }
    setBarPos(posRef.current);
    animRef.current = requestAnimationFrame(animate);
  }, [speed]);

  useEffect(() => {
    if (phase === "playing") {
      animRef.current = requestAnimationFrame(animate);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [phase, animate]);

  const getAccuracy = (pos: number): { label: string; labelEs: string; score: number } => {
    const center = Math.abs(pos - 0.5);
    if (center <= (zones.perfect ?? 0.1) / 2) return { label: "PERFECTO", labelEs: "PERFECTO", score: 100 };
    if (center <= (zones.good ?? 0.25) / 2) return { label: "BIEN", labelEs: "BIEN", score: 70 };
    if (center <= (zones.ok ?? 0.4) / 2) return { label: "OK", labelEs: "OK", score: 40 };
    return { label: "FAIL", labelEs: "FALLASTE", score: 10 };
  };

  const handleClick = () => {
    if (phase !== "playing") return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const current = posRef.current;
    const { label, labelEs, score } = getAccuracy(current);
    setLastAccuracy(labelEs);
    setLastScore(score);
    setPhase("result");

    if (!playerId || !minigame) return;
    playMinigame.mutate(
      { id: minigame.id, data: { playerId, score, accuracy: label.toLowerCase() } },
      {
        onSuccess: (res) => { setReward(res.reward ?? 0); },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el resultado." });
        },
      }
    );
  };

  const accuracyColor: Record<string, string> = {
    "PERFECTO": "text-accent",
    "BIEN": "text-secondary",
    "OK": "text-yellow-400",
    "FALLASTE": "text-destructive",
  };

  if (!minigame) return (
    <div className="p-8 flex justify-center items-center min-h-screen">
      <Zap className="animate-spin text-primary" size={40} />
    </div>
  );

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 select-none">
      <Button variant="ghost" onClick={() => setLocation("/game")} className="font-bold">
        <ArrowLeft className="mr-2" /> Regresar
      </Button>

      <div className="bg-card rounded-3xl p-8 border border-border shadow-lg text-center space-y-4">
        <div className="text-6xl">{minigame.emoji}</div>
        <h1 className="text-3xl font-black uppercase text-primary tracking-tight">{minigame.name}</h1>
        <p className="text-muted-foreground font-bold">{minigame.description}</p>
        <div className="flex justify-center gap-4 text-sm font-bold flex-wrap">
          <span className="bg-accent/20 text-accent px-3 py-1 rounded-full">Premio: ${minigame.baseReward}</span>
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full">Dificultad: {"★".repeat(minigame.difficulty ?? 1)}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-4">
            <p className="text-lg font-bold text-muted-foreground">
              Detén la barra lo más cerca del centro que puedas.<br />
              Entre más centrado, mayor el premio.
            </p>
            <Button size="lg" onClick={() => { posRef.current = 0; dirRef.current = 1; setPhase("playing"); }} className="text-xl font-black px-12 py-8 rounded-2xl shadow-lg">
              <Gamepad2 className="mr-3" size={28} /> COMENZAR
            </Button>
          </motion.div>
        )}

        {phase === "playing" && (
          <motion.div key="playing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div
              className="relative h-16 bg-muted rounded-2xl overflow-hidden border-4 border-border cursor-pointer shadow-inner"
              onClick={handleClick}
            >
              <div className="absolute top-0 bottom-0 bg-accent/40 rounded" style={{ left: `${(0.5 - (zones.perfect ?? 0.1) / 2) * 100}%`, width: `${(zones.perfect ?? 0.1) * 100}%` }} />
              <div className="absolute top-0 bottom-0 bg-secondary/20 rounded" style={{ left: `${(0.5 - (zones.good ?? 0.25) / 2) * 100}%`, width: `${(zones.good ?? 0.25) * 100}%` }} />
              <div className="absolute top-1 bottom-1 w-4 bg-primary rounded-xl shadow-lg" style={{ left: `calc(${barPos * 100}% - 8px)`, transition: "none" }} />
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-foreground/20" />
            </div>
            <p className="text-center text-2xl font-black text-primary animate-pulse">TOCA PARA DETENER!</p>
            <div className="flex justify-center gap-4 text-xs font-bold text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-accent/40" /> Perfecto</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-secondary/20" /> Bien</span>
            </div>
          </motion.div>
        )}

        {phase === "result" && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300 }} className="text-center space-y-6">
            <div className={`text-6xl font-black ${accuracyColor[lastAccuracy ?? ""] ?? ""}`}>{lastAccuracy}</div>
            {playMinigame.isPending ? (
              <p className="text-muted-foreground font-bold animate-pulse">Calculando premio...</p>
            ) : (
              <div className="bg-card rounded-3xl p-6 border border-border shadow space-y-2">
                <div className="flex items-center justify-center gap-3 text-2xl font-black">
                  <Trophy className="text-accent" size={32} />
                  <span>+${reward}</span>
                </div>
                <p className="text-muted-foreground font-bold">Puntaje: {lastScore}/100</p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => { posRef.current = 0; dirRef.current = 1; setPhase("playing"); }} className="font-bold">
                Jugar de nuevo
              </Button>
              <Button onClick={() => setLocation("/game")} className="font-black">Regresar al Mapa</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
