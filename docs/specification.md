# PRD & Design Specification: OKLCH Theme Token Generator

**Version:** 2.0 (Light Mode)
**Date:** 2025-09-11
**Author:** Gemini

---

### 1. Project Overview

The **OKLCH Theme Token Generator** is a web-based utility designed to visualize and export color theme tokens. The tool takes a predefined set of 12 base color tokens (derived from the "Default Blue" theme) and programmatically generates alternative themes by modifying the hue and chromaticity in the modern OKLCH color space.

The primary goals are to:
1.  Provide an accurate visual reference for reviewing color themes.
2.  Offer a simple, one-click method to export the resulting color values as CSS custom properties.

This tool is for internal review and asset generation. It operates exclusively in a light mode theme.

### 2. Core Functionality & Requirements

#### 2.1. Visualization of Color Themes
- The application displays one theme at a time, defaulting to **"Default Blue"** on load.
- A dropdown menu allows users to seamlessly switch between all predefined themes.

#### 2.2. Dynamic Color Generation Logic
All color calculations are performed in the OKLCH color space to ensure perceptually uniform results.

-   **Hue (H):** For any selected theme, the hue of all 12 tokens is set to the single, predefined hue of that theme's base color.
-   **Lightness (L):** The lightness value for each of the 12 tokens is **preserved** directly from the corresponding token in the "Default Blue" theme.
-   **Chromaticity (C):** The chromaticity for each token is calculated based on an interpolation logic:
    -   A **"Max Chroma Boost"** slider (defaulting to 150%) sets a maximum possible chroma, calculated as `[Base '500' Token Chroma] * [Boost %]`.
    -   The logic compares the selected theme's chroma to the base '500' token's chroma and the calculated maximum. It then generates a `chromaScaleFactor` to ensure the final palette is a properly scaled representation of the theme's intent, preventing low-chroma themes from becoming too colorful and high-chroma themes from exceeding the cap.

#### 2.3. Handling of Out-of-Gamut Colors
-   All color math is performed in the OKLCH color space.
-   When an OKLCH color is converted to a HEX code for display, the conversion process performs **gamut clipping**, mapping any out-of-gamut color to the nearest possible in-gamut equivalent.

#### 2.4. Data Export
-   A "Copy" button with a Material Symbol icon copies a list of CSS custom properties for the current theme to the user's clipboard.
-   **Format:**
    ```css
    --theme-25: oklch(98.77% 0.0057 260.00); /* #F9FBFF */
    /* ... and so on for all 12 tokens */
    ```

### 3. User Interface (UI) Design Specification

The application uses a responsive, two-column, full-height layout with a light-mode aesthetic.

#### 3.1. Left Column: Controls Panel
A fixed-width panel containing all user-configurable options.

-   **Logo:** A static logo is displayed at the top.
-   **Title:** "Theme Token Generator".
-   **Theme Selector:** A `<select>` dropdown menu labeled "Select Theme".
-   **Chromaticity Control:** An `<input type="range">` slider labeled "Max Chroma Boost". The percentage value in the label updates dynamically.
-   **Export Panel:** A full-height section with a read-only `<textarea>` and a "Copy" button positioned next to the "Export CSS Tokens" label.

#### 3.2. Right Column: Content Panel
A wrapped content area displaying the generated theme data.

-   **Theme Header:**
    -   An `<h2>` heading with the current theme's name.
    -   A theme info swatch displaying the theme's base color, HEX code, and OKLCH value.

-   **Visualization Area:** A two-column layout containing the data table and charts.
    -   **Data Table:**
        -   Displays the 12 color tokens of the selected theme.
        -   **Columns:**
            1.  **Token:** The token identifier (e.g., "25", "500").
            2.  **Swatch:** A visual square of the final, in-gamut color.
            3.  **Value:** The HEX code and full OKLCH value string, stacked vertically.
    -   **Data Charts:**
        -   Two dedicated `<canvas>` elements rendered by Chart.js, stacked vertically.
        1.  **Chromaticity Chart:** A line chart visualizing the theme's chroma values, with comparison lines for the base chroma and the calculated max chroma.
        2.  **Lightness Chart:** A line chart visualizing the theme's lightness values, with a comparison line for the base lightness.
        -   Data points are rendered as circles filled with the actual color of the corresponding token.

### 4. Technical Specification

-   **Environment:** Static HTML5, CSS3, and modern JavaScript (ES6+).
-   **Fonts:** "Inter" for UI text and "IBM Plex Mono" for monospaced values.
-   **Icons:** Material Symbols.
-   **Libraries:**
    -   **colorjs.io:** For all color space conversions and gamut clipping.
    -   **Chart.js:** For rendering the dynamic data visualization charts.
-   **Data Management:** All theme data is hardcoded as JavaScript objects within `main.js`.