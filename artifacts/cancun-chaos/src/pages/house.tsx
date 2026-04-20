import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { getPlayerId } from "@/lib/auth";
import { useGetHouse, useUpdateHouse, useGetPlayer } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hammer, Star, Zap } from "lucide-react";

const STYLES = ["beach", "tropical", "neon", "luxury", "legendary"];
const STYLE_NAMES = ["Cuartucho de Playa", "Cabana Tropical", "Cueva Neon", "Mansion de Lujo", "Palacio del Caos"];
const STYLE_EMOJIS = ["🏚️", "🏡", "💜", "🏰", "👑"];
const STYLE_COSTS = [0, 100, 300, 700, 1500];

export default function HousePage() {
  const playerId = getPlayerId();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: house, refetch } = useGetHouse(playerId!, { query: { enabled: !!playerId } });
  const { data: player } = useGetPlayer(playerId!, { query: { enabled: !!playerId } });
  const updateHouse = useUpdateHouse();

  const currentStyleIdx = STYLES.indexOf(house?.style ?? "beach");
  const level = Math.max(0, currentStyleIdx);
  const isMaxLevel = level >= STYLES.length - 1;
  const nextStyle = STYLES[level + 1];
  const nextCost = STYLE_COSTS[level + 1] ?? 0;

  const handleUpgrade = () => {
    if (!house || isMaxLevel) return;
    if ((player?.money ?? 0) < nextCost) {
      toast({ variant: "destructive", title: "Sin dinero", description: `Necesitas $${nextCost} pesos para mejorar.` });
      return;
    }
    updateHouse.mutate(
      { playerId: playerId!, data: { style: nextStyle } },
      {
        onSuccess: () => {
          refetch();
          toast({ title: "Casa mejorada!", description: "Los vecinos lloran de envidia." });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "No se pudo mejorar la casa." });
        },
      }
    );
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
      <Button variant="ghost" onClick={() => setLocation("/game")} className="font-bold">
        <ArrowLeft className="mr-2" /> Regresar
      </Button>

      {!house ? (
        <div className="text-center py-16 space-y-3">
          <Zap size={64} className="mx-auto text-muted-foreground/40 animate-spin" />
          <p className="font-black text-muted-foreground">Cargando tu casa...</p>
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-3xl p-8 border border-border shadow-xl text-center space-y-4">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-8xl">
              {STYLE_EMOJIS[level]}
            </motion.div>
            <h1 className="text-3xl font-black uppercase text-primary tracking-tight">{STYLE_NAMES[level]}</h1>
            <div className="flex items-center justify-center gap-1">
              {STYLES.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-colors ${i <= level ? "bg-primary flex-[2]" : "bg-muted flex-1"}`} />
              ))}
            </div>
            <p className="text-muted-foreground font-bold">Nivel {level + 1} / {STYLES.length}</p>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="bg-muted rounded-xl p-3">
                <p className="font-black text-lg">Q{house.hexQ}</p>
                <p className="text-muted-foreground font-bold">Hex Q</p>
              </div>
              <div className="bg-muted rounded-xl p-3">
                <p className="font-black text-lg">R{house.hexR}</p>
                <p className="text-muted-foreground font-bold">Hex R</p>
              </div>
              <div className="bg-muted rounded-xl p-3">
                <p className="font-black text-lg"><Star size={16} className="inline text-accent" /> {house.visitCount}</p>
                <p className="text-muted-foreground font-bold">Visitas</p>
              </div>
            </div>
          </motion.div>

          {isMaxLevel ? (
            <div className="bg-accent/10 border border-accent rounded-2xl p-6 text-center">
              <p className="text-2xl font-black text-accent">NIVEL MAXIMO</p>
              <p className="text-muted-foreground font-bold mt-1">Tu casa es una leyenda del barrio.</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-6 border border-border shadow space-y-4">
              <div className="flex items-center gap-3">
                <Hammer size={28} className="text-primary" />
                <div>
                  <h3 className="font-black text-lg">Mejorar a {STYLE_NAMES[level + 1]}</h3>
                  <p className="text-muted-foreground font-bold text-sm">Costo: ${nextCost} pesos — Tienes: ${player?.money ?? 0}</p>
                </div>
              </div>
              <Button size="lg" onClick={handleUpgrade} disabled={updateHouse.isPending || (player?.money ?? 0) < nextCost} className="w-full font-black text-lg py-6 rounded-2xl shadow">
                <Hammer className="mr-2" size={20} />
                {updateHouse.isPending ? "Mejorando..." : `Mejorar — $${nextCost}`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
