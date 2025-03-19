# Tasks

* [ ] remove console log
* [ ] fix precommit hook (not triggered)
* [ ] find a way to enable mandatory pr-validation before merging (disabled because was not triggered on the release-please workflow)
* [ ] add a public method to get the json equivalent of sizes (for debugging)
* [ ] allow other absolute units (rem etc.)

* [ ] better api 2.0.0 => does not rely on breakpoints only !
Use cases:

```typescript
const sizesSystem = createSizesSystem({
  s: '200px',
  m: '400px',
  l: '600px',
});

// parent width until max-width
const sizesContext1 = sizesSystem
  .from()
  .base('100%') // or any relative unit
  .max("500px"); 
// (max-width: 500px) 100vw, 500px
// spec: base only allow relative units

// max really works as a cap when absolute units
const sizesContext2 = sizesSystem
  .from(sizesContext1)
  .at("s", "25%") // bp 200px -> 25% of 100% of 200px = 50px
  // virtual 500px breakpoint inferred from the parent max and = 
  // .at("500px", "50%") bp 500px -> 50% of 100% of 500px = 250px but capped at max (240px)
  .at("l", "50%") // bp 600px -> 50% of 100% of 600px = 300px but capped at max (240px)
  .max("240px"); // 240px

// processed:
// .at("s", "25%") -> (max-width: 200px) 25vw,
// .at("480px", "50%") -> (max-width: 480px) 50vw, !! we did / 50%
// .max("240px") -> 240px
// (max-width: 200px) 25vw, (max-width: 480px) 50vw, 240px

// allow absolute units
const sizesContext2 = sizesSystem
  .from()
  .at("250px", "25%")
  .at("500px", "50%") // 50% of 100% of 500px = 250px, > max, donc 240px/0.5 = 480px
  .max("240px");
// (max-width: 250px) 25vw, (max-width: 480px) 50vw, 240px
```
