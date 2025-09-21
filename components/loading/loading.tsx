"use client";

import { motion } from "framer-motion";

export const Loading = ({ size = 12 }: { size?: number }) => {
  return (
    <motion.div
      className="border-4 border-t-accent border-b-accent border-l-transparent border-r-transparent rounded-full mx-auto"
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{
        repeat: Infinity,
        ease: "linear",
        duration: 0.8,
      }}
    />
  );
};
