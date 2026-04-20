import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { getPlayerId } from "@/lib/auth";
import { useListAchievements, useGetPlayerAchievements } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Lock, Zap } from "lucide-react";

export default function AchievementsPage() {
  const playerId = getPlayerId();
  const [_, setLocation] = useLocation();

  const { data: all, isLoading } = useListAchievements();
  const { data: earned } = useGetPlayerAchievements(playerId!, { query: { enabled: !!playerId } });

  const earnedIds = new Set(earned?.map((e) => e.achievementId));

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
      <Button variant="ghost" onClick={() => setLocation("/game")} className="font-bold">
        <ArrowLeft className="mr-2" /> Regresar
      </Button>

      <div className="bg-card rounded-3xl p-6 border border-border shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Trophy size={48} className="text-primary" />
          <div>
            <h1 className="text-3xl font-black uppercase text-primary tracking-tight">Logros</h1>
            <p className="text-muted-foreground font-bold">{earned?.length ?? 0} / {all?.length ?? 0} desbloqueados</p>
          </div>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${all?.length ? ((earned?.length ?? 0) / all.length) * 100 : 0}%` }}
            transition={{ duration: 0.8, type: "spring" }}
            className="h-full bg-primary rounded-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <Zap size={32} className="animate-spin text-primary" />
          <p className="font-bold text-muted-foreground">Cargando logros...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {all?.map((a, i) => {
            const isEarned = earnedIds.has(a.id);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4 ${isEarned ? "" : "opacity-50"}`}
              >
                <div className="text-4xl shrink-0">
                  {isEarned ? a.emoji : <Lock size={36} className="text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-base leading-tight">{a.name}</h3>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">{a.description}</p>
                  {a.rewardMoney && a.rewardMoney > 0 ? (
                    <span className="text-xs font-bold bg-accent/20 text-accent px-2 py-0.5 rounded-full mt-1 inline-block">+${a.rewardMoney}</span>
                  ) : null}
                </div>
                {isEarned && <span className="text-xs font-black text-accent shrink-0">Desbloqueado</span>}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
