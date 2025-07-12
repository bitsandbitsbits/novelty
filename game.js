const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game configuration
const config = {
    width: 800,
    height: 600,
    backgroundColor: '#222',
    habitColor: '#888',
    noveltyColor: '#ff00ff',
    textColor: '#eee'
};

// Set canvas dimensions
canvas.width = config.width;
canvas.height = config.height;

// Game state
let novelty = 0;
const maxNovelty = 100;
let prestigeLevel = 0;
let isPaused = false;
let concrescenceReached = false;
let gameObjects = [];
let particles = [];

const narrativeChapters = [
    { threshold: 0, text: "In the beginning, there was only Habit. A universe of sameness, repeating endlessly. But within the stillness, a flicker of Potential resides, waiting to be awakened." },
    { threshold: 25, text: "The first sparks of Novelty appear. They are fragile, quickly fading back into the grey hum of Habit. But they are a start. A choice has been made." },
    { threshold: 50, text: "Connections form. The sparks of Novelty, once isolated, now find each other in the chaos. They merge, creating brief, beautiful moments of Complexity." },
    { threshold: 75, text: "The new Complex forms are more stable. They begin to generate their own Novelty, pushing back against the tide of Habit. The universe begins to wake itself up." },
    { threshold: 100, text: "Concrescence! The universe has reached a new level of complexity. Habit is overcome, and all is Novelty. A new reality dawns." }
];
let currentNarrativeIndex = 0;


// --- Audio Setup ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const masterGainNode = audioCtx.createGain();
masterGainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
masterGainNode.connect(audioCtx.destination);

let habitOscillator;

function initAudio() {
    // Stop any existing oscillator to prevent errors on reset
    if (habitOscillator) {
        try { habitOscillator.stop(); } catch(e) {}
    }
    habitOscillator = audioCtx.createOscillator();
    const habitGainNode = audioCtx.createGain();
    
    habitOscillator.type = 'sine';
    habitOscillator.frequency.setValueAtTime(80, audioCtx.currentTime);
    habitOscillator.connect(habitGainNode);
    habitGainNode.connect(masterGainNode);
    habitGainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    habitOscillator.start();
    habitOscillator.gainNode = habitGainNode; // Attach gain node for later access
}

function updateAmbientAudio() {
    if (isPaused) return;
    const noveltyRatio = Math.min(novelty / maxNovelty, 1.0);
    if (habitOscillator && habitOscillator.gainNode) {
        habitOscillator.gainNode.gain.linearRampToValueAtTime(0.15 * (1 - noveltyRatio), audioCtx.currentTime + 0.1);
    }
    if (concrescenceReached) {
         habitOscillator.gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
    }
}

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    if (type === 'click') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300 + Math.random() * 50, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.connect(gain);
        gain.connect(masterGainNode);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'merge') {
        ['C5', 'E5'].forEach(note => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            const freq = { C5: 523.25, E5: 659.25 }[note];
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
            gain.gain.linearRampToValueAtTime(0, now + 1.0);
            osc.connect(gain);
            gain.connect(masterGainNode);
            osc.start(now);
            osc.stop(now + 1.0);
        });
    } else if (type === 'decay') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.01);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.connect(gain);
        gain.connect(masterGainNode);
        osc.start(now);
        osc.stop(now + 0.2);
    }
}

// --- Particle System ---
class Particle {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type;
        if (this.type === 'ripple') { this.life = 100; this.radius = 1; this.maxRadius = 50; }
        else if (this.type === 'merge') { this.life = 100; this.vx = (Math.random() - 0.5) * 4; this.vy = (Math.random() - 0.5) * 4; this.size = Math.random() * 5 + 2; }
        else if (this.type === 'decay') { this.life = 100; this.vx = (Math.random() - 0.5) * 1; this.vy = (Math.random() - 0.5) * 1; this.size = Math.random() * 3 + 1; }
        else if (this.type === 'trail') {
            this.life = 60; // Longer life
            this.size = Math.random() * 2 + 1; // Slightly larger and variable size
            this.vx = (Math.random() - 0.5) * 0.5; // Gentle outward drift
            this.vy = (Math.random() - 0.5) * 0.5; // Gentle outward drift
        }
    }
    update() {
        this.life--;
        if (this.type === 'ripple') { this.radius += (this.maxRadius - this.radius) * 0.1; }
        else { // All other particles, including trail, will now move
            this.x += this.vx;
            this.y += this.vy;
        }
    }
    draw() {
        // Set alpha based on particle type for better visibility
        if (this.type === 'trail') {
            ctx.globalAlpha = this.life / 60; // Fades from a brighter start
        } else {
            ctx.globalAlpha = this.life / 100;
        }

        if (this.type === 'ripple') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.stroke(); }
        else if (this.type === 'merge') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
        else if (this.type === 'decay') { ctx.fillStyle = config.habitColor; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
        else if (this.type === 'trail') { ctx.fillStyle = config.noveltyColor; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
        
        ctx.globalAlpha = 1.0; // Reset global alpha
    }
}

function handleParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// --- Game Objects ---
class GameObject {
    constructor(x, y, size, type = 'habit') {
        this.x = x; this.y = y; this.size = size; this.type = type;
        this.noveltyTimer = 0;
        this.dx = (this.type === 'habit') ? (Math.random() - 0.5) * 0.5 : 0;
        this.dy = (this.type === 'habit') ? (Math.random() - 0.5) * 0.5 : 0;

        // Properties for Stage 3 orbital movement
        if (this.type === 'complex') {
            const centerX = config.width / 2;
            const centerY = config.height / 2;
            this.orbitRadius = Math.hypot(this.x - centerX, this.y - centerY);
            this.orbitAngle = Math.atan2(this.y - centerY, this.x - centerX);
            this.orbitSpeed = 0.001 + Math.random() * 0.001; // Give each a slightly different speed
        }
    }
    draw() {
        if (this.type === 'complex') {
            let radius = this.size / 1.5; // Default radius
            // Stage 2 Visuals: Pulsing Glow and Swell for Complex Forms
            if (novelty > 50) {
                const pulse = Math.sin(Date.now() * 0.005); // Slow, smooth pulse
                const glowSize = 15 + pulse * 5; // Base glow of 15, pulsing by 5
                ctx.shadowBlur = glowSize;
                ctx.shadowColor = config.noveltyColor;
                radius += pulse * 2; // Add swelling effect, max of 2 pixels
            }
            ctx.fillStyle = config.noveltyColor; ctx.beginPath(); ctx.arc(this.x + this.size / 2, this.y + this.size / 2, radius, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
            // Reset shadow for other objects
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = this.type === 'novelty' ? config.noveltyColor : config.habitColor;
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
    }
}

// --- Game Logic ---
let animationFrameId;
function init(isPrestige = false) {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    novelty = 0;
    isPaused = false;
    concrescenceReached = false;
    gameObjects = [];
    particles = [];
    currentNarrativeIndex = 0;

    if (!isPrestige) {
        prestigeLevel = 0;
    }
    document.getElementById('prestige-level').textContent = prestigeLevel;

    for (let i = 0; i < 20; i++) {
        const x = Math.random() * config.width; const y = Math.random() * config.height;
        const size = 10 + Math.random() * 20;
        gameObjects.push(new GameObject(x, y, size, 'habit'));
    }
    document.getElementById('text-guide').innerHTML = `<p>${narrativeChapters[0].text}</p>`;
    initAudio();
    gameLoop();
}

function update() {
    if (isPaused || concrescenceReached) {
        handleParticles();
        updateAmbientAudio();
        return;
    }
    
    if (novelty >= maxNovelty) {
        startConcrescence();
    }

    let objectsToRemove = [];
    for (let i = 0; i < gameObjects.length; i++) {
        const obj = gameObjects[i];

        // Stage 1 Visuals: Living Sparks
        if (novelty > 25 && obj.type === 'novelty') {
            if (Math.random() > 0.5) { // Add a bit of randomness to the trail
                // Generate particles from the border of the square, not the center
                let px, py;
                const side = Math.floor(Math.random() * 4);
                if (side === 0) { // Top edge
                    px = obj.x + Math.random() * obj.size;
                    py = obj.y;
                } else if (side === 1) { // Right edge
                    px = obj.x + obj.size;
                    py = obj.y + Math.random() * obj.size;
                } else if (side === 2) { // Bottom edge
                    px = obj.x + Math.random() * obj.size;
                    py = obj.y + obj.size;
                } else { // Left edge
                    px = obj.x;
                    py = obj.y + Math.random() * obj.size;
                }
                particles.push(new Particle(px, py, 'trail'));
            }
        }

        if (obj.type === 'novelty' || obj.type === 'complex') {
            obj.noveltyTimer--;
            if (obj.noveltyTimer <= 0) {
                playSound('decay');
                for (let k = 0; k < 10; k++) { particles.push(new Particle(obj.x + obj.size / 2, obj.y + obj.size / 2, 'decay')); }
                obj.type = 'habit'; obj.dx = (Math.random() - 0.5) * 0.5; obj.dy = (Math.random() - 0.5) * 0.5;
                if (novelty > 0) { novelty -= (obj.type === 'complex' ? 10 : 3); }
            }
        }
        if (obj.type === 'complex' && novelty < maxNovelty) { novelty += 0.02; }
        if (obj.type === 'novelty') {
            for (let j = i + 1; j < gameObjects.length; j++) {
                const otherObj = gameObjects[j];
                if (otherObj.type === 'novelty') {
                    const dist = Math.hypot(obj.x - otherObj.x, obj.y - otherObj.y);
                    if (dist < (obj.size + otherObj.size) / 2) {
                        playSound('merge');
                        for (let k = 0; k < 20; k++) { particles.push(new Particle(obj.x + (otherObj.x - obj.x) * 0.5, obj.y + (otherObj.y - obj.y) * 0.5, 'merge')); }
                        const newSize = obj.size + otherObj.size / 2;
                        const newX = (obj.x * obj.size + otherObj.x * otherObj.size) / (obj.size + otherObj.size);
                        const newY = (obj.y * obj.size + otherObj.y * otherObj.size) / (obj.size + otherObj.size);
                        const newComplexObj = new GameObject(newX, newY, newSize, 'complex');
                        newComplexObj.noveltyTimer = 300 + Math.random() * 300;
                        gameObjects.push(newComplexObj);
                        objectsToRemove.push(i, j);
                        break;
                    }
                }
            }
        }
    }
    gameObjects = gameObjects.filter((_, index) => !objectsToRemove.includes(index));
    handleParticles();
    moveObjects();
    updateAmbientAudio();
    updateNarrative();
}

function updateNarrative() {
    if (currentNarrativeIndex < narrativeChapters.length - 1) {
        const nextChapter = narrativeChapters[currentNarrativeIndex + 1];
        if (novelty >= nextChapter.threshold) {
            currentNarrativeIndex++;
            document.getElementById('text-guide').innerHTML = `<p>${nextChapter.text}</p>`;
            isPaused = true;
        }
    }
}

function draw() {
    const noveltyRatio = Math.min(novelty / maxNovelty, 1.0);
    const bgColor = `rgb(${34 + noveltyRatio * 30}, ${34}, ${34 + noveltyRatio * 30})`;
    ctx.fillStyle = concrescenceReached ? '#fff' : bgColor;
    ctx.fillRect(0, 0, config.width, config.height);

    particles.forEach(p => p.draw());
    gameObjects.forEach(obj => obj.draw());

    // Stage 2 Visuals: Gravitational Connection
    if (novelty > 50) {
        for (let i = 0; i < gameObjects.length; i++) {
            const obj = gameObjects[i];
            if (obj.type === 'novelty') {
                for (let j = i + 1; j < gameObjects.length; j++) {
                    const otherObj = gameObjects[j];
                    if (otherObj.type === 'novelty') {
                        const dist = Math.hypot(obj.x - otherObj.x, obj.y - otherObj.y);
                        if (dist < (obj.size + otherObj.size) / 2 + 20) { // A bit larger than merge distance
                            ctx.beginPath();
                            ctx.moveTo(obj.x + obj.size / 2, obj.y + obj.size / 2);
                            ctx.lineTo(otherObj.x + otherObj.size / 2, otherObj.y + otherObj.size / 2);
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        }
                    }
                }
            }
        }
    }

    if (!concrescenceReached) {
        ctx.fillStyle = '#444'; ctx.fillRect(10, 10, 200, 20);
        ctx.fillStyle = config.noveltyColor; ctx.fillRect(10, 10, (novelty / maxNovelty) * 200, 20);
        ctx.strokeStyle = '#eee'; ctx.strokeRect(10, 10, 200, 20);
    }

    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, config.width, config.height);
        ctx.fillStyle = '#fff';
        ctx.font = '50px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', config.width / 2, config.height / 2 - 20);
        ctx.font = '20px sans-serif';
        ctx.fillText('Click to continue...', config.width / 2, config.height / 2 + 20);
        ctx.textAlign = 'left';
    }
}

function gameLoop() { 
    update(); 
    draw(); 
    animationFrameId = requestAnimationFrame(gameLoop); 
}

function startConcrescence() {
    concrescenceReached = true;
    prestigeLevel++;
    document.getElementById('prestige-level').textContent = prestigeLevel;
    
    // A brief pause to enjoy the moment before reset
    setTimeout(() => {
        init(true);
    }, 3000); 

    gameObjects.forEach(obj => { obj.type = 'complex'; obj.dx = 0; obj.dy = 0; });
    document.getElementById('text-guide').innerHTML = `<p>${narrativeChapters[narrativeChapters.length - 1].text}</p>`;
}

function moveObjects() {
    const centerX = config.width / 2;
    const centerY = config.height / 2;

    gameObjects.forEach(obj => {
        if (obj.type === 'habit') {
            obj.x += obj.dx;
            obj.y += obj.dy;
            if (obj.x <= 0 || obj.x + obj.size >= config.width) obj.dx *= -1;
            if (obj.y <= 0 || obj.y + obj.size >= config.height) obj.dy *= -1;
        }
        // Stage 3 Visuals: Self-Organizing Systems
        else if (novelty > 75 && obj.type === 'complex') {
            obj.orbitAngle += obj.orbitSpeed;
            obj.x = centerX + Math.cos(obj.orbitAngle) * obj.orbitRadius - obj.size / 2;
            obj.y = centerY + Math.sin(obj.orbitAngle) * obj.orbitRadius - obj.size / 2;
        }
    });
}

// --- Event Listeners ---
document.getElementById('reset-button').addEventListener('click', (event) => {
    event.preventDefault();
    location.reload();
});

canvas.addEventListener('click', (event) => {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (isPaused) {
        isPaused = false;
        document.getElementById('text-guide').innerHTML = `<p>${narrativeChapters[currentNarrativeIndex].text}</p>`;
        return;
    }
    
    if (concrescenceReached) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    particles.push(new Particle(mouseX, mouseY, 'ripple'));
    for (let i = gameObjects.length - 1; i >= 0; i--) {
        const obj = gameObjects[i];
        if (obj.type === 'habit' && mouseX >= obj.x && mouseX <= obj.x + obj.size && mouseY >= obj.y && mouseY <= obj.y + obj.size) {
            playSound('click');
            obj.type = 'novelty'; obj.dx = 0; obj.dy = 0;
            // Prestige makes decay faster
            const baseDecayTime = 120;
            const decayReduction = prestigeLevel * 10;
            obj.noveltyTimer = (baseDecayTime - decayReduction) + Math.random() * 180;
            if (obj.noveltyTimer < 20) obj.noveltyTimer = 20; // Ensure a minimum decay time

            if (novelty < maxNovelty) { novelty += 5; }
            break;
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    init();
});
