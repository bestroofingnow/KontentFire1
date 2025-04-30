import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

type CursorEffectProps = {
  type?: 'dot' | 'circle' | 'gradient' | 'pointer' | 'trail';
  color?: string;
  size?: number;
  showOnHover?: boolean;
  trailLength?: number;
  className?: string;
  zIndex?: number;
};

/**
 * CursorEffect - Adds playful cursor effects to enhance user interaction
 * 
 * @example
 * <CursorEffect type="trail" color="#FF5B2E" />
 */
export const CursorEffect: React.FC<CursorEffectProps> = ({
  type = 'dot',
  color = '#FF5B2E', // Default primary brand color
  size = 20,
  showOnHover = false,
  trailLength = 5,
  className = '',
  zIndex = 9999
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(!showOnHover);
  const [trailPositions, setTrailPositions] = useState<Array<{ x: number, y: number }>>([]);
  
  const cursorAnimation = useAnimation();
  
  // Update mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Update trail positions (if using trail effect)
      if (type === 'trail') {
        setTrailPositions(prev => {
          const newPositions = [{ x: e.clientX, y: e.clientY }, ...prev.slice(0, trailLength - 1)];
          return newPositions;
        });
      }
    };
    
    const handleMouseEnter = () => {
      if (showOnHover) setIsVisible(true);
    };
    
    const handleMouseLeave = () => {
      if (showOnHover) setIsVisible(false);
    };
    
    const handleMouseDown = () => {
      // Animate cursor on click
      cursorAnimation.start({
        scale: 0.8,
        opacity: 0.8,
        transition: { duration: 0.1 }
      });
    };
    
    const handleMouseUp = () => {
      // Reset cursor animation
      cursorAnimation.start({
        scale: 1,
        opacity: 1,
        transition: { duration: 0.2 }
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseenter', handleMouseEnter);
    document.body.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [showOnHover, type, trailLength, cursorAnimation]);
  
  // Initialize trail positions
  useEffect(() => {
    if (type === 'trail') {
      const initialPositions = Array(trailLength).fill({ x: 0, y: 0 });
      setTrailPositions(initialPositions);
    }
  }, [type, trailLength]);
  
  if (!isVisible) return null;
  
  // Renders different cursor types
  const renderCursorContent = () => {
    switch (type) {
      case 'dot':
        return (
          <motion.div
            className={`rounded-full ${className}`}
            style={{
              position: 'fixed',
              left: mousePosition.x,
              top: mousePosition.y,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              pointerEvents: 'none',
              zIndex,
              mixBlendMode: 'difference',
              transform: 'translate(-50%, -50%)'
            }}
            animate={cursorAnimation}
            initial={{ scale: 1, opacity: 1 }}
          />
        );
        
      case 'circle':
        return (
          <motion.div
            className={`rounded-full border-2 ${className}`}
            style={{
              position: 'fixed',
              left: mousePosition.x,
              top: mousePosition.y,
              width: `${size}px`,
              height: `${size}px`,
              borderColor: color,
              backgroundColor: 'transparent',
              pointerEvents: 'none',
              zIndex,
              transform: 'translate(-50%, -50%)'
            }}
            animate={cursorAnimation}
            initial={{ scale: 1, opacity: 0.8 }}
          />
        );
        
      case 'gradient':
        return (
          <motion.div
            className={`rounded-full ${className}`}
            style={{
              position: 'fixed',
              left: mousePosition.x,
              top: mousePosition.y,
              width: `${size * 3}px`,
              height: `${size * 3}px`,
              background: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 70%)`,
              pointerEvents: 'none',
              zIndex,
              transform: 'translate(-50%, -50%)'
            }}
            animate={cursorAnimation}
            initial={{ scale: 1, opacity: 0.3 }}
          />
        );
        
      case 'pointer':
        return (
          <motion.div
            className={`${className}`}
            style={{
              position: 'fixed',
              left: mousePosition.x + 10,
              top: mousePosition.y + 10,
              color: color,
              fontSize: `${size}px`,
              pointerEvents: 'none',
              zIndex,
              transform: 'translate(0%, 0%)'
            }}
            animate={cursorAnimation}
            initial={{ scale: 1, opacity: 1 }}
          >
            ↖
          </motion.div>
        );
        
      case 'trail':
        return (
          <>
            {trailPositions.map((position, index) => (
              <motion.div
                key={index}
                className={`rounded-full ${className}`}
                style={{
                  position: 'fixed',
                  left: position.x,
                  top: position.y,
                  width: `${size - (index * (size / trailLength))}px`,
                  height: `${size - (index * (size / trailLength))}px`,
                  backgroundColor: color,
                  pointerEvents: 'none',
                  zIndex: zIndex - index,
                  opacity: 1 - (index / trailLength),
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))}
          </>
        );
        
      default:
        return null;
    }
  };
  
  return renderCursorContent();
};

export default CursorEffect;