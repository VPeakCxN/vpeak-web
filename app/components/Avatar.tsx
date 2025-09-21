// components/Avatar.tsx
"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import avatarPlaceholder from "@/components/images/placeholder-avatar.png";

type AvatarProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt?: string;
  fallbackSrc?: string;
};

export default function Avatar({
  src,
  alt = "User avatar",
  fallbackSrc = avatarPlaceholder, // ✅ just reference the import
  ...props
}: AvatarProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(fallbackSrc)}
    />
  );
}
