import { useParams, useLocation } from "wouter";
import { useListLocations, useListNpcs, useListMinigames, useGetPlayer } from "@workspace/api-client-react";
import { getPlayerId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gamepad2, Users, AlertTriangle, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function LocationPage() {
  const { id } = useParams();
  const [_, setLocation] = useLocation();
  const playerId = getPlayerId();

  const { data: locations } = useListLocations();
  const { data: npcs } = useListNpcs();
  const { data: minigames } = useListMinigames();
  const { data: player } = useGetPlayer(playerId!, { query: { enabled: !!playerId } });

  if (!id) return null;
  const location = locations?.find(l => l.id === parseInt(id, 10));
  if (!location) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-screen gap-4">
      <Zap className="animate-spin text-primary" size={40} />
      <p className="font-bold text-muted-foreground">Cargando ubicacion...</p>
    </div>
  );

  const locNpcs = npcs?.filter(n => n.locationId === location.id);
  const minigame = minigames?.find(m => m.id === location.minigameId);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 max-w-2xl mx-auto space-y-6 pb-10"
    >
      <Button variant="ghost" onClick={() => setLocation("/game")} className="font-bold">
        <ArrowLeft className="mr-2" /> Regresar al Mapa
      </Button>

      <div className="bg-card rounded-3xl p-8 border border-border shadow-xl text-center space-y-4">
        <div className="text-8xl mb-4">{location.emoji}</div>
        <h1 className="text-4xl font-black uppercase text-primary tracking-tight">{location.name}</h1>
        <p className="text-lg text-muted-foreground font-bold">{location.description}</p>
        
        <div className="flex justify-center gap-4 py-4 flex-wrap">
          <span className="bg-destructive/20 text-destructive px-4 py-2 rounded-xl font-bold flex items-center gap-2">
            <AlertTriangle size={18} /> Riesgo Nivel {location.riskLevel}
          </span>
          <span className="bg-accent/20 text-accent px-4 py-2 rounded-xl font-bold flex items-center gap-2">
            <Zap size={18} /> Energia {(location.energyRestore ?? 0) >= 0 ? "+" : ""}{location.energyRestore}
          </span>
        </div>
      </div>

      {minigame && (
        <div className="bg-primary text-primary-foreground rounded-3xl p-6 shadow-md flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black flex items-center gap-2"><Gamepad2 /> {minigame.name}</h3>
            <p className="opacity-90 text-sm mt-1">{minigame.description}</p>
            <p className="font-bold mt-1 opacity-80">Premio base: ${minigame.baseReward}</p>
          </div>
          <Button 
            variant="secondary" 
            className="font-black text-lg px-6 py-4 rounded-2xl shrink-0"
            onClick={() => setLocation(`/minigame/${minigame.id}`)}
          >
            Jugar
          </Button>
        </div>
      )}

      {locNpcs && locNpcs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-black uppercase flex items-center gap-2 text-secondary">
            <Users size={22} /> Personajes aqui
          </h2>
          {locNpcs.map((npc, i) => (
            <motion.div
              key={npc.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl p-4 border border-border shadow-sm flex gap-4 items-start"
            >
              <span className="text-4xl shrink-0">{npc.emoji}</span>
              <div>
                <h3 className="font-black">{npc.name}</h3>
                <p className="text-sm text-muted-foreground italic mt-1">"{npc.dialogue}"</p>
                <span className="text-xs font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded-full mt-2 inline-block">
                  {npc.personality}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!minigame && (!locNpcs || locNpcs.length === 0) && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="font-bold">Nada especial aqui... por ahora.</p>
          <p className="text-sm mt-1">La energia del lugar se siente diferente.</p>
        </div>
      )}
    </motion.div>
  );
}
