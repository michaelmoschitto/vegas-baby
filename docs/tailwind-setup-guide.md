# Tailwind CSS Setup Guide for Next.js with Bun and Node 22

This guide covers how to set up Tailwind CSS v4 with Next.js using Bun as your package manager and Node.js 22.

## Prerequisites

- Node.js 22 installed (using asdf, nvm, or direct installation)
- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Next.js project initialized

## Installation Steps

### 1. Install Tailwind CSS and Dependencies

```bash
bun add -d tailwindcss @tailwindcss/postcss autoprefixer
```

**Important:** For Tailwind v4, you need `@tailwindcss/postcss` instead of the traditional PostCSS plugin.

### 2. Configure PostCSS

Create or update your `postcss.config.mjs` file:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

**Note:** Do NOT use the old configuration with separate `tailwindcss` and `autoprefixer` plugins for v4.

### 3. Create Your CSS File

Create or update `src/app/globals.css`:

```css
@import "tailwindcss";

/* Your custom styles here */
```

**Important:**

- Tailwind v4 uses CSS-first configuration
- No `tailwind.config.js` file is needed for basic usage
- Tailwind automatically detects your content files

### 4. Import CSS in Your Layout

In `src/app/layout.tsx` (App Router) or `pages/_app.tsx` (Pages Router):

```tsx
import "./globals.css";
```

### 5. Start Development Server

```bash
bun dev
```

## Common Issues and Solutions

### Issue 1: PostCSS Plugin Error

**Error:** "It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin..."

**Solution:** Install and use `@tailwindcss/postcss`:

```bash
bun add -d @tailwindcss/postcss
```

Update `postcss.config.mjs`:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### Issue 2: Tailwind Classes Not Working

**Symptoms:** Classes like `bg-red-500` have no effect

**Solutions:**

1. Clear Next.js cache:

   ```bash
   rm -rf .next
   ```

2. Ensure your CSS is imported in the root layout

3. Check that PostCSS is processing your CSS by inspecting the generated CSS file in DevTools

### Issue 3: Bun Compatibility Issues

**Symptoms:** Build errors or PostCSS not running

**Solutions:**

1. Ensure you have the latest version of Bun:

   ```bash
   bun upgrade
   ```

2. If issues persist, try running with Node.js as a comparison:
   ```bash
   npm run dev
   ```

### Issue 4: CSS Not Loading

**Symptoms:** No CSS file in Network tab or very small CSS file

**Solutions:**

1. Verify the import path in your layout file
2. Check for any build errors in the terminal
3. Ensure PostCSS config is in the project root

## Alternative: Using Tailwind CLI

If you encounter persistent issues with the PostCSS integration, you can use the Tailwind CLI as a workaround:

### 1. Create Input CSS

Create `tailwind-input.css`:

```css
@import "tailwindcss";
```

### 2. Generate CSS with CLI

```bash
npx tailwindcss -i ./tailwind-input.css -o ./public/tailwind-output.css --watch
```

### 3. Link in HTML

In your layout file, add:

```tsx
<link rel="stylesheet" href="/tailwind-output.css" />
```

## Testing Your Setup

Add this test element to verify Tailwind is working:

```tsx
<div className="bg-red-500 text-white p-8 text-4xl">
  If this is red, Tailwind is working!
</div>
```

## Project Structure

```
your-project/
├── src/
│   └── app/
│       ├── layout.tsx
│       └── globals.css
├── postcss.config.mjs
├── package.json
└── bun.lockb
```

## Key Differences in Tailwind v4

1. **CSS-first configuration** - No JavaScript config file needed
2. **Automatic content detection** - No need to specify content paths
3. **New PostCSS plugin** - Use `@tailwindcss/postcss`
4. **Improved performance** - Faster builds and smaller output

## Useful Commands

```bash
# Install dependencies
bun add -d tailwindcss @tailwindcss/postcss

# Clean install
rm -rf node_modules bun.lockb .next
bun install

# Run development server
bun dev

# Build for production
bun run build
```

## Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Bun Documentation](https://bun.sh/docs)

## Troubleshooting Checklist

- [ ] Correct PostCSS config with `@tailwindcss/postcss`
- [ ] CSS file imported in root layout
- [ ] No conflicting CSS imports
- [ ] `.next` cache cleared
- [ ] Dev server restarted
- [ ] No terminal errors
- [ ] CSS file loading in browser Network tab
- [ ] Test element showing with styles

If you follow these steps and still encounter issues, the problem may be specific to your environment or project configuration.
