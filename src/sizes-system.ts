import { SizesBuilderImpl } from './sizes-builder';
import { BreakpointRecord } from './types';

export class ImageSizesSystem<BP extends BreakpointRecord> {
  private readonly breakpoints: BP;

  constructor(breakpoints: BP) {
    this.breakpoints = breakpoints;
  }

  from(parent?: Partial<SizesBuilderImpl<BP>>): SizesBuilderImpl<BP> {
    return new SizesBuilderImpl({ breakpoints: this.breakpoints, parent });
  }
}

export function createImageSizesSystem<const BP extends BreakpointRecord>(breakpoints: BP) {
  return new ImageSizesSystem(breakpoints);
}

export function createBreakpointRecord<const BP extends BreakpointRecord>(breakpoints: BP): BP {
  return breakpoints;
}
