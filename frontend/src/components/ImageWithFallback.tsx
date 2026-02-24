import { useState } from "react";

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  "data-testid"?: string;
}

const PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EImage indisponible%3C/text%3E%3C/svg%3E";

export function ImageWithFallback({ src, alt, className = "", fallbackClassName = "", "data-testid": dataTestId }: ImageWithFallbackProps) {
  const [errored, setErrored] = useState(false);
  const effectiveSrc = errored || !src ? PLACEHOLDER_SVG : src;
  const effectiveClass = errored || !src ? fallbackClassName || "bg-gray-200" : className;

  return (
    <img
      src={effectiveSrc}
      alt={alt}
      className={effectiveClass}
      onError={() => setErrored(true)}
      data-testid={dataTestId}
    />
  );
}
