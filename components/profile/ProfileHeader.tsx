// components/profile/ProfileHeader.tsx
'use client';

import Image from 'next/image';
import { useCookies } from '@/hooks/getCookies';
import { useAvatar } from '@/hooks/getAvatar';
import { useState } from 'react';

export function ProfileHeader() {
  const { user, currentUserId } = useCookies();
  const name = user?.name ?? 'User';
  const email = user?.email ?? '';
  const { avatar } = useAvatar(currentUserId ?? null);
  const [broken, setBroken] = useState(false);

  const initials = name.trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card border-border">
      <div className="w-16 h-16 rounded-full flex items-center justify-center ring-1 ring-ring/40" style={{ background: 'var(--gradient-primary)' }}>
        {!broken && avatar ? (
          <Image
            src={avatar}
            alt={`${name} avatar`}
            width={64}
            height={64}
            className="rounded-full object-cover"
            onError={() => setBroken(true)}
          />
        ) : (
          <span className="text-primary-foreground text-2xl font-semibold">{initials}</span>
        )}
      </div>
      <div>
        <div className="text-lg font-medium text-foreground">{name}</div>
        <div className="text-sm text-muted-foreground">{email}</div>
      </div>
    </div>
  );
}
