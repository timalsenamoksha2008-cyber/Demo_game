# Beneath the ocean

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Getting Started

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Building for itch.io 🧩

The game runs entirely in the browser, so you can upload it to itch.io as an **HTML5** project. Follow these steps to prepare the files:

1. Run the production build.

   ```sh
   npm run build
   ```

   This generates a `dist` folder containing `index.html` and all the compiled assets. The `base` path in `vite.config.ts` is already set to `"./"`, so the files use relative URLs and work when opened from a ZIP or in an iframe.

2. Compress the contents of `dist` into a ZIP archive. On Windows you can use PowerShell:

   ```powershell
   cd dist
   Compress-Archive -Path * -DestinationPath ..\game.zip
   ```

   Or simply select the files in Explorer, right‑click → *Send to → Compressed (zipped) folder*.

3. On itch.io create a new project (choose **HTML** or **HTML5**), upload `game.zip`, and set the file to be your **HTML5 game**. The service will automatically host it in a browser-ready iframe.

4. Optionally, update the project's description, icon, screenshots, and tags to make it discoverable.

5. When you're ready, publish the page — visitors will be able to click *Play* and experience the game instantly.

(If you ever add additional routes, the project now uses `HashRouter` so navigation continues to work with static hosting.)

Enjoy! 🎮
