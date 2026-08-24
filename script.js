const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const uploadSection = document.getElementById('uploadSection');
const transformBtn = document.getElementById('transformBtn');
const resetBtn = document.getElementById('resetBtn');
const loading = document.getElementById('loading');
const resultsSection = document.getElementById('resultsSection');
const newPhotoBtn = document.getElementById('newPhoto');
const downloadAllBtn = document.getElementById('downloadAll');
const ageGrid = document.getElementById('ageGrid');

let uploadedImage = null;

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleFile(file);
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
});

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        uploadedImage = new Image();
        uploadedImage.onload = () => {
            uploadArea.style.display = 'none';
            previewContainer.style.display = 'block';
        };
        uploadedImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

transformBtn.addEventListener('click', () => {
    if (!uploadedImage) return;
    uploadSection.style.display = 'none';
    loading.style.display = 'block';

    setTimeout(() => {
        generateAllAges();
        loading.style.display = 'none';
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 2000);
});

resetBtn.addEventListener('click', resetAll);
newPhotoBtn.addEventListener('click', resetAll);

function resetAll() {
    uploadSection.style.display = 'block';
    previewContainer.style.display = 'none';
    loading.style.display = 'none';
    resultsSection.style.display = 'none';
    uploadArea.style.display = 'block';
    fileInput.value = '';
    uploadedImage = null;
}

downloadAllBtn.addEventListener('click', downloadAllCanvases);

function generateAllAges() {
    const size = 400;

    const ages = [
        { id: 'canvasChild', transform: transformChild },
        { id: 'canvasYoung', transform: transformYoung },
        { id: 'canvasAdult', transform: transformAdult },
        { id: 'canvasElderly', transform: transformElderly },
        { id: 'canvasFuture', transform: transformFuture }
    ];

    ages.forEach(({ id, transform }) => {
        const canvas = document.getElementById(id);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const srcAspect = uploadedImage.width / uploadedImage.height;
        let sx, sy, sw, sh;

        if (srcAspect > 1) {
            sh = uploadedImage.height;
            sw = sh;
            sx = (uploadedImage.width - sw) / 2;
            sy = 0;
        } else {
            sw = uploadedImage.width;
            sh = sw;
            sx = 0;
            sy = (uploadedImage.height - sh) / 2;
        }

        ctx.drawImage(uploadedImage, sx, sy, sw, sh, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        transform(imageData.data);
        ctx.putImageData(imageData, 0, 0);
    });
}

function transformChild(data) {
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        r = Math.min(255, r * 1.15 + 15);
        g = Math.min(255, g * 1.1 + 10);
        b = Math.min(255, b * 1.05 + 5);

        const brightness = (r + g + b) / 3;
        const factor = 1 + (128 - brightness) / 500;
        r = Math.min(255, r * factor);
        g = Math.min(255, g * factor);
        b = Math.min(255, b * factor);

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
    }

    smoothSkin(data, Math.floor(data.length / 4), 1.5);
}

function transformYoung(data) {
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.05 + 5);
        data[i + 1] = Math.min(255, data[i + 1] * 1.02 + 3);
        data[i + 2] = Math.min(255, data[i + 2] * 0.98);
    }
}

function transformAdult(data) {
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.02);
        data[i + 1] = Math.min(255, data[i + 1] * 1.01);
        data[i + 2] = data[i + 2] * 0.99;

        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const contrast = 1.05;
        data[i] = clamp(((data[i] / 255 - 0.5) * contrast + 0.5) * 255);
        data[i + 1] = clamp(((data[i + 1] / 255 - 0.5) * contrast + 0.5) * 255);
        data[i + 2] = clamp(((data[i + 2] / 255 - 0.5) * contrast + 0.5) * 255);
    }
}

function transformElderly(data) {
    const width = Math.floor(Math.sqrt(data.length / 4));

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const desat = 0.5;
        data[i] = clamp(r + (gray - r) * desat);
        data[i + 1] = clamp(g + (gray - g) * desat);
        data[i + 2] = clamp(b + (gray - b) * desat);

        data[i] = data[i] * 0.9 + 25;
        data[i + 1] = data[i + 1] * 0.88 + 20;
        data[i + 2] = data[i + 2] * 0.85 + 15;

        const px = (i / 4) % width;
        const py = Math.floor(i / 4 / width);

        const wrinkleChance = Math.sin(px * 0.3 + py * 0.15) * Math.cos(px * 0.1 - py * 0.25);
        if (wrinkleChance > 0.6) {
            const darken = 0.75 + Math.random() * 0.1;
            data[i] *= darken;
            data[i + 1] *= darken;
            data[i + 2] *= darken;
        }

        if (Math.random() < 0.003) {
            const spot = 0.6 + Math.random() * 0.2;
            data[i] *= spot;
            data[i + 1] *= spot;
            data[i + 2] *= spot;
        }
    }

    smoothSkin(data, Math.floor(data.length / 4), 0.8);
}

function transformFuture(data) {
    const width = Math.floor(Math.sqrt(data.length / 4));

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        data[i] = clamp(r * 0.95 + 20);
        data[i + 1] = clamp(g * 0.95 + 25);
        data[i + 2] = clamp(b * 1.1 + 40);

        const px = (i / 4) % width;
        const py = Math.floor(i / 4 / width);

        const wave = Math.sin(px * 0.05 + py * 0.03) * 0.15 + 0.85;
        data[i] *= wave;
        data[i + 1] *= wave;
        data[i + 2] = Math.min(255, data[i + 2] * (2 - wave));

        const glow = Math.sin(px * 0.08) * Math.cos(py * 0.06);
        if (glow > 0.7) {
            data[i] = Math.min(255, data[i] + 15);
            data[i + 1] = Math.min(255, data[i + 1] + 20);
            data[i + 2] = Math.min(255, data[i + 2] + 30);
        }
    }

    smoothSkin(data, Math.floor(data.length / 4), 2.0);

    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 12;
        data[i] = clamp(data[i] + noise);
        data[i + 1] = clamp(data[i + 1] + noise);
        data[i + 2] = clamp(data[i + 2] + noise);
    }
}

function smoothSkin(data, pixelCount, strength) {
    const tempR = new Float32Array(pixelCount);
    const tempG = new Float32Array(pixelCount);
    const tempB = new Float32Array(pixelCount);

    for (let i = 0; i < pixelCount; i++) {
        tempR[i] = data[i * 4];
        tempG[i] = data[i * 4 + 1];
        tempB[i] = data[i * 4 + 2];
    }

    const radius = Math.floor(strength);
    const weight = strength - radius;

    for (let i = 0; i < pixelCount; i++) {
        let rSum = tempR[i], gSum = tempG[i], bSum = tempB[i];
        let count = 1;

        for (let d = 1; d <= radius; d++) {
            if (i - d >= 0) {
                rSum += tempR[i - d];
                gSum += tempG[i - d];
                bSum += tempB[i - d];
                count++;
            }
            if (i + d < pixelCount) {
                rSum += tempR[i + d];
                gSum += tempG[i + d];
                bSum += tempB[i + d];
                count++;
            }
        }

        if (weight > 0 && i + radius + 1 < pixelCount) {
            rSum += tempR[i + radius + 1] * weight;
            gSum += tempG[i + radius + 1] * weight;
            bSum += tempB[i + radius + 1] * weight;
            count += weight;
        }

        data[i * 4] = clamp(rSum / count);
        data[i * 4 + 1] = clamp(gSum / count);
        data[i * 4 + 2] = clamp(bSum / count);
    }
}

function clamp(val) {
    return Math.max(0, Math.min(255, Math.round(val)));
}

function downloadAllCanvases() {
    const canvases = ageGrid.querySelectorAll('canvas');
    const labels = ['child', 'young-adult', 'adult', 'elderly', 'future'];

    canvases.forEach((canvas, index) => {
        const link = document.createElement('a');
        link.download = `time-machine-${labels[index]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}
