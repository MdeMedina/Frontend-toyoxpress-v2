"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Pen, Trash2, PlusCircle } from "lucide-react";
import Swal from 'sweetalert2';
import RequirePermission from "@/components/auth/RequirePermission";
import CuentaModal from "./CuentaModal";

export default function CuentasTable() {
    const [cuentas, setCuentas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cuentaToEdit, setCuentaToEdit] = useState<any | null>(null);

    const fetchCuentas = async () => {
        try {
            setLoading(true);
            const res = await api.get('/cuentas');
            if (res.data.success) {
                setCuentas(res.data.cuentas);
            }
        } catch (error) {
            console.error("Error fetching cuentas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCuentas();
    }, []);

    const handleDelete = async (id: string, label: string) => {
        const result = await Swal.fire({
            title: `¿Eliminar la cuenta "${label}"?`,
            text: 'Esta cuenta desaparecerá de las listas, pero se conservará en el historial contable (Soft Delete).',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const res = await api.delete(`/cuentas/${id}`);
                if (res.data.success) {
                    Swal.fire('¡Eliminada!', 'La cuenta ha sido dada de baja exitosamente.', 'success');
                    fetchCuentas();
                }
            } catch (error: any) {
                console.error("Error deleting cuenta:", error);
                Swal.fire('Error', error.response?.data?.message || 'Hubo un problema al eliminar la cuenta.', 'error');
            }
        }
    };

    const handleEditClick = (cuenta: any) => {
        setCuentaToEdit(cuenta);
        setIsModalOpen(true);
    };

    const handleNewClick = () => {
        setCuentaToEdit(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end p-2 bg-gray-50 rounded-xl border">
                <RequirePermission perm="configurarCuentas">
                    <Button
                        onClick={handleNewClick}
                        className="bg-[#0b5ed7] hover:bg-[#0a58ca] text-white flex items-center gap-2 font-medium"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Crear una cuenta
                    </Button>
                </RequirePermission>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-gray-50 border-b">
                            <TableHead className="font-bold text-black py-4 w-1/3">Nombre de la cuenta</TableHead>
                            <TableHead className="font-bold text-black w-1/3">Etiqueta de Color</TableHead>
                            <TableHead className="font-bold text-black text-center">Contabilidad</TableHead>
                            <TableHead className="font-bold text-black text-right pr-6">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
                        ) : cuentas.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No hay cuentas registradas.</TableCell></TableRow>
                        ) : cuentas.map((cuenta) => (
                            <TableRow key={cuenta._id} className="border-b last:border-0 hover:bg-gray-50/50">
                                <TableCell className="py-4 font-semibold text-gray-800 text-base">
                                    {cuenta.label.toUpperCase()}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-6 h-6 rounded-full border shadow-sm"
                                            style={{ backgroundColor: cuenta.color || '#000000' }}
                                        ></div>
                                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                            {cuenta.color || '#000000'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    {cuenta.saldo ? (
                                        <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                            Suma al Saldo Total
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                            Excluida del Saldo
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <div className="flex justify-end gap-2">
                                        <RequirePermission perm="configurarCuentas">
                                            <Button
                                                size="sm"
                                                onClick={() => handleEditClick(cuenta)}
                                                className="bg-[#0b5ed7] hover:bg-[#0a58ca] text-white"
                                            >
                                                <Pen className="w-4 h-4" />
                                            </Button>
                                        </RequirePermission>

                                        <RequirePermission perm="configurarCuentas">
                                            <Button
                                                size="sm"
                                                onClick={() => handleDelete(cuenta._id, cuenta.label)}
                                                className="bg-[#dc3545] hover:bg-[#bb2d3b] text-white"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </RequirePermission>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {isModalOpen && (
                <CuentaModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchCuentas();
                    }}
                    cuenta={cuentaToEdit}
                />
            )}
        </div>
    );
}
