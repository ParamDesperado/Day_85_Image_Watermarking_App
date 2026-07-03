document.addEventListener('DOMContentLoaded', () => {

    // ── DOM References ────────────────────────────────────────────────
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('image-upload');
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const canvas = document.getElementById('preview-canvas');
    const ctx = canvas.getContext('2d');
    const changeImgBtn = document.getElementById('btn-change-img');

    // Mode
    const modeTextBtn = document.getElementById('mode-text');
    const modeImgBtn = document.getElementById('mode-img');
    const textControls = document.getElementById('text-controls');
    const imgControls = document.getElementById('img-controls');

    // Text controls
    const textInput = document.getElementById('wm-text');
    const colorInput = document.getElementById('wm-color');
    const colorHex = document.getElementById('color-hex');
    const fontInput = document.getElementById('wm-font');
    const weightInput = document.getElementById('wm-weight');
    const styleInput = document.getElementById('wm-style');
    const sizeInput = document.getElementById('wm-size');
    const sizeVal = document.getElementById('size-val');
    const shadowToggle = document.getElementById('wm-shadow');

    // Image watermark controls
    const wmImgUploadBtn = document.getElementById('btn-wm-img-upload');
    const wmImageUpload = document.getElementById('wm-image-upload');
    const wmImgName = document.getElementById('wm-img-name');
    const wmScaleInput = document.getElementById('wm-scale');
    const wmScaleVal = document.getElementById('scale-val');

    // Shared controls
    const opacityInput = document.getElementById('wm-opacity');
    const opacityVal = document.getElementById('opacity-val');
    const rotationInput = document.getElementById('wm-rotation');
    const rotationVal = document.getElementById('rotation-val');
    const tileToggle = document.getElementById('wm-tile');
    const posButtons = document.querySelectorAll('.pos-btn');

    // Footer
    const exportPngBtn = document.getElementById('btn-export-png');
    const exportJpgBtn = document.getElementById('btn-export-jpg');
    const resetBtn = document.getElementById('btn-reset');

    // ── State ─────────────────────────────────────────────────────────
    let mainImage = null;
    let wmImage = null;
    let originalFilename = 'image';
    let position = 'bottom-right';
    let currentMode = 'text';

    // ── Helpers ───────────────────────────────────────────────────────
    const redraw = () => { if (mainImage) drawCanvas(); };

    function hexToRgb(hex) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
            : { r: 255, g: 255, b: 255 };
    }

    function getAnchorXY(w, h, margin) {
        const mx = margin, my = margin;
        const positions = {
            'top-left': [mx + w / 2, my + h / 2],
            'top-center': [canvas.width / 2, my + h / 2],
            'top-right': [canvas.width - mx - w / 2, my + h / 2],
            'center-left': [mx + w / 2, canvas.height / 2],
            'center': [canvas.width / 2, canvas.height / 2],
            'center-right': [canvas.width - mx - w / 2, canvas.height / 2],
            'bottom-left': [mx + w / 2, canvas.height - my - h / 2],
            'bottom-center': [canvas.width / 2, canvas.height - my - h / 2],
            'bottom-right': [canvas.width - mx - w / 2, canvas.height - my - h / 2],
        };
        return positions[position] || positions['bottom-right'];
    }

    // ── Mode Switching ────────────────────────────────────────────────
    modeTextBtn.addEventListener('click', () => {
        currentMode = 'text';
        modeTextBtn.classList.add('active');
        modeImgBtn.classList.remove('active');
        textControls.style.display = 'block';
        imgControls.style.display = 'none';
        redraw();
    });

    modeImgBtn.addEventListener('click', () => {
        currentMode = 'img';
        modeImgBtn.classList.add('active');
        modeTextBtn.classList.remove('active');
        imgControls.style.display = 'block';
        textControls.style.display = 'none';
        redraw();
    });

    // ── Upload (Main Image) ───────────────────────────────────────────
    function openFilePicker() { fileInput.value = ''; fileInput.click(); }

    dropZone.addEventListener('click', openFilePicker);
    changeImgBtn.addEventListener('click', openFilePicker);

    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files[0]) loadMainImage(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', e => {
        if (e.target.files[0]) loadMainImage(e.target.files[0]);
    });

    // ── Upload (Watermark Image) ──────────────────────────────────────
    wmImgUploadBtn.addEventListener('click', () => { wmImageUpload.value = ''; wmImageUpload.click(); });
    wmImageUpload.addEventListener('change', e => {
        if (!e.target.files[0]) return;
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
        const reader = new FileReader();
        reader.onload = ev => {
            const img = new Image();
            img.onload = () => { wmImage = img; wmImgName.textContent = file.name; redraw(); };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });

    // ── Control Event Listeners ───────────────────────────────────────
    textInput.addEventListener('input', redraw);

    colorInput.addEventListener('input', e => {
        colorHex.textContent = e.target.value.toUpperCase();
        redraw();
    });

    fontInput.addEventListener('change', redraw);
    weightInput.addEventListener('change', redraw);
    styleInput.addEventListener('change', redraw);

    sizeInput.addEventListener('input', e => {
        sizeVal.textContent = e.target.value;
        updateSliderFill(e.target);
        redraw();
    });

    opacityInput.addEventListener('input', e => {
        opacityVal.textContent = e.target.value + '%';
        updateSliderFill(e.target);
        redraw();
    });

    rotationInput.addEventListener('input', e => {
        rotationVal.textContent = e.target.value + '°';
        updateSliderFill(e.target, true);
        redraw();
    });

    wmScaleInput.addEventListener('input', e => {
        wmScaleVal.textContent = e.target.value + '%';
        updateSliderFill(e.target);
        redraw();
    });

    shadowToggle.addEventListener('change', redraw);
    tileToggle.addEventListener('change', () => {
        document.getElementById('position-grid').style.opacity = tileToggle.checked ? '0.35' : '1';
        document.getElementById('position-grid').style.pointerEvents = tileToggle.checked ? 'none' : 'auto';
        redraw();
    });

    posButtons.forEach(btn => btn.addEventListener('click', e => {
        posButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        position = e.currentTarget.dataset.pos;
        redraw();
    }));

    // ── Slider fill progress ──────────────────────────────────────────
    function updateSliderFill(input, isBipolar = false) {
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        const val = parseFloat(input.value);
        let pct;
        if (isBipolar) {
            // Map -max..max → 0..100
            pct = ((val - min) / (max - min)) * 100;
        } else {
            pct = ((val - min) / (max - min)) * 100;
        }
        input.style.background = `linear-gradient(to right, var(--accent) ${pct}%, var(--input-border) ${pct}%)`;
    }

    // Init fills on page load
    [sizeInput, opacityInput, wmScaleInput].forEach(el => updateSliderFill(el));
    updateSliderFill(rotationInput, true);

    // ── Export ────────────────────────────────────────────────────────
    function exportImage(format) {
        if (!mainImage) return;
        const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
        const quality = format === 'jpg' ? 0.92 : 1.0;
        const ext = format;
        const baseName = originalFilename.replace(/\.[^.]+$/, '');
        const link = document.createElement('a');
        link.download = `${baseName}_watermarked.${ext}`;

        if (format === 'jpg') {
            // Flatten onto white background for JPEG (no alpha)
            const flat = document.createElement('canvas');
            flat.width = canvas.width;
            flat.height = canvas.height;
            const fctx = flat.getContext('2d');
            fctx.fillStyle = '#ffffff';
            fctx.fillRect(0, 0, flat.width, flat.height);
            fctx.drawImage(canvas, 0, 0);
            link.href = flat.toDataURL(mime, quality);
        } else {
            link.href = canvas.toDataURL(mime, quality);
        }
        link.click();
    }

    exportPngBtn.addEventListener('click', () => exportImage('png'));
    exportJpgBtn.addEventListener('click', () => exportImage('jpg'));

    // ── Reset ─────────────────────────────────────────────────────────
    resetBtn.addEventListener('click', () => {
        mainImage = null;
        wmImage = null;
        wmImgName.textContent = 'No file selected';
        dropZone.style.display = 'flex';
        canvasWrapper.classList.add('hidden');
        [exportPngBtn, exportJpgBtn, resetBtn].forEach(b => b.disabled = true);
    });

    // ── Load Main Image ───────────────────────────────────────────────
    function loadMainImage(file) {
        if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
        originalFilename = file.name;
        const reader = new FileReader();
        reader.onload = ev => {
            const img = new Image();
            img.onload = () => {
                mainImage = img;
                canvas.width = img.width;
                canvas.height = img.height;
                dropZone.style.display = 'none';
                canvasWrapper.classList.remove('hidden');
                [exportPngBtn, exportJpgBtn, resetBtn].forEach(b => b.disabled = false);
                document.fonts.ready.then(drawCanvas);
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }

    // ── Draw Canvas ───────────────────────────────────────────────────
    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(mainImage, 0, 0);

        const opacity = parseInt(opacityInput.value) / 100;
        const rotation = parseInt(rotationInput.value) * (Math.PI / 180);
        const isTiled = tileToggle.checked;

        ctx.save();
        ctx.globalAlpha = opacity;

        if (currentMode === 'text') {
            drawTextWatermark(rotation, isTiled);
        } else if (currentMode === 'img' && wmImage) {
            drawImageWatermark(rotation, isTiled);
        }

        ctx.restore();
    }

    // ── Text Watermark ────────────────────────────────────────────────
    function drawTextWatermark(rotation, isTiled) {
        const text = textInput.value.trim();
        if (!text) return;

        const color = colorInput.value;
        const font = fontInput.value;
        const weight = weightInput.value;
        const style = styleInput.value;
        const useShadow = shadowToggle.checked;

        // Scale font relative to image size (1920 baseline)
        const scale = Math.max(canvas.width / 1920, 0.2);
        const fontSize = Math.round(parseInt(sizeInput.value) * scale);

        ctx.font = `${style} ${weight} ${fontSize}px "${font}", sans-serif`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        const metrics = ctx.measureText(text);
        const tw = metrics.width;
        const th = fontSize;
        const margin = Math.max(30 * scale, 12);

        if (useShadow) applyShadow(color);

        if (isTiled) {
            tileDraw((x, y) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rotation);
                ctx.fillText(text, 0, 0);
                if (useShadow) { ctx.shadowBlur = 0; ctx.strokeText(text, 0, 0); }
                ctx.restore();
            }, tw, th, rotation);
        } else {
            const [x, y] = getAnchorXY(tw, th, margin);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.fillText(text, 0, 0);
            if (useShadow) { ctx.shadowBlur = 0; ctx.strokeText(text, 0, 0); }
            ctx.restore();
        }
    }

    // ── Image Watermark ───────────────────────────────────────────────
    function drawImageWatermark(rotation, isTiled) {
        const scalePct = parseInt(wmScaleInput.value) / 100;
        const tw = canvas.width * scalePct;
        const th = wmImage.height * (tw / wmImage.width);
        const margin = Math.max(30 * (canvas.width / 1920), 12);

        if (isTiled) {
            tileDraw((x, y) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rotation);
                ctx.drawImage(wmImage, -tw / 2, -th / 2, tw, th);
                ctx.restore();
            }, tw, th, rotation);
        } else {
            const [x, y] = getAnchorXY(tw, th, margin);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.drawImage(wmImage, -tw / 2, -th / 2, tw, th);
            ctx.restore();
        }
    }

    // ── Tiling Helper ─────────────────────────────────────────────────
    function tileDraw(drawFn, itemW, itemH, rotation) {
        // Estimate bounding box of rotated element
        const absRot = Math.abs(rotation);
        const diagW = Math.abs(itemW * Math.cos(absRot)) + Math.abs(itemH * Math.sin(absRot));
        const diagH = Math.abs(itemW * Math.sin(absRot)) + Math.abs(itemH * Math.cos(absRot));
        const gapX = diagW * 1.4;
        const gapY = diagH * 1.4;

        for (let y = gapY / 2; y < canvas.height + gapY; y += gapY) {
            for (let x = gapX / 2; x < canvas.width + gapX; x += gapX) {
                drawFn(x, y);
            }
        }
    }

    // ── Shadow / Stroke Helper ────────────────────────────────────────
    function applyShadow(color) {
        const rgb = hexToRgb(color);
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        const contrast = brightness > 128 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.75)';
        const scale = Math.max(canvas.width / 1920, 0.2);
        const fontSize = parseInt(sizeInput.value) * scale;

        ctx.shadowColor = contrast;
        ctx.shadowBlur = Math.max(fontSize * 0.12, 3);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.lineWidth = Math.max(fontSize * 0.025, 1);
        ctx.strokeStyle = contrast.replace('0.75', '0.25');
    }

});
