# Photo calorie estimation worker

Reference implementation for the "snap a photo, get calories" feature. Keeps
the vision-model API key out of the phone app.

## Deploy

```
npm install -g wrangler
cd serverless/photo-estimate
wrangler secret put ANTHROPIC_API_KEY
wrangler deploy
```

Wrangler prints a `*.workers.dev` URL. Put it in the app's `.env` as:

```
VITE_PHOTO_ESTIMATE_URL=https://doneright-photo-estimate.<you>.workers.dev
```

Without this variable set, the app's photo-logging screen skips straight to
manual entry (steppers) — it's a bonus path, not a dependency, per the build
spec. Swap the model call in `index.js` for any other vision-capable API if
you'd rather not use Anthropic's.
