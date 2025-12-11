# Vegas Baby UI Design System

## Overview

This document outlines the UI/UX design system for Vegas Baby, focusing on the POS system and card activation interfaces. The design system follows a mobile-first approach with specific optimizations for desktop/tablet POS usage.

## Design Principles

- **Clarity First:** Clear visual hierarchy and intuitive interactions
- **Consistency:** Uniform patterns across all interfaces
- **Efficiency:** Optimized for quick transactions and card activations
- **Responsive:** Adapts seamlessly across device sizes
- **Accessible:** Follows WCAG guidelines for accessibility

## Color System

### Primary Colors

- **Rose Theme:**
  - Primary: `rose-600` (#E11D48) - Main actions, buttons
  - Hover: `rose-700` (#BE123C) - Interactive states
  - Light: `rose-200` (#FECDD3) - Accents, borders
  - Background: `rose-50` (#FFF1F2) - Subtle backgrounds

### Neutral Colors

- **Background:**
  - Light: `gray-50` (#F9FAFB) - Main background
  - White: `white` (#FFFFFF) - Card backgrounds
- **Borders:**
  - Light: `gray-200` (#E5E7EB) - Subtle borders
  - Medium: `gray-300` (#D1D5DB) - Active borders
- **Text:**
  - Primary: `gray-900` (#111827) - Main text
  - Secondary: `gray-600` (#4B5563) - Supporting text
  - Muted: `gray-500` (#6B7280) - Disabled text

## Typography

### Font Hierarchy

- **Headings:**
  - H1: `text-3xl font-bold` - Page titles
  - H2: `text-2xl font-semibold` - Section headers
  - H3: `text-xl font-medium` - Card titles
- **Body:**
  - Regular: `text-base` - Main content
  - Small: `text-sm` - Supporting text
  - XSmall: `text-xs` - Labels, metadata

### Font Weights

- Bold: 700 - Headings
- Semibold: 600 - Subheadings
- Medium: 500 - Labels
- Regular: 400 - Body text

## Component Patterns

### Cards

```tsx
<Card className="p-6">
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
</Card>
```

- Consistent padding: `p-6`
- Subtle shadow for depth
- Clear section headers
- Rounded corners: `rounded-lg`

### Buttons

```tsx
// Primary
<button className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">
  Primary Action
</button>

// Secondary
<button className="px-4 py-2 border border-rose-600 text-rose-600 rounded-lg hover:bg-rose-50">
  Secondary Action
</button>
```

- Consistent padding: `px-4 py-2`
- Rounded corners: `rounded-lg`
- Clear hover states
- Icon support (when needed)

### Form Elements

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700">Label</label>
  <input
    type="text"
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
  />
</div>
```

- Clear labels
- Consistent spacing
- Focus states with rose theme
- Error states (when needed)

## Layout System

### Grid System

- **Desktop (≥ 1024px):**
  - 12-column grid
  - Side-by-side layouts
  - Optimal for POS system
- **Tablet (≥ 768px):**
  - 8-column grid
  - Stacked layouts
  - Touch-optimized
- **Mobile (< 768px):**
  - 4-column grid
  - Single column layouts
  - Card activation focused

### Spacing

- **Base Unit:** 4px
- **Common Spacings:**
  - xs: 4px (1)
  - sm: 8px (2)
  - md: 16px (4)
  - lg: 24px (6)
  - xl: 32px (8)
  - 2xl: 48px (12)

## POS Interface

### Layout Structure

- **Header:**
  - Brand logo
  - Navigation
  - Vendor context
  - Quick actions
- **Main Content:**
  - Card input section (1/3)
  - Transaction section (2/3)
- **Responsive Behavior:**
  - Desktop: Side-by-side
  - Tablet: Stacked
  - Mobile: Not supported

### Card Input Section

- Prominent card input area
- Clear balance display
- Status indicators
- Error states

### Transaction Section

- Amount input
- Description field
- Quick amount buttons
- Process button
- Success/error states

## Card Activation Interface

### Mobile-First Design

- Full-width inputs
- Large touch targets
- Clear progress indicators
- Error handling
- Success confirmation

### Form Elements

- Card UID input
- Email input
- Mezo ID input
- Validation feedback
- Submit button

## Responsive Design

### Breakpoints

- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

### Device-Specific Optimizations

- **Desktop:**
  - Keyboard shortcuts
  - Hover states
  - Side-by-side layouts
- **Tablet:**
  - Touch targets
  - Stacked layouts
  - Collapsible navigation
- **Mobile:**
  - Large touch targets
  - Single column
  - Simplified navigation

## Future Enhancements

### UI Components

- Toast notifications
- Loading states
- Modal dialogs
- Dropdown menus
- Date pickers

### Features

- Dark mode support
- Keyboard shortcuts
- Transaction history
- Analytics dashboard
- Settings panel

### Accessibility

- Screen reader support
- Keyboard navigation
- High contrast mode
- Focus management
- ARIA labels

## Implementation Notes

### Tailwind Usage

- Use `@apply` sparingly
- Leverage existing utilities
- Maintain consistent class ordering
- Document custom utilities

### shadcn/ui Integration

- Use base components
- Customize with rose theme
- Maintain consistent props
- Document custom variants

### Performance

- Lazy load components
- Optimize images
- Minimize re-renders
- Use proper loading states

## Design Tokens

### Spacing

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

### Colors

```css
--color-primary: #e11d48;
--color-primary-hover: #be123c;
--color-primary-light: #fecdd3;
--color-background: #f9fafb;
```

### Typography

```css
--font-size-base: 16px;
--font-size-sm: 14px;
--font-size-lg: 18px;
--font-size-xl: 20px;
```

## Best Practices

### Component Development

1. Start with mobile layout
2. Add responsive breakpoints
3. Implement interactions
4. Add error states
5. Test accessibility

### Code Organization

1. Use consistent file structure
2. Document props and types
3. Include usage examples
4. Add component tests
5. Maintain changelog

### Performance

1. Optimize images
2. Lazy load components
3. Minimize re-renders
4. Use proper caching
5. Monitor bundle size
