# The Briefing Room

A mobile-first, Netlify-ready news briefing with four beats, source links, quick/context/deep reading, save/follow lists, conversation prompts, and browser text-to-speech.

## Deploy on Netlify

1. Unzip this project.
2. Upload the folder to a GitHub repository.
3. In Netlify, choose **Add new project → Import an existing project**, select the repository.
4. Build command: `npm run build`; publish directory: `dist`. Netlify detects `netlify.toml` and deploys the serverless news function.
5. Deploy. The app loads current headlines via Google News RSS through a Netlify Function.

**Important:** Netlify's simple drag-and-drop deploy of a prebuilt `dist` folder does not reliably deploy the serverless news function. Use the Git-based deployment method above (or Netlify CLI with functions). The app is not a static-only site.

## Local development

Install Node.js 20.19+ and run `npm install` followed by `npx netlify dev`. The function is at `/api/news?beat=taiwan` (also `global`, `asia`, `us`).

## Notes and limitations

- Feed headlines and descriptions come from Google News RSS; freshness, availability, and licensing depend on upstream sources. No fabricated news or source URLs.
- Summaries are short extracted feed descriptions, **not AI-generated article summaries**. Conversation angles are general prompts, not claims about the stories. Deep mode provides transparency rather than invented analysis.
- Listening uses the device's built-in speech synthesis; iOS Safari may pause playback when locked or backgrounded.
- Saves and follows are stored locally on the device, not synced.
- The 'Following' tab tracks saved headlines in the current feed; it does not perform background notifications or long-term topic matching.
- No API keys required. No paywall bypass.
