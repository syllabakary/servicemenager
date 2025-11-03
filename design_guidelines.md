# Design Guidelines: Local Services Website

## Design Approach
**Reference-Based Approach**: Inspired by Azaé.com's professional service platform aesthetic, modernized with fluid interactions and contemporary web patterns. Focus on building trust and simplicity while maintaining a warm, approachable character.

## Core Design Principles
1. **Professional Confidence**: Clean layouts that inspire trust in service quality
2. **Accessible Simplicity**: Clear information hierarchy for easy navigation
3. **Warm Modernism**: Contemporary design with human touch

## Typography
**Font Family**: Poppins (primary) or Inter as fallback
- **Hero Headlines**: 4xl to 6xl, font-bold (600-700)
- **Section Titles**: 3xl to 4xl, font-semibold (600)
- **Card Titles**: xl to 2xl, font-medium (500)
- **Body Text**: base to lg, font-normal (400)
- **Captions/Meta**: sm, font-light (300)

## Layout System
**Spacing Units**: Tailwind units of 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- **Section Padding**: py-16 md:py-24 lg:py-32
- **Card Padding**: p-6 md:p-8
- **Element Gaps**: gap-6 md:gap-8 lg:gap-12
- **Container**: max-w-7xl mx-auto px-4 md:px-6 lg:px-8

## Color Palette
**Primary**: Blue #2A63F5 (trust, professionalism)
**Neutrals**: White (dominant), soft grays (#F8F9FA, #E9ECEF, #6C757D)
**Accent**: Lighter blue shades for hover states
**Text**: Dark gray (#212529) for primary, medium gray (#6C757D) for secondary

## Component Library

### Navigation
- Fixed top navigation with subtle shadow on scroll
- Logo left, navigation links center/right, CTA button (blue background, white text)
- Mobile: Hamburger menu with smooth slide-in drawer

### Hero Section
**Layout**: Full-width, centered content with large hero image background
- **Image**: Professional service scene (cleaning, caregiving) with blue overlay (opacity-20)
- Headline + subheadline + dual CTA buttons (primary: solid blue, secondary: outline)
- Height: min-h-[600px] md:min-h-[700px]
- **Buttons on Image**: Use backdrop-blur-sm with bg-white/90 or bg-blue-600/90

### Service Cards
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Card: white background, rounded-xl, p-6, shadow-sm
- Icon: Lucide icon in circle (64px), light blue background
- Title (xl, semibold) + Description (base, gray)
- "Découvrir" link with arrow icon
- **Hover**: Subtle lift (translate-y-1), enhanced shadow

### Agency Cards
- Similar grid structure to service cards
- Includes agency image (rounded-lg, aspect-video)
- City badge + service tags (pill-shaped, light blue background)
- CTA button: "Voir détails"

### Search & Filter Bar
- Sticky position below hero
- White background with shadow-md
- Search input + city dropdown + service filter
- Rounded-lg inputs with blue focus rings

### Quote Request Form
- Modal overlay (backdrop-blur-md bg-black/50)
- Centered white card (max-w-lg, rounded-2xl, p-8)
- Form fields: name, email, service dropdown, message textarea
- Submit button: full-width, blue, with loading state
- **Toast Notification**: Top-right corner, slide-in animation, green success or red error

### Agency Detail Page
- Two-column layout (lg:grid-cols-3)
- Left: Agency image + info card (sticky)
- Right: Description, services list, hours, location
- Quote CTA button (sticky bottom on mobile)

### Footer
- Dark section (bg-gray-900, white text)
- Multi-column layout: About, Services, Contact, Social
- Newsletter signup form
- Bottom bar with copyright and legal links

## Micro-Interactions
**Hover States**:
- Cards: -translate-y-1 shadow-lg transition-all duration-300
- Buttons: Slight scale (scale-105) + brightness increase
- Links: Underline animation (from-left)

**Page Transitions**: Framer Motion fade-in with stagger for card grids

**Scroll Animations**: 
- Fade-in on scroll for sections (opacity-0 to opacity-100)
- Stagger children by 100ms for card grids

**Form Interactions**:
- Input focus: Blue ring (ring-2 ring-blue-500)
- Submit: Loading spinner inside button
- Success: Toast from top-right with checkmark icon

## Images
**Hero Image**: Large, professional photograph showing service workers (cleaning staff, caregiver with elderly person, or gardener) in action. Image should convey warmth and professionalism. Use subtle blue overlay for brand consistency and text readability.

**Agency Images**: Real or high-quality stock photos of local storefronts, teams, or service environments. Aspect ratio: 16:9 for consistency.

**Service Icons**: Lucide React icons only (Broom, Baby, Leaf, etc.) - never custom SVG

## Responsive Strategy
**Mobile-First**: Base styles for mobile, progressive enhancement
- **Mobile**: Single column, full-width cards, hamburger menu
- **Tablet (md:)**: 2-column grids, expanded navigation
- **Desktop (lg:)**: 3-column grids, full navigation, larger hero

## Accessibility
- Color contrast ratio: minimum 4.5:1 for text
- Focus indicators: visible blue ring on all interactive elements
- Alt text for all images
- Semantic HTML (nav, main, section, article)
- ARIA labels for icon-only buttons

## Animation Principles
**Subtle & Purposeful**: Use sparingly for feedback and delight
- Page transitions: 300ms ease-in-out
- Hover effects: 200ms
- Modal entry/exit: 400ms with spring animation
- Avoid excessive motion; respect prefers-reduced-motion

This design creates a trustworthy, modern platform that balances professionalism with approachability, ensuring users feel confident in finding and contacting local service providers.