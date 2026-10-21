# FullStack Ascent — Career Transition Cockpit & Daily Tracker

An offline-first, high-performance career transition cockpit and progressive study tracker guiding the journey from **Senior Frontend to Lead Full-Stack Engineer**.

Built with React 19, TypeScript, Tailwind CSS, Vite, and Vite PWA.

---

## 🚀 How to Update Targets & Topics (JSON-First Architecture)

All curriculum phases, weekly topics, daily options, deliverables, capstones, and competency benchmarks are centrally defined in a single, clean JSON file:

📁 **`src/data/curriculum.json`**

Whenever you want to add, edit, or remove:
* Phase names or descriptions
* Weekly titles or target dates
* Topics (e.g. adding new API patterns to Phase 3)
* Daily practice options (Mode A / Mode B / Mode C tasks)
* Capstone project deliverables
* Competency rubrics

### ✨ The "Just Edit the JSON and Boom" Workflow:
1. Open [`src/data/curriculum.json`](file:///src/data/curriculum.json).
2. Edit or add your target topics, APIs, or daily options.
3. Save the file.
4. **Boom!** The app's auto-reconciliation engine instantly updates the roadmap and cockpit in real time **without erasing your completed checkmarks, streak, or logged study sessions**.

---

## 🌐 Deploy to GitHub Pages (Free Tier)

This repository includes a ready-to-run GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and publishes the app to GitHub Pages on every `git push`.

### Step 1: Create a Repository on GitHub
Create a new public or private repository on GitHub (e.g. `personal-growth-tracker` or `fullstack-ascent`).

### Step 2: Link Remote & Push
Run the following terminal commands:
```bash
# Add your GitHub remote repository
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# Push your code to the main branch
git push -u origin main
```

### Step 3: Enable GitHub Pages in Repository Settings
1. Go to your repository on GitHub.
2. Click **Settings** → **Pages** (under the "Code and automation" sidebar).
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. The deployment workflow will trigger automatically and publish your live app to:
   ```
   https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPOSITORY_NAME>/
   ```

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript check & production build
npm run build
```
