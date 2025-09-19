import gsap from 'gsap';
import './style.css';
import Color from "colorjs.io/dist/color.js";
import {
    Chart, LineController, CategoryScale, LinearScale,
    PointElement, LineElement, Legend, Tooltip,
} from 'chart.js';

Chart.register(
    LineController, CategoryScale, LinearScale,
    PointElement, LineElement, Legend, Tooltip
);

// --- STATE MANAGEMENT ---
let appState = {
    mode: 'existing', // 'existing' or 'custom'
    themeName: 'Default Blue',
    chromaBoost: 150,
    animate: true,
    customHue: 259,
    customChroma: 0.15,
};

// --- DATA ---
const baseTokens = {
    '25':   '#F9FBFF', '50':  '#F2F7FE', '100': '#E7F0FF',
    '200':  '#CFE1FE', '300': '#ADCFFB', '400': '#7AA9F6',
    '500':  '#5890ED', '600': '#276FE3', '700': '#155ACA',
    '800':  '#174B9F', '900': '#123D82', '950': '#022762'
};
const themes = {
    'Default Blue': '#5890ED', 'Army': '#4A543A', 'Barbie World': '#FF0090',
    'Beautiful Gloom': '#8F729F', 'Dark Land': '#62626D', 'Dodgers': '#005A9C',
    'Dodgers (Alt)': '#5A5A95', 'Ducks': '#00693E', 'Elegant': '#5473B8',
    'Flower Field': '#D954C8', 'Galactic Empire': '#4F4F4F', 'Green Giant': '#007A53',
    'Lakers': '#9B2D92', 'Oceans 11': '#3B62CC', 'OSU': '#BB2500',
    'Smurf': '#4667B2', 'Starry Night': '#E59F00', 'The Browns': '#4B5882', 'V8': '#8C5400'
};

// --- DOM ELEMENTS ---
let themeSelect, chromaSlider, chromaValueSpan, exportButton, 
    cssOutputTextarea, themeTitle, tableBody, chromaChartCanvas, 
    lightnessChartCanvas, themeSwatchInfo, contentWrapper, animateToggle,
    modeRadios, existingThemeControls, customThemeControls,
    hueSlider, hueValueSpan, customChromaSlider, customChromaValueSpan;
let chromaChart = null, lightnessChart = null;

// --- FUNCTIONS ---
function populateThemeSelector() {
    Object.keys(themes).forEach(themeName => {
        const option = document.createElement('option');
        option.value = themeName;
        option.textContent = themeName;
        themeSelect.appendChild(option);
    });
}

function renderTableRow(token) {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent = token.name;
    const swatchCell = document.createElement('td');
    const swatchDiv = document.createElement('div');
    swatchDiv.className = 'color-swatch';
    swatchDiv.style.backgroundColor = token.hex;
    swatchCell.appendChild(swatchDiv);
    const valueCell = document.createElement('td');
    const hue = isNaN(token.h) ? 0 : token.h;
    const oklchString = `oklch(${(token.l * 100).toFixed(2)}% ${token.c.toFixed(4)} ${hue.toFixed(2)})`;
    valueCell.innerHTML = `${token.hex.toUpperCase()}<br>${oklchString}`;
    row.append(nameCell, swatchCell, valueCell);
    tableBody.appendChild(row);
}

function updateChart(tokenData, baseChromaData, maxChromaData, baseLightnessData) {
    if (!chromaChartCanvas || !lightnessChartCanvas) return;
    if (chromaChart) chromaChart.destroy();
    if (lightnessChart) lightnessChart.destroy();

    const labels = tokenData.map(t => t.name);
    
    const secondaryTextColor = '#414651';
    const borderColor = '#E9EAEB';
    const themeLineColor = tokenData.find(t => t.name === '700').hex;
    
    const sharedOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0
        },
        plugins: { 
            legend: { 
                display: false, 
            } 
        },
        scales: { 
            x: { 
                title: { display: true, text: 'Token', color: secondaryTextColor, font: { weight: '600' } }, 
                ticks: { color: secondaryTextColor },
                grid: { color: 'transparent' } 
            } 
        },
        interaction: { mode: 'index', intersect: false },
    };

    const chromaCtx = chromaChartCanvas.getContext('2d');
    chromaChart = new Chart(chromaCtx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Theme Chroma', data: tokenData.map(t => t.c), borderColor: themeLineColor, backgroundColor: themeLineColor, pointBackgroundColor: tokenData.map(t => t.hex), pointBorderColor: '#fff', pointRadius: 6, pointHoverRadius: 8, tension: 0.1 },
                { label: 'Base Chroma', data: baseChromaData, borderColor: secondaryTextColor, borderDash: [5, 5], pointRadius: 0, tension: 0.1, borderWidth: 1 },
                { label: 'Max Chroma', data: maxChromaData, borderColor: 'rgba(0, 0, 0, 0.15)', borderDash: [2, 4], pointRadius: 0, tension: 0.1, borderWidth: 2 }
            ]
        },
        options: { ...sharedOptions, scales: { ...sharedOptions.scales, y: { min: 0, max: 0.4, title: { display: true, text: 'Chromaticity', color: secondaryTextColor, font: { weight: '600' } }, ticks: { color: secondaryTextColor }, grid: { color: borderColor } } } }
    });

    const lightnessCtx = lightnessChartCanvas.getContext('2d');
    lightnessChart = new Chart(lightnessCtx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Theme Lightness', data: tokenData.map(t => t.l * 100), borderColor: themeLineColor, backgroundColor: themeLineColor, pointBackgroundColor: tokenData.map(t => t.hex), pointBorderColor: '#fff', pointRadius: 6, pointHoverRadius: 8, tension: 0.1 },
                { label: 'Base Lightness', data: baseLightnessData, borderColor: secondaryTextColor, borderDash: [5, 5], pointRadius: 0, tension: 0.1, borderWidth: 1 }
            ]
        },
        options: { ...sharedOptions, scales: { ...sharedOptions.scales, y: { title: { display: true, text: 'Lightness', color: secondaryTextColor, font: { weight: '600' } }, ticks: { color: secondaryTextColor }, grid: { color: borderColor } } } }
    });
}

function updateExportData(tokenData) {
    const themeName = appState.mode === 'existing' ? appState.themeName : 'Custom Theme';
    
    const cssTokens = tokenData.map(token => {
        const propName = `--theme-${token.name}`;
        const hexValue = token.hex.toUpperCase();
        const hue = isNaN(token.h) ? 0 : token.h;
        const oklchValue = `oklch(${(token.l * 100).toFixed(2)}% ${token.c.toFixed(4)} ${hue.toFixed(2)})`;

        const fallbackLine = `    ${propName}: ${hexValue};`;
        const modernLine = `    ${propName}: ${oklchValue};`;

        return `${fallbackLine}\n${modernLine}`;
    }).join('\n\n');

    cssOutputTextarea.value = `/* Theme: ${themeName} */\n${cssTokens}`;
}

function updateTheme(animate = false) {
    let themeColor;
    if (appState.mode === 'existing') {
        themeColor = new Color(themes[appState.themeName]);
    } else {
        const lightness = 0.6582; // Fixed lightness from base 500 token
        themeColor = new Color("oklch", [lightness, appState.customChroma, appState.customHue]);
    }
    
    const chromaMultiplier = appState.chromaBoost / 100;
    const targetHue = themeColor.oklch.h || 0;
    const themeChroma = themeColor.oklch.c;
    const base500Color = new Color(baseTokens['500']);
    const base500Chroma = base500Color.oklch.c;
    const maxChroma = base500Chroma * chromaMultiplier;
    
    let chromaScaleFactor = themeChroma / base500Chroma;
    if (themeChroma > maxChroma) {
        chromaScaleFactor = maxChroma / base500Chroma;
    }

    const generatedTokens = [];
    const baseChromaData = [];
    const baseLightnessData = [];

    for (const tokenName in baseTokens) {
        const baseHex = baseTokens[tokenName];
        const baseTokenColor = new Color(baseHex);
        
        baseChromaData.push(baseTokenColor.oklch.c);
        baseLightnessData.push(baseTokenColor.oklch.l * 100);

        const newColor = baseTokenColor.clone().set({
            'oklch.h': targetHue,
            'oklch.c': c => c * chromaScaleFactor
        });
        const { l, c, h } = newColor.oklch;
        generatedTokens.push({ name: tokenName, hex: newColor.to('srgb').toString({ format: 'hex' }), l, c, h });
    }
    const maxChromaData = baseChromaData.map(c => c * chromaMultiplier);

    const renderUpdates = () => {
        themeTitle.textContent = appState.mode === 'existing' ? appState.themeName : 'Custom Theme';
        tableBody.innerHTML = '';

        const swatchDiv = themeSwatchInfo.querySelector('.color-swatch');
        const valueDiv = themeSwatchInfo.querySelector('.value-text');
        const themeHex = themeColor.to('srgb').toString({ format: 'hex' });
        const themeOklch = `oklch(${(themeColor.oklch.l * 100).toFixed(2)}% ${themeColor.oklch.c.toFixed(4)} ${targetHue.toFixed(2)})`;
        swatchDiv.style.backgroundColor = themeHex;
        valueDiv.innerHTML = `${themeHex.toUpperCase()}<br>${themeOklch}`;

        generatedTokens.forEach(token => renderTableRow(token));
        
        const root = document.documentElement;
        const token600 = generatedTokens.find(t => t.name === '600').hex;
        const token700 = generatedTokens.find(t => t.name === '700').hex;
        const token800 = generatedTokens.find(t => t.name === '800').hex;
        const token950 = generatedTokens.find(t => t.name === '950').hex;

        root.style.setProperty('--interactive-bg', token700);
        root.style.setProperty('--interactive-bg-hover', token600);
        root.style.setProperty('--interactive-bg-pressed', token800);
        root.style.setProperty('--interactive-border-hover', token950);

        updateChart(generatedTokens, baseChromaData, maxChromaData, baseLightnessData);
        updateExportData(generatedTokens);
    };

    if (animate && appState.animate) {
        // UPDATED: Animation is now 300% faster with a snappier ease
        gsap.timeline()
          .to(contentWrapper, { y: '-105%', duration: 0.075, ease: 'expo.in' })
          .call(renderUpdates)
          .set(contentWrapper, { y: '105%' })
          .to(contentWrapper, { y: '0%', duration: 0.125, ease: 'expo.out' });
    } else {
        renderUpdates();
    }
}

async function copyToClipboard() {
    const buttonTextSpan = document.getElementById('copy-button-text');
    if (!buttonTextSpan) {
        console.error("Could not find #copy-button-text span to update.");
        await navigator.clipboard.writeText(cssOutputTextarea.value);
        return;
    }

    const originalText = buttonTextSpan.textContent;
    try {
        await navigator.clipboard.writeText(cssOutputTextarea.value);
        buttonTextSpan.textContent = 'Copied!';
    } catch (err) {
        console.error('Failed to copy text: ', err);
        buttonTextSpan.textContent = 'Failed!';
    } finally {
        setTimeout(() => {
            buttonTextSpan.textContent = originalText;
        }, 1500);
    }
}

function syncUI() {
    // Sync mode controls
    if (appState.mode === 'existing') {
        existingThemeControls.classList.remove('hidden');
        customThemeControls.classList.add('hidden');
        document.getElementById('mode-existing').checked = true;
    } else {
        existingThemeControls.classList.add('hidden');
        customThemeControls.classList.remove('hidden');
        document.getElementById('mode-custom').checked = true;
    }

    // Sync form element values
    themeSelect.value = appState.themeName;
    chromaSlider.value = appState.chromaBoost;
    animateToggle.checked = appState.animate;
    hueSlider.value = appState.customHue;
    customChromaSlider.value = appState.customChroma;

    // Sync value labels
    chromaValueSpan.textContent = appState.chromaBoost;
    hueValueSpan.textContent = appState.customHue;
    customChromaValueSpan.textContent = parseFloat(appState.customChroma).toFixed(3);
}

function init() {
    // --- QUERY DOM ELEMENTS ---
    themeSelect = document.getElementById('theme-select');
    chromaSlider = document.getElementById('chroma-slider');
    chromaValueSpan = document.getElementById('chroma-value');
    exportButton = document.getElementById('export-button');
    cssOutputTextarea = document.getElementById('css-output');
    themeTitle = document.getElementById('theme-title');
    tableBody = document.getElementById('token-table-body');
    chromaChartCanvas = document.getElementById('chroma-chart');
    lightnessChartCanvas = document.getElementById('lightness-chart');
    themeSwatchInfo = document.getElementById('theme-swatch-info');
    contentWrapper = document.querySelector('.content-wrapper');
    animateToggle = document.getElementById('animate-toggle');

    // New elements
    modeRadios = document.querySelectorAll('input[name="theme-mode"]');
    existingThemeControls = document.getElementById('existing-theme-controls');
    customThemeControls = document.getElementById('custom-theme-controls');
    hueSlider = document.getElementById('hue-slider');
    hueValueSpan = document.getElementById('hue-value');
    customChromaSlider = document.getElementById('chroma-slider-custom');
    customChromaValueSpan = document.getElementById('chroma-value-custom');

    // --- VALIDATE DOM ELEMENTS ---
    const requiredElements = { themeSelect, chromaSlider, exportButton, tableBody, contentWrapper, animateToggle, existingThemeControls, customThemeControls };
    for (const [name, el] of Object.entries(requiredElements)) {
        if (!el) {
            console.error(`Fatal Error: UI element "${name}" was not found. App cannot start.`);
            return; 
        }
    }

    // --- ATTACH EVENT LISTENERS ---
    modeRadios.forEach(radio => radio.addEventListener('change', (e) => {
        appState.mode = e.target.value;
        syncUI();
        updateTheme(true);
    }));

    themeSelect.addEventListener('change', (e) => {
        appState.themeName = e.target.value;
        updateTheme(true);
    });

    chromaSlider.addEventListener('input', (e) => {
        appState.chromaBoost = parseInt(e.target.value, 10);
        
        // Dynamic Chroma Capping Logic
        const base500Chroma = new Color(baseTokens['500']).oklch.c;
        const newMaxChroma = base500Chroma * (appState.chromaBoost / 100);
        customChromaSlider.max = newMaxChroma;

        if (appState.customChroma > newMaxChroma) {
            appState.customChroma = newMaxChroma;
        }
        
        syncUI();
        updateTheme(false);
    });
    
    animateToggle.addEventListener('change', (e) => {
        appState.animate = e.target.checked;
    });

    hueSlider.addEventListener('input', (e) => {
        appState.customHue = parseInt(e.target.value, 10);
        syncUI();
        updateTheme(false);
    });
    
    customChromaSlider.addEventListener('input', (e) => {
        appState.customChroma = parseFloat(e.target.value);
        syncUI();
        updateTheme(false);
    });

    exportButton.addEventListener('click', copyToClipboard);

    // --- INITIALIZE APP ---
    populateThemeSelector();
    syncUI();
    updateTheme(false); 
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}