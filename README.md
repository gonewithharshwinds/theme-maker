# Theme Maker - Advanced Design Tokens Visualizer & Wireframe Sandbox

**Theme Maker** is a visual design system editor and component wireframing workbench. It allows developers and designers to build structured token schemas, duplicate token matrices dynamically, wireframe custom layouts, and bind properties (backgrounds, text, fonts, radii) directly to design tokens with Pantone autocomplete support.

---

## Key Features

### 📋 Figma-style Design Tokens Matrix
* **Visual Group cards**: Tokens are grouped into visual table cards (e.g. Colors, Layout, Typography, Sidebar).
* **Workspace card selections**: Click on a card to select it. A highlighted border indicates the active selected group.
* **Rapid Duplication (`Ctrl+D`)**: Press `Ctrl+D` (or click duplicate in the header) to clone the selected token group card. Cloned tokens automatically receive unique keys (`-copy`) and names.

### 🎨 Pantone & Hex Autocomplete Engine
* **Autocomplete ghost inputs**: Color inputs suggest matching colors from the local Pantone fashion/interiors library inline in grayed-out italics.
* **Shortcut acceptance**: Press `Tab`, `ArrowRight`, or `Enter` to autocomplete the suggestions instantly.
* **Resolution layer**: Automatically converts Pantone naming conventions to HEX under-the-hood so your previews render correctly.

### 📐 Figma-like Layout Canvas Editor (Editor View)
* **Recursive layers tree**: Compose elements out of nested primitives: **Frame** (flex container), **Rectangle**, **Circle**, **Text**, and **Image**.
* **Flex layout constraints**: Adjust direction (flex row/column), padding, and gap spacing directly from the Layer Inspector.
* **Semantic Token bindings**: Bind background fill, text color, border-radius, and font properties directly to active project design tokens. If unbound, layers utilize configurable "raw state" fallbacks.
* **Visual canvas selections**: Click layers on the visual canvas grid to inspect, resize, or delete them.

### 📁 Projects Workspace Manager
* **Multi-project support**: Switch between different layup projects in real-time.
* **SaaS Template Project**: Includes a read-only default Shadcn/UI SaaS template mockup (viewable in the **Producer View**) with a reset utility.
* **Custom Sandboxes**: Create clean projects from scratch with minimalist starting tokens to build your design systems from the ground up.

---

## Tech Stack
* **Framework**: Next.js 15 (React 19)
* **Styling**: Tailwind CSS & Vanilla CSS Variables
* **State Management**: Zustand (Persisted client-side)
* **Icons**: Lucide React
* **Typings**: TypeScript

---

## Local Development

### Prerequisites
* Node.js 18+
* npm, pnpm, or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open **[http://localhost:3000](http://localhost:3000)** in your browser.

forked shadcn
