# Web Style Guide - Unified Design System

A flexible design system for creating cohesive web experiences with a modern, professional aesthetic.

## Core Design Philosophy

### Visual Language
- **Clean & Spacious**: Generous whitespace, clear hierarchy
- **Depth Through Shadows**: Soft, layered shadows instead of borders
- **Emphasis Through Contrast**: Mix regular and italic text, bold key phrases
- **Gradient Accents**: Purple-to-magenta gradients for energy and movement

## Typography

### Font System
```css
/* Primary Stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

/* Character Fonts */
Sans-serif: Manrope, Poppins
Serif: STIX Two Text, Cormorant Garamond
Display: Tiempos, Bitter
```

### Type Scale
```css
/* Size Ratios */
--text-xs: 0.75rem   /* 12px - metadata */
--text-sm: 0.9rem    /* 14px - captions */
--text-base: 1rem    /* 16px - base */
--text-lg: 1.1rem    /* 18px - body */
--text-xl: 1.5rem    /* 24px - subheadings */
--text-2xl: 2rem     /* 32px - headings */
--text-3xl: 2.5rem   /* 40px - hero */
```

### Text Styling Rules
- **Emphasis**: Use italics for key concepts, not bold
- **Line Height**: 150% for body text, 120% for headings  
- **Letter Spacing**: Default, except -0.02em for large headings
- **Mixed Styles**: Combine regular and italic within sentences for rhythm
- **Tone**: Prefer lowercase, conversational style ("the residency" not "The Residency")
- **Key Text Size**: 24px (1.5rem) with 150% line height for important body content

## Color System

### Base Palette
```css
/* Backgrounds */
--bg-primary: #FFFFFF
--bg-light: #FAFAFA
--bg-section: #F8F9FA

/* Text */
--text-primary: #2D3748
--text-secondary: #4A5568
--text-muted: #718096
--text-inverse: #FFFFFF

/* Borders & Dividers */
--border-light: #F0F0F0
--border-medium: #E2E8F0
--border-focus: #4A5568

/* Accents */
--accent-primary: #4A5568
--accent-secondary: #2D3748
```

### Color Philosophy
- **Muted Sophistication**: Use gray-based palette with NO bright blues or purples
- **Clean Minimalism**: Pure white backgrounds with subtle gray accents
- **High Contrast Text**: Ensure readability with darker text colors
- **Subtle Interactions**: Muted focus states and hover effects using gray tones only

### Usage Patterns
- White cards on white backgrounds
- Light gray backgrounds for input fields  
- Gray accents for interactive elements (NO purple/blue)
- Subtle borders only where necessary
- **Section Alternation**: Alternate between white and light gray (#F8F9FA) section backgrounds
- **Major Section Spacing**: 100px vertical spacing between major content blocks

## Spatial Design

### Spacing Scale
```css
--space-xs: 8px
--space-sm: 12px
--space-md: 20px
--space-lg: 30px
--space-xl: 40px
--space-2xl: 60px
--space-3xl: 100px
```

### Container Strategy
```css
/* Content Widths */
--width-narrow: 600px  /* Forms, focused content */
--width-medium: 800px  /* Articles, main content */
--width-wide: 1200px   /* Full layouts */

/* Padding Pattern */
--padding-mobile: 20px
--padding-desktop: 40px
```

## Visual Effects

### Shadow System
```css
/* Elevation Levels */
--shadow-sm: 0 2px 4px rgba(0,0,0,0.05)
--shadow-md: 0 10px 20px rgba(0,0,0,0.1)
--shadow-lg: 0 20px 60px rgba(0,0,0,0.15)
--shadow-xl: 0 30px 80px rgba(0,0,0,0.2)

/* Colored Shadows */
--shadow-purple: 0 10px 20px rgba(102, 126, 234, 0.3)
```

### Border Radius
```css
--radius-sm: 4px   /* Small elements */
--radius-md: 8px   /* Buttons, inputs */
--radius-lg: 16px  /* Cards, containers */
--radius-xl: 24px  /* Hero sections */
```

### Interactive Elements
- Clean, minimal button styling with solid colors
- Simple hover effects (subtle darkening, no gradients)
- Text-based CTAs with underlines
- Minimal visual effects throughout

## Interactive Patterns

### State Transitions
```css
/* Universal Transition */
transition: all 0.3s ease;

/* Specific Transitions */
--transition-fast: 0.15s ease
--transition-normal: 0.3s ease
--transition-slow: 0.6s ease-out
```

### Hover Behaviors
```css
/* Elevation */
transform: translateY(-2px);
box-shadow: [increased shadow];

/* Color Shift */
opacity: 0.9;
background: [slightly darker];

/* Reveal */
opacity: 0 → 1;
transform: scale(0.95) → scale(1);
```

### Focus States
- 2px gray border (#2D3748)
- Subtle shadow increase
- No color tints, maintain gray theme

## Layout Principles

### Grid Structure
```css
/* Flexible Grid */
display: grid;
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
gap: var(--space-lg);
```

### Flexbox Patterns
```css
/* Common Patterns */
.centered { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}

.space-between { 
  display: flex; 
  justify-content: space-between; 
}

.stack { 
  display: flex; 
  flex-direction: column; 
  gap: var(--space-md); 
}
```

### Content Blocks
- Clear visual hierarchy
- Generous internal padding
- Consistent spacing between sections
- Alternating layouts for visual interest

## Component Architecture

### Universal Card Pattern
```css
background: white;
border-radius: var(--radius-lg);
padding: var(--space-xl);
box-shadow: var(--shadow-lg);
```

### Button Hierarchy
1. **Primary**: Dark gray (#4A5568) background, white text, minimal styling
2. **Secondary**: Light gray background, dark text  
3. **Ghost**: Transparent with border
4. **Text**: No background, just text with underline on hover

### Form Elements
- Consistent height (44-48px)
- Rounded corners (8px)
- 2px borders that change on focus
- Generous padding (12px horizontal)

### Content Sections
- Clear heading + body structure
- **Italic Emphasis Pattern**: Mix regular and italic text within headings and body text
- Supporting text in muted colors
- Visual anchors (icons, images, gradients)
- **Typography Hierarchy**: 
  - Hero: 2.5rem (40px) with italic spans
  - Section Headers: 2rem (32px) with italic emphasis
  - Body Important: 1.5rem (24px) at 150% line height
  - Body Regular: 1.1rem (18px) at 150% line height

## Motion Guidelines

### Animation Principles
- **Purpose**: Only animate to enhance understanding
- **Performance**: Use transform and opacity
- **Subtlety**: Small movements (2-4px) 
- **Consistency**: Same easing throughout

### Common Animations
```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

## Responsive Strategy

### Breakpoint System
```css
--mobile: 640px
--tablet: 768px
--desktop: 1024px
--wide: 1280px
```

### Scaling Rules
- **Typography**: Scale down 10-20% on mobile
- **Spacing**: Reduce by 25-40% on mobile
- **Columns**: Stack vertically below tablet
- **Images**: Full width on mobile, constrained on desktop

## Application Examples

### Data Display
- White cards with subtle shadows
- Clear headers with italic emphasis
- Generous padding around content
- Hover states for interactive rows

### Navigation
- Clean horizontal bar on desktop
- Hamburger menu on mobile
- Active states with gradient underline
- Smooth transitions between states

### Forms & Inputs
- Grouped in white cards
- Labels above inputs
- Hint text in muted gray
- Error states in red with icon

### Content Presentation
- Hero sections with gradient backgrounds
- Article text in constrained width
- Pull quotes in larger, italic text
- Images with rounded corners

## Implementation Checklist

- [ ] Define CSS variables for all values
- [ ] Set up responsive font scaling
- [ ] Create reusable component classes
- [ ] Test color contrast for accessibility
- [ ] Implement focus states for keyboard nav
- [ ] Add transition animations
- [ ] Optimize for performance
- [ ] Validate across devices

This system provides a cohesive visual language that can be applied to any content while maintaining consistency and professional polish.