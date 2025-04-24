import { ReactNode, useEffect } from 'react';
import { hexToRgb } from '@/lib/color-utils';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    // Initialize RGB variables from theme - this could be fetched from API or config
    // For now, we'll use a default primary color
    const primaryColor = 'hsl(14, 100%, 57%)'; // Same as in theme.json
    
    // Convert HSL or hex to RGB
    if (primaryColor.startsWith('hsl')) {
      // For HSL colors, we'll use a temporary element to get computed style
      const tempEl = document.createElement('div');
      tempEl.style.color = primaryColor;
      document.body.appendChild(tempEl);
      const computedColor = getComputedStyle(tempEl).color;
      document.body.removeChild(tempEl);
      
      // Parse RGB values from computed style (format: "rgb(r, g, b)")
      const rgbMatch = computedColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (rgbMatch) {
        const [_, r, g, b] = rgbMatch;
        document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
      }
    } else if (primaryColor.startsWith('#')) {
      // For hex colors, use our utility function
      const rgb = hexToRgb(primaryColor);
      if (rgb) {
        document.documentElement.style.setProperty(
          '--primary-rgb', 
          `${rgb.r}, ${rgb.g}, ${rgb.b}`
        );
      }
    }
  }, []);

  return children;
}

export default ThemeProvider;