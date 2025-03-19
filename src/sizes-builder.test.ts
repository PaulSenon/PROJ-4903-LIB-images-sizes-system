import { describe, it, expect } from 'vitest';
import { SizesBuilderImpl } from './sizes-builder';
import { createBreakpointRecord } from './sizes-system';

describe('SizesBuilder', () => {
  const breakpoints = createBreakpointRecord({
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  });

  describe('test without parent', () => {
    it('empty builder defaults to 100vw', () => {
      const builder = new SizesBuilderImpl({ breakpoints });
      expect(builder.toString()).toBe('100vw');
    });

    it('basic builder with no parent - (relative)', () => {
      const builder = new SizesBuilderImpl({ breakpoints })
        .at('sm', '100%')
        .at('lg', '50%')
        .max('33%');

      expect(builder.toString()).toBe(
        [
          `(max-width: ${breakpoints.sm}px) 100vw`,
          `(max-width: ${breakpoints.lg}px) 50vw`,
          '33vw',
        ].join(', '),
      );
    });

    it('basic builder with no parent - (absolute)', () => {
      const builder = new SizesBuilderImpl({ breakpoints })
        .at('sm', '150px')
        .at('lg', '250px')
        .max('400px');

      expect(builder.toString()).toBe(
        [
          `(max-width: ${breakpoints.sm}px) 150px`,
          `(max-width: ${breakpoints.lg}px) 250px`,
          '400px',
        ].join(', '),
      );
    });
  });

  describe('test with parent', () => {
    it('with parent context - (relative > relative)', () => {
      const parent = new SizesBuilderImpl({ breakpoints })
        .at('sm', '100%')
        .at('lg', '50%')
        .max('33%');

      const child = new SizesBuilderImpl({ breakpoints, parent })
        .at('sm', '40%')
        .at('md', '80%')
        .max('50%');

      expect(child.toString()).toBe(
        [
          // `(max-width: ${breakpoints.sm}px) 40vw`, // 40% of 100% // skipped because = next value
          `(max-width: ${breakpoints.md}px) 40vw`, // 80% of 50%
          `(max-width: ${breakpoints.lg}px) 25vw`, // 50% of 50%
          '17vw', // 50% of 33%
        ].join(', '),
      );

      expect(parent.toString()).toBe(
        [
          `(max-width: ${breakpoints.sm}px) 100vw`,
          `(max-width: ${breakpoints.lg}px) 50vw`,
          '33vw',
        ].join(', '),
      );
    });

    it('with parent context - (absolute > relative)', () => {
      const parent = new SizesBuilderImpl({ breakpoints })
        .at('sm', '150px')
        .at('lg', '250px')
        .max('400px');

      const child = new SizesBuilderImpl({ breakpoints, parent })
        .at('sm', '40%')
        .at('md', '80%')
        .max('50%');

      expect(child.toString()).toBe(
        [
          `(max-width: ${breakpoints.sm}px) 60px`, // 40% of 150px
          `(max-width: ${breakpoints.md}px) 200px`, // 80% of 250px
          `(max-width: ${breakpoints.lg}px) 125px`, // 50% of 250px
          '200px', // 50% of 400px
        ].join(', '),
      );

      expect(parent.toString()).toBe(
        [
          `(max-width: ${breakpoints.sm}px) 150px`,
          `(max-width: ${breakpoints.lg}px) 250px`,
          '400px',
        ].join(', '),
      );
    });

    it('with parent context - (absolute > absolute)', () => {
      const parent = new SizesBuilderImpl({ breakpoints })
        .at('sm', '150px')
        .at('lg', '250px')
        .max('400px');

      const child = new SizesBuilderImpl({ breakpoints, parent })
        .at('sm', '100px')
        .at('md', '200px')
        .max('300px');

      expect(child.toString()).toBe(
        [
          `(max-width: ${breakpoints.sm}px) 100px`, // 100px
          `(max-width: ${breakpoints.md}px) 200px`, // 200px
          '300px', // 300px
        ].join(', '),
      );

      expect(parent.toString()).toBe(
        [
          `(max-width: ${breakpoints.sm}px) 150px`,
          `(max-width: ${breakpoints.lg}px) 250px`,
          '400px',
        ].join(', '),
      );
    });

    it('with parent context - (relative > absolute)', () => {
      const parent = new SizesBuilderImpl({ breakpoints })
        .at('sm', '100%')
        .at('lg', '50%')
        .max('33%');

      const child = new SizesBuilderImpl({ breakpoints, parent })
        .at('sm', '100px')
        .at('md', '200px')
        .max('300px');

      expect(child.toString()).toBe(
        [
          `(max-width: ${breakpoints.sm}px) 100px`, // 100px
          `(max-width: ${breakpoints.md}px) 200px`, // 200px
          '300px', // 300px
        ].join(', '),
      );

      expect(parent.toString()).toBe(
        [
          `(max-width: ${breakpoints.sm}px) 100vw`,
          `(max-width: ${breakpoints.lg}px) 50vw`,
          '33vw',
        ].join(', '),
      );
    });

    it('with parent context - (mixed > mixed)', () => {
      const parent = new SizesBuilderImpl({ breakpoints })
        .at('sm', '100%')
        .at('md', '150px')
        .at('lg', '33%')
        .max('250px');

      const child = new SizesBuilderImpl({ breakpoints, parent })
        .at('md', '33%')
        .at('lg', '100px')
        .max('200px');

      expect(child.toString()).toBe(
        [
          `(max-width: ${breakpoints.sm}px) 33vw`, // 33% of 100%
          `(max-width: ${breakpoints.md}px) 50px`, // 33% of 150px
          `(max-width: ${breakpoints.lg}px) 100px`, // 100px (override)
          '200px', // 200px (override)
        ].join(', '),
      );

      expect(parent.toString()).toBe(
        [
          `(max-width: ${breakpoints.sm}px) 100vw`,
          `(max-width: ${breakpoints.md}px) 150px`,
          `(max-width: ${breakpoints.lg}px) 33vw`,
          '250px',
        ].join(', '),
      );
    });
  });

  describe('real world examples', () => {
    it('layout relative > container grid > item', () => {
      const layoutSizes = new SizesBuilderImpl({ breakpoints })
        .at('md', '100%') // full width on up to medium screens
        .at('lg', '80%') // 80% width on large screens
        .max('820px'); // max 820px beyond large screens

      const gridContainerSizes = new SizesBuilderImpl({ breakpoints, parent: layoutSizes })
        .at('sm', '100%') // 1 column 100% width on small screens
        .at('md', '90%') // 1 column 90% width on up to medium screens
        .at('lg', '50%') // 2 columns 50% width on large screens
        .max('33%'); // 3 columns 33% width on large screens

      const gridItemSizes = new SizesBuilderImpl({ breakpoints, parent: gridContainerSizes })
        .at('sm', '25%') // 25% of container width on small screens
        .max('33%'); // 33% for everything else

      expect(gridItemSizes.toString()).toBe(
        [
          `(max-width: ${breakpoints.sm}px) 25vw`, // 25% of 100% of 100%
          `(max-width: ${breakpoints.md}px) 30vw`, // 33% of 90% of 100%
          `(max-width: ${breakpoints.lg}px) 13vw`, // 33% of 50% of 80%
          '89px', // 33% of 33% of 820px
        ].join(', '),
      );

      expect(gridContainerSizes.toString()).toBe(
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
});
