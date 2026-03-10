"use client";

import { useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { CartTable } from "./CartTable";
import {
    Search, UserRound, Package, X, Send, Plus,
    Tag, ChevronDown
} from "lucide-react";
import Swal from "sweetalert2";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Cliente {
    _id: string;
    Rif: string;
    Nombre: string;
    Telefonos?: string;
    'Correo Electronico'?: string;
    'Tipo de Precio'?: string;
    Estado?: string;
    Ciudad?: string;
    Direccion?: string;
}

interface Producto {
    _id: string;
    sku: string;       // same as Código in Excel
    name: string;      // same as Nombre in Excel
    brands?: string;
    Marca?: string;
    Ref?: string;
    'Precio Minimo'?: number;
    'Precio Mayor'?: number;
    sale_price?: number;          // used as "Precio Oferta"
    'Existencia Actual'?: number;
    stock_quantity?: number;
}

interface Linea {
    codigo: string;
    nombre: string;
    marca?: string;
    referencia?: string;
    cantidad: number | '';
    precio: number;
    total: number;
}

interface Props {
    onSuccess?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPO_PRECIO_MAP: Record<string, (p: Producto) => number> = {
    'Precio Oferta': p => Number(p.sale_price || p['Precio Minimo'] || 0),
    'Precio Mayor': p => Number(p['Precio Mayor'] || 0),
    'Precio Minimo': p => Number(p['Precio Minimo'] || 0),
    'Local': p => Number(p['Precio Minimo'] || 0),
};

function getPrecio(producto: Producto, tipoPrecio?: string): number {
    if (!tipoPrecio) return Number(producto['Precio Minimo'] || 0);
    const fn = TIPO_PRECIO_MAP[tipoPrecio.trim()];
    return fn ? fn(producto) : Number(producto['Precio Minimo'] || 0);
}

const PRECIO_BADGE: Record<string, string> = {
    'Precio Oferta': 'bg-emerald-50 text-emerald-700',
    'Precio Mayor': 'bg-blue-50 text-blue-700',
    'Precio Minimo': 'bg-amber-50 text-amber-700',
    'Local': 'bg-purple-50 text-purple-700',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function VentaForm({ onSuccess }: Props) {
    const token = useAuthStore((state: any) => state.token);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

    // Client search
    const [clienteQuery, setClienteQuery] = useState("");
    const [clienteResults, setClienteResults] = useState<Cliente[]>([]);
    const [clienteLoading, setClienteLoading] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const clienteTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Product search
    const [productoQuery, setProductoQuery] = useState("");
    const [productoResults, setProductoResults] = useState<Producto[]>([]);
    const [productoLoading, setProductoLoading] = useState(false);
    const productoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cart
    const [carrito, setCarrito] = useState<Linea[]>([]);

    // Order extras
    const [notaPedido, setNotaPedido] = useState("");
    const [notaCorreo, setNotaCorreo] = useState("");
    const [emails, setEmails] = useState<string[]>([]);
    const [emailInput, setEmailInput] = useState("");
    const [sending, setSending] = useState(false);

    // ── Client search ──────────────────────────────────────────────────────

    const buscarClientes = useCallback((q: string) => {
        if (clienteTimeout.current) clearTimeout(clienteTimeout.current);
        if (!q.trim()) { setClienteResults([]); return; }
        clienteTimeout.current = setTimeout(async () => {
            setClienteLoading(true);
            try {
                const r = await axios.get(`${backendUrl}/clientes`, {
                    params: { search: q, limit: 8 },
                    headers: { Authorization: `Bearer ${token}` },
                });
                setClienteResults(r.data.data || []);
            } catch { setClienteResults([]); }
            finally { setClienteLoading(false); }
        }, 350);
    }, [token, backendUrl]);

    // ── Product search ─────────────────────────────────────────────────────

    const buscarProductos = useCallback((q: string) => {
        if (productoTimeout.current) clearTimeout(productoTimeout.current);
        if (!q.trim()) { setProductoResults([]); return; }
        productoTimeout.current = setTimeout(async () => {
            setProductoLoading(true);
            try {
                const r = await axios.get(`${backendUrl}/productos`, {
                    params: { search: q, limit: 10 },
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProductoResults(r.data.data || []);
            } catch { setProductoResults([]); }
            finally { setProductoLoading(false); }
        }, 350);
    }, [token, backendUrl]);

    // ── Cart operations ────────────────────────────────────────────────────

    const agregarProducto = (p: Producto) => {
        const precio = getPrecio(p, selectedCliente?.['Tipo de Precio']);
        const yaExiste = carrito.findIndex(l => l.codigo === p.sku);
        if (yaExiste >= 0) {
            // Increment existing line
            const updated = [...carrito];
            const currentQty = Number(updated[yaExiste].cantidad) || 0;
            updated[yaExiste].cantidad = currentQty + 1;
            updated[yaExiste].total = updated[yaExiste].cantidad * updated[yaExiste].precio;
            setCarrito(updated);
        } else {
            setCarrito(prev => [...prev, {
                codigo: p.sku,
                nombre: p.name,
                marca: p.brands,
                cantidad: 1,
                precio,
                total: precio,
            }]);
        }
        setProductoQuery("");
        setProductoResults([]);
    };

    const cambiarCantidad = (idx: number, val: number | '') => {
        const updated = [...carrito];
        updated[idx].cantidad = val;
        updated[idx].total = (Number(val) || 0) * updated[idx].precio;
        setCarrito(updated);
    };

    const eliminarLinea = (idx: number) => setCarrito(prev => prev.filter((_, i) => i !== idx));

    // ── Email extras ───────────────────────────────────────────────────────

    const addEmail = () => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (re.test(emailInput.trim()) && !emails.includes(emailInput.trim())) {
            setEmails(prev => [...prev, emailInput.trim()]);
            setEmailInput("");
        }
    };

    // ── Submit ─────────────────────────────────────────────────────────────

    const enviarPedido = async () => {
        if (!selectedCliente) { Swal.fire('⚠️', 'Selecciona un cliente primero.', 'warning'); return; }
        if (carrito.length === 0) { Swal.fire('⚠️', 'El carrito está vacío.', 'warning'); return; }

        setSending(true);
        try {
            const carritoLimpio = carrito.map(l => ({
                ...l,
                cantidad: Number(l.cantidad) || 1,
                total: (Number(l.cantidad) || 1) * l.precio
            }));

            const total = carritoLimpio.reduce((s, l) => s + l.total, 0);
            const items = carritoLimpio.reduce((s, l) => s + l.cantidad, 0);

            await axios.post(`${backendUrl}/pedidos`, {
                data: {
                    cliente: selectedCliente,
                    vendedor: useAuthStore.getState().name || 'Vendedor',
                    productos: carritoLimpio,
                    total,
                    items,
                    notaPedido,
                    notaCorreo,
                    emails,
                    hora: new Date().toLocaleString('es-VE'),
                },
            }, { headers: { Authorization: `Bearer ${token}` } });

            Swal.fire({
                icon: 'success',
                title: '¡Pedido enviado!',
                html: `El pedido para <b>${selectedCliente.Nombre}</b> fue encolado correctamente. Recibirás el PDF por email cuando se procese.`,
                confirmButtonText: 'OK',
            });

            // Reset form
            setSelectedCliente(null);
            setCarrito([]);
            setNotaPedido("");
            setNotaCorreo("");
            setEmails([]);
            setClienteQuery("");
            onSuccess?.();

        } catch (e: any) {
            Swal.fire('Error', e.response?.data?.message || 'No se pudo enviar el pedido.', 'error');
        } finally {
            setSending(false);
        }
    };

    // ─── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-5">

            {/* ── Cliente ─────────────────────────────────────────────── */}
            <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <UserRound className="h-3.5 w-3.5" /> Cliente
                </p>
                {selectedCliente ? (
                    <div className="flex items-start justify-between gap-4 p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{selectedCliente.Nombre}</p>
                            <p className="text-xs text-muted-foreground">RIF: {selectedCliente.Rif} · {selectedCliente.Ciudad}</p>
                            {selectedCliente['Tipo de Precio'] && (
                                <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRECIO_BADGE[selectedCliente['Tipo de Precio'].trim()] || 'bg-gray-100 text-gray-600'}`}>
                                    <Tag className="h-2.5 w-2.5" /> {selectedCliente['Tipo de Precio']}
                                </span>
                            )}
                        </div>
                        <button onClick={() => { setSelectedCliente(null); setCarrito([]); }} className="text-muted-foreground hover:text-destructive mt-0.5">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-9 h-9"
                            placeholder="Buscar cliente por nombre o RIF..."
                            value={clienteQuery}
                            onChange={e => { setClienteQuery(e.target.value); buscarClientes(e.target.value); }}
                        />
                        {(clienteLoading || clienteResults.length > 0) && (
                            <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
                                {clienteLoading ? (
                                    <p className="text-xs text-muted-foreground px-4 py-3">Buscando...</p>
                                ) : clienteResults.map(c => (
                                    <button key={c._id} onClick={() => { setSelectedCliente(c); setClienteResults([]); setClienteQuery(""); }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors">
                                        <p className="text-sm font-medium">{c.Nombre}</p>
                                        <p className="text-xs text-muted-foreground">{c.Rif} · {c['Tipo de Precio'] || '—'}</p>
                                    </button>
                                ))}
                                {!clienteLoading && clienteResults.length === 0 && (
                                    <p className="text-xs text-muted-foreground px-4 py-3">Sin resultados.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Producto search ──────────────────────────────────────── */}
            {selectedCliente && (
                <div className="bg-card rounded-xl border border-border p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" /> Agregar Producto
                    </p>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-9 h-9"
                            placeholder="Buscar por código, descripción..."
                            value={productoQuery}
                            onChange={e => { setProductoQuery(e.target.value); buscarProductos(e.target.value); }}
                        />
                        {(productoLoading || productoResults.length > 0) && (
                            <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg z-20 max-h-72 overflow-y-auto">
                                {productoLoading ? (
                                    <p className="text-xs text-muted-foreground px-4 py-3">Buscando...</p>
                                ) : productoResults.length === 0 ? (
                                    <p className="text-xs text-muted-foreground px-4 py-3">Sin resultados.</p>
                                ) : productoResults.map(p => {
                                    let precio = getPrecio(p, selectedCliente?.['Tipo de Precio']);
                                    const stock = Number(p['Existencia Actual'] ?? p.stock_quantity ?? 0);
                                    return (
                                        <button key={p._id} onClick={() => agregarProducto(p)}
                                            className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0 flex items-center justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-mono text-muted-foreground">{p.sku}</p>
                                                <p className="text-sm font-medium truncate">{p.name}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-bold text-primary">${precio.toFixed(2)}</p>
                                                <p className={`text-[10px] ${stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    Stock: {stock}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Cart ─────────────────────────────────────────────────── */}
            {selectedCliente && (
                <div className="bg-card rounded-xl border border-border p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Carrito</p>
                    <CartTable lineas={carrito} onCantidadChange={cambiarCantidad} onRemove={eliminarLinea} />
                </div>
            )}

            {/* ── Notas + emails ────────────────────────────────────────── */}
            {selectedCliente && carrito.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Nota del Pedido</label>
                            <textarea
                                rows={3}
                                value={notaPedido}
                                onChange={e => setNotaPedido(e.target.value)}
                                placeholder="Instrucciones para bodega..."
                                className="w-full resize-none text-sm rounded-lg border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Nota del Correo</label>
                            <textarea
                                rows={3}
                                value={notaCorreo}
                                onChange={e => setNotaCorreo(e.target.value)}
                                placeholder="Mensaje para el email..."
                                className="w-full resize-none text-sm rounded-lg border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>

                    {/* CC emails */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">CC (correos adicionales)</label>
                        <div className="flex gap-2">
                            <Input
                                className="h-8 text-sm"
                                placeholder="correo@ejemplo.com"
                                value={emailInput}
                                onChange={e => setEmailInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addEmail()}
                            />
                            <button onClick={addEmail} className="shrink-0 bg-muted hover:bg-muted/80 rounded-md px-3 transition-colors">
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        {emails.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {emails.map(e => (
                                    <span key={e} className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                                        {e} <button onClick={() => setEmails(prev => prev.filter(x => x !== e))}><X className="h-2.5 w-2.5" /></button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Submit ───────────────────────────────────────────────── */}
            {selectedCliente && carrito.length > 0 && (
                <button
                    onClick={enviarPedido}
                    disabled={sending}
                    className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 rounded-xl py-3 text-sm font-semibold transition-colors shadow-sm"
                >
                    <Send className="h-4 w-4" />
                    {sending ? 'Enviando pedido...' : 'Enviar Pedido'}
                </button>
            )}
        </div>
    );
}
