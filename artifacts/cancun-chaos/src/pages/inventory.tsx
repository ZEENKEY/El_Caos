import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { getPlayerId } from "@/lib/auth";
import { useGetInventory } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, ShoppingBag } from "lucide-react";

export default function InventoryPage() {
  const playerId = getPlayerId();
  const [_, setLocation] = useLocation();

  const { data: items, isLoading } = useGetInventory(playerId!, {
    query: { enabled: !!playerId },
  });

  const typeEmoji: Record<string, string> = {
    food: "🌮",
    accessory: "👒",
    furniture: "🛋️",
    special: "✨",
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => setLocation("/game")}
        className="font-bold"
      >
        <ArrowLeft className="mr-2" /> Back
      </Button>

      <div className="bg-primary text-primary-foreground rounded-3xl p-6 shadow-lg flex items-center gap-4">
        <ShoppingBag size={48} />
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Inventario</h1>
          <p className="opacity-80 font-bold">
            {items?.length ?? 0} items in your chaos bag
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground font-bold animate-pulse">
          Loading your stuff...
        </div>
      ) : !items || items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 space-y-4"
        >
          <Package size={64} className="mx-auto text-muted-foreground/50" />
          <p className="text-2xl font-black text-muted-foreground">Bolsa Vacia</p>
          <p className="text-muted-foreground font-medium">
            Play minigames and visit locations to collect items.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-2">
                {typeEmoji[item.type ?? ""] ?? "📦"}
              </div>
              <h3 className="font-black text-lg leading-tight">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1 font-medium">
                  {item.description}
                </p>
              )}
              <div className="mt-3 flex gap-2 flex-wrap">
                <span className="text-xs font-bold bg-secondary/20 text-secondary px-2 py-1 rounded-full uppercase">
                  {item.type}
                </span>
                {item.value && (
                  <span className="text-xs font-bold bg-accent/20 text-accent px-2 py-1 rounded-full">
                    ${item.value}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
