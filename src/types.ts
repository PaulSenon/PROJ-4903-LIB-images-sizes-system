/**
 * Type for percentage values using template literals
 * @example '50%', '100%', '33.33%'
 */
export type Percentage = `${number}%`;

/**
 * Type for pixel values using template literals
 * @example '100px', '200px', '1200px'
 */
export type Pixels = `${number}px`;

/**
 * Union type for valid size values
 */
export type SizeValue = Percentage | Pixels;

/**
 * Type for a record of breakpoint names and their values
 */
export type BreakpointRecord = Record<string, number>;

/**
 * Internal type for parsed size values
 */
export interface ParsedSize {
  value: number;
  unit: 'absolute' | 'relative';
}

/**
 * Combined builder interface - represents the full API
 */
export interface SizesBuilder<BP extends BreakpointRecord> {
  at<K extends keyof BP>(breakpoint: K, size: SizeValue): SizesBuilder<BP>;
  max(size: SizeValue): SizesBuilder<BP>;
  toString(): string;
}
