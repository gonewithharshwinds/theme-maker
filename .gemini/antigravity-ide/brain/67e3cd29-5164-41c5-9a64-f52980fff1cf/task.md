# Tasks

- `[x]` Update app/page.tsx to redirect `/` directly to `/editor/theme`
- `[x]` Update lib/auth-client.ts to mock client session
- `[x]` Update components/user-profile-dropdown.tsx to hide auth buttons
- `[x]` Update lib/shared.ts to mock server session user data
- `[x]` Update lib/subscription.ts to mock active subscription check & return Pro status
- `[x]` Update actions/themes.ts to use LOCAL_DATA folder for storage
- `[x]` Update actions/ai-usage.ts to use LOCAL_DATA or return mock usage
- `[x]` Update actions/community-themes.ts to mock queries cleanly
- `[x]` Update actions/account.ts to bypass database delete actions
- `[x]` Update app/api/generate-theme/route.ts to safely ignore ratelimit if no KV configuration exists
- `[x]` Add Figma standard Design Tokens export JSON to the Code panel tab
- `[x]` Create `components/editor/pantone-panel.tsx` to display and search Pantone colors
- `[x]` Integrate `PantonePanel` inside `components/editor/editor.tsx` as a collapsible panel
- `[x]` Integrate a toggle button in the header/action-bar for the Pantone panel
- `[x]` Verify that the Pantone Colors database functions correctly with search and copy
