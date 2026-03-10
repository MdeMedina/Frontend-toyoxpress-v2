'use client';

import React from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';

interface RequirePermissionProps {
    perm: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export default function RequirePermission({ perm, children, fallback = null }: RequirePermissionProps) {
    const permissions = useAuthStore((state) => state.permissions);

    // If permissions object exists and the specific permission is true, render children
    // Otherwise, render nothing (or the fallback)
    if (permissions && permissions[perm] === true) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}
