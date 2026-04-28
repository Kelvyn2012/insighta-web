# insighta-web

Web portal for the [Insighta Labs+](https://github.com/Kelvyn2012/Backend_Repository_Core_System) Intelligence Query Engine.

Built with Next.js 15 (App Router). Tokens are stored in **HTTP-only cookies** — JavaScript on the page never touches them.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Runtime | Node.js 20+ |
| Auth | GitHub OAuth via backend PKCE flow |
| Token storage | HTTP-only, SameSite=Strict cookies |
| CSRF protection | SameSite=Strict + Origin header validation on mutations |

## Setup

```bash
npm install
```

Create `.env.local`:

```dotenv
INSIGHTA_API_URL=https://your-backend-url.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Then:

```bash
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run test
```

## Auth flow

```
User clicks "Login with GitHub"
  → GET /api/auth/login
      - calls backend GET /auth/github/
      - stores oauth_state in HTTP-only cookie
      - redirects browser to GitHub authorize URL

GitHub redirects → GET /api/auth/callback?code=...&state=...
      - validates state cookie (CSRF guard)
      - calls backend GET /auth/github/callback/?code=...&state=...
      - backend exchanges code + PKCE verifier, returns token pair
      - portal sets access_token + refresh_token as HTTP-only cookies
      - redirects to /profiles

/profiles page loads
      - JS calls /api/profiles (Next.js proxy route)
      - proxy reads HTTP-only cookies, forwards Bearer token to backend
      - auto-refreshes token if within 10s of expiry
      - returns data to client
```

## Token handling

- `access_token` and `refresh_token` are stored as `httpOnly`, `secure`, `sameSite=strict` cookies — never accessible to JavaScript.
- Next.js API routes act as a server-side proxy: they read the cookies and attach `Authorization: Bearer` + `X-API-Version: 1` headers for every backend call.
- If the access token is near expiry (within 10 seconds), the proxy calls `POST /auth/refresh/` and replaces the cookies in the same response.
- Logout (`POST /api/auth/logout`) revokes the refresh token server-side, then clears all cookies.

## CSRF protection

- All auth cookies use `SameSite=Strict`, preventing cross-site form submissions from sending them.
- Mutating API routes (`/api/auth/logout`) additionally validate the `Origin` header to confirm requests come from this portal's own host.

## Features

| Page | Path | Access |
|---|---|---|
| Login | `/` | Public |
| Profiles list + filters | `/profiles` | analyst+ |
| Natural language search | `/profiles` (search bar) | analyst+ |
| CSV export | `/api/profiles/export` | analyst+ |

Unauthenticated requests to any protected page are redirected to `/` by `src/middleware.ts`.
