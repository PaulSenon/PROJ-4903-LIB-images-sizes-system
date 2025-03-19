import { BreakpointRecord, SizesBuilder, SizeValue, Percentage, Pixels } from './types';

type SizesEntryAbsolute = {
  type: 'absolute';
  value: number;
};
type SizesEntryRelative = {
  type: 'relative';
  value: number;
};

type SizesEntry = SizesEntryAbsolute | SizesEntryRelative;
type SizesRecordBase = {
  max: SizesEntry;
};
type SizesRecord<BP extends BreakpointRecord> = SizesRecordBase & {
  [key in keyof BP]?: SizesEntry;
};

const DEFAULT_MAX_SIZE: SizesEntry = { type: 'relative', value: 100 };

type SizesBuilderParams<BP extends BreakpointRecord> = {
  breakpoints: BP;
  parent?: Partial<SizesBuilderImpl<BP>>;
};

export class SizesBuilderImpl<BP extends BreakpointRecord> implements SizesBuilder<BP> {
  private readonly parent?: SizesBuilderImpl<BP>;
  private readonly breakpoints: BP;
  private readonly breakpointsAscendingKeyOrdered: (keyof BP)[];
  private readonly sizes: SizesRecord<BP> = { max: DEFAULT_MAX_SIZE };

  constructor({ breakpoints, parent }: SizesBuilderParams<BP>) {
    this.breakpoints = breakpoints;
    this.parent = parent as SizesBuilderImpl<BP>;
    this.breakpointsAscendingKeyOrdered = getBreakpointAscendingKeyOrderedRecord(breakpoints);
  }

  at<K extends keyof BP>(breakpoint: K, size: SizeValue): SizesBuilder<Omit<BP, K>> {
    const sizesEntry = parseSizeValue(size);
    // weird type issue... TODO: fix
    this.sizes[breakpoint] = sizesEntry as SizesRecord<BP>[K];
    return this;
  }

  max(size: SizeValue): Omit<SizesBuilder<BP>, 'max' | 'at'> {
    const sizesEntry = parseSizeValue(size);
    this.sizes.max = sizesEntry;
    return this;
  }

  protected getSize<T extends keyof BP | 'max'>(breakpoint: T): SizesRecord<BP>[T] {
    return this.sizes[breakpoint];
  }

  protected getSizeOrAbove<T extends keyof BP | 'max'>(breakpoint: T): SizesEntry {
    if (breakpoint === 'max') {
      return this.sizes.max;
    }

    const indexOfSize = this.breakpointsAscendingKeyOrdered.indexOf(breakpoint);

    // edge case: breakpoint not found
    if (indexOfSize === -1) {
      throw new Error(`Critical error: Breakpoint not found: ${breakpoint.toString()}`);
    }

    // recursion break when all bigger breakpoints are checked
    if (indexOfSize === this.breakpointsAscendingKeyOrdered.length - 1) {
      return this.getSize('max');
    }

    // otherwise we get the size of the current breakpoint
    const key = this.breakpointsAscendingKeyOrdered[indexOfSize];
    const size = this.sizes[key];
    if (size) return size;

    // if not found, we get the above size
    return this.getSizeOrAbove(this.breakpointsAscendingKeyOrdered[indexOfSize + 1]);
  }

  protected getComputedSize(breakpoint: keyof BP | 'max'): SizesEntry {
    const parentSize = this.parent?.getSizeOrAbove(breakpoint) ?? DEFAULT_MAX_SIZE;
    const childSize = this.getSizeOrAbove(breakpoint);
    if (!this.parent) return computeSize({ parentSize, childSize });
    return computeSize({
      parentSize: this.parent.getComputedSize(breakpoint),
      childSize,
    });
  }

  toString(): string {
    const sizes: {
      breakpointValue: number | 'max';
      sizeEntry: SizesEntry;
    }[] = [];

    for (const breakpoint of this.breakpointsAscendingKeyOrdered) {
      console.log('breakpoint', breakpoint);
      const breakpointValue = this.breakpoints[breakpoint];
      console.log('breakpointValue', breakpointValue);
      const computedSize = this.getComputedSize(breakpoint);
      console.log('computedSize', computedSize);
      sizes.push({
        breakpointValue,
        sizeEntry: computedSize,
      });
    }

    const computedMaxSize = this.getComputedSize('max');
    console.log('adding max size', computedMaxSize);

    sizes.push({
      breakpointValue: 'max',
      sizeEntry: computedMaxSize,
    });

    console.log('sizes', sizes);

    // collapse same breakpoint values
    const collapsedSizes: {
      breakpointValue: number | 'max';
      sizeEntry: SizesEntry;
    }[] = [];
    // if the previous size entry has the same value & type, we merge them into the last breakpoint value
    for (let index = 0; index < sizes.length; index++) {
      const currentSize = sizes[index];
      if (index === 0 || collapsedSizes.length < 1) {
        collapsedSizes.push(currentSize);
        continue;
      }

      const previousSize = collapsedSizes[collapsedSizes.length - 1];

      // if previous is same, we replace it's bp with the current one
      if (
        previousSize.sizeEntry.type === currentSize.sizeEntry.type &&
        previousSize.sizeEntry.value === currentSize.sizeEntry.value
      ) {
        previousSize.breakpointValue = currentSize.breakpointValue;
        continue;
      }

      // otherwise we add the current size to the collapsed sizes
      collapsedSizes.push(currentSize);
    }

    console.log('collapsedSizes', collapsedSizes);

    const sizeStringFragments = collapsedSizes.map(getSizeStringFragment);

    return sizeStringFragments.join(', ');
  }
}

function computeSize({
  parentSize,
  childSize,
}: {
  parentSize: SizesEntry;
  childSize: SizesEntry;
}): SizesEntry {
  // absolute children override parent size
  if (childSize.type === 'absolute') {
    console.log('childSize is absolute => override');
    return childSize;
  }

  // otherwise (childSize is relative) we process the new value, keeping the parent unit.
  const computedSize = {
    type: parentSize.type,
    value: parentSize.value * (childSize.value / 100),
  };
  console.log('details', `parentSize: ${parentSize.value} * ${childSize.value / 100}`);
  return computedSize;
}

function stringifySizeEntry(sizeEntry: SizesEntry): string {
  const value = Math.round(sizeEntry.value);
  return sizeEntry.type === 'absolute' ? `${value}px` : `${value}vw`;
}

function getSizeStringFragment({
  breakpointValue,
  sizeEntry,
}: {
  breakpointValue: number | 'max';
  sizeEntry: SizesEntry;
}): string {
  if (breakpointValue === 'max') {
    return `${stringifySizeEntry(sizeEntry)}`;
  }

  return `(max-width: ${breakpointValue}px) ${stringifySizeEntry(sizeEntry)}`;
}

function getBreakpointAscendingKeyOrderedRecord<BP extends BreakpointRecord>(
  breakpoints: BP,
): (keyof BP)[] {
  return Object.keys(breakpoints).sort((a, b) => breakpoints[a] - breakpoints[b]);
}

function parseSizeValue(sizeString: SizeValue): SizesEntry {
  if (isPercentage(sizeString)) {
    const value = parseFloat(sizeString.replace('%', ''));
    return { type: 'relative', value };
  } else if (isPixels(sizeString)) {
    const value = parseFloat(sizeString.replace('px', ''));
    return { type: 'absolute', value };
  } else {
    throw new Error(`Invalid size value: ${sizeString}`);
  }
}

function isPercentage(size: SizeValue): size is Percentage {
  return typeof size === 'string' && size.endsWith('%');
}

function isPixels(size: SizeValue): size is Pixels {
  return typeof size === 'string' && size.endsWith('px');
}
