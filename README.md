# Gujab: Developer & Hosting Guide

Welcome to the internal guide for **Gujab | The Official Unofficial Record**. Use this guide to maintain, update, and deploy the project.

---

## 🎨 Theme & Theming (Dark Mode Ready)

The app uses a centralized CSS Variable system. Instead of hardcoding hex values in your components, use these classes or variables.

### 1. Variables defined in `index.css`
- `--bg-paper`: Main background color.
- `--text-primary`: Primary text color.
- `--bg-secondary`: Scrollbar track and secondary backgrounds.
- `--color-accent`: The signature "Gujab Red".
- `--color-highlight`: The "Yellow Journalism" highlight.

### 2. Using with Tailwind
We have mapped these to Tailwind classes. Use these for automatic theme switching:
- `bg-paper`
- `text-primary`
- `bg-secondary`
- `text-accent`
- `bg-highlight`

### 3. How to enable Dark Mode
To switch the app to dark mode, simply add `data-theme="dark"` to the `<html>` element in `index.html`:
```html
<html lang="en" class="scroll-smooth" data-theme="dark">
```

---

## 🛠 Component Update Guide

Each component is located in the `src/components` directory. Follow these rules when updating:

### General Workflow
1.  **Typography**: Always use the custom fonts defined in `tailwind.config`.
    - `font-masthead`: For large titles.
    - `font-headline`: For secondary headers and news headlines.
    - `font-body`: For long-form text.
    - `font-secret`: For confidential or technical-looking notes.
2.  **State Management**: Use React Hooks (`useState`, `useEffect`) locally where possible.
3.  **Supabase Integration**: Import `supabase` from `../services/supabaseClient` for any database or storage operations.

---

## 🚀 Hosting on Cloudflare Pages

Cloudflare Pages is the recommended host because of its **Unlimited Bandwidth**.

### Step 1: Connect to GitHub
1.  Push your code to a private or public GitHub repository.
2.  Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
3.  Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.

### Step 2: Configure Build Settings
During the setup, use the following settings:
- **Project Name**: `gujab`
- **Production branch**: `main`
- **Framework preset**: `Vite` (or `None`)
- **Build command**: `npm run build`
- **Build output directory**: `dist`

### Step 3: Set Environment Variables
Go to **Settings** > **Environment variables** and add the variables from your `.env` file:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`

### Step 4: Deploy
Click **Save and Deploy**. Cloudflare will build your app and give you a `.pages.dev` URL. You can then connect your custom domain to it.

---

## 💾 Database Setup
If you ever reset the database, go to the **Admin Dashboard** > **System Diagnostics** and run the **Master SQL** in the Supabase SQL editor. This ensures all tables (articles, tips, profiles, site_config) are correctly created.
