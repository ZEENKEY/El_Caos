import { useParams, useLocation } from "wouter";
import { useListLocations, useListNpcs, useListMinigames, useGetPlayer } from "@workspace/api-client-react";
import { getPlayerId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gamepad2, Users, AlertTriangle } from "lucide-react";
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
  if (!location) return <div>Loading location...</div>;

  const locNpcs = npcs?.filter(n => n.locationId === location.id);
  const minigame = minigames?.find(m => m.id === location.minigameId);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 max-w-2xl mx-auto space-y-6"
    >
      <Button variant="ghost" onClick={() => setLocation("/game")} className="font-bold">
        <ArrowLeft className="mr-2" /> Back to Map
      </Button>

      <div className="bg-card rounded-3xl p-8 border border-border shadow-xl text-center space-y-4">
        <div className="text-8xl mb-4">{location.emoji}</div>
        <h1 className="text-4xl font-black uppercase text-primary tracking-tight">{location.name}</h1>
        <p className="text-lg text-muted-foreground font-bold">{location.description}</p>
        
        <div className="flex justify-center gap-4 py-4">
          <span className="bg-secondary/20 text-secondary px-4 py-2 rounded-xl font-bold flex items-center gap-2">
            <AlertTriangle size={18} /> Risk Lvl {location.riskLevel}
          </span>
          <span className="bg-accent/20 text-accent px-4 py-2 rounded-xl font-bold flex items-center gap-2">
            ⚡ Energy +{location.energyRestore}
          </span>
        </div>
      </div>

      {minigame && (
        <div className="bg-primary text-primary-foreground rounded-3xl p-6 shadow-md flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black flex items-center gap-2"><Gamepad2 /> {minigame.name}</h3>
            <p className="opacity-90">{minigame.description}</p>
          </div>
          <Button 
            variant="secondary" 
            className="font-black text-lg px-8 py-6 rounded-2xl"
            onClick={() => setLocation(`/minigame/${minigame.id}`)}
          >
            PLAY
          </Button>
        </div>
      )}

      {locNpcs && locNpcs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-black flex items-center gap-2"><Users /> People Here</h2>
          <div className="grid gap-4">
            {locNpcs.map(npc => (
              <div key={npc.id} className="bg-card p-4 rounded-2xl border border-border flex items-center gap-4">
                <div className="text-4xl bg-muted p-3 rounded-2xl">{npc.emoji}</div>
                <div>
                  <h4 className="font-bold text-lg">{npc.name}</h4>
                  <p className="text-muted-foreground italic">"{npc.dialogue}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}