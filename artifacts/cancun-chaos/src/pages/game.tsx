import { useState } from "react";
import { motion } from "framer-motion";
import { getPlayerId } from "@/lib/auth";
import { useGetPlayer, useGetPlayerSummary, useMovePlayer, useListLocations, useListHouses, useListPlayers, useGetPlayerDecisions } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Zap, Coins, Star, Home, Skull, ArrowRight, ShoppingBag, MessageSquare, Target, Trophy } from "lucide-react";

const HEX_SIZE = 40;

function hexToPixel(q: number, r: number) {
  const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
  const y = HEX_SIZE * 3 / 2 * r;
  return { x, y };
}

export default function GamePage() {
  const playerId = getPlayerId();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: player, isLoading: playerLoading, refetch: refetchPlayer } = useGetPlayer(playerId!, { query: { enabled: !!playerId } });
  const { data: summary } = useGetPlayerSummary(playerId!, { query: { enabled: !!playerId } });
  const { data: locations } = useListLocations();
  const { data: houses } = useListHouses();
  const { data: players } = useListPlayers();
  const { data: decisions } = useGetPlayerDecisions(playerId!, { query: { enabled: !!playerId } });
  
  const movePlayer = useMovePlayer();
  const [showSummary, setShowSummary] = useState(true);

  const grid = [];
  for (let q = -4; q <= 4; q++) {
    for (let r = Math.max(-4, -q - 4); r <= Math.min(4, -q + 4); r++) {
      grid.push({ q, r });
    }
  }

  const handleHexClick = (q: number, r: number) => {
    if (!player || movePlayer.isPending) return;
    
    const dq = Math.abs(player.currentHexQ - q);
    const dr = Math.abs(player.currentHexR - r);
    const ds = Math.abs(-player.currentHexQ - player.currentHexR - (-q - r));
    const isAdjacent = Math.max(dq, dr, ds) <= 1 && !(dq === 0 && dr === 0);
      
    if (!isAdjacent) {
      toast({ title: "Muy lejos!", description: "Solo puedes moverte a hexagonos adyacentes.", variant: "destructive" });
      return;
    }

    movePlayer.mutate(
      { id: player.id, data: { hexQ: q, hexR: r } },
      {
        onSuccess: (res) => {
          refetchPlayer();
          if (res.eventTriggered) {
            toast({ title: "Evento aleatorio!", description: res.eventTriggered });
          }
          if (res.locationName) {
            const loc = locations?.find(l => l.hexQ === q && l.hexR === r);
            if (loc) setLocation(`/location/${loc.id}`);
          }
        },
        onError: (err) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Error al mover";
          toast({ title: "No puedes moverte", description: msg === "Not enough energy" ? "Sin energia suficiente." : msg, variant: "destructive" });
        },
      }
    );
  };

  if (!playerId) return null;
  if (playerLoading) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-screen gap-4">
      <Zap className="animate-spin text-primary" size={40} />
      <p className="font-bold text-muted-foreground">Cargando...</p>
    </div>
  );
  if (!player) return (
    <div className="p-8 text-center">
      <p className="font-bold text-destructive">Jugador no encontrado. Regresa al inicio.</p>
      <Link href="/" className="mt-4 inline-block font-black text-primary underline">Inicio</Link>
    </div>
  );

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Barra de stats */}
      <div className="bg-card rounded-2xl p-3 shadow-sm border border-border flex flex-wrap gap-3 items-center justify-between sticky top-2 z-20">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-muted px-3 py-1 rounded-xl font-black text-base">{player.username}</span>
          <span className="flex items-center gap-1 font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-lg text-sm">
            <Coins size={15} /> ${player.money}
          </span>
          <span className="flex items-center gap-1 font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg text-sm">
            <Zap size={15} /> {player.energy}/100
          </span>
          <span className="flex items-center gap-1 font-bold text-purple-500 bg-purple-500/10 px-2 py-1 rounded-lg text-sm">
            <Star size={15} /> {player.reputation}
          </span>
        </div>
      </div>

      {/* Alerta de decisiones pendientes */}
      {decisions && decisions.filter(d => !d.isResolved).length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/social" className="block bg-destructive text-destructive-foreground p-4 rounded-2xl shadow-md font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skull size={22} />
              <span>Tienes {decisions.filter(d => !d.isResolved).length} decisiones pendientes. Peligro inminente.</span>
            </div>
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      )}

      {/* Mapa hexagonal */}
      <div className="bg-muted/30 rounded-3xl overflow-hidden border border-border relative h-[55vh] min-h-[350px] flex items-center justify-center">
        <svg viewBox="-300 -280 600 560" className="w-full h-full cursor-grab active:cursor-grabbing">
          <g>
            {grid.map(({ q, r }) => {
              const { x, y } = hexToPixel(q, r);
              const isCurrent = player.currentHexQ === q && player.currentHexR === r;
              const dq = Math.abs(player.currentHexQ - q);
              const dr = Math.abs(player.currentHexR - r);
              const ds = Math.abs(-player.currentHexQ - player.currentHexR - (-q - r));
              const isAdjacent = Math.max(dq, dr, ds) <= 1 && !isCurrent;
              const loc = locations?.find(l => l.hexQ === q && l.hexR === r);
              const house = houses?.find(h => h.hexQ === q && h.hexR === r);
              const playersHere = players?.filter(p => p.currentHexQ === q && p.currentHexR === r && p.id !== player.id);

              return (
                <g 
                  key={`${q},${r}`} 
                  transform={`translate(${x}, ${y})`}
                  onClick={() => handleHexClick(q, r)}
                  style={{ cursor: isAdjacent ? "pointer" : "default", opacity: isAdjacent || isCurrent || loc ? 1 : 0.45 }}
                >
                  <polygon 
                    points="34.641,20 0,40 -34.641,20 -34.641,-20 0,-40 34.641,-20" 
                    style={{
                      fill: isCurrent ? "hsl(var(--primary))" : loc ? "hsl(var(--card))" : isAdjacent ? "hsl(var(--card))" : "hsl(var(--muted))",
                      stroke: isCurrent ? "hsl(var(--primary-foreground))" : "hsl(var(--border))",
                      strokeWidth: isCurrent ? 3 : 1.5,
                    }}
                  />
                  {loc && (
                    <text textAnchor="middle" dy="7" fontSize="20" style={{ pointerEvents: "none", userSelect: "none" }}>{loc.emoji}</text>
                  )}
                  {house && !loc && (
                    <text textAnchor="middle" dy="7" fontSize="14" style={{ pointerEvents: "none", userSelect: "none" }}>🏠</text>
                  )}
                  {isCurrent && (
                    <circle r="6" fill="white" style={{ opacity: 0.9 }} />
                  )}
                  {playersHere && playersHere.length > 0 && (
                    <circle r="4" cy="-16" fill="hsl(var(--secondary))" />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Instruccion */}
      <p className="text-center text-sm text-muted-foreground font-bold">
        Toca un hexagono adyacente para moverte. Toca una ubicacion para visitarla.
      </p>

      {/* Navegacion inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-2">
          <Link href="/house" className="flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Home size={22} />
            <span className="text-xs font-bold">Casa</span>
          </Link>
          <Link href="/inventory" className="flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ShoppingBag size={22} />
            <span className="text-xs font-bold">Mochila</span>
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

      {/* Modal "mientras no estabas" */}
      {summary && showSummary && summary.eventsOccurred.length > 0 && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card p-6 rounded-3xl border border-border shadow-2xl max-w-sm w-full space-y-4"
          >
            <h2 className="text-2xl font-black text-primary">Mientras no estabas...</h2>
            <p className="font-bold text-muted-foreground italic">"{summary.headline}"</p>
            
            <div className="space-y-2 py-4">
              <div className="flex justify-between font-bold text-sm">
                <span>Dinero:</span>
                <span className={(summary.moneyGained - summary.moneyLost) >= 0 ? "text-accent" : "text-destructive"}>
                  {(summary.moneyGained - summary.moneyLost) >= 0 ? "+" : ""}{summary.moneyGained - summary.moneyLost}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm">
                <span>Visitantes:</span>
                <span>{summary.visitorsCount}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase text-muted-foreground">Lo que paso:</h3>
              <ul className="text-sm space-y-1">
                {summary.eventsOccurred.map((ev, i) => <li key={i} className="bg-muted p-2 rounded-lg">"{ev}"</li>)}
              </ul>
            </div>

            <button onClick={() => setShowSummary(false)} className="w-full bg-primary text-primary-foreground font-black p-3 rounded-xl">
              ENTENDIDO
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
