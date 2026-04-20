import { useState } from "react";
import { motion } from "framer-motion";
import {
  useListPlayers,
  useListLocations,
  useListEvents,
  useListMinigames,
  useListNpcs,
  useListAchievements,
  useListMissions,
  useGetAdminLogs,
  useGetAdminStats,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Users,
  MapPin,
  Zap,
  Gamepad2,
  Bot,
  Trophy,
  Target,
  BarChart3,
  ScrollText,
} from "lucide-react";

type Tab =
  | "stats"
  | "players"
  | "locations"
  | "events"
  | "minigames"
  | "npcs"
  | "achievements"
  | "missions"
  | "logs";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "stats", label: "Stats", icon: <BarChart3 size={16} /> },
  { id: "players", label: "Jugadores", icon: <Users size={16} /> },
  { id: "locations", label: "Lugares", icon: <MapPin size={16} /> },
  { id: "events", label: "Eventos", icon: <Zap size={16} /> },
  { id: "minigames", label: "Minijuegos", icon: <Gamepad2 size={16} /> },
  { id: "npcs", label: "NPCs", icon: <Bot size={16} /> },
  { id: "achievements", label: "Logros", icon: <Trophy size={16} /> },
  { id: "missions", label: "Misiones", icon: <Target size={16} /> },
  { id: "logs", label: "Logs", icon: <ScrollText size={16} /> },
];

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
      <div className="p-3 bg-primary/10 text-primary rounded-xl">{icon}</div>
      <div>
        <p className="text-2xl font-black">{value}</p>
        <p className="text-sm text-muted-foreground font-bold">{label}</p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("stats");

  const { data: stats } = useGetAdminStats();
  const { data: players } = useListPlayers();
  const { data: locations } = useListLocations();
  const { data: events } = useListEvents();
  const { data: minigames } = useListMinigames();
  const { data: npcs } = useListNpcs();
  const { data: achievements } = useListAchievements();
  const { data: missions } = useListMissions();
  const { data: logs } = useGetAdminLogs({ limit: 50 });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-foreground text-background p-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <h1 className="text-2xl font-black uppercase tracking-tight">Panel Admin</h1>
          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-black uppercase">
            Cancun Chaos
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <Button
              key={t.id}
              variant={tab === t.id ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.id)}
              className="font-bold shrink-0 flex items-center gap-1.5"
            >
              {t.icon}
              {t.label}
            </Button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {tab === "stats" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Jugadores" value={stats?.totalPlayers ?? players?.length ?? 0} icon={<Users size={24} />} />
                <StatCard label="Ubicaciones" value={locations?.length ?? 0} icon={<MapPin size={24} />} />
                <StatCard label="Eventos" value={events?.length ?? 0} icon={<Zap size={24} />} />
                <StatCard label="Minijuegos" value={minigames?.length ?? 0} icon={<Gamepad2 size={24} />} />
              </div>
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard label="Dinero Total en Juego" value={`$${stats.totalMoney ?? 0}`} icon={<span className="text-xl">💰</span>} />
                  <StatCard label="Minijuegos Jugados" value={stats.minigamesPlayed ?? 0} icon={<Gamepad2 size={24} />} />
                  <StatCard label="Chismes Generados" value={stats.gossipCount ?? 0} icon={<span className="text-xl">💬</span>} />
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Jugador Top" value={stats?.topPlayer ?? "—"} icon={<Trophy size={24} />} />
                <StatCard label="Dinero Promedio" value={`$${stats?.averageMoney ?? 0}`} icon={<span className="text-xl">📊</span>} />
                <StatCard label="Logros / Misiones" value={`${achievements?.length ?? 0} / ${missions?.length ?? 0}`} icon={<Target size={24} />} />
              </div>
            </div>
          )}

          {tab === "players" && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-black">ID</th>
                    <th className="text-left p-3 font-black">Usuario</th>
                    <th className="text-left p-3 font-black">Dinero</th>
                    <th className="text-left p-3 font-black">Energia</th>
                    <th className="text-left p-3 font-black">Rep</th>
                    <th className="text-left p-3 font-black">Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {players?.map((p) => (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/50">
                      <td className="p-3 font-mono text-muted-foreground">{p.id}</td>
                      <td className="p-3 font-bold">{p.username}</td>
                      <td className="p-3 font-bold text-accent">${p.money}</td>
                      <td className="p-3 font-bold text-secondary">{p.energy}</td>
                      <td className="p-3 font-bold text-primary">{p.reputation}</td>
                      <td className="p-3 text-muted-foreground">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString("es-MX") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "locations" && (
            <div className="grid gap-3 md:grid-cols-2">
              {locations?.map((l) => (
                <div key={l.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm flex gap-4">
                  <span className="text-4xl">{l.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black">{l.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{l.description}</p>
                    <div className="flex gap-2 mt-2 text-xs font-bold flex-wrap">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{l.type}</span>
                      <span className="bg-muted px-2 py-0.5 rounded-full">Q{l.hexQ} R{l.hexR}</span>
                      <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Riesgo {l.riskLevel}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "events" && (
            <div className="space-y-3">
              {events?.map((e) => (
                <div key={e.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm flex gap-4 items-start">
                  <span className="text-3xl">{e.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black">{e.name}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${e.isActive ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}>
                        {e.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{e.description}</p>
                    <div className="flex gap-2 mt-2 text-xs font-bold flex-wrap">
                      <span className="bg-muted px-2 py-0.5 rounded-full">{e.type}</span>
                      <span className="bg-muted px-2 py-0.5 rounded-full">Prob: {((e.probability ?? 0) * 100).toFixed(0)}%</span>
                      {e.moneyEffect && (
                        <span className={`px-2 py-0.5 rounded-full ${(e.moneyEffect ?? 0) >= 0 ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}>
                          ${e.moneyEffect}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "minigames" && (
            <div className="grid gap-3 md:grid-cols-2">
              {minigames?.map((m) => (
                <div key={m.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{m.emoji}</span>
                    <div>
                      <h3 className="font-black">{m.name}</h3>
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{m.type}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{m.description}</p>
                  <div className="flex gap-2 mt-3 text-xs font-bold flex-wrap">
                    <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full">Premio: ${m.baseReward}</span>
                    <span className="bg-muted px-2 py-0.5 rounded-full">Dificultad: {m.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "npcs" && (
            <div className="grid gap-3 md:grid-cols-2">
              {npcs?.map((n) => (
                <div key={n.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm flex gap-3">
                  <span className="text-4xl">{n.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black">{n.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium italic mt-0.5">"{n.dialogue}"</p>
                    <div className="flex gap-2 mt-2 text-xs font-bold flex-wrap">
                      <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">{n.personality}</span>
                      <span className="bg-muted px-2 py-0.5 rounded-full">Aparicion: {((n.spawnProbability ?? 0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "achievements" && (
            <div className="space-y-3">
              {achievements?.map((a) => (
                <div key={a.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm flex gap-4">
                  <span className="text-4xl">{a.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black">{a.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{a.description}</p>
                    <div className="flex gap-2 mt-2 text-xs font-bold">
                      <span className="bg-muted px-2 py-0.5 rounded-full">Condicion: {a.condition}</span>
                      {a.rewardMoney ? <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full">+${a.rewardMoney}</span> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "missions" && (
            <div className="space-y-3">
              {missions?.map((m) => (
                <div key={m.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                  <h3 className="font-black">{m.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">{m.description}</p>
                  <div className="flex gap-2 mt-2 text-xs font-bold flex-wrap">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{m.type}</span>
                    <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full">${m.reward}</span>
                    <span className="bg-muted px-2 py-0.5 rounded-full">{m.status === "active" ? "Activa" : "Completada"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "logs" && (
            <div className="bg-foreground text-background rounded-2xl p-4 font-mono text-xs space-y-1 max-h-[70vh] overflow-y-auto">
              {!logs || logs.length === 0 ? (
                <p className="text-muted-foreground">Sin logs todavia.</p>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="flex gap-3 opacity-80 hover:opacity-100">
                    <span className="text-muted-foreground shrink-0">
                      {l.createdAt ? new Date(l.createdAt).toLocaleTimeString("es-MX") : ""}
                    </span>
                    <span className="text-primary shrink-0">[{l.action}]</span>
                    <span>{l.details}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
