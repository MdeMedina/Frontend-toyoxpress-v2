import { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
    title: 'Login - ToyoXpress',
    description: 'Inicia sesión en el sistema administrativo',
};

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-primary">
                        ToyoXpress
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Ingresa tus credenciales para continuar
                    </p>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}
