# Install PowerShell 7+ (Required for Copilot CLI)

## Quick Install (Recommended)

### Option 1: Using Windows Package Manager (Fastest)
```cmd
winget install Microsoft.PowerShell
```

Then restart your terminal and verify:
```
pwsh --version
```

### Option 2: Using Chocolatey
```cmd
choco install powershell-core
```

Then verify:
```
pwsh --version
```

### Option 3: Direct Download
1. Visit: https://github.com/PowerShell/PowerShell/releases
2. Download: `PowerShell-7.x.x-win-x64.msi` (for 64-bit Windows)
3. Run the installer
4. Accept default options
5. Restart your terminal

## Verify Installation

Run this command:
```
pwsh --version
```

Should output something like:
```
PowerShell 7.4.0
```

## After Installation

Once installed:
1. The Copilot CLI will automatically detect pwsh
2. I'll be able to run all backend and frontend commands
3. Full dependency installation and testing will proceed

## Expected Timeline

- Installation: 2-3 minutes
- After restart: Ready to proceed

---

**Once you've installed PowerShell 7+, let me know and I'll:**
1. Install all dependencies (backend + frontend)
2. Run both applications
3. Identify all errors and issues
4. Create comprehensive fixes for Phase 4 & 5
5. Complete all remaining work automatically
