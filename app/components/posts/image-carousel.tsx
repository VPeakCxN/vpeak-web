"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface PostFile {
  uid: string;
  file_name: string;
  file_url: string;
  contentType: string | null;
}

export function ImageCarousel({ images }: { images: PostFile[] }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [direction, setDirection] = useState(0);

  const handlePrevious = () => {
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setZoomLevel(1);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setZoomLevel(1);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 1));
  };

  // Animation variants for Framer Motion
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="relative w-full">
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative w-full aspect-[4/3] max-h-[70vh] overflow-hidden rounded-lg">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentImageIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute w-full h-full"
              >
                <Image
                  src={images[currentImageIndex].file_url}
                  alt={images[currentImageIndex].file_name}
                  fill
                  className="object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </DialogTrigger>
        <DialogContent className="p-0 w-[90vw] max-w-4xl max-h-[90vh] aspect-[4/3]">
          <div className="relative w-full h-full">
            <Image
              src={images[currentImageIndex].file_url}
              alt={images[currentImageIndex].file_name}
              fill
              className="object-contain"
              style={{ transform: `scale(${zoomLevel})` }}
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, 60vw"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              <Button
                variant="secondary"
                size="icon"
                className="bg-gray-200/80 hover:bg-gray-300 rounded-full h-8 w-8"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-5 w-5 text-gray-800" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="bg-gray-200/80 hover:bg-gray-300 rounded-full h-8 w-8"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-5 w-5 text-gray-800" />
              </Button>
            </div>
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-200/80 hover:bg-gray-300 rounded-full h-8 w-8"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-5 w-5 text-gray-800" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-200/80 hover:bg-gray-300 rounded-full h-8 w-8"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-5 w-5 text-gray-800" />
                </Button>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-white bg-black/50 px-2 py-1 rounded">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-200/80 hover:bg-gray-300 rounded-full h-8 w-8"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-5 w-5 text-gray-800" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-200/80 hover:bg-gray-300 rounded-full h-8 w-8"
            onClick={handleNext}
          >
            <ChevronRight className="h-5 w-5 text-gray-800" />
          </Button>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-white bg-black/50 px-2 py-1 rounded">
            {currentImageIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}