"use client";

import { CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react";

type Estado = "pendiente" | "procesando" | "completado" | "error";

const config: Record<Estado, { label: string; icon: React.ReactNode; cls: string }> = {
    pendiente: { label: "Pendiente", icon: <Clock className="h-3 w-3" />, cls: "bg-amber-50 text-amber-700 border-amber-200" },
    procesando: { label: "Procesando", icon: <Loader2 className="h-3 w-3 animate-spin" />, cls: "bg-blue-50 text-blue-700 border-blue-200" },
    completado: { label: "Completado", icon: <CheckCircle2 className="h-3 w-3" />, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    error: { label: "Error", icon: <AlertCircle className="h-3 w-3" />, cls: "bg-red-50 text-red-700 border-red-200" },
};

export function PedidoStatusBadge({ estado }: { estado: string }) {
    const c = config[estado as Estado] ?? config.pendiente;
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${c.cls}`}>
            {c.icon} {c.label}
        </span>
    );
}
