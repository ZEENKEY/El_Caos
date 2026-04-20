import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, AlertTriangle, ScrollText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type FrontendError = {
  id: number;
  timestamp: string;
  action: string;
  message: string;
  url: string;
  context: object | null;
  userAgent: string;
};

type GameLog = {
  id: number;
  playerId: number | null;
  action: string;
  details: string;
  createdAt: string;
};

export default function ConsolaPage() {
  const [tab, setTab] = useState<"errores" | "logs">("errores");
  const [errors, setErrors] = useState<FrontendError[]>([]);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/consola/errors");
      const data = await r.json();
      setErrors(Array.isArray(data) ? data : []);
      setLastRefresh(new Date().toLocaleTimeString("es-MX"));
    } catch (e) {
      console.error("Error fetching consola errors", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/consola/logs");
      const data = await r.json();
      setLogs(Array.isArray(data) ? data : []);
      setLastRefresh(new Date().toLocaleTimeString("es-MX"));
    } catch (e) {
      console.error("Error fetching consola logs", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (tab === "errores") fetchErrors();
    else fetchLogs();
  };

  return (
    <div className="min-h-screen bg-background font-mono">
      {/* Header */}
      <div className="bg-foreground text-background p-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black uppercase">Consola Cancun Chaos</span>
          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-black uppercase">
            Sistema
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && <span className="text-xs opacity-60">Actualizado: {lastRefresh}</span>}
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="font-bold border-background/30 text-background hover:bg-background/10"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="ml-1.5">Actualizar</span>
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={tab === "errores" ? "default" : "outline"}
            onClick={() => { setTab("errores"); setErrors([]); }}
            className="font-black flex items-center gap-2"
          >
            <AlertTriangle size={16} /> Errores del Frontend
            {errors.length > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full font-black">
                {errors.length}
              </span>
            )}
          </Button>
          <Button
            variant={tab === "logs" ? "default" : "outline"}
            onClick={() => { setTab("logs"); setLogs([]); }}
            className="font-black flex items-center gap-2"
          >
            <ScrollText size={16} /> Logs del Juego
          </Button>
        </div>

        {/* Instruccion inicial */}
        {tab === "errores" && errors.length === 0 && !loading && (
          <div className="bg-card rounded-2xl p-8 border border-border text-center space-y-4">
            <AlertTriangle size={48} className="mx-auto text-muted-foreground/40" />
            <p className="font-black text-xl">Errores del Frontend</p>
            <p className="text-muted-foreground font-medium">
              Aqui se muestran los errores que reportan los usuarios al usar la app.
              Haz clic en Actualizar para cargar los errores recientes.
            </p>
            <Button onClick={fetchErrors} disabled={loading} className="font-black">
              <RefreshCw size={16} className={loading ? "animate-spin mr-2" : "mr-2"} />
              Cargar errores
            </Button>
          </div>
        )}

        {tab === "logs" && logs.length === 0 && !loading && (
          <div className="bg-card rounded-2xl p-8 border border-border text-center space-y-4">
            <ScrollText size={48} className="mx-auto text-muted-foreground/40" />
            <p className="font-black text-xl">Logs del Juego</p>
            <p className="text-muted-foreground font-medium">
              Registro de acciones de todos los jugadores en tiempo real.
            </p>
            <Button onClick={fetchLogs} disabled={loading} className="font-black">
              <RefreshCw size={16} className={loading ? "animate-spin mr-2" : "mr-2"} />
              Cargar logs
            </Button>
          </div>
        )}

        {/* Errores */}
        {tab === "errores" && errors.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-black text-sm text-muted-foreground uppercase">{errors.length} errores encontrados</p>
              <Button variant="ghost" size="sm" onClick={() => setErrors([])} className="text-destructive font-bold">
                <Trash2 size={14} className="mr-1" /> Limpiar
              </Button>
            </div>
            {errors.map((err) => (
              <div key={err.id} className="bg-card rounded-xl border border-destructive/30 p-4 space-y-2 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded font-black text-xs">{err.action}</span>
                    <span className="text-muted-foreground text-xs">{new Date(err.timestamp).toLocaleString("es-MX")}</span>
                  </div>
                </div>
                <p className="font-bold text-destructive">{err.message}</p>
                {err.url && <p className="text-muted-foreground text-xs">URL: {err.url}</p>}
                {err.context && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground font-bold">Ver contexto</summary>
                    <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto text-xs">{JSON.stringify(err.context, null, 2)}</pre>
                  </details>
                )}
                {err.userAgent && <p className="text-muted-foreground/60 text-xs truncate">UA: {err.userAgent}</p>}
              </div>
            ))}
          </motion.div>
        )}

        {/* Logs del juego */}
        {tab === "logs" && logs.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-foreground text-background rounded-2xl p-4 text-xs space-y-1 max-h-[70vh] overflow-y-auto">
              {logs.map((l) => (
                <div key={l.id} className="flex gap-3 opacity-80 hover:opacity-100 hover:bg-white/5 px-1 py-0.5 rounded">
                  <span className="text-muted-foreground shrink-0 w-20 text-right">
                    {new Date(l.createdAt).toLocaleTimeString("es-MX")}
                  </span>
                  <span className="text-primary shrink-0 w-32 truncate">[{l.action}]</span>
                  <span className="text-secondary shrink-0 w-14">P{l.playerId ?? "?"}</span>
                  <span className="flex-1">{l.details}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
