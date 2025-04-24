/**
 * Convert hex color string to RGB components
 * @param hex Hex color string (e.g., "#ff0000" or "#f00")
 * @returns Object with r, g, b values or undefined if invalid
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | undefined {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Handle shorthand hex (e.g., #f00 -> #ff0000)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(char => char + char)
      .join('');
  }
  
  // Validate hex format
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    console.warn('Invalid hex color format:', hex);
    return undefined;
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Update the CSS variable for primary color RGB values
 * @param hexColor Hex color string
 */
export function updatePrimaryRgb(hexColor: string): void {
  const rgb = hexToRgb(hexColor);
  if (rgb) {
    document.documentElement.style.setProperty(
      '--primary-rgb', 
      `${rgb.r}, ${rgb.g}, ${rgb.b}`
    );
  }
}

/**
 * Create an RGBA string from RGB components and alpha
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @param alpha Alpha channel (0-1)
 * @returns RGBA string (e.g., "rgba(255, 0, 0, 0.5)")
 */
export function rgbaString(r: number, g: number, b: number, alpha: number): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get RGBA string based on primary color and specified alpha
 * @param alpha Alpha channel (0-1)
 * @returns RGBA string using primary color
 */
export function primaryRgba(alpha: number): string {
  // For framer-motion animations, we need actual color values rather than CSS variables
  // Extract the RGB values from the computed style
  const rootStyles = getComputedStyle(document.documentElement);
  const primaryRgb = rootStyles.getPropertyValue('--primary-rgb').trim();
  
  if (primaryRgb) {
    return `rgba(${primaryRgb}, ${alpha})`;
  }
  
  // Fallback to our theme's primary orange if the CSS variable isn't available yet
  return `rgba(255, 91, 46, ${alpha})`;
}