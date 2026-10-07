# 🛡️ CyberClash: Red Team vs Blue Team Cybersecurity Simulator

An interactive, visual, and engaging cybersecurity educational simulator built for students and beginners learning cybersecurity concepts.

![CyberClash Banner](https://img.shields.io/badge/Cybersecurity-Red_vs_Blue-3b82f6?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 🌟 Overview

**CyberClash** puts students in the shoes of both a **Red Team Attacker** (Offensive Cybersecurity) and a **Blue Team Defender** (Security Operations Center / SOC). Through animated network topology maps, sound effects, real-time security event logs (SIEM), and interactive attack/defense controls, students learn how cybersecurity threats work and how modern defenses protect web infrastructure.

---

## 🎮 Key Features

- **🌐 Animated Network Topology**: Real-time canvas visualization showing packet flows between Attacker, Firewall, Web Server, Database, and Employee Workstation.
- **🔴 Red Team Offensive Control Panel**:
  1. **Password Brute-Force**: Simulates automated dictionary attacks against `/login`.
  2. **Phishing Campaign**: Sends spoofed emails targeting organization staff.
  3. **DDoS Traffic Flood**: Floods the server with botnet request waves.
  4. **SQL Injection (SQLi)**: Injects database query payloads into search inputs.
- **🔵 Blue Team Defensive Control Panel**:
  1. **Multi-Factor Authentication (MFA)** & Password Lockout Policy.
  2. **Email Gateway Security Filter** & Staff Awareness Training.
  3. **Web Application Firewall (WAF)** & Rate-Limiting Engine.
  4. **Input Sanitization** & Prepared Database Queries.
- **🔊 Interactive Web Audio Effects**: Dynamic synth sound effects for attacks, defensive blocks, alert sirens, and compromise alarms.
- **📡 Live SIEM Security Monitor**: Real-time console streaming timestamped security alerts and mitigation status.
- **💡 Educational Concept Cards**: Beginner-friendly explanations for every cyber concept.

---

## 🚀 How to Run Locally

Because CyberClash is a self-contained web application built with vanilla HTML5, CSS3, and JavaScript:

1. Double-click `index.html` to open directly in any modern browser (Chrome, Firefox, Safari, Edge).
2. Or serve it using python's built-in web server:
   ```bash
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

---

## 📤 How to Push to GitHub & Deploy to GitHub Pages

### 1. Initialize and Commit Files Locally
In your terminal, navigate to the folder and run:
```bash
git add .
git commit -m "Initial commit: CyberClash Red vs Blue Simulator"
```

### 2. Create a GitHub Repository
1. Go to [GitHub.com](https://github.com) and click **New Repository**.
2. Name your repository (e.g. `cyber-clash-simulator`).
3. Keep it **Public** and do NOT initialize with README (since we already have one).
4. Copy the repository URL (e.g., `https://github.com/YOUR-USERNAME/cyber-clash-simulator.git`).

### 3. Push Code to GitHub
Run the following commands in your terminal:
```bash
git remote add origin https://github.com/YOUR-USERNAME/cyber-clash-simulator.git
git branch -M main
git push -u origin main
```

### 4. Enable GitHub Pages (Free Hosting!)
1. Go to your repository on GitHub.
2. Click **Settings** > **Pages** (under Code and automation).
3. Under **Build and deployment** > **Branch**, select `main` branch and `/ (root)` folder.
4. Click **Save**.
5. Your website will be live in ~1 minute at `https://YOUR-USERNAME.github.io/cyber-clash-simulator/`!

---

## 🎓 Educational Learning Objectives

- Understand the difference between **Offensive Security (Red Team)** and **Defensive Security (Blue Team)**.
- Learn why **Defense in Depth** (combining multiple security controls) is vital.
- Discover how MFA prevents password guessing.
- Discover how input sanitization prevents database leaks.
- Understand the role of SIEM logging in detecting cybersecurity incidents.
