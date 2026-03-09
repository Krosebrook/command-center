# Production Native Build Guide

The Command Center is a robust Next.js application that integrates native C++ Node binaries (`better-sqlite3`) to handle local vector databases efficiently. 

Because we are wrapping this Node.js architecture into a sleek Electron shell, compiling and running the **Production Version** requires strict adherence to native Windows build tools. Running `npm run dev` forces Next.js to recompile pages continuously, eating CPU. Moving to **Production Mode** gives you the frictionless native-app experience.

---

## 1. Prerequisites (For Windows Users)
To compile native modules like `better-sqlite3` and the Electron binary wrapper locally, you must have the necessary C++ build tools installed on your Windows machine.

Open an **Administrator PowerShell** window and run:
```bash
npm install --global --production windows-build-tools
```
*(If this fails or takes too long, you can alternatively install Visual Studio Community and ensure the "Desktop development with C++" workload is checked.)*

---

## 2. Clean Installation
Since you encountered module conflicts (such as `better-sqlite3` binding errors or missing `wait-on`/`concurrently` references), the best practice is to wipe the slate clean.

From the `D:\UPE\command-center` directory, run:
```bash
# 1. Nuke the old modules and NextJS cache
npm run clean

# 2. Re-install all dependencies from scratch
npm install
```

---

## 3. The Production Protocol

Do not use `npm run dev` long-term. You should compile the static React UI and server routes for maximum efficiency.

### Step A: Build Next.js
This command traverses the entire source code, runs TypeScript linting, creates the optimized CSS tailwind bundles, and produces the final Node server runtime inside the `.next` folder.
```bash
npm run build:prod
```

### Step B: Run the Command Center Native Application 
Once the build is complete, use this command to boot the optimized Node server silently alongside the borderless Electron Chromium window:
```bash
npm run start:prod
```

Instantly, the Electron HUD will pop onto your screen. You can now press `Ctrl+Shift+Space` globally on your OS to summon the app!

---

## Troubleshooting Guide

### Issue: `wait-on` or `electron` command not found
**Why?** The dev dependencies did not install properly.
**Fix:** Run `npm install wait-on concurrently electron --save-dev` manually.

### Issue: `better-sqlite3` throws an architecture module mismatch or "The specified module could not be found."
**Why?** You installed dependencies in WSL/Linux, but are trying to run the app natively on Windows (or vice versa), or your Node version changed.
**Fix:** Force Node to rebuild the C++ bindings for your current operating system:
```bash
npm rebuild better-sqlite3 --build-from-source
```

### Issue: "EADDRINUSE: address already in use :::3000"
**Why?** There is already a Node or Next.js development server running stubbornly in the background.
**Fix:** Open task manager and kill any stray `node.exe` processes, or run:
```powershell
Stop-Process -Name "node" -Force
```
