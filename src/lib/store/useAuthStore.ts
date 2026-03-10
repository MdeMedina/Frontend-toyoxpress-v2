import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserPermissions {
    verMovimientos: boolean;
    verOtrosMovimientos: boolean;
    aprobarMovimientos: boolean;
    editarMovimientos: boolean;
    eliminarMovimientos: boolean;
    modificarFechas: boolean;
    crearUsuarios: boolean;
    modificarUsuarios: boolean;
    eliminarUsuarios: boolean;
    horasIngreso: boolean;
    obviarIngreso: boolean;
    configurarCuentas: boolean;
    consultarPrecios: boolean;
    verClientes: boolean;
    verExcel: boolean;
    cargarProductos: boolean;
    [key: string]: boolean; // Allows for dynamic checks
}

interface AuthState {
    token: string | null
    email: string | null
    name: string | null
    permissions: UserPermissions | null
    cantidadM: number
    login: (token: string, user: { email: string; name: string; permissions: UserPermissions; cantidadM: number }) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            email: null,
            name: null,
            permissions: null,
            cantidadM: 10,
            login: (token, user) => set({
                token,
                email: user.email,
                name: user.name,
                permissions: user.permissions,
                cantidadM: user.cantidadM || 10
            }),
            logout: () => set({ token: null, email: null, name: null, permissions: null, cantidadM: 10 }),
        }),
        {
            name: 'toyoxpress-auth', // Almacena en localStorage de manera encriptada y reactiva
        }
    )
)
