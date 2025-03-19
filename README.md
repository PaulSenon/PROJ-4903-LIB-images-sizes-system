# Image Sizes Processor

## Project Mindset

**For web developers who struggle with responsive images and HTML's `sizes` attribute.**

This library solves three core problems:

1. **Complex Syntax:** Writing `sizes` attributes manually is error-prone and hard to maintain.
2. **Responsive Layouts:** As components nest inside each other, calculating correct image sizes becomes mathematically complex.
3. **Type Safety:** Traditional string-based approaches lack type checking and developer tooling.

Use this library to compose responsive image sizes through your component hierarchy with a clean, chainable API. Perfect for modern component-based frameworks where parent layouts affect child image dimensions.

I hope browsers will soon support auto sizes attribute and I can deprecate this library. It's not perfect but way better than defining all your sizes by hand.

### Before

Usually you need to define the sizes attribute for each image. But if you have reused ResponsiveImage component, you will need to provide him manually the sizes attribute depending on the context. But if your image is inside a grid container, inside another container, inside a layout, etc. it becomes hard to manage and it becomes really error prone and hacky...

### After

Now for every responsive parent that might have a ResponsiveImage in their tree, you create a sizesContext that extends the parent sizesContext.
Then in each responsive component you simply extend the parent sizesContext describing ONLY the current component sizes behavior (without thinking of where it is in the tree). and you pass the new sizesContext to the child components. eventually it will reach a ResponsiveImage were you will just be able to unwrap the whole sizes string computed from the whole tree context.

e.g. Let's say you have:

* a base layout that is full width up to medium screens, 80% width on large screens, and a max width of 820px.
* a grid container that is 1 column on small screens, 2 columns on medium screens, 3 columns on large screens.
* an image component that is 25% of the container width on small screens, and 33% of the container width on large screens.

```tsx
// You create one sizesSystem for the whole app, based on your breakpoints
const sizesSystem = createImageSizesSystem({
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
});

// in your layout component you will create an initial sizesContext
const layoutSizesContext = sizesSystem
  .from() // start from the root === the viewport = 100vw
  // note that you can omit the some breakpoints. It will always calculate from the bigger defined breakpoint. up to 'max' that is a mandatory default value. In that case "sm" will have the value of "md" (100%)
  .at('md', '100%') // full width on up to medium screens breakpoint
  .at('lg', '80%') // 80% width up to large screens breakpoint
  // note that you can omit the some breakpoints. It will always calculate from the bigger defined breakpoint. up to 'max' that is a mandatory default value. In that case "xl" will have the value of "max" (820px)
  .max('820px'); // 820px beyond large screens breakpoint

// in your grid container component you will create a new sizesContext that extends the parent layoutSizesContext and only describe the current component responsive behavior
const gridSizesContext = sizesSystem
  .from(layoutSizesContext) // inherit from the parent layoutSizesContext
  .at('sm', '100%') // 100% of parent context width up to small screens breakpoint
  .at('md', '90%') // 90% of parent context width up to medium screens breakpoint
  .at('lg', '50%') // 50% of parent context width up to large screens breakpoint
  .max('33%'); // 33% of parent context width for everything else (beyond large screens)

// in your grid item component you will create a new sizesContext that extends the parent gridSizesContext and only describe the current component responsive behavior
const gridItemSizesContext = sizesSystem
  .from(gridSizesContext) // inherit from the parent gridSizesContext
  .at('sm', '25%') // 25% of parent context width up to small screens breakpoint
  .max('33%'); // 33% of parent context width for everything else (beyond large screens)

// in you responsive image component you will simply unwrap the whole sizes string computed from the whole tree context without caring about what it is.
return <img 
  sizes={gridItemSizesContext.toString()} 
  srcset={srcset} 
  src={src} 
  alt={alt} 
/>
```

Given this, anytime you change the responsive behavior of a component, you will only need to update the sizesContext of the current component and it will automatically compute the correct sizes for the whole tree.

You still have to update this manually as I don't have the skill to build something that could infer it from your css. But who knows maybe one day lol

## Installation

```bash
npm install image-sizes
# or with yarn
yarn add image-sizes
# or with pnpm
pnpm add image-sizes
```

## Basic Usage

```typescript
import { createImageSizesSystem } from 'image-sizes';

// Configure with your breakpoints
const sizesSystem = createImageSizesSystem({
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
});

// Create a sizes attribute
const sizes = sizesSystem.from().at('sm', '100%').at('lg', '50%').max('33%');

// Use in your HTML or component
// <img
//   sizes={sizes.toString()}
//   srcset="..."
// />

// Output: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
```

## Component Composition

The library shines when composing responsive sizes through nested components:

```typescript
// Using React as an example
import { createImageSizesSystem } from 'image-sizes'
import React from 'react'

const sizesSystem = createImageSizesSystem({
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
})

// Layout component
function Layout({ children }) {
  // Layout is full width on medium screens, 80% on large screens, max 820px
  const layoutSizes = sizesSystem
    .from()
    .at('md', '100%')
    .at('lg', '80%')
    .max('820px')

  return (
    <div className="layout">
      {/* Pass sizes down to children */}
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { sizesContext: layoutSizes })
      )}
    </div>
  )
}

// Container component
function Container({ sizesContext, children }) {
  const containerSizes = sizesSystem
    .from(sizesContext)
    .at('sm', '100%')  // 1 column on small screens
    .at('md', '90%')   // 1 column, slightly narrower on medium
    .at('lg', '50%')   // 2 columns on large screens
    .max('33%')        // 3 columns 33% width on large screens

  return (
    <div className="container">
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { sizesContext: containerSizes })
      )}
    </div>
  )
}

// Image component
function Image({ sizesContext, src, alt }) {
  const imageSizes = sizesSystem
    .from(sizesContext)
    .at('sm', '25%')  // 25% of container width on small screens
    .max('33%')       // 33% for everything else

  return (
    <img
      src={src}
      alt={alt}
      sizes={imageSizes.toString()}
      srcSet={`...`}
    />
  )
}

// Usage
function App() {
  return (
    <Layout>
      <Container>
        <Image src="/example.jpg" alt="Example" />
      </Container>
    </Layout>
  )
}

// The resulting sizes attribute for the image will be:
// "(max-width: 640px) 25vw, (max-width: 768px) 30vw, (max-width: 1024px) 13vw, 89px"
```

## Real-world Example

Here's how the system calculates sizes when components are composed:

```typescript
const sizesSystem = createImageSizesSystem({
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
});

// Layout level
const layoutSizes = sizesSystem
  .from()
  .at('md', '100%') // full width on up to medium screens
  .at('lg', '80%') // 80% width on large screens
  .max('820px'); // max 820px beyond large screens

// Container level
const containerSizes = sizesSystem
  .from(layoutSizes)
  .at('sm', '100%') // 1 column 100% width on small screens
  .at('md', '90%') // 1 column 90% width on up to medium screens
  .at('lg', '50%') // 2 columns 50% width on large screens
  .max('33%'); // 3 columns 33% width on large screens

// Item level
const itemSizes = sizesSystem
  .from(containerSizes)
  .at('sm', '25%') // 25% of container width on small screens
  .max('33%'); // 33% for everything else

// The final sizes attribute will be:
// "(max-width: 640px) 25vw, (max-width: 768px) 30vw, (max-width: 1024px) 13vw, 89px"
//
// Where:
// - On small screens: 25% of 100% of 100% = 25vw
// - On medium screens: 33% of 90% of 100% = 30vw
// - On large screens: 33% of 50% of 80% = 13vw
// - On xlarge screens: 33% of 33% of 820px = 89px
```

You can also use absolute values (pixels) at any level:

```typescript
// Fixed-width item
const fixedItem = sizesSystem
  .from(containerSizes)
  .at('sm', '50px') // Fixed 50px width on small screens
  .at('md', '40%') // 40% of container on medium screens
  .at('lg', '25%') // 25% of container on large screens
  .max('100px'); // Fixed 100px width on xlarge screens

// Outputs: "(max-width: 640px) 50px, (max-width: 768px) 36vw, (max-width: 1024px) 10vw, 100px"
```

## API Reference

### `createImageSizesSystem(breakpoints)`

Creates a new image sizes system with custom breakpoints.

```typescript
const sizesSystem = createImageSizesSystem({
  sm: 640, // 640px
  md: 768, // 768px
  lg: 1024, // 1024px
  xl: 1280, // 1280px
});
```

### `sizesSystem.from(parent?)`

Creates a new sizes builder, optionally inheriting from a parent context.

```typescript
// Create a root sizes builder
const rootSizes = sizesSystem.from();

// Create a sizes builder that inherits from a parent
const childSizes = sizesSystem.from(parentSizes);
```

### `at(breakpoint, size)`

Defines a size for a specific breakpoint. Size can be a percentage or pixel value.

```typescript
// For screens up to 'sm' breakpoint, use 100% width
const builder = sizesSystem.from().at('sm', '100%');

// For screens up to 'lg' breakpoint, use 500px width
const builder = sizesSystem.from().at('lg', '500px');
```

### `max(size)`

Sets the default size for screens larger than all specified breakpoints.
(default size is `100%`)

```typescript
// For screens larger than all specified breakpoints, use 50% width
const builder = sizesSystem.from().at('sm', '100%').max('50%');

// For screens larger than all specified breakpoints, use 800px width
const builder = sizesSystem.from().at('lg', '75%').max('800px');
```

### `toString()`

Converts the builder to an HTML sizes attribute string.

```typescript
const sizesString = sizesSystem.from().at('sm', '100%').at('md', '50%').max('33%').toString();
// "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
```

## How the System Works

The system calculates sizes based on composition:

1. **Percentage Composition**: When a child specifies a percentage size and its parent also has a percentage size, the resulting size is a multiplication of both percentages.

   Example: If a parent container is `90%` width and a child element is `50%` width of that container, the final size is `45%` (90% × 50%) of the viewport width.

2. **Fixed Size Overrides**: When a child specifies a fixed pixel size, it overrides any percentage-based calculations.

   Example: If a child specifies `100px`, it will be `100px` regardless of parent container sizes.

3. **Percentage of Fixed**: When a parent has a fixed size and a child has a percentage, the system calculates the exact pixel value.

   Example: If a parent container is `800px` and a child element is `25%` width of that container, the final size is `200px`.

## Development

This project uses Docker for development. To get started:

```bash
# Clone the repository
git clone https://github.com/yourusername/image-sizes.git
cd image-sizes

# Build the Docker container
make docker-build

# Install dependencies
make install

# Run development mode
make dev

# Run tests
make test
```

For a complete step-by-step development workflow from local coding to npm publication, see [RELEASE.md](RELEASE.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes using conventional commits format: `make commit`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Conventional Commits

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification to automate versioning and changelog generation. When making changes, use the `make commit` command which will guide you through creating a properly formatted commit message.

Common commit types:

* `feat`: A new feature (triggers a minor version bump)
* `fix`: A bug fix (triggers a patch version bump)
* `docs`: Documentation changes
* `style`: Code style changes (formatting, etc.)
* `refactor`: Code changes that neither fix bugs nor add features
* `test`: Adding or updating tests
* `chore`: Changes to the build process or auxiliary tools

Adding `BREAKING CHANGE:` to the footer of your commit message will trigger a major version bump when the PR is merged.

Please make sure your code passes all tests and linting before submitting a PR.

## Releasing

For maintainers, please see [RELEASE.md](RELEASE.md) for instructions on how to create releases and publish to npm.

## License

MIT
