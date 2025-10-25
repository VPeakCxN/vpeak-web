// components/composer/TweetComposer.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCookies } from '@/hooks/getCookies';
import { useAvatar } from '@/hooks/getAvatar';
import { useState } from 'react';

export function TweetComposer() {
  const { user, currentUserId } = useCookies();
  const userName = user?.name ?? 'User';
  const { avatar, source, loading, error } = useAvatar(currentUserId ?? null);
  const [broken, setBroken] = useState(false);

  const showInitials = broken || !avatar;

  return (
    <div className="rounded-xl shadow-sm border mb-6 overflow-hidden smooth-transition bg-card border-border">
      <div className="p-6">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-ring/40" style={{ background: 'var(--gradient-primary)' }}>
            {!showInitials ? (
              <Image
                src={avatar!}
                alt="Profile avatar"
                width={48}
                height={48}
                className="rounded-full object-cover"
                onError={() => setBroken(true)}
                priority
              />
            ) : (
              <span className="text-primary-foreground font-semibold text-lg">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Composer Content */}
          <div className="flex-1">
            <Link href="/posts/create" className="block">
              <div className="group cursor-pointer">
                <div className="text-xl smooth-transition mb-4 text-muted-foreground group-hover:text-foreground">
                  Hi {userName}, what's on your mind today?
                </div>

                <div className="flex items-center justify-between pt-4 border-t smooth-transition border-border">
                  <div className="flex items-center space-x-4 text-primary">
                    {/* icons */}
                  </div>

                  <button className="bg-primary hover:opacity-90 text-primary-foreground font-semibold py-2 px-6 rounded-full smooth-transition shadow-sm hover:shadow-md hover:scale-105 ring-1 ring-ring/40">
                    <div className="flex items-center space-x-2">
                      <span>Post</span>
                      <div className="w-4 h-4">{/* icon */}</div>
                    </div>
                  </button>
                </div>

                {/* Debug status */}
                <div className="mt-2 text-xs text-muted-foreground">
                  {loading ? 'Loading avatar…' : error ? 'Avatar error (see console)' : `Avatar source: ${source}`}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
