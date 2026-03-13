"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import Swal from 'sweetalert2';
import RequirePermission from "@/components/auth/RequirePermission";
import { Checkbox } from "@/components/ui/checkbox";

interface CuentaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    cuenta?: any; // If null, it's Creation mode. If populated, it's Edit mode.
}

export default function CuentaModal({ isOpen, onClose, onSuccess, cuenta }: CuentaModalProps) {
    const isEditing = !!cuenta;

    const [formData, setFormData] = useState({
        label: "",
        color: "#000000",
        saldo: false
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (cuenta) {
            setFormData({
                label: cuenta.label || "",
                color: cuenta.color || "#000000",
                saldo: cuenta.saldo || false
            });
        } else {
            setFormData({
                label: "",
                color: "#000000",
                saldo: false
            });
        }
    }, [cuenta]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.label.trim()) {
            Swal.fire('Error', 'Debe ingresar un nombre para la cuenta.', 'error');
            return;
        }

        try {
            setLoading(true);
            let res;

            if (isEditing) {
                res = await api.put(`/cuentas/${cuenta._id}`, formData);
            } else {
                res = await api.post('/cuentas', formData);
            }

            if (res.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: isEditing ? 'Cuenta actualizada' : 'Cuenta registrada',
                    text: res.data.message,
                    timer: 2000,
                    showConfirmButton: false
                });
                onSuccess();
            }
        } catch (error: any) {
            console.error("Error saving cuenta:", error);
            Swal.fire('Error', error.response?.data?.message || 'Hubo un problema al guardar la cuenta.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">{isEditing ? "Modificar Cuenta" : "Crear Nueva Cuenta"}</DialogTitle>
                    <DialogDescription>
                        Ingrese los datos de la cuenta bancaria o método de pago.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="label" className="text-sm font-medium">Nombre de la cuenta <span className="text-red-500">*</span></Label>
                        <Input
                            id="label"
                            placeholder="Ej. Banesco, Zelle, Efectivo..."
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-4">
                        <Label htmlFor="color" className="text-sm font-medium">Color de la cuenta</Label>
                        <div className="flex items-center gap-4">
                            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 shadow-sm shrink-0 cursor-pointer hover:scale-105 transition-transform">
                                <input
                                    type="color"
                                    id="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="absolute -top-4 -left-4 w-24 h-24 p-0 border-0 cursor-pointer"
                                />
                            </div>
                            <div className="flex flex-col gap-1 w-full">
                                <span className="text-sm text-muted-foreground">Seleccione un identificador visual.</span>
                                <Input
                                    type="text"
                                    value={formData.color.toUpperCase()}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="font-mono text-sm max-w-[120px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg border border-border flex flex-col gap-2">
                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id="saldo"
                                checked={formData.saldo}
                                onCheckedChange={(checked) => setFormData({ ...formData, saldo: checked as boolean })}
                                className="mt-1"
                            />
                            <div className="flex flex-col">
                                <Label htmlFor="saldo" className="font-semibold text-foreground cursor-pointer">
                                    Agregar a Saldo Total
                                </Label>
                                <span className="text-xs text-muted-foreground leading-snug mt-1">
                                    Si marca esta opción, el dinero que ingrese a esta cuenta se sumará matemáticamente al indicador global de &quot;Saldo Total&quot; en la pantalla de Movimientos.
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <RequirePermission perm="configurarCuentas">
                            <Button type="submit" className="bg-[#0b5ed7] hover:bg-[#0a58ca] text-white" disabled={loading}>
                                {loading ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Cuenta"}
                            </Button>
                        </RequirePermission>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
