import { useState } from "react";
import { motion } from "framer-motion";
import { getPlayerId } from "@/lib/auth";
import { useGetPlayer, useGetPlayerSummary, useMovePlayer, useListLocations, useListHouses, useListPlayers, useGetPlayerDecisions } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Zap, Coins, Star, Home, Skull, ArrowRight, ShoppingBag, MessageSquare, Target, Trophy } from "lucide-react";

// Hex math helpers
const HEX_SIZE = 40;
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const HEX_HEIGHT = 2 * HEX_SIZE;

function hexToPixel(q: number, r: number) {
  const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
  const y = HEX_SIZE * 3 / 2 * r;
  return { x, y };
}

export default function GamePage() {
  const playerId = getPlayerId();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: player, isLoading: playerLoading } = useGetPlayer(playerId!, { query: { enabled: !!playerId } });
  const { data: summary } = useGetPlayerSummary(playerId!, { query: { enabled: !!playerId } });
  const { data: locations } = useListLocations();
  const { data: houses } = useListHouses();
  const { data: players } = useListPlayers();
  const { data: decisions } = useGetPlayerDecisions(playerId!, { query: { enabled: !!playerId } });
  
  const movePlayer = useMovePlayer();

  const [showSummary, setShowSummary] = useState(true);

  // Generate grid (just a simple 5x5 around 0,0 for now)
  const grid = [];
  for (let q = -4; q <= 4; q++) {
    for (let r = Math.max(-4, -q - 4); r <= Math.min(4, -q + 4); r++) {
      grid.push({ q, r });
    }
  }

  const handleHexClick = (q: number, r: number) => {
    if (!player || movePlayer.isPending) return;
    
    // Simple adjacency check
    const isAdjacent = 
      (Math.abs(player.currentHexQ - q) <= 1 && Math.abs(player.currentHexR - r) <= 1 && Math.abs(-player.currentHexQ - player.currentHexR - (-q - r)) <= 1);
      
    if (!isAdjacent) {
      toast({ title: "Too far!", description: "You can only move to adjacent hexes.", variant: "destructive" });
      return;
    }

    movePlayer.mutate(
      { id: player.id, data: { hexQ: q, hexR: r } },
      {
        onSuccess: (res) => {
          if (res.eventTriggered) {
            toast({ title: "Random Event!", description: res.eventTriggered });
          }
          if (res.locationName) {
            const loc = locations?.find(l => l.hexQ === q && l.hexR === r);
            if (loc) setLocation(`/location/${loc.id}`);
          }
        }
      }
    );
  };

  if (!playerId) return null;
  if (playerLoading) return <div className="p-8 flex justify-center"><Zap className="animate-spin text-primary" /></div>;
  if (!player) return <div>Player not found</div>;

  return (
    <div className="p-4 space-y-6">
      {/* Top Stats Bar */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border flex flex-wrap gap-4 items-center justify-between sticky top-4 z-20">
        <div className="flex items-center gap-4">
          <div className="bg-muted p-2 rounded-xl">
            <span className="text-2xl font-black">{player.username}</span>
          </div>
          <div className="flex items-center gap-1 font-bold text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-lg">
            <Coins size={18} /> {player.money}
          </div>
          <div className="flex items-center gap-1 font-bold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg">
            <Zap size={18} /> {player.energy}/100
          </div>
          <div className="flex items-center gap-1 font-bold text-purple-500 bg-purple-500/10 px-3 py-1 rounded-lg">
            <Star size={18} /> {player.reputation}
          </div>
        </div>
      </div>

      {/* Decisions Alert */}
      {decisions && decisions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/social" className="block bg-destructive text-destructive-foreground p-4 rounded-2xl shadow-md font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skull size={24} />
              <span>You have {decisions.length} pending decisions! Ignore at your own peril.</span>
            </div>
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      )}

      {/* Map Container */}
      <div className="bg-muted/30 rounded-3xl overflow-hidden border border-border relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-x-auto touch-pan-x touch-pan-y">
        <svg viewBox="-300 -300 600 600" className="w-full h-full min-w-[600px] cursor-grab active:cursor-grabbing">
          <g>
            {grid.map(({ q, r }) => {
              const { x, y } = hexToPixel(q, r);
              const isCurrent = player.currentHexQ === q && player.currentHexR === r;
              
              const isAdjacent = Math.abs(player.currentHexQ - q) <= 1 && Math.abs(player.currentHexR - r) <= 1 && Math.abs(-player.currentHexQ - player.currentHexR - (-q - r)) <= 1;

              const loc = locations?.find(l => l.hexQ === q && l.hexR === r);
              const house = houses?.find(h => h.hexQ === q && h.hexR === r);
              const playersHere = players?.filter(p => p.currentHexQ === q && p.currentHexR === r && p.id !== player.id);

              return (
                <g 
                  key={`${q},${r}`} 
                  transform={`translate(${x}, ${y})`}
                  onClick={() => handleHexClick(q, r)}
                  className={`transition-all ${isAdjacent ? "cursor-pointer hover:opacity-80" : "opacity-50"}`}
                >
                  <polygon 
                    points="34.641,20 0,40 -34.641,20 -34.641,-20 0,-40 34.641,-20" 
                    className={`stroke-2 ${isCurrent ? "fill-primary stroke-primary-foreground" : isAdjacent ? "fill-card stroke-border hover:fill-accent/20" : "fill-muted stroke-border/50"}`}
                  />
                  {loc && (
                    <text textAnchor="middle" dy="5" fontSize="20" className="pointer-events-none">{loc.emoji}</text>
                  )}
                  {house && !loc && (
                    <text textAnchor="middle" dy="5" fontSize="16" className="pointer-events-none">🏠</text>
                  )}
                  {isCurrent && (
                    <circle r="6" fill="var(--color-primary-foreground)" className="animate-pulse" />
                  )}
                  {playersHere && playersHere.length > 0 && !isCurrent && (
                    <circle r="4" cy="-15" fill="var(--color-secondary)" />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-2">
          <Link href="/house" className="flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Home size={22} />
            <span className="text-xs font-bold">Casa</span>
          </Link>
          <Link href="/inventory" className="flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ShoppingBag size={22} />
            <span className="text-xs font-bold">Inventario</span>
          </Link>
          <Link href="/social" className="flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground relative">
            <MessageSquare size={22} />
            <span className="text-xs font-bold">Social</span>
            {decisions && decisions.filter(d => !d.isResolved).length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            )}
          </Link>
          <Link href="/missions" className="flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Target size={22} />
            <span className="text-xs font-bold">Misiones</span>
          </Link>
          <Link href="/achievements" className="flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Trophy size={22} />
            <span className="text-xs font-bold">Logros</span>
          </Link>
        </div>
      </div>
      {/* Bottom nav spacer */}
      <div className="h-20" />

      {/* Summary Modal (fake modal for now) */}
      {summary && showSummary && summary.eventsOccurred.length > 0 && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card p-6 rounded-3xl border border-border shadow-2xl max-w-sm w-full space-y-4"
          >
            <h2 className="text-2xl font-black text-primary">While you were away...</h2>
            <p className="font-bold text-muted-foreground italic">"{summary.headline}"</p>
            
            <div className="space-y-2 py-4">
              <div className="flex justify-between font-bold text-sm"><span>Money change:</span> <span className={summary.moneyGained - summary.moneyLost >= 0 ? "text-accent" : "text-destructive"}>{summary.moneyGained - summary.moneyLost >= 0 ? "+" : ""}{summary.moneyGained - summary.moneyLost}</span></div>
              <div className="flex justify-between font-bold text-sm"><span>Visitors:</span> <span>{summary.visitorsCount}</span></div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase text-muted-foreground">What happened:</h3>
              <ul className="text-sm space-y-1">
                {summary.eventsOccurred.map((ev, i) => <li key={i} className="bg-muted p-2 rounded-lg">"{ev}"</li>)}
              </ul>
            </div>

            <button onClick={() => setShowSummary(false)} className="w-full bg-primary text-primary-foreground font-black p-3 rounded-xl">GOT IT</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}