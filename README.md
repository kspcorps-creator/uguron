# Uguron

Modern SaaS website and lightweight project workspace for Uguron, an AI-powered construction permit and compliance platform.

## What is included

- Enterprise-grade marketing site
- Account creation and sign-in UI
- Saved permit project workspace
- Readiness scoring, missing requirement tracking, notes, and project deletion
- Supabase-ready auth and database integration
- Local demo mode when Supabase is not connected

## Update workflow

Edit the site files locally, commit the changes, and push to the connected Git repository. The public hosting provider should redeploy from the repository automatically.

## Connect real accounts and saved data

GitHub Pages is static hosting, so real accounts require a hosted backend. This site is wired for Supabase.

1. Create a free Supabase project.
2. Open the Supabase SQL Editor and run `supabase-schema.sql`.
3. Copy your Supabase project URL and anon public key from Project Settings, then update `config.js`.
4. In Supabase Auth settings, add the GitHub Pages site URL to allowed redirect URLs:
   `https://kspcorps-creator.github.io/uguron/`
5. Commit and publish `config.js`.

The anon key is intended for browser use. Data privacy comes from Row Level Security policies in `supabase-schema.sql`, which restrict each permit project to the signed-in user who owns it.
