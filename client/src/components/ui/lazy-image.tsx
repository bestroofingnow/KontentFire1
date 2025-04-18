import { useState, useEffect, useRef } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderSrc?: string;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
  aspectRatio?: number;
  blurAmount?: number;
}

/**
 * A lazy-loaded image component that uses Intersection Observer
 * for improved performance
 */
export function LazyImage({
  src,
  alt,
  placeholderSrc,
  threshold = 0.1,
  onLoad,
  onError,
  aspectRatio,
  blurAmount = 5,
  className,
  ...imgProps
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Create a placeholder background if none is provided
  const defaultPlaceholder = placeholderSrc || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48L3N2Zz4=';
  
  // Set up intersection observer to detect when the image is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [threshold]);
  
  // Handle successful image load
  const handleImageLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };
  
  // Handle image loading error
  const handleImageError = () => {
    setHasError(true);
    onError?.();
  };
  
  // Calculate aspect ratio styles if provided
  const containerStyle: React.CSSProperties = {};
  if (aspectRatio) {
    containerStyle.position = 'relative';
    containerStyle.paddingBottom = `${(1 / aspectRatio) * 100}%`;
    containerStyle.overflow = 'hidden';
  }
  
  // Calculate image styles
  const imageStyle: React.CSSProperties = {
    transition: 'opacity 0.3s, filter 0.3s',
    opacity: isLoaded ? 1 : 0,
    filter: isLoaded ? 'none' : `blur(${blurAmount}px)`,
  };
  
  // If aspect ratio is provided, make image absolute positioned
  if (aspectRatio) {
    imageStyle.position = 'absolute';
    imageStyle.top = 0;
    imageStyle.left = 0;
    imageStyle.width = '100%';
    imageStyle.height = '100%';
    imageStyle.objectFit = 'cover';
  }
  
  // Calculate placeholder styles
  const placeholderStyle: React.CSSProperties = {
    position: aspectRatio ? 'absolute' : 'relative',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.3s',
    opacity: isLoaded ? 0 : 1,
  };
  
  return (
    <div
      className={`lazy-image-container ${className || ''}`}
      style={containerStyle}
      ref={imgRef}
    >
      {/* Placeholder image */}
      <img
        src={defaultPlaceholder}
        alt={alt}
        style={placeholderStyle}
        className="lazy-image-placeholder"
      />
      
      {/* Real image (only loaded when in view) */}
      {isInView && (
        <img
          {...imgProps}
          src={hasError ? defaultPlaceholder : src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={imageStyle}
          className="lazy-image"
        />
      )}
    </div>
  );
}