# Passkey (Biometric) Login — Design Doc

> **Status:** Not built. Reference design for future implementation.
> **Recommended timing:** build after `luckee.com.au` is live (see "Domain caveat").

## Background

The original PRD (`luckee-prd.md`) specced biometric login via "Supabase Auth passkeys
(WebAuthn) — device handles biometrics, no biometric data stored on server," but it was never
implemented. Luckee currently ships **email magic-link only** (`app/routes/login.tsx` → Supabase
→ `app/routes/auth.callback.tsx`).

A working passkey implementation exists in a **separate** project (a single-owner "tasks" app:
Cloudflare Worker + KV for challenges/keys, PIN auth, "owner" session). That code is not in this
repo and cannot be ported line-for-line — Luckee is multi-user, Supabase-backed, and uses a
different session model. This doc adapts the WebAuthn approach to Luckee's stack.

**Chosen login UX:** email-first, then passkey (user types email → biometric prompt for that
account). Passkeys sit **alongside** magic-link, which remains the fallback / recovery path.

## How WebAuthn works (why it's secure)

- The biometric (Face ID / Touch ID / Windows Hello) is only the **local unlock gesture** — it's
  never sent to or stored on the server, and isn't "the passkey."
- Registration creates a **hardware-bound key pair** in the device's secure enclave. The private
  key never leaves the device. The server stores only the **public key**, so a DB leak exposes
  nothing usable.
- Each login uses a **single-use challenge** signed by the private key → replay-safe.
- A **signature counter** is verified and advanced to detect cloned authenticators.
- Origin + RP ID are verified on every assertion.

## Approach

Use **`@simplewebauthn/server`** (edge/Workers-compatible, Web Crypto) and
**`@simplewebauthn/browser`**.

### Storage (Supabase, not KV)

`sql/passkeys.sql`:

```sql
create table if not exists webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  credential_id text not null unique,   -- base64url
  public_key text not null,             -- base64url (COSE)
  counter bigint not null default 0,
  transports text[],
  device_label text,
  created_at timestamptz default now(),
  last_used_at timestamptz
);
create index if not exists webauthn_credentials_user_idx on webauthn_credentials (user_id);
```

**Challenge storage:** a short-lived **HttpOnly cookie** (e.g. `luckee_webauthn_chal`, ~5 min,
`SameSite=Lax`, `Secure`) — no KV, no challenge table, self-cleaning. Mirrors the existing
`luckee_pkce` cookie pattern in `app/lib/auth.server.ts`.

### RP config (env-driven — do NOT hardcode pages.dev)

- `RP_ID` = registrable domain (`luckee.com.au` in prod, `localhost` in dev).
- `RP_ORIGIN` = full origin (`https://luckee.com.au`).
- Derive from the request origin where possible; add to `Env` types.

## Flows

### Registration (logged-in user adds a passkey from Profile)

1. `POST /api/passkey/register-options` (`requireAuth`): `generateRegistrationOptions` with
   `rpID`, `userID = user.id`, `userName = user.email`, `excludeCredentials` = existing creds.
   Store `options.challenge` in the challenge cookie; return options.
2. Browser: `startRegistration(options)` → biometric prompt → attestation response.
3. `POST /api/passkey/register-verify`: `verifyRegistrationResponse({ expectedChallenge (cookie),
   expectedOrigin: RP_ORIGIN, expectedRPID: RP_ID })`. On success insert into
   `webauthn_credentials`.

### Authentication (login — email-first)

1. User enters email → `POST /api/passkey/auth-options` with the email. Look up the user + their
   credentials; `generateAuthenticationOptions({ allowCredentials })`. Store challenge cookie;
   return options. If the email has no passkeys, tell the UI to fall back to magic link.
2. Browser: `startAuthentication(options)` → biometric prompt → assertion.
3. `POST /api/passkey/auth-verify`: find credential by `credential_id`,
   `verifyAuthenticationResponse({ expectedChallenge, expectedOrigin, expectedRPID, credential })`,
   check/advance `counter`, update `last_used_at`.
4. **Mint a Supabase session** (reuse the existing path): with the **service** client,
   `auth.admin.generateLink({ type: 'magiclink', email })` → take `properties.hashed_token` →
   **anon** client `auth.verifyOtp({ token_hash: hashed_token, type: 'magiclink' })` → session.
   Set cookies via `authCookies(session.access_token, session.refresh_token, expires_in, request)`
   from `app/lib/auth.server.ts` — identical to `app/routes/auth.callback.tsx` lines 39–41.
   Redirect to `/rewards`.

## UI

- **Login** (`app/routes/login.tsx`): add "Sign in with Face ID / fingerprint" after the email
  field; try passkey on submit, fall back to magic link if none / on cancel.
- **Profile** (`app/routes/profile.tsx`): a "Passkeys" section — "+ Add this device", list
  registered devices (label + created date), allow remove. Only render when
  `window.PublicKeyCredential` exists.

## Files to add / touch

- **NEW:** `app/routes/api.passkey.register-options.tsx`, `api.passkey.register-verify.tsx`,
  `api.passkey.auth-options.tsx`, `api.passkey.auth-verify.tsx`; `app/lib/webauthn.server.ts`
  (options/verify + challenge-cookie helpers); `sql/passkeys.sql`.
- **EDIT:** `app/routes.ts` (register the 4 API routes), `app/routes/login.tsx`,
  `app/routes/profile.tsx`, `Env` types (`RP_ID`, `RP_ORIGIN`).
- **REUSE:** `authCookies`, `getCookie`, `CookieStorage` (`app/lib/auth.server.ts`);
  `getSupabase` / `getSupabaseAnon` (`app/lib/supabase.server.ts`); session pattern from
  `app/routes/auth.callback.tsx`.
- **DEPS:** `@simplewebauthn/server`, `@simplewebauthn/browser`.

## Domain caveat

Passkeys are **bound to the registrable domain** (RP ID). A passkey created on
`luckee-app.pages.dev` will not be offered on `luckee.com.au` (different registrable domain), so
users would have to re-register (a one-tap Face ID prompt). Build on the final domain to avoid
throwaway credentials. Subdomains of the same registrable domain **can** share (set
`RP_ID=luckee.com.au`).

## Verification (once built, on the real domain)

1. Run `sql/passkeys.sql`; set `RP_ID` / `RP_ORIGIN`.
2. On a passkey-capable device, logged in: Profile → Add passkey → biometric prompt → row appears
   in `webauthn_credentials`.
3. Log out; on login enter email → biometric prompt → land on `/rewards` with `luckee_at` /
   `luckee_rt` set. Confirm magic-link still works as fallback.
4. Negative checks: tampered/synthetic assertion rejected; expired challenge rejected; counter
   regression rejected; email with no passkey falls back to magic link.
