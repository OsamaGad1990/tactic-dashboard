'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function LoginBackground() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="fixed inset-0 -z-10 bg-background" />;
    }

    const bgSrc = resolvedTheme === 'light'
        ? '/backgrounds/Light_background.jpg'
        : '/backgrounds/Dark_background.jpg';

    return (
        <div className="fixed inset-0 -z-10">
            <Image
                src={bgSrc}
                alt=""
                fill
                priority
                className="object-cover"
                aria-hidden="true"
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" />
        </div>
    );
}
