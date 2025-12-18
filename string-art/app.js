/**
 * ====================================================================
 * String Art Pattern Generator - Error-Based Algorithm
 * ====================================================================
 * Author: Hamed Ghane
 * Date: December 18, 2025
 * 
 * Description:
 * Client-side web application that generates string art patterns using
 * an error-based greedy algorithm. Minimizes squared error between the
 * current thread canvas and target image using multiplicative darkening.
 * 
 * Algorithm:
 *   - Start with white canvas (1.0)
 *   - Each thread multiplies pixels by (1 - alpha), darkening them
 *   - Select the line that maximizes: Σ[(old_error)² - (new_error)²]
 *   - This directly optimizes for matching the target image
 * 
 * Input:
 *   - Image file (upload or URL)
 *   - Frame configuration (shape, pins, starting angle)
 *   - Generation parameters (lines, alpha, gamma, etc.)
 * 
 * Output:
 *   - Visual preview of generated string art
 *   - CSV file with step-by-step pin connections
 *   - PNG export of the result
 * ====================================================================
 */

// ============================================
// Application State
// ============================================
const AppState = {
    // Image data
    sourceImage: null,
    targetData: null,      // Float32Array - target grayscale [0,1]
    currentCanvas: null,   // Float32Array - current state [0,1]
    
    // Frame configuration
    frameConfirmed: false,
    pins: [],              // Array of {x, y} pixel positions
    pinsNormalized: [],    // Array of {x, y} normalized [-1,1]
    
    // Generation state
    isGenerating: false,
    shouldCancel: false,
    connections: [],       // Array of {step, startPin, endPin}
    
    // Canvases
    canvases: {},
    contexts: {}
};

// ============================================
// DOM Elements Cache
// ============================================
const Elements = {};

// ============================================
// Quality Presets
// ============================================
const PRESETS = {
    draft:  { lines: 2000, alpha: 0.06, minGap: 25 },
    normal: { lines: 3500, alpha: 0.05, minGap: 20 },
    high:   { lines: 5000, alpha: 0.04, minGap: 15 },
    ultra:  { lines: 7000, alpha: 0.035, minGap: 12 }
};

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    initializeCanvases();
    setupEventListeners();
    updateUIState();
});

/**
 * Cache DOM element references
 */
function initializeElements() {
    // Image input
    Elements.fileInput = document.getElementById('fileInput');
    Elements.dropZone = document.getElementById('dropZone');
    Elements.imageUrl = document.getElementById('imageUrl');
    Elements.loadUrlBtn = document.getElementById('loadUrlBtn');
    Elements.imageStatus = document.getElementById('imageStatus');
    
    // Frame settings
    Elements.frameShape = document.getElementById('frameShape');
    Elements.ellipseRatio = document.getElementById('ellipseRatio');
    Elements.ellipseRatioGroup = document.getElementById('ellipseRatioGroup');
    Elements.rectRatio = document.getElementById('rectRatio');
    Elements.rectRatioGroup = document.getElementById('rectRatioGroup');
    Elements.numPins = document.getElementById('numPins');
    Elements.startAngle = document.getElementById('startAngle');
    Elements.previewFrameBtn = document.getElementById('previewFrameBtn');
    Elements.frameConfirmation = document.getElementById('frameConfirmation');
    Elements.confirmFrameBtn = document.getElementById('confirmFrameBtn');
    Elements.editFrameBtn = document.getElementById('editFrameBtn');
    
    // Generation parameters
    Elements.qualityPreset = document.getElementById('qualityPreset');
    Elements.customParams = document.getElementById('customParams');
    Elements.numLines = document.getElementById('numLines');
    Elements.startPin = document.getElementById('startPin');
    Elements.minPinGap = document.getElementById('minPinGap');
    Elements.alpha = document.getElementById('alpha');
    Elements.gamma = document.getElementById('gamma');
    Elements.canvasRes = document.getElementById('canvasRes');
    Elements.performanceWarning = document.getElementById('performanceWarning');
    Elements.generateBtn = document.getElementById('generateBtn');
    
    // Progress
    Elements.progressContainer = document.getElementById('progressContainer');
    Elements.progressText = document.getElementById('progressText');
    Elements.progressPercent = document.getElementById('progressPercent');
    Elements.progressFill = document.getElementById('progressFill');
    Elements.cancelBtn = document.getElementById('cancelBtn');
    
    // Results
    Elements.resultsSection = document.getElementById('resultsSection');
    Elements.statsLines = document.getElementById('statsLines');
    Elements.statsTime = document.getElementById('statsTime');
    Elements.downloadCsvBtn = document.getElementById('downloadCsvBtn');
    Elements.downloadPngBtn = document.getElementById('downloadPngBtn');
    Elements.instructionsText = document.getElementById('instructionsText');
    Elements.connectionsBody = document.getElementById('connectionsBody');
    
    // Placeholders
    Elements.imagePlaceholder = document.getElementById('imagePlaceholder');
    Elements.framePlaceholder = document.getElementById('framePlaceholder');
    Elements.resultPlaceholder = document.getElementById('resultPlaceholder');
}

/**
 * Initialize canvas elements
 */
function initializeCanvases() {
    AppState.canvases.image = document.getElementById('imageCanvas');
    AppState.canvases.frame = document.getElementById('frameCanvas');
    AppState.canvases.result = document.getElementById('resultCanvas');
    
    AppState.contexts.image = AppState.canvases.image.getContext('2d');
    AppState.contexts.frame = AppState.canvases.frame.getContext('2d');
    AppState.contexts.result = AppState.canvases.result.getContext('2d');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Input tabs
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', () => switchInputTab(tab.dataset.tab));
    });
    
    // Preview tabs
    document.querySelectorAll('.preview-tab').forEach(tab => {
        tab.addEventListener('click', () => switchPreviewTab(tab.dataset.preview));
    });
    
    // File input
    Elements.fileInput.addEventListener('change', handleFileSelect);
    Elements.dropZone.addEventListener('click', () => Elements.fileInput.click());
    Elements.dropZone.addEventListener('dragover', handleDragOver);
    Elements.dropZone.addEventListener('dragleave', handleDragLeave);
    Elements.dropZone.addEventListener('drop', handleDrop);
    
    // URL input
    Elements.loadUrlBtn.addEventListener('click', handleUrlLoad);
    Elements.imageUrl.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleUrlLoad();
    });
    
    // Frame settings
    Elements.frameShape.addEventListener('change', handleShapeChange);
    Elements.previewFrameBtn.addEventListener('click', previewFrame);
    Elements.confirmFrameBtn.addEventListener('click', confirmFrame);
    Elements.editFrameBtn.addEventListener('click', editFrame);
    
    // Quality preset
    Elements.qualityPreset.addEventListener('change', handlePresetChange);
    
    // Performance warning
    Elements.numLines.addEventListener('change', checkPerformanceWarning);
    Elements.canvasRes.addEventListener('change', checkPerformanceWarning);
    
    // Generate
    Elements.generateBtn.addEventListener('click', startGeneration);
    Elements.cancelBtn.addEventListener('click', cancelGeneration);
    
    // Downloads
    Elements.downloadCsvBtn.addEventListener('click', downloadCSV);
    Elements.downloadPngBtn.addEventListener('click', downloadPNG);
}

// ============================================
// Tab Switching
// ============================================
function switchInputTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.toggle('active', c.id === `tab-${tabName}`);
    });
}

function switchPreviewTab(previewName) {
    document.querySelectorAll('.preview-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.preview === previewName);
    });
    document.querySelectorAll('.preview-content').forEach(c => {
        c.classList.toggle('active', c.id === `preview-${previewName}`);
    });
}

// ============================================
// Image Loading
// ============================================
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) loadImageFile(file);
}

function handleDragOver(e) {
    e.preventDefault();
    Elements.dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    Elements.dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    Elements.dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImageFile(file);
    } else {
        showStatus('Please drop an image file.', 'error');
    }
}

function loadImageFile(file) {
    const reader = new FileReader();
    reader.onload = e => loadImageFromSrc(e.target.result, file.name);
    reader.onerror = () => showStatus('Failed to read file.', 'error');
    reader.readAsDataURL(file);
}

function handleUrlLoad() {
    const url = Elements.imageUrl.value.trim();
    if (!url) {
        showStatus('Please enter an image URL.', 'error');
        return;
    }
    showStatus('Loading image...', 'info');
    loadImageFromSrc(url, 'url-image');
}

function loadImageFromSrc(src, name) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
        AppState.sourceImage = img;
        displayImagePreview(img);
        showStatus(`✓ Image loaded: ${name}`, 'success');
        updateUIState();
    };
    
    img.onerror = () => {
        showStatus('Failed to load image. Try downloading and uploading locally.', 'error');
    };
    
    img.src = src;
}

function displayImagePreview(img) {
    const canvas = AppState.canvases.image;
    const ctx = AppState.contexts.image;
    const size = parseInt(Elements.canvasRes.value) || 600;
    
    canvas.width = size;
    canvas.height = size;
    
    // Crop and fit to square
    const scale = Math.max(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (size - w) / 2;
    const y = (size - h) / 2;
    
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, x, y, w, h);
    
    Elements.imagePlaceholder.classList.add('hidden');
    switchPreviewTab('image');
}

function showStatus(message, type) {
    Elements.imageStatus.textContent = message;
    Elements.imageStatus.className = `status-message ${type}`;
    Elements.imageStatus.classList.remove('hidden');
}

// ============================================
// Frame Configuration
// ============================================
function handleShapeChange() {
    const shape = Elements.frameShape.value;
    Elements.ellipseRatioGroup.classList.toggle('hidden', shape !== 'ellipse');
    Elements.rectRatioGroup.classList.toggle('hidden', shape !== 'rectangle');
    AppState.frameConfirmed = false;
    Elements.frameConfirmation.classList.add('hidden');
    updateUIState();
}

function previewFrame() {
    if (!AppState.sourceImage) {
        alert('Please load an image first.');
        return;
    }
    
    const canvas = AppState.canvases.frame;
    const ctx = AppState.contexts.frame;
    const size = parseInt(Elements.canvasRes.value) || 600;
    const numPins = parseInt(Elements.numPins.value) || 200;
    const startAngle = parseFloat(Elements.startAngle.value) || 0;
    const shape = Elements.frameShape.value;
    
    canvas.width = size;
    canvas.height = size;
    
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);
    
    // Calculate pins
    const frameConfig = {
        shape,
        numPins,
        startAngle,
        ellipseRatio: parseFloat(Elements.ellipseRatio.value) || 0.75,
        rectRatio: parseFloat(Elements.rectRatio.value) || 1.33
    };
    
    AppState.pinsNormalized = calculatePinPositionsNormalized(frameConfig);
    AppState.pins = coordsToPixels(AppState.pinsNormalized, size);
    
    // Draw frame outline
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    drawFrameOutline(ctx, size, frameConfig);
    
    // Draw pins
    const labelsToShow = getLabelsToShow(numPins);
    
    AppState.pins.forEach((pin, i) => {
        const pinNum = i + 1;
        const showLabel = labelsToShow.includes(pinNum);
        
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, showLabel ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = pinNum === 1 ? '#f87171' : (showLabel ? '#60a5fa' : '#64748b');
        ctx.fill();
        
        if (showLabel) {
            ctx.font = '12px "JetBrains Mono", monospace';
            ctx.fillStyle = '#f1f5f9';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const cx = size / 2;
            const cy = size / 2;
            const angle = Math.atan2(pin.y - cy, pin.x - cx);
            const lx = pin.x + Math.cos(angle) * 22;
            const ly = pin.y + Math.sin(angle) * 22;
            
            ctx.fillText(pinNum.toString(), lx, ly);
        }
    });
    
    // Direction indicator
    if (AppState.pins.length >= 10) {
        const p1 = AppState.pins[0];
        const p2 = AppState.pins[5];
        
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.font = '11px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#4ade80';
        ctx.textAlign = 'right';
        ctx.fillText('Clockwise →', size - 15, 20);
    }
    
    Elements.framePlaceholder.classList.add('hidden');
    Elements.frameConfirmation.classList.remove('hidden');
    switchPreviewTab('frame');
}

/**
 * Calculate pin positions in normalized [-1, 1] coordinates
 * Matches the Python algorithm exactly
 */
function calculatePinPositionsNormalized(config) {
    const { shape, numPins, startAngle, ellipseRatio, rectRatio } = config;
    const pins = [];
    
    // Convert start angle: 0° = top, clockwise
    const thetaClock = [];
    for (let i = 0; i < numPins; i++) {
        thetaClock.push((startAngle + 360 * i / numPins) * Math.PI / 180);
    }
    
    // Convert to standard math angle
    const angles = thetaClock.map(t => Math.PI / 2 - t);
    
    if (shape === 'circle') {
        for (let i = 0; i < numPins; i++) {
            pins.push({
                x: Math.cos(angles[i]),
                y: Math.sin(angles[i])
            });
        }
    } else if (shape === 'ellipse') {
        const ratio = ellipseRatio;
        for (let i = 0; i < numPins; i++) {
            const x = Math.cos(angles[i]);
            const y = ratio * Math.sin(angles[i]);
            const m = Math.max(Math.abs(x), Math.abs(y));
            pins.push({ x: x / m, y: y / m });
        }
    } else if (shape === 'rectangle') {
        const aspect = rectRatio;
        let halfW, halfH;
        if (aspect >= 1) {
            halfW = 1.0;
            halfH = 1.0 / aspect;
        } else {
            halfW = aspect;
            halfH = 1.0;
        }
        
        const per = 4 * (halfW + halfH);
        
        for (let i = 0; i < numPins; i++) {
            const ti = (i / numPins) * per;
            let x, y;
            
            if (ti < 2 * halfW) {
                x = -halfW + ti;
                y = halfH;
            } else if (ti < 2 * halfW + 2 * halfH) {
                x = halfW;
                y = halfH - (ti - 2 * halfW);
            } else if (ti < 4 * halfW + 2 * halfH) {
                x = halfW - (ti - (2 * halfW + 2 * halfH));
                y = -halfH;
            } else {
                x = -halfW;
                y = -halfH + (ti - (4 * halfW + 2 * halfH));
            }
            pins.push({ x, y });
        }
        
        // Rotate to match start angle
        const desiredAng = Math.PI / 2 - startAngle * Math.PI / 180;
        let bestK = 0;
        let bestDelta = Infinity;
        
        for (let k = 0; k < pins.length; k++) {
            const ang = Math.atan2(pins[k].y, pins[k].x);
            const delta = Math.abs(((ang - desiredAng + Math.PI) % (2 * Math.PI)) - Math.PI);
            if (delta < bestDelta) {
                bestDelta = delta;
                bestK = k;
            }
        }
        
        // Rotate array
        const rotated = [];
        for (let i = 0; i < numPins; i++) {
            rotated.push(pins[(i + bestK) % numPins]);
        }
        return rotated;
    }
    
    return pins;
}

/**
 * Convert normalized [-1,1] coords to pixel positions
 */
function coordsToPixels(normalized, size) {
    return normalized.map(p => ({
        x: (p.x + 1) * 0.5 * (size - 1),
        y: (1 - (p.y + 1) * 0.5) * (size - 1)
    }));
}

function drawFrameOutline(ctx, size, config) {
    const cx = size / 2;
    const cy = size / 2;
    const r = 0.98;
    const scale = size / 2;
    
    ctx.beginPath();
    
    if (config.shape === 'circle') {
        ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
    } else if (config.shape === 'ellipse') {
        const rx = r * scale;
        const ry = rx * config.ellipseRatio;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    } else if (config.shape === 'rectangle') {
        const aspect = config.rectRatio;
        let halfW, halfH;
        if (aspect >= 1) {
            halfW = r;
            halfH = r / aspect;
        } else {
            halfW = r * aspect;
            halfH = r;
        }
        const w = halfW * 2 * scale;
        const h = halfH * 2 * scale;
        ctx.rect(cx - w/2, cy - h/2, w, h);
    }
    
    ctx.stroke();
}

function getLabelsToShow(numPins) {
    const q = Math.floor(numPins / 4);
    const labels = new Set([1, q + 1, 2*q + 1, 3*q + 1, numPins]);
    const step = Math.max(1, Math.floor(numPins / 12));
    for (let i = 1; i <= numPins; i += step) labels.add(i);
    return [...labels];
}

function confirmFrame() {
    AppState.frameConfirmed = true;
    Elements.frameConfirmation.classList.add('hidden');
    updateUIState();
}

function editFrame() {
    AppState.frameConfirmed = false;
    Elements.frameConfirmation.classList.remove('hidden');
}

// ============================================
// Quality Presets
// ============================================
function handlePresetChange() {
    const preset = Elements.qualityPreset.value;
    
    if (preset === 'custom') {
        Elements.customParams.classList.remove('hidden');
        return;
    }
    
    Elements.customParams.classList.add('hidden');
    
    if (PRESETS[preset]) {
        Elements.numLines.value = PRESETS[preset].lines;
        Elements.alpha.value = PRESETS[preset].alpha;
        Elements.minPinGap.value = PRESETS[preset].minGap;
    }
    
    checkPerformanceWarning();
}

function checkPerformanceWarning() {
    const lines = parseInt(Elements.numLines.value) || 3500;
    const res = parseInt(Elements.canvasRes.value) || 600;
    const show = lines > 5000 || res > 800;
    Elements.performanceWarning.classList.toggle('hidden', !show);
}

function updateUIState() {
    const canGenerate = AppState.sourceImage && AppState.frameConfirmed && !AppState.isGenerating;
    Elements.generateBtn.disabled = !canGenerate;
    Elements.startPin.max = parseInt(Elements.numPins.value) || 200;
}

// ============================================
// Generation (Error-Based Algorithm)
// ============================================
async function startGeneration() {
    if (!AppState.sourceImage || !AppState.frameConfirmed) {
        alert('Please load an image and confirm frame settings first.');
        return;
    }
    
    AppState.isGenerating = true;
    AppState.shouldCancel = false;
    AppState.connections = [];
    
    Elements.progressContainer.classList.remove('hidden');
    Elements.resultsSection.classList.add('hidden');
    Elements.generateBtn.disabled = true;
    switchPreviewTab('result');
    
    const startTime = performance.now();
    
    try {
        updateProgress('Preparing image...', 0);
        await prepareTargetImage();
        
        updateProgress('Generating pattern...', 5);
        await generatePatternErrorBased();
        
        updateProgress('Rendering result...', 95);
        renderResult();
        
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        showResults(elapsed);
        
    } catch (error) {
        console.error('Generation error:', error);
        alert('Generation failed: ' + error.message);
    }
    
    AppState.isGenerating = false;
    Elements.progressContainer.classList.add('hidden');
    updateUIState();
}

function cancelGeneration() {
    AppState.shouldCancel = true;
    updateProgress('Cancelling...', 0);
}

function updateProgress(text, percent) {
    Elements.progressText.textContent = text;
    Elements.progressPercent.textContent = `${Math.round(percent)}%`;
    Elements.progressFill.style.width = `${percent}%`;
}

/**
 * Prepare target image as grayscale Float32Array
 * Target intensity [0,1] where 1=white, 0=black
 */
async function prepareTargetImage() {
    const img = AppState.sourceImage;
    const size = parseInt(Elements.canvasRes.value) || 600;
    const gamma = parseFloat(Elements.gamma.value) || 1.0;
    const shape = Elements.frameShape.value;
    
    // Draw to temp canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Scale and center image
    const scale = Math.max(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (size - w) / 2;
    const y = (size - h) / 2;
    
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, size, size);
    tempCtx.drawImage(img, x, y, w, h);
    
    // Get pixel data
    const imageData = tempCtx.getImageData(0, 0, size, size);
    const pixels = imageData.data;
    
    // Create target and mask
    const target = new Float32Array(size * size);
    const frameConfig = {
        shape,
        ellipseRatio: parseFloat(Elements.ellipseRatio.value) || 0.75,
        rectRatio: parseFloat(Elements.rectRatio.value) || 1.33
    };
    
    const cx = (size - 1) / 2;
    const cy = (size - 1) / 2;
    const r = 0.98;
    
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const idx = row * size + col;
            const pIdx = idx * 4;
            
            // Grayscale luminance
            let gray = (0.299 * pixels[pIdx] + 0.587 * pixels[pIdx + 1] + 0.114 * pixels[pIdx + 2]) / 255;
            
            // Apply gamma
            if (gamma !== 1.0) {
                gray = Math.pow(Math.max(0, Math.min(1, gray)), gamma);
            }
            
            // Apply frame mask - set outside to white (1.0)
            const nx = (col - cx) / (size / 2);
            const ny = (cy - row) / (size / 2);
            
            if (!isInsideFrame(nx, ny, r, frameConfig)) {
                gray = 1.0;
            }
            
            target[idx] = gray;
        }
    }
    
    AppState.targetData = target;
    
    // Recalculate pins for current size
    const numPins = parseInt(Elements.numPins.value) || 200;
    const startAngle = parseFloat(Elements.startAngle.value) || 0;
    
    AppState.pinsNormalized = calculatePinPositionsNormalized({
        shape,
        numPins,
        startAngle,
        ellipseRatio: frameConfig.ellipseRatio,
        rectRatio: frameConfig.rectRatio
    });
    AppState.pins = coordsToPixels(AppState.pinsNormalized, size);
}

function isInsideFrame(x, y, r, config) {
    if (config.shape === 'circle') {
        return (x*x + y*y) <= r*r;
    } else if (config.shape === 'ellipse') {
        const a = r;
        const b = r * config.ellipseRatio;
        return (x*x)/(a*a) + (y*y)/(b*b) <= 1;
    } else if (config.shape === 'rectangle') {
        const aspect = config.rectRatio;
        let halfW, halfH;
        if (aspect >= 1) {
            halfW = r;
            halfH = r / aspect;
        } else {
            halfW = r * aspect;
            halfH = r;
        }
        return Math.abs(x) <= halfW && Math.abs(y) <= halfH;
    }
    return false;
}

/**
 * Error-based greedy algorithm
 * Matches the Python implementation
 */
async function generatePatternErrorBased() {
    const size = parseInt(Elements.canvasRes.value) || 600;
    const numLines = parseInt(Elements.numLines.value) || 3500;
    const startPinNum = parseInt(Elements.startPin.value) || 1;
    const minGap = parseInt(Elements.minPinGap.value) || 20;
    const alpha = parseFloat(Elements.alpha.value) || 0.05;
    
    const numPins = AppState.pins.length;
    const target = AppState.targetData;
    
    // Start with white canvas
    const current = new Float32Array(size * size);
    current.fill(1.0);
    
    // Darkening factor
    const f = Math.max(0, Math.min(1, 1 - alpha));
    
    let currentPin = Math.max(1, Math.min(numPins, startPinNum));
    AppState.connections = [];
    
    // Candidate sampling count
    const numCandidates = Math.min(numPins - 1, 180);
    
    for (let step = 1; step <= numLines; step++) {
        if (AppState.shouldCancel) break;
        
        // Update progress every 100 steps
        if (step % 100 === 0) {
            const pct = 5 + (step / numLines) * 90;
            updateProgress(`Line ${step} of ${numLines}...`, pct);
            await sleep(0);
        }
        
        const i = currentPin;
        
        // Get valid candidates
        const candidates = [];
        for (let j = 1; j <= numPins; j++) {
            if (j === i) continue;
            const gap = Math.min(Math.abs(j - i), numPins - Math.abs(j - i));
            if (gap >= minGap) {
                candidates.push(j);
            }
        }
        
        if (candidates.length === 0) break;
        
        // Sample candidates for speed
        const sampled = sampleArray(candidates, numCandidates);
        
        const p0 = AppState.pins[i - 1];
        let bestJ = sampled[0];
        let bestImprove = -Infinity;
        let bestPixels = null;
        
        // Evaluate each candidate
        for (const j of sampled) {
            const p1 = AppState.pins[j - 1];
            const pixels = getLinePixels(p0.x, p0.y, p1.x, p1.y, size);
            
            // Calculate improvement in squared error
            let improve = 0;
            for (const { idx } of pixels) {
                const c = current[idx];
                const t = target[idx];
                const oldErr = c - t;
                const newErr = c * f - t;
                improve += oldErr * oldErr - newErr * newErr;
            }
            
            if (improve > bestImprove) {
                bestImprove = improve;
                bestJ = j;
                bestPixels = pixels;
            }
        }
        
        // Apply best line
        if (bestPixels && bestImprove > 0) {
            for (const { idx } of bestPixels) {
                current[idx] *= f;
            }
        }
        
        AppState.connections.push({
            step,
            startPin: i,
            endPin: bestJ
        });
        
        currentPin = bestJ;
    }
    
    // Store current canvas for rendering
    AppState.currentCanvas = current;
}

/**
 * Get pixel indices along a line
 */
function getLinePixels(x0, y0, x1, y1, size) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const steps = Math.max(2, Math.ceil(Math.max(dx, dy)));
    
    const pixels = [];
    const xStep = (x1 - x0) / steps;
    const yStep = (y1 - y0) / steps;
    
    for (let i = 0; i <= steps; i++) {
        const x = Math.round(x0 + i * xStep);
        const y = Math.round(y0 + i * yStep);
        
        if (x >= 0 && x < size && y >= 0 && y < size) {
            pixels.push({ x, y, idx: y * size + x });
        }
    }
    
    return pixels;
}

/**
 * Random sample from array
 */
function sampleArray(arr, n) {
    if (arr.length <= n) return arr;
    
    const sampled = [];
    const indices = new Set();
    
    while (sampled.length < n) {
        const idx = Math.floor(Math.random() * arr.length);
        if (!indices.has(idx)) {
            indices.add(idx);
            sampled.push(arr[idx]);
        }
    }
    
    return sampled;
}

/**
 * Render the final result
 */
function renderResult() {
    const canvas = AppState.canvases.result;
    const ctx = AppState.contexts.result;
    const size = parseInt(Elements.canvasRes.value) || 600;
    
    canvas.width = size;
    canvas.height = size;
    
    if (AppState.currentCanvas) {
        // Render from current canvas state (grayscale)
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        for (let i = 0; i < size * size; i++) {
            const v = Math.round(AppState.currentCanvas[i] * 255);
            data[i * 4] = v;
            data[i * 4 + 1] = v;
            data[i * 4 + 2] = v;
            data[i * 4 + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    Elements.resultPlaceholder.classList.add('hidden');
}

function showResults(elapsed) {
    Elements.resultsSection.classList.remove('hidden');
    Elements.statsLines.textContent = `${AppState.connections.length} lines`;
    Elements.statsTime.textContent = `${elapsed}s`;
    
    if (AppState.connections.length > 0) {
        const first = AppState.connections[0];
        const second = AppState.connections[1];
        Elements.instructionsText.innerHTML = `
            Start at pin <strong>${first.startPin}</strong>, wrap thread to pin <strong>${first.endPin}</strong>.<br>
            ${second ? `Then to pin <strong>${second.endPin}</strong>, and follow the CSV.` : ''}
        `;
    }
    
    // Populate table
    Elements.connectionsBody.innerHTML = '';
    const count = Math.min(50, AppState.connections.length);
    
    for (let i = 0; i < count; i++) {
        const conn = AppState.connections[i];
        const row = document.createElement('tr');
        row.innerHTML = `<td>${conn.step}</td><td>${conn.startPin}</td><td>${conn.endPin}</td>`;
        Elements.connectionsBody.appendChild(row);
    }
}

// ============================================
// Downloads
// ============================================
function downloadCSV() {
    if (AppState.connections.length === 0) {
        alert('No pattern generated yet.');
        return;
    }
    
    let csv = 'step,start_pin,end_pin\n';
    for (const c of AppState.connections) {
        csv += `${c.step},${c.startPin},${c.endPin}\n`;
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'string-art-pattern.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function downloadPNG() {
    const canvas = AppState.canvases.result;
    if (!canvas.width || AppState.connections.length === 0) {
        alert('No pattern generated yet.');
        return;
    }
    
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'string-art-preview.png';
    a.click();
}

// ============================================
// Utilities
// ============================================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
