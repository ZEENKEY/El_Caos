import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Map, ScrollText, Backpack, Trophy, User, Settings, LogOut, MessageSquare } from "lucide-react";
import { clearPlayerId, getPlayerId } from "@/lib/auth";

interface GameLayoutProps {
  children: ReactNode;
}

export function GameLayout({ children }: GameLayoutProps) {
  const [location, setLocation] = useLocation();
  const playerId = getPlayerId();

  const handleLogout = () => {
    clearPlayerId();
    setLocation("/");
  };

  if (!playerId) {
    setLocation("/");
    return null;
  }

  const navItems = [
    { href: "/game", icon: Map, label: "Map" },
    { href: "/gossip", icon: MessageSquare, label: "Gossip" },
    { href: "/missions", icon: ScrollText, label: "Missions" },
    { href: "/inventory", icon: Backpack, label: "Stuff" },
    { href: "/achievements", icon: Trophy, label: "Trophies" },
    { href: "/decisions", icon: User, label: "Choices" },
    { href: "/profile", icon: User, label: "Me" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 flex justify-around items-center z-50">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`p-2 rounded-xl flex flex-col items-center justify-center transition-colors ${isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon size={20} className="mb-1" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-card border-r border-border h-screen sticky top-0">
        <div className="p-6">
          <h1 className="text-2xl font-black text-primary tracking-tighter uppercase drop-shadow-sm">Cancun Chaos</h1>
        </div>
        <div className="flex-1 flex flex-col gap-2 px-4">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`p-3 rounded-xl flex items-center gap-3 transition-colors font-bold ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"}`}>
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-border flex flex-col gap-2">
          <Link href="/admin" className="p-3 rounded-xl flex items-center gap-3 transition-colors font-bold text-muted-foreground hover:bg-accent/10 hover:text-foreground">
            <Settings size={20} />
            <span>Admin</span>
          </Link>
          <button onClick={handleLogout} className="p-3 rounded-xl flex items-center gap-3 transition-colors font-bold text-destructive hover:bg-destructive/10 w-full text-left">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto w-full min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
