/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

interface LazyImageProps {
  src: string;
  placeholder?: string;
  alt?: string;
}

export default function LazyImage({
  src,
  placeholder = "",
  alt = "",
}: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!imgRef.current) return;
    const observer = new IntersectionObserver(
      ([entry], obs) => {
        if (entry.isIntersecting && imgRef.current) {
          imgRef.current.src = src;
          imgRef.current.onload = () => setLoaded(true);
          obs.unobserve(imgRef.current);
        }
      },
      { rootMargin: "100px", threshold: 0.1 },
    );
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={placeholder}
      alt={alt}
      className={`transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
    ></img>
  );
}
