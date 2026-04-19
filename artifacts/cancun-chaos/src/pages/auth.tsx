import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useCreatePlayer } from "@workspace/api-client-react";
import { setPlayerId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Map, Zap, Sparkles } from "lucide-react";

export default function AuthPage() {
  const [username, setUsername] = useState("");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const createPlayer = useCreatePlayer();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    createPlayer.mutate(
      { data: { username } },
      {
        onSuccess: (data) => {
          setPlayerId(data.id);
          toast({
            title: "Welcome to Chaos!",
            description: `Get ready, ${data.username}!`,
          });
          setLocation("/game");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to enter the city.",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background text-foreground overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, var(--primary) 0%, transparent 50%)" }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full max-w-md p-6 relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 5 }}
            className="inline-block p-4 bg-primary text-primary-foreground rounded-3xl shadow-xl mb-4 rotate-3"
          >
            <Sparkles size={48} />
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary via-secondary to-accent tracking-tighter uppercase drop-shadow-sm mb-2">
            Cancun Chaos
          </h1>
          <p className="text-xl font-bold text-muted-foreground">Where bad decisions meet great entertainment</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 bg-card p-6 rounded-3xl border border-border shadow-xl">
          <div className="space-y-2">
            <label className="text-sm font-bold text-card-foreground uppercase tracking-wider" htmlFor="username">
              Enter your alias
            </label>
            <Input
              id="username"
              type="text"
              placeholder="e.g. LocoLarry, SunburnSally"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-lg p-6 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary transition-colors font-bold"
              disabled={createPlayer.isPending}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full text-lg py-6 rounded-2xl font-black tracking-wider shadow-lg active:scale-95 transition-all"
            disabled={createPlayer.isPending || !username.trim()}
          >
            {createPlayer.isPending ? "Entering City..." : "START CHAOS"}
          </Button>
        </form>

        <div className="mt-8 flex justify-center gap-6 text-muted-foreground font-bold text-sm">
          <div className="flex items-center gap-2"><Map size={16} /> Explore</div>
          <div className="flex items-center gap-2"><Zap size={16} /> Survive</div>
        </div>
      </motion.div>
    </div>
  );
}