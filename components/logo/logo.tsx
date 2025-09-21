// components/logo/Logo.tsx
"use client";

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import logoSrc from "@/components/images/logo.png";

interface LogoProps {
  size?: number;
}

const flipVariants: Variants = {
  hidden: { rotateY: 0, opacity: 0 },
  visible: {
    rotateY: 360,
    opacity: 1,
    transition: {
      rotateY: {
        repeat: Infinity,
        duration: 6, // 6s per flip
        ease: "linear",
      },
      opacity: { duration: 0.5 },
    },
  },
};

export function Logo({ size = 80 }: LogoProps) {
  return (
    <motion.div
      className="mx-auto w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] perspective-1000"
      variants={flipVariants}
      initial="hidden"
      animate="visible"
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        <Image
          src={logoSrc}
          alt="VPeak Logo"
          width={size}
          height={size}
          className="w-full h-full object-contain"
        />
      </motion.div>
    </motion.div>
  );
}
