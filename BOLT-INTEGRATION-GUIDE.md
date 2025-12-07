# Bolt Project Integration Guide

This guide explains how to integrate Bolt.new projects into this Firebase hosting setup.

## Quick Start Checklist

- [ ] Export/download your Bolt project
- [ ] Place it in `public/project/` (or create a new folder like `public/project-name/`)
- [ ] Configure Vite for relative paths
- [ ] Build the project
- [ ] Copy built files to a deployment folder
- [ ] Add Firebase rewrites
- [ ] Test locally
- [ ] Deploy

## Step-by-Step Process

### 1. Download Your Bolt Project

From Bolt.new, download your project files. You'll get a Vite/React/TypeScript project structure.

### 2. Place in Public Folder

```bash
# Create a folder in public/ for your source project
public/
├── project/              # Your Bolt project source
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
```

**Important:** Keep the source project in a subfolder like `public/project/` or `public/my-app-source/` for separation of concerns.

### 3. Configure Vite for Relative Paths

Edit `vite.config.ts` in your Bolt project:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',  // ← CRITICAL: Use relative paths
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

**Why relative paths?** Firebase's rewrite system doesn't support path preservation with wildcards. Relative paths allow assets to be served directly from their physical location.

### 4. Install Dependencies & Build

```bash
cd public/project  # or whatever you named your source folder
npm install
npm run build
```

This creates a `dist/` folder with your built files.

### 5. Copy to Deployment Folder

Create a deployment folder in `public/` with a clean name (this will be your URL path):

```bash
# Windows
xcopy /E /I /Y "public\project\dist\*" "public\my-app\"

# Mac/Linux
cp -r public/project/dist/* public/my-app/
```

**Naming convention:**
- Source folder: `public/project/` or `public/my-app-source/`
- Deployment folder: `public/my-app/` (matches your desired URL)

### 6. Add Firebase Rewrites

Edit `firebase.json` and add rewrites for your new app. **Order matters** - add them BEFORE the final `**` catch-all:

```json
{
  "hosting": {
    "rewrites": [
      // ... existing rewrites ...
      
      // Your new app (add before the ** catch-all)
      {
        "source": "/my-app",
        "destination": "/my-app/index.html"
      },
      {
        "source": "/my-app/**",
        "destination": "/my-app/index.html"
      },
      
      // This must be LAST
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Pattern:**
- `/my-app` → Exact match for the root
- `/my-app/**` → Catch-all for SPA routing (React Router, etc.)
- Both point to the same `index.html`

### 7. Test Locally

```bash
# From project root
firebase serve --only hosting
```

Navigate to `http://localhost:5000/my-app` and verify:
- ✅ Page loads
- ✅ CSS styles are applied
- ✅ JavaScript runs
- ✅ No 404 errors in console
- ✅ Navigation works (if using React Router)

### 8. Deploy to Firebase

```bash
firebase deploy --only hosting
```

Your app will be live at `https://aarie.ca/my-app`

## Example: Cuzzins Project

Here's the actual configuration used for the Cuzzins Mechanical project:

### File Structure
```
public/
├── project/                    # Source (Vite/React)
│   ├── src/
│   ├── dist/                  # Build output (gitignored)
│   ├── package.json
│   └── vite.config.ts
│
└── cuzzins-project/           # Deployment (committed)
    ├── index.html
    └── assets/
        ├── index-*.css
        └── index-*.js
```

### vite.config.ts
```typescript
export default defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

### firebase.json
```json
{
  "source": "/cuzzins-project",
  "destination": "/cuzzins-project/index.html"
},
{
  "source": "/cuzzins-project/**",
  "destination": "/cuzzins-project/index.html"
}
```

### Build Commands
```bash
cd public/project
npm run build
xcopy /E /I /Y dist\* ..\cuzzins-project\
```

## Automation Script

Create a build script to automate the process.

### Windows: `public/project/deploy.bat`
```batch
@echo off
echo Building project...
call npm run build

echo Copying to deployment folder...
xcopy /E /I /Y dist\* ..\cuzzins-project\

echo ✅ Built and copied to cuzzins-project/
echo Ready to deploy with: firebase deploy --only hosting
pause
```

### Mac/Linux: `public/project/deploy.sh`
```bash
#!/bin/bash
echo "Building project..."
npm run build

echo "Copying to deployment folder..."
cp -r dist/* ../cuzzins-project/

echo "✅ Built and copied to cuzzins-project/"
echo "Ready to deploy with: firebase deploy --only hosting"
```

Make it executable:
```bash
chmod +x public/project/deploy.sh
```

## Common Issues & Solutions

### Assets Return 404 Errors

**Problem:** CSS/JS files not loading, console shows 404 errors.

**Solution:**
1. Verify `vite.config.ts` has `base: './'`
2. Ensure files were copied to deployment folder
3. Check Firebase rewrites are in correct order (before `**` catch-all)

### Assets Served as HTML (MIME Type Error)

**Problem:** Console shows "Refused to apply style... MIME type 'text/html'"

**Solution:**
- The SPA catch-all rewrite is intercepting asset requests
- Make sure your app's rewrites come BEFORE the final `**` catch-all
- Don't create separate asset rewrites - let Firebase serve them directly

### Page Shows Wrong Content

**Problem:** Navigating to `/my-app` shows the main site instead.

**Solution:**
- Check Firebase rewrites point to `/my-app/index.html`
- Verify the rewrite comes before the `**` catch-all
- Restart `firebase serve` after changing `firebase.json`

### React Router Not Working

**Problem:** Direct navigation to `/my-app/about` returns 404.

**Solution:**
- Ensure you have the `/**` catch-all rewrite for your app
- Both `/my-app` and `/my-app/**` should point to the same `index.html`

## Best Practices

### 1. Folder Naming
- **Source folder:** `public/project-name-source/` or `public/project/`
- **Deployment folder:** `public/project-name/` (matches URL)
- Keep source and deployment separate

### 2. Git Configuration
- **Commit:** Deployment folder (`public/my-app/`)
- **Ignore:** Source `dist/` folder (`public/project/dist/`)
- **Ignore:** `node_modules/` in source folder

Add to `.gitignore`:
```
public/project/dist/
public/project/node_modules/
public/*/node_modules/
```

### 3. Environment Variables
- Store in `public/project/.env` (gitignored)
- Use Vite's `import.meta.env` to access them
- Don't commit `.env` files with secrets

### 4. Build Process
- Always build before copying
- Use automation scripts to prevent mistakes
- Test locally before deploying

### 5. URL Structure
- Use clean, descriptive URLs: `/my-app`, `/services`, `/dashboard`
- Avoid deep nesting: `/apps/my-app/v1/` ❌
- Keep it simple: `/my-app` ✅

## Multiple Bolt Projects

You can host multiple Bolt projects in the same Firebase setup:

```
public/
├── project-1-source/
├── project-2-source/
├── app-one/           # Deployed at /app-one
├── app-two/           # Deployed at /app-two
└── dashboard/         # Deployed at /dashboard
```

Each needs its own rewrites in `firebase.json`:

```json
{
  "rewrites": [
    // App One
    {
      "source": "/app-one",
      "destination": "/app-one/index.html"
    },
    {
      "source": "/app-one/**",
      "destination": "/app-one/index.html"
    },
    
    // App Two
    {
      "source": "/app-two",
      "destination": "/app-two/index.html"
    },
    {
      "source": "/app-two/**",
      "destination": "/app-two/index.html"
    },
    
    // Dashboard
    {
      "source": "/dashboard",
      "destination": "/dashboard/index.html"
    },
    {
      "source": "/dashboard/**",
      "destination": "/dashboard/index.html"
    },
    
    // Must be last
    {
      "source": "**",
      "destination": "/index.html"
    }
  ]
}
```

## Troubleshooting Checklist

Before asking for help, verify:

- [ ] `vite.config.ts` has `base: './'`
- [ ] Project built successfully (`npm run build`)
- [ ] Files copied to deployment folder
- [ ] Deployment folder contains `index.html` and `assets/`
- [ ] Firebase rewrites added in correct order
- [ ] Rewrites come BEFORE the `**` catch-all
- [ ] `firebase serve` restarted after config changes
- [ ] Browser cache cleared
- [ ] Console shows no 404 or MIME type errors

## Quick Reference

### Build & Deploy Commands
```bash
# Navigate to source folder
cd public/project

# Install dependencies (first time only)
npm install

# Build the project
npm run build

# Copy to deployment folder (Windows)
xcopy /E /I /Y dist\* ..\my-app\

# Copy to deployment folder (Mac/Linux)
cp -r dist/* ../my-app/

# Test locally
cd ../..
firebase serve --only hosting

# Deploy to production
firebase deploy --only hosting
```

### Firebase Rewrite Template
```json
{
  "source": "/YOUR-APP-NAME",
  "destination": "/YOUR-APP-NAME/index.html"
},
{
  "source": "/YOUR-APP-NAME/**",
  "destination": "/YOUR-APP-NAME/index.html"
}
```

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Verify all steps were followed in order
3. Check browser console for specific errors
4. Test with `firebase serve` before deploying

---

**Last Updated:** 2025-12-06  
**Tested With:** Vite 5.4.2, React 18.3.1, Firebase Hosting
