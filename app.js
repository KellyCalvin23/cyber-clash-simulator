// CyberClash: Red vs Blue Simulator Logic

// Global State
const state = {
    health: 100,
    blueScore: 0,
    redScore: 0,
    activeThreats: 0,
    soundEnabled: true,
    defenses: {
        mfa: false,
        phish: false,
        waf: false,
        sqli: false
    }
};

// Canvas & Topology Setup
let canvas, ctx;
let packets = [];
let particles = [];
let animFrameId;

// Topology Node Positions (Relative %)
const nodes = {
    attacker: { x: 0.1, y: 0.5, name: 'Attacker (Red)', icon: '🔴', type: 'red' },
    firewall: { x: 0.35, y: 0.5, name: 'WAF & Firewall', icon: '🛡️', type: 'blue' },
    server: { x: 0.65, y: 0.5, name: 'Web Server', icon: '🖥️', type: 'server' },
    db: { x: 0.88, y: 0.3, name: 'Database', icon: '🗄️', type: 'db' },
    employee: { x: 0.88, y: 0.7, name: 'Employee PC', icon: '💻', type: 'user' }
};

// --- WEB AUDIO API SYSTEM ---
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!state.soundEnabled) return;
    try {
        initAudio();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        const now = audioCtx.currentTime;

        if (type === 'attack') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'defend') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'blocked') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.setValueAtTime(900, now + 0.05);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'breach') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.4);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } else if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        }
    } catch (e) {
        console.warn('Audio Error:', e);
    }
}

// Sound Toggle Handler
document.addEventListener('DOMContentLoaded', () => {
    const soundBtn = document.getElementById('soundToggle');
    soundBtn.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        soundBtn.innerHTML = state.soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
        playSound('click');
    });

    const resetBtn = document.getElementById('resetBtn');
    resetBtn.addEventListener('click', resetSim);

    initCanvas();
    animateTopology();
    logSIEM('System security initialized. Defensive monitors active.', 'log-system');
});

// Canvas Setup
function initCanvas() {
    canvas = document.getElementById('networkCanvas');
    ctx = canvas.getContext('2d');

    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
    resize();
    window.addEventListener('resize', resize);
}

// Topology Render Loop
function animateTopology() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw Network Connection Lines
    drawConnection(nodes.attacker, nodes.firewall, '#ef4444');
    drawConnection(nodes.firewall, nodes.server, '#3b82f6');
    drawConnection(nodes.server, nodes.db, '#06b6d4');
    drawConnection(nodes.server, nodes.employee, '#a855f7');

    // 2. Render Nodes
    for (const key in nodes) {
        const n = nodes[key];
        const nx = n.x * w;
        const ny = n.y * h;

        // Node Glow Effect
        ctx.beginPath();
        ctx.arc(nx, ny, 28, 0, Math.PI * 2);
        if (key === 'firewall' && isAnyDefenseActive()) {
            ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
            ctx.strokeStyle = '#3b82f6';
        } else if (key === 'server' && state.health < 50) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
            ctx.strokeStyle = '#ef4444';
        } else {
            ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
            ctx.strokeStyle = '#475569';
        }
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Node Icon & Label
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.icon, nx, ny);

        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(n.name, nx, ny + 40);
    }

    // 3. Render Floating Traffic Packets
    for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.progress += p.speed;

        const startX = nodes[p.from].x * w;
        const startY = nodes[p.from].y * h;
        const targetX = nodes[p.to].x * w;
        const targetY = nodes[p.to].y * h;

        const currentX = startX + (targetX - startX) * p.progress;
        const currentY = startY + (targetY - startY) * p.progress;

        // Check if packet reached firewall node
        if (p.to === 'firewall' && p.progress >= 1) {
            if (p.blocked) {
                // Trigger Defense Block Effect
                createExplosion(currentX, currentY, '#3b82f6');
                playSound('blocked');
                logSIEM(`🛡️ DEFENSE SUCCESS: Firewall blocked ${p.attackType.toUpperCase()} attack packet!`, 'log-blue');
                updateScores(15, 0);
                packets.splice(i, 1);
                continue;
            } else {
                // Forward packet to actual target
                p.from = 'firewall';
                p.to = p.finalTarget;
                p.progress = 0;
                continue;
            }
        }

        // Check if packet reached final target
        if (p.progress >= 1) {
            // Breach success!
            createExplosion(currentX, currentY, '#ef4444');
            playSound('breach');
            logSIEM(`💥 CRITICAL BREACH: ${p.attackType.toUpperCase()} exploit compromised ${p.finalTarget.toUpperCase()}!`, 'log-red');
            damageServer(p.damage);
            updateScores(0, 20);
            packets.splice(i, 1);
            continue;
        }

        // Draw Packet
        ctx.beginPath();
        ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // 4. Render Particle Explosions
    for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.05;

        if (pt.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.life;
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    animFrameId = requestAnimationFrame(animateTopology);
}

function drawConnection(n1, n2, color) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.beginPath();
    ctx.moveTo(n1.x * w, n1.y * h);
    ctx.lineTo(n2.x * w, n2.y * h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 4 + 2,
            color: color,
            life: 1.0
        });
    }
}

function isAnyDefenseActive() {
    return Object.values(state.defenses).some(val => val === true);
}

// --- ATTACK TRIGGER LOGIC (RED TEAM) ---
function triggerAttack(type) {
    playSound('attack');
    let attackConfig = {
        type: type,
        color: '#ef4444',
        finalTarget: 'server',
        blocked: false,
        damage: 20
    };

    if (type === 'brute_force') {
        attackConfig.finalTarget = 'server';
        attackConfig.blocked = state.defenses.mfa;
        logSIEM('⚠️ RED TEAM: Initiated Password Brute-Force attack wave against /login.', 'log-red');
    } else if (type === 'phishing') {
        attackConfig.finalTarget = 'employee';
        attackConfig.blocked = state.defenses.phish;
        attackConfig.damage = 25;
        logSIEM('⚠️ RED TEAM: Dispatched spoofed CEO Phishing Email campaign to employees.', 'log-red');
    } else if (type === 'ddos') {
        attackConfig.finalTarget = 'server';
        attackConfig.blocked = state.defenses.waf;
        attackConfig.damage = 30;
        logSIEM('⚠️ RED TEAM: Launched DDoS Botnet Traffic Flood (10,000 req/sec).', 'log-red');
        
        // Spawn multiple packets for DDoS
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                packets.push({
                    from: 'attacker',
                    to: 'firewall',
                    finalTarget: 'server',
                    attackType: 'ddos',
                    color: '#f59e0b',
                    speed: 0.02,
                    progress: 0,
                    blocked: state.defenses.waf,
                    damage: 6
                });
            }, i * 150);
        }
        return;
    } else if (type === 'sqli') {
        attackConfig.finalTarget = 'db';
        attackConfig.blocked = state.defenses.sqli;
        attackConfig.damage = 35;
        logSIEM("⚠️ RED TEAM: Sent SQL Payload (`' OR '1'='1`) into web search form.", 'log-red');
    }

    packets.push({
        from: 'attacker',
        to: 'firewall',
        finalTarget: attackConfig.finalTarget,
        attackType: type,
        color: attackConfig.color,
        speed: 0.015,
        progress: 0,
        blocked: attackConfig.blocked,
        damage: attackConfig.damage
    });
}

// --- DEFENSE TOGGLE LOGIC (BLUE TEAM) ---
function toggleDefense(type, active) {
    state.defenses[type] = active;
    playSound('defend');

    const names = {
        mfa: 'Multi-Factor Authentication (MFA)',
        phish: 'Email Gateway & Awareness Training',
        waf: 'WAF & Rate-Limiting Firewall',
        sqli: 'Input Sanitization & Prepared Queries'
    };

    if (active) {
        logSIEM(`🔵 BLUE TEAM: Activated ${names[type]}. Security controls enforced!`, 'log-blue');
    } else {
        logSIEM(`⚠️ BLUE TEAM WARNING: Deactivated ${names[type]}. System vulnerable!`, 'log-alert');
    }
}

// --- STATE UPDATES & SCORES ---
function damageServer(amount) {
    state.health = Math.max(0, state.health - amount);
    const bar = document.getElementById('healthBar');
    const val = document.getElementById('healthValue');
    
    bar.style.width = state.health + '%';
    val.textContent = state.health + '%';

    if (state.health < 30) {
        bar.style.backgroundColor = '#ef4444';
        document.getElementById('serverStatusBadge').className = 'badge badge-danger';
        document.getElementById('serverStatusBadge').textContent = 'CRITICAL UNDER ATTACK';
    } else if (state.health < 70) {
        bar.style.backgroundColor = '#f59e0b';
        document.getElementById('serverStatusBadge').className = 'badge badge-warning';
        document.getElementById('serverStatusBadge').textContent = 'WARNING HIGH LOAD';
    } else {
        bar.style.backgroundColor = '#10b981';
        document.getElementById('serverStatusBadge').className = 'badge badge-success';
        document.getElementById('serverStatusBadge').textContent = 'SYSTEM ONLINE';
    }
}

function updateScores(bluePts, redPts) {
    state.blueScore += bluePts;
    state.redScore += redPts;
    document.getElementById('blueScore').textContent = state.blueScore;
    document.getElementById('redScore').textContent = state.redScore;
}

function resetSim() {
    playSound('click');
    state.health = 100;
    state.blueScore = 0;
    state.redScore = 0;
    packets = [];
    particles = [];
    
    // Reset switches
    for (const key in state.defenses) {
        state.defenses[key] = false;
        const el = document.getElementById(`def_${key}`);
        if (el) el.checked = false;
    }

    damageServer(0);
    document.getElementById('blueScore').textContent = '0';
    document.getElementById('redScore').textContent = '0';
    logSIEM('[RESET] Simulation environment restored to baseline.', 'log-system');
}

// --- SIEM LOGGER ---
function logSIEM(message, className = 'log-system') {
    const consoleBody = document.getElementById('consoleBody');
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${className}`;
    entry.textContent = `[${time}] ${message}`;
    
    consoleBody.appendChild(entry);
    consoleBody.scrollTop = consoleBody.scrollHeight;
}

function clearLogs() {
    playSound('click');
    document.getElementById('consoleBody').innerHTML = '<div class="log-entry log-system">[CONSOLE CLEARED]</div>';
}

// --- EDUCATIONAL CONCEPTS MODAL ---
const conceptsInfo = {
    brute_force: {
        title: '🔓 Password Brute-Force Attack',
        content: `
            <p><strong>What is it?</strong> A brute-force attack is when an attacker uses automated computer scripts to try thousands or millions of common password combinations (like <em>"123456"</em> or <em>"password"</em>) until they guess the right one.</p>
            <p><strong>Red Team Goal:</strong> Gain unauthorized login access to a user or admin account.</p>
            <p><strong>Blue Team Defense (MFA):</strong> Multi-Factor Authentication requires a 2nd step (like a code sent to your phone). Even if the attacker guesses the password, they can't log in without your phone!</p>
        `
    },
    phishing: {
        title: '🎣 Phishing Email Campaign',
        content: `
            <p><strong>What is it?</strong> Phishing is when attackers send deceptive fake emails impersonating someone trustworthy (like a principal, bank, or gaming platform) to trick you into clicking a bad link or typing your password.</p>
            <p><strong>Red Team Goal:</strong> Trick unsuspecting employees into handing over secret login credentials.</p>
            <p><strong>Blue Team Defense:</strong> Email security filters inspect links in incoming mail, and security awareness training teaches users to spot red flags in fake emails.</p>
        `
    },
    ddos: {
        title: '⚡ DDoS (Distributed Denial of Service) Flood',
        content: `
            <p><strong>What is it?</strong> A DDoS attack uses a network of infected computers (a botnet) to send massive waves of fake traffic to a website all at once, overwhelming the server so real users cannot access it.</p>
            <p><strong>Red Team Goal:</strong> Crash the website or cause severe slowdowns.</p>
            <p><strong>Blue Team Defense (WAF & Rate Limiting):</strong> A Web Application Firewall acts like a smart traffic guard. It identifies abnormal spikes in bot traffic and drops those fake requests before they reach the server.</p>
        `
    },
    sqli: {
        title: '💉 SQL Injection (SQLi) Exploit',
        content: `
            <p><strong>What is it?</strong> Databases store website data using a computer language called SQL. If a website search box isn't secured, an attacker can type sneaky database commands (like <code>' OR 1=1 --</code>) into the box to trick the database into revealing secret data!</p>
            <p><strong>Red Team Goal:</strong> Bypass login checks or leak secret database tables.</p>
            <p><strong>Blue Team Defense:</strong> Input sanitization and prepared queries clean all user inputs, forcing the database to treat inputs strictly as harmless plain text.</p>
        `
    }
};

function showInfo(key) {
    playSound('click');
    const modal = document.getElementById('infoModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');

    if (conceptsInfo[key]) {
        title.innerHTML = conceptsInfo[key].title;
        body.innerHTML = conceptsInfo[key].content;
        modal.classList.remove('hidden');
    }
}

function closeModal() {
    playSound('click');
    document.getElementById('infoModal').classList.add('hidden');
}
