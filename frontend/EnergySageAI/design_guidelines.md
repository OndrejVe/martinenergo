# Design Guidelines: Martin - Interaktivní AI Poradce pro Spotové Ceny Elektřiny

## Design Approach

**Selected Approach:** Energetický & Dynamický (Energy-First Interactive Experience)

**Primary References:**
- Tesla Energy dashboards pro moderní energetický feel
- Neon/cyberpunk aesthetics pro elektrický look
- ChatGPT pro konverzační UI
- Motion graphics inspirace pro dynamické animace

**Key Design Principles:**
1. **Avatar jako Hlavní Hvězda** - Martin dominuje celou obrazovku, není utopený
2. **Energetická Paleta** - Živé barvy reprezentující elektřinu, energii, dynamiku
3. **Neustálý Pohyb** - Animované gradienty, pulzující efekty, smooth transitions
4. **Electrical Feel** - Vše evokuje elektřinu a energii

## Core Design Elements

### A. Color Palette (ENERGETICKÁ)

**Light Mode:**
- Primary: 190 85% 45% (Elektrická cyan/modrá - hlavní energetická barva)
- Secondary: 25 95% 55% (Energetická oranžová - teplo, dynamika)
- Accent: 45 95% 58% (Elektrická žlutá - světlo, energie)
- Success: 142 76% 45% (Zelená - úspory)
- Background: 200 20% 98% (Velmi světlá s nádechem modré)
- Surface: 200 15% 96%
- Text Primary: 200 15% 12%
- Text Secondary: 200 10% 40%
- Border: 200 15% 88%

**Dark Mode:**
- Primary: 190 80% 55% (Světlejší cyan pro dark)
- Secondary: 25 90% 60%
- Accent: 45 90% 65%
- Success: 142 70% 55%
- Background: 200 25% 6% (Tmavá s modrým podtónem)
- Surface: 200 20% 10%
- Text Primary: 200 10% 95%
- Text Secondary: 200 8% 70%
- Border: 200 20% 18%

**Gradient Combinations:**
- Electric Flow: Primary → Accent (190deg cyan to yellow)
- Energy Burst: Secondary → Primary (orange to cyan)
- Power Glow: Accent → Success (yellow to green)

### B. Typography

**Font Families:**
- Primary: Inter (Clean, modern)
- Display/Hero: Poppins nebo Montserrat (bold, impactful)
- Monospace: JetBrains Mono (numbers, technical data)

**Type Scale:**
- H1 Hero: text-6xl md:text-7xl lg:text-8xl font-bold (Extra large for Martin)
- H2: text-4xl md:text-5xl font-bold
- H3: text-2xl md:text-3xl font-semibold
- Body: text-base md:text-lg
- Chat: text-base
- Small: text-sm

### C. Layout System

**Avatar Dominance:**
- Desktop: Fullscreen nebo 70-80% viewport height
- Mobile: Minimum 60% viewport
- Always above the fold, immediately visible
- Sticky/Fixed positioning optional

**Spacing:**
- Generous spacing: py-16 md:py-24 lg:py-32 for sections
- Component padding: p-6 md:p-8
- Grid gaps: gap-8 md:gap-12

### D. Component Library

**Navigation:**
- Translucent with backdrop blur (bg-background/90 backdrop-blur-lg)
- Gradient border bottom (primary to secondary)
- Minimal: Logo, Language toggle, Theme toggle
- Floating or fixed top

**Hero Section:**
- MASSIVE Martin branding
- Bold gradient text: "Váš AI Poradce pro Elektřinu"
- Animated electrical effects around text
- Pulsing CTA button
- Gradient background with animated flow

**Video Avatar (MAIN STAR):**
- Fullscreen nebo minimum 70% viewport
- Rounded-3xl with animated gradient border
- Glowing effect around edges (box-shadow with primary color)
- Speaking indicator: Pulsing electrical glow animation
- Loading state: Electrical pulse skeleton
- Background: Subtle animated gradient
- Position: Center stage, impossible to miss

**Chat Interface:**
- Floating card over background
- Glass morphism effect (backdrop-blur-xl)
- User messages: Gradient background (primary to secondary)
- Martin messages: Surface with subtle glow
- Animated message appearance (slide + fade)
- Voice button: Pulsing animation when active
- Send button: Gradient with hover glow

**Contact Form:**
- Clean minimal design
- Gradient focus states on inputs
- Animated submit button with electrical effect
- Success animation with electrical burst

**Footer:**
- Minimal, dark
- Gradient accent line top
- Links with hover glow effect

### E. Interactive Elements & Animations

**DYNAMICKÉ ANIMACE (KRITICKÉ):**

1. **Gradient Animations:**
   - Background gradients constantly flowing/shifting
   - Use CSS keyframes for infinite gradient rotation
   - Subtle but always moving

2. **Avatar Animations:**
   - Pulsing glow when Martin is "thinking"
   - Electrical spark effects when speaking
   - Border gradient rotation
   - Smooth scale/hover effects

3. **Text Animations:**
   - Gradient text animation on hero
   - Fade-in-up for sections (Framer Motion)
   - Number counter animations

4. **Button Animations:**
   - Hover: Glow + slight scale
   - Click: Electrical ripple effect
   - Gradient shift on hover

5. **Scroll Animations:**
   - Parallax backgrounds
   - Fade + slide sections into view
   - Progress indicators with gradient

6. **Loading States:**
   - Electrical pulse animation
   - Shimmer effect with gradient
   - Particle effects for heavy actions

**Micro-interactions:**
- Success: Electrical burst animation
- Error: Red glow shake
- Hover: Smooth glow transitions (200ms)
- Click: Ripple effect

## Special Animations Code Examples

**Animated Gradient Background:**
```css
@keyframes gradient-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.bg-animated-gradient {
  background: linear-gradient(270deg, primary, secondary, accent);
  background-size: 400% 400%;
  animation: gradient-flow 15s ease infinite;
}
```

**Pulsing Glow:**
```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px primary, 0 0 40px primary; }
  50% { box-shadow: 0 0 40px primary, 0 0 80px secondary; }
}

.avatar-glow {
  animation: pulse-glow 3s ease-in-out infinite;
}
```

## Layout Structure (NOVÝ)

1. **Hero/Avatar Section** (Full viewport height)
   - Dominantní Martin avatar (70-80% height)
   - Krátký headline
   - CTA tlačítko
   
2. **Proč Spotové Ceny** (Educational content)
   - 3 feature cards s ikonami
   - Animace při scrollu
   
3. **Chat Interface** (Floating over animated background)
   - Translucent card
   - Glass morphism
   
4. **Kontaktní Formulář** (Simple, centered)
   - Clean design
   - Gradient accents
   
5. **Footer** (Minimal)

**ODSTRANIT:**
- ❌ Kalkulačka (Calculator) - bude řešit jejich systém

## Critical Requirements

- ✅ Avatar MUST be prominent, minimum 70% viewport
- ✅ Živé energetické barvy (cyan, orange, yellow)
- ✅ Animované gradienty všude
- ✅ Pulsující efekty
- ✅ Smooth transitions (300-500ms)
- ✅ Glass morphism na kartách
- ✅ Electrical/energy theme throughout
