import { describe, it, expect } from 'vitest';
import { createBreakpointRecord, createImageSizesSystem } from './sizes-system';

describe('SizesSystem', () => {
  const breakpoints = createBreakpointRecord({
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  });

  it('basic usage', () => {
    const sisesSystem = createImageSizesSystem(breakpoints);
    const sizes = sisesSystem.from().at('sm', '100%').at('lg', '50%').max('33%');

    expect(sizes.toString()).toBe(
      [
        `(max-width: ${breakpoints.sm}px) 100vw`,
        `(max-width: ${breakpoints.lg}px) 50vw`,
        '33vw',
      ].join(', '),
    );
  });

  it('realworld example', () => {
    const sizesSystem = createImageSizesSystem(breakpoints);
    const layoutSizes = sizesSystem
      .from()
      .at('md', '100%') // full width on up to medium screens
      .at('lg', '80%') // 80% width on large screens
      .max('820px'); // max 820px beyond large screens

    const containerSizes = sizesSystem
      .from(layoutSizes)
      .at('sm', '100%') // 1 column 100% width on small screens
      .at('md', '90%') // 1 column 90% width on up to medium screens
      .at('lg', '50%') // 2 columns 50% width on large screens
      .max('33%'); // 3 columns 33% width on large screens

    const itemSizes = sizesSystem
      .from(containerSizes)
      .at('sm', '25%') // 25% of container width on small screens
      .max('33%'); // 33% for everything else

    const anotherItem = sizesSystem
      .from(containerSizes)
      .at('sm', '50px')
      .at('md', '40%')
      .at('lg', '25%')
      .max('100px');

    expect(anotherItem.toString()).toBe(
      [
        `(max-width: ${breakpoints.sm}px) 50px`, // 50px (override)
        `(max-width: ${breakpoints.md}px) 36vw`, // 40% of 90% of 100%
        `(max-width: ${breakpoints.lg}px) 10vw`, // 25% of 50% of 80%
        '100px', // 100px (override)
      ].join(', '),
    );

    expect(itemSizes.toString()).toBe(
      [
        `(max-width: ${breakpoints.sm}px) 25vw`, // 25% of 100% of 100%
        `(max-width: ${breakpoints.md}px) 30vw`, // 33% of 90% of 100%
        `(max-width: ${breakpoints.lg}px) 13vw`, // 33% of 50% of 80%
        '89px', // 33% of 33% of 820px
      ].join(', '),
    );

    expect(containerSizes.toString()).toBe(
      [
        `(max-width: ${breakpoints.sm}px) 100vw`, // 100% of 100%
        `(max-width: ${breakpoints.md}px) 90vw`, // 90% of 100%
        `(max-width: ${breakpoints.lg}px) 40vw`, // 50% of 80%
        '271px', // 33% of 820px
      ].join(', '),
    );

    expect(layoutSizes.toString()).toBe(
      [
        `(max-width: ${breakpoints.md}px) 100vw`, // 100% of 100%
        `(max-width: ${breakpoints.lg}px) 80vw`, // 80% of 100%
        '820px', // 820px
      ].join(', '),
    );
  });
});
