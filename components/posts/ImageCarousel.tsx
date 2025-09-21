'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Tables } from '@/lib/database.types';

type PostFile = Tables<'post_files'>;

interface ImageCarouselProps {
  files: PostFile[];
}

export function ImageCarousel({ files }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % files.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + files.length) % files.length);
  };

  if (files.length === 0) return null;

  const currentFile = files[currentIndex];
  const isImage = currentFile.type.startsWith('image/');

  return (
    <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
      {isImage ? (
        <Image
          src={currentFile.file_url}
          alt={currentFile.file_name}
          fill
          className="object-cover"
          priority={currentIndex === 0}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Unsupported media type: {currentFile.type}</p>
        </div>
      )}
      
      {files.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
            aria-label="Previous slide"
          >
            &lt;
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
            aria-label="Next slide"
          >
            &gt;
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
            {files.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}