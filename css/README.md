# CSS Modules

This folder contains the modular CSS architecture for the Weekly Update Dashboard, split by functionality for maintainability.

## Files

- **base.css** (113 lines) - Foundation styles
  - CSS custom properties (variables)
  - Global reset and typography
  - Basic layout components (container, hero, header)

- **form.css** (216 lines) - Form components and interactions
  - Question sections and form layout
  - Input fields and textareas
  - Button styles and states
  - Loading spinners and error messages

- **editor.css** (225 lines) - Editor.js integration and bullet styling
  - Bullet points section layout
  - Editor.js custom styling and overrides
  - Nested list hierarchies
  - Roam Research-style inline editing

- **animations.css** (88 lines) - Motion and responsive design
  - Keyframe animations (fadeIn, slideUp, slideDown, spin)
  - Responsive breakpoints for mobile devices
  - Micro-interactions and transitions

## Design System

The CSS uses a cohesive design system with:
- **Colors**: Muted grays with no bright blues/purples
- **Typography**: System font stack with semantic sizing
- **Spacing**: Consistent scale using CSS custom properties
- **Interactions**: Subtle hover states and smooth transitions

## Import Order

CSS files should be imported in this order in HTML:
1. base.css (variables and foundation)
2. form.css (form components)
3. editor.css (editor-specific styles)
4. animations.css (animations and responsive)