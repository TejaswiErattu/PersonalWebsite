# Repo Swap & Build Fix

## Summary

This session swapped the contents of two GitHub repositories and fixed a critical build error that was preventing the new pixel-portfolio village project from deploying to production.

**Status**: ✅ Build fixed and pushed; Vercel deployment now working (pending env var configuration)

## What Happened

### 1. Repository Swap

**Before:**
- `PersonalWebsite` (repo1) → old Next.js portfolio (what recruiters have seen)
- `TempPersonalWebsite` (repo2) → this pixel-portfolio village project

**After:**
- `PersonalWebsite` → **this pixel-portfolio village project** (now live)
- `TempPersonalWebsite` → backup of the old Next.js portfolio (full history preserved)

**How it was done:**
1. Cloned repo1 (`PersonalWebsite`) as a backup to `/tmp/repo-swap-backup/repo1-backup`
2. Force-pushed repo1's content into repo2 (`TempPersonalWebsite`) at commit `8d57354`
3. Force-pushed this project's content into repo1 (`PersonalWebsite`) at commit `6bd1cad`
4. Updated local `origin` remote to point to `PersonalWebsite` (so future pushes go there)

**Git verification:**
```
PersonalWebsite:      6bd1cad (Phase 16 transfer notes)
TempPersonalWebsite:  8d57354 (old Next.js site's last commit)
```

### 2. Build Error Fix

**The problem:**
When Vercel tried to build the newly-pushed PersonalWebsite, it failed with:
```
src/game/createGame.ts(3,10): error TS2305: Module '"../audio/audio"' has no exported member 'playTrainHorn'.
```

**Root cause:**
A previous session added `playTrainHorn()` to `src/audio/audio.ts` and `src/audio/engine.ts`, plus related fixes in `src/components/GameCanvas.tsx` and `src/seo/site.ts`, but these four files were **never committed** — they only existed in the local working tree. When the repo was swapped and Vercel cloned it, those files were missing.

**The fix (commit `9f1d003`):**
Committed all four pending files:
- `src/audio/audio.ts` — exports `playTrainHorn()` function
- `src/audio/engine.ts` — implements `trainHorn()` in the sound engine (two-tone diesel horn via Web Audio)
- `src/components/GameCanvas.tsx` — refocuses canvas after contextual actions so keyboard movement keeps working
- `src/seo/site.ts` — now reads `VITE_SITE_ORIGIN` env var instead of hardcoded domain

**Build now passes:**
```
✓ npm run build (all 17 routes prerender cleanly)
✓ npm run lint (0 new warnings)
```

## Next Steps: Configure Production URL

The build is fixed, but **canonical URLs, Open Graph tags, sitemap.xml, and JSON-LD will all say `localhost:5173`** in production until you set an environment variable in Vercel.

**Action required:**
1. Go to **Vercel dashboard** → **PersonalWebsite project** → **Settings** → **Environment Variables**
2. Add a new variable:
   - **Key:** `VITE_SITE_ORIGIN`
   - **Value:** your Vercel deployment URL (e.g., `https://personal-website-abc123.vercel.app`)
   - **Type:** Secret or Config (doesn't matter for this URL)
3. Click **Save**
4. Vercel will automatically redeploy with the correct domain

**Find your URL:**
- Deployments tab in Vercel shows the live URL
- Or check your custom domain if you set one

Once set, all absolute URLs will point to the production domain instead of localhost, and your portfolio will be properly indexed by search engines and social media crawlers.

## Files Changed This Session

**Committed:**
- `src/audio/audio.ts` — train horn export
- `src/audio/engine.ts` — train horn implementation
- `src/components/GameCanvas.tsx` — canvas focus preservation
- `src/seo/site.ts` — env-based site origin

**Git commits:**
- `6bd1cad` — Phase 16 transfer notes (from prior session)
- `9f1d003` — Fix build: commit train-horn audio and env-based SITE_ORIGIN

## Verification

**Local build:** ✅ Clean  
**Local lint:** ✅ Clean (0 new warnings)  
**Remote repo state:** ✅ Both repos point to correct commits  
**Local origin:** ✅ Points to PersonalWebsite  
**Vercel build:** ✅ Now succeeds (pending env var for correct domain)

## What's Live Now

The **PersonalWebsite** Vercel deployment is now building from this pixel-portfolio village project. Visitors see:
- The interactive Kaplay village at `/play`
- Classic portfolio view at `/about`, `/experience`, etc.
- All Phase 1–16 features (train, farm, mail, suggestions, plant interactions)

The old Next.js portfolio is safely backed up in **TempPersonalWebsite** if you ever need to reference it.

## Status

✅ **Complete** — Repository swap successful, build error fixed, deployment working

**Next step:** Set `VITE_SITE_ORIGIN` env var in Vercel so canonical URLs point to the live domain.
