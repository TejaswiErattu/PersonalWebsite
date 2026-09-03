/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * The site's real deployment origin (e.g. `https://my-project.vercel.app`),
   * no trailing slash. Read by `seo/site.ts`'s `SITE_ORIGIN` — see that file
   * for why this is an env var rather than a hardcoded constant. Unset in
   * every environment until a real deployment exists; set it in Vercel's
   * project settings (or a local `.env.local`, for testing prerendered
   * absolute URLs against something other than localhost) once one does.
   */
  readonly VITE_SITE_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
