// CyberSOC: Red vs Blue SIEM Simulator Engine

// Global State
const state = {
    viewMode: 'dual',
    isAttacking: false,
    attackInterval: null,
    targetUser: 'admin@company.com',
    originIp: '185.220.101.5',
    location: 'Frankfurt, Germany',
    flag: '🇩🇪',
    blockedIps: [],
    siemScore: 100,
    soundEnabled: true,
    attemptsCount: 0
};

// Cross-Window Broadcast Synchronization
const channel = new BroadcastChannel('cyber_soc_channel');

channel.onmessage = (event) => {
    const { type, data } = event.data;
    if (type === 'START_ATTACK') {
        handleIncomingAttack(data);
    } else if (type === 'STOP_ATTACK') {
        handleStopAttack(data);
    } else if (type === 'BLOCK_IP') {
        handleIpBlocked(data);
    } else if (type === 'RESET') {
        resetLocalState();
    }
};

// Password Dictionary for Brute Force
const passwordDictionary = [
    "123456", "password", "123456789", "picture1", "password1",
    "12345", "12345678", "qwerty", "111111", "welcome",
    "admin123", "letmein", "monkey", "dragon", "baseball",
    "mustang", "shadow", "master", "michael", "superman",
    "654321", "amber", "iloveyou", "trustno1", "welcome2026"
];

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

        if (type === 'alert') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.linearRampToValueAtTime(400, now + 0.3);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'block') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.setValueAtTime(600, now + 0.1);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(700, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        }
    } catch (e) {
        console.warn('Audio error:', e);
    }
}

// --- DOM INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initGeoCanvas();
    startGeoMapLoop();

    const soundBtn = document.getElementById('soundToggle');
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            state.soundEnabled = !state.soundEnabled;
            soundBtn.innerHTML = state.soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
            playSound('click');
        });
    }

    logSiem('SIEM Agent initialized. Waiting for threat events...', 'log-info');
});

// View Switcher
function switchView(mode) {
    state.viewMode = mode;
    document.body.className = `view-mode-${mode}`;
    
    const btns = document.querySelectorAll('.view-btn');
    btns.forEach(b => b.classList.remove('active'));
    
    if (mode === 'dual') btns[0].classList.add('active');
    if (mode === 'red') btns[1].classList.add('active');
    if (mode === 'blue') btns[2].classList.add('active');

    playSound('click');
    setTimeout(resizeGeoCanvas, 100);
}

// --- RED TEAM BRUTE FORCE ENGINE ---
function startBruteForce() {
    const userSel = document.getElementById('targetUserSelect').value;
    const originRaw = document.getElementById('originIpSelect').value;
    const [ip, loc, flag] = originRaw.split('|');

    state.targetUser = userSel;
    state.originIp = ip;
    state.location = loc;
    state.flag = flag;

    // Check if IP is already blocked
    if (state.blockedIps.includes(ip)) {
        appendRedTerminal(`❌ [ERROR] Connection refused! IP ${ip} is blocked by target firewall.`, 'term-blocked');
        return;
    }

    state.isAttacking = true;
    state.attemptsCount = 0;
    
    document.getElementById('launchAttackBtn').classList.add('hidden');
    document.getElementById('stopAttackBtn').classList.remove('hidden');

    appendRedTerminal(`🚀 [INITIATING] Starting Brute Force attack wave against ${userSel}...`, 'term-system');
    appendRedTerminal(`🌐 Attacker Origin: ${ip} (${loc} ${flag})`, 'term-system');

    // Broadcast to Blue Team
    const attackPayload = {
        targetUser: userSel,
        originIp: ip,
        location: loc,
        flag: flag
    };
    channel.postMessage({ type: 'START_ATTACK', data: attackPayload });
    handleIncomingAttack(attackPayload);

    let dictIdx = 0;
    state.attackInterval = setInterval(() => {
        if (!state.isAttacking) return;
        
        // Re-check block status
        if (state.blockedIps.includes(state.originIp)) {
            stopBruteForce('IP_BLOCKED');
            return;
        }

        const pass = passwordDictionary[dictIdx % passwordDictionary.length];
        dictIdx++;
        state.attemptsCount++;

        const time = new Date().toLocaleTimeString();
        appendRedTerminal(`[${time}] POST /login user=${userSel} pass=${pass} -> 401 Unauthorized`, 'term-attempt');
    }, 350);
}

function stopBruteForce(reason = 'MANUAL') {
    state.isAttacking = false;
    if (state.attackInterval) clearInterval(state.attackInterval);

    document.getElementById('launchAttackBtn').classList.remove('hidden');
    document.getElementById('stopAttackBtn').classList.add('hidden');

    if (reason === 'IP_BLOCKED') {
        appendRedTerminal(`🚫 [ATTACK HALTED] Connection reset by peer! Target firewall blocked IP ${state.originIp}.`, 'term-blocked');
    } else {
        appendRedTerminal(`⏹️ [ATTACK STOPPED] Brute Force attack wave terminated.`, 'term-system');
    }

    channel.postMessage({ type: 'STOP_ATTACK', data: { reason } });
    handleStopAttack({ reason });
}

function appendRedTerminal(msg, className = 'term-system') {
    const term = document.getElementById('redTerminal');
    const line = document.createElement('div');
    line.className = `term-line ${className}`;
    line.textContent = msg;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
}

function clearRedTerminal() {
    playSound('click');
    document.getElementById('redTerminal').innerHTML = '<div class="term-line term-system">[TERMINAL CLEARED]</div>';
}

// --- BLUE TEAM SIEM ENGINE ---
function handleIncomingAttack(data) {
    state.isAttacking = true;
    state.targetUser = data.targetUser;
    state.originIp = data.originIp;
    state.location = data.location;
    state.flag = data.flag;

    playSound('alert');

    // Update SIEM Metrics
    document.getElementById('activeAlertsCount').textContent = '1';
    document.getElementById('threatPulse').className = 'pulse-indicator red';
    document.getElementById('threatLevelText').textContent = 'THREAT LEVEL: CRITICAL';

    // Show Incident Banner
    const banner = document.getElementById('incidentBanner');
    document.getElementById('alertTimestamp').textContent = new Date().toLocaleTimeString();
    document.getElementById('alertTargetUser').textContent = data.targetUser;
    document.getElementById('alertSourceIp').textContent = data.originIp;
    document.getElementById('alertLocation').textContent = `${data.location} ${data.flag}`;
    document.getElementById('alertRate').textContent = '350 attempts / min';

    banner.classList.remove('hidden');

    logSiem(`🚨 [HIGH SEVERITY ALERT] Brute-force velocity threshold breached for user ${data.targetUser} from IP ${data.originIp} (${data.location} ${data.flag})`, 'log-high');
}

function handleStopAttack(data) {
    state.isAttacking = false;
    if (!state.blockedIps.includes(state.originIp)) {
        document.getElementById('activeAlertsCount').textContent = '0';
        document.getElementById('threatPulse').className = 'pulse-indicator green';
        document.getElementById('threatLevelText').textContent = 'THREAT LEVEL: LOW';
    }
}

// --- BLUE TEAM DEFENSE ACTION: BLOCK IP ---
function blockAttackerIp() {
    const ipToBlock = state.originIp;
    
    if (!state.blockedIps.includes(ipToBlock)) {
        state.blockedIps.push(ipToBlock);
        state.siemScore += 50;
    }

    playSound('block');

    // Broadcast Block IP to Red Team
    channel.postMessage({ type: 'BLOCK_IP', data: { ip: ipToBlock } });
    handleIpBlocked({ ip: ipToBlock });
}

function handleIpBlocked(data) {
    const ip = data.ip;
    if (!state.blockedIps.includes(ip)) {
        state.blockedIps.push(ip);
    }

    // Stop red team attack if running on this IP
    if (state.originIp === ip) {
        state.isAttacking = false;
        if (state.attackInterval) clearInterval(state.attackInterval);
        document.getElementById('launchAttackBtn').classList.remove('hidden');
        document.getElementById('stopAttackBtn').classList.add('hidden');
        appendRedTerminal(`🚫 [CONNECTION REFUSED] Your IP ${ip} has been blocked by Blue Team Firewall!`, 'term-blocked');
    }

    // Update SIEM UI
    document.getElementById('incidentBanner').classList.add('hidden');
    document.getElementById('activeAlertsCount').textContent = '0';
    document.getElementById('threatPulse').className = 'pulse-indicator green';
    document.getElementById('threatLevelText').textContent = 'THREAT LEVEL: MITIGATED';
    document.getElementById('blockedIpCount').textContent = state.blockedIps.length;
    document.getElementById('siemScore').textContent = state.siemScore;

    renderBlocklistTable();
    logSiem(`🛡️ [MITIGATED] Firewall rule deployed. IP ${ip} blocked from network. Attack stopped!`, 'log-mitigated');
}

function dismissAlert() {
    playSound('click');
    document.getElementById('incidentBanner').classList.add('hidden');
}

function unblockIp(ip) {
    playSound('click');
    state.blockedIps = state.blockedIps.filter(item => item !== ip);
    document.getElementById('blockedIpCount').textContent = state.blockedIps.length;
    renderBlocklistTable();
    logSiem(`⚠️ [FIREWALL RULE REMOVED] IP ${ip} unblocked.`, 'log-warn');
}

function renderBlocklistTable() {
    const tbody = document.getElementById('blocklistTableBody');
    if (state.blockedIps.length === 0) {
        tbody.innerHTML = '<tr id="emptyBlocklistRow"><td colspan="4" class="text-center text-muted">No IP addresses blocked yet.</td></tr>';
        return;
    }

    tbody.innerHTML = state.blockedIps.map(ip => `
        <tr>
            <td><code>${ip}</code></td>
            <td>${state.location} ${state.flag}</td>
            <td>Brute Force Attack</td>
            <td>
                <button class="btn btn-ghost btn-sm" onclick="unblockIp('${ip}')">Unblock</button>
            </td>
        </tr>
    `).join('');
}

function logSiem(msg, className = 'log-info') {
    const consoleBody = document.getElementById('siemConsole');
    const time = new Date().toLocaleTimeString();
    const row = document.createElement('div');
    row.className = `log-row ${className}`;
    row.textContent = `[${time}] ${msg}`;
    consoleBody.appendChild(row);
    consoleBody.scrollTop = consoleBody.scrollHeight;
}

function clearSiemLogs() {
    playSound('click');
    document.getElementById('siemConsole').innerHTML = '<div class="log-row log-info">[SIEM LOGS CLEARED]</div>';
}

function resetSim() {
    playSound('click');
    state.isAttacking = false;
    if (state.attackInterval) clearInterval(state.attackInterval);
    state.blockedIps = [];
    state.siemScore = 100;
    
    document.getElementById('launchAttackBtn').classList.remove('hidden');
    document.getElementById('stopAttackBtn').classList.add('hidden');
    document.getElementById('incidentBanner').classList.add('hidden');
    document.getElementById('activeAlertsCount').textContent = '0';
    document.getElementById('blockedIpCount').textContent = '0';
    document.getElementById('siemScore').textContent = '100';
    document.getElementById('threatPulse').className = 'pulse-indicator green';
    document.getElementById('threatLevelText').textContent = 'THREAT LEVEL: LOW';

    renderBlocklistTable();
    clearRedTerminal();
    clearSiemLogs();
    logSiem('[SYSTEM RESET] SIEM baseline restored.', 'log-info');

    channel.postMessage({ type: 'RESET' });
}

function resetLocalState() {
    state.isAttacking = false;
    if (state.attackInterval) clearInterval(state.attackInterval);
    state.blockedIps = [];
    state.siemScore = 100;
}

// --- GEOGRAPHIC THREAT CANVAS RENDERER ---
let geoCanvas, geoCtx;
let mapAnimId;

function initGeoCanvas() {
    geoCanvas = document.getElementById('geoCanvas');
    if (!geoCanvas) return;
    geoCtx = geoCanvas.getContext('2d');
    resizeGeoCanvas();
    window.addEventListener('resize', resizeGeoCanvas);
}

function resizeGeoCanvas() {
    if (!geoCanvas) return;
    const rect = geoCanvas.parentElement.getBoundingClientRect();
    geoCanvas.width = rect.width;
    geoCanvas.height = rect.height;
}

function startGeoMapLoop() {
    function render() {
        if (!geoCtx) return;
        const w = geoCanvas.width;
        const h = geoCanvas.height;

        geoCtx.clearRect(0, 0, w, h);

        // Draw stylized world grid background
        geoCtx.strokeStyle = '#1e293b';
        geoCtx.lineWidth = 0.5;
        for (let x = 0; x < w; x += 40) {
            geoCtx.beginPath();
            geoCtx.moveTo(x, 0);
            geoCtx.lineTo(x, h);
            geoCtx.stroke();
        }
        for (let y = 0; y < h; y += 30) {
            geoCtx.beginPath();
            geoCtx.moveTo(0, y);
            geoCtx.lineTo(w, y);
            geoCtx.stroke();
        }

        // Target Node (Corporate Datacenter / London UK)
        const targetPos = { x: w * 0.52, y: h * 0.4 };

        // Draw Target Datacenter Node
        geoCtx.beginPath();
        geoCtx.arc(targetPos.x, targetPos.y, 8, 0, Math.PI * 2);
        geoCtx.fillStyle = '#3b82f6';
        geoCtx.shadowColor = '#3b82f6';
        geoCtx.shadowBlur = 12;
        geoCtx.fill();
        geoCtx.shadowBlur = 0;

        geoCtx.font = '11px Inter, sans-serif';
        geoCtx.fillStyle = '#94a3b8';
        geoCtx.fillText('Corporate HQ (London)', targetPos.x - 45, targetPos.y + 22);

        // If attack is active, draw incoming threat vector from origin IP location
        if (state.isAttacking && !state.blockedIps.includes(state.originIp)) {
            // Origin Location mapping coordinates
            let originPos = { x: w * 0.48, y: h * 0.38 }; // Germany default
            if (state.originIp.startsWith('45.')) originPos = { x: w * 0.65, y: h * 0.35 }; // Russia
            if (state.originIp.startsWith('103.')) originPos = { x: w * 0.82, y: h * 0.48 }; // China
            if (state.originIp.startsWith('198.')) originPos = { x: w * 0.25, y: h * 0.42 }; // USA

            // Draw Threat Origin Pulsing Dot
            const time = Date.now() * 0.005;
            const pulseRadius = 10 + Math.sin(time) * 4;

            geoCtx.beginPath();
            geoCtx.arc(originPos.x, originPos.y, pulseRadius, 0, Math.PI * 2);
            geoCtx.fillStyle = 'rgba(239, 68, 68, 0.3)';
            geoCtx.fill();

            geoCtx.beginPath();
            geoCtx.arc(originPos.x, originPos.y, 6, 0, Math.PI * 2);
            geoCtx.fillStyle = '#ef4444';
            geoCtx.shadowColor = '#ef4444';
            geoCtx.shadowBlur = 15;
            geoCtx.fill();
            geoCtx.shadowBlur = 0;

            // Curved Threat Vector Line
            geoCtx.beginPath();
            geoCtx.moveTo(originPos.x, originPos.y);
            const cpX = (originPos.x + targetPos.x) / 2;
            const cpY = Math.min(originPos.y, targetPos.y) - 40;
            geoCtx.quadraticCurveTo(cpX, cpY, targetPos.x, targetPos.y);
            geoCtx.strokeStyle = '#ef4444';
            geoCtx.lineWidth = 2;
            geoCtx.setLineDash([6, 6]);
            geoCtx.stroke();
            geoCtx.setLineDash([]);

            geoCtx.font = '11px Fira Code, sans-serif';
            geoCtx.fillStyle = '#f87171';
            geoCtx.fillText(`⚡ ${state.originIp} (${state.location})`, originPos.x - 30, originPos.y - 14);
        }

        mapAnimId = requestAnimationFrame(render);
    }
    render();
}
