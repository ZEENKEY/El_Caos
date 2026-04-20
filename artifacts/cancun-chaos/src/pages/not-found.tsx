import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-center space-y-6 p-8"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <AlertTriangle size={80} className="mx-auto text-destructive" />
        </motion.div>
        <h1 className="text-6xl font-black text-destructive">404</h1>
        <p className="text-2xl font-black text-foreground">Pagina no encontrada</p>
        <p className="text-muted-foreground font-medium">
          Esta pagina no existe o se la llevo la corriente del hotel.
        </p>
        <Link href="/" className="inline-block bg-primary text-primary-foreground font-black text-lg px-8 py-4 rounded-2xl shadow-lg hover:opacity-90 transition-opacity">
          Regresar al Inicio
        </Link>
      </motion.div>
    </div>
  );
}
