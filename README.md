# AgriCast

AgriCast is a React weather dashboard for checking current conditions, hourly and seven-day forecasts, and general farming guidance for a searched location.

## Requirements

Install Node.js and npm before setting up the project.

## Standard Setup

For computers using a regular local drive, run these commands from the project folder:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173/`.

## External exFAT Drive

Only use these commands if the project is stored on an exFAT USB or external drive on Linux. exFAT does not support the symlinks npm normally creates, so install without npm's command links and start Vite directly:

```sh
npm install --no-bin-links
node ./node_modules/vite/bin/vite.js
```

This workaround is supplied on the command line for this install only. The project does not set a shared npm configuration, so teammates using regular drives can use the standard setup above. On the exFAT drive, run lint or build directly when needed:

```sh
node ./node_modules/eslint/bin/eslint.js .
node ./node_modules/vite/bin/vite.js build
```

