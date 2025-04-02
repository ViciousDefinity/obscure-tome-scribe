# Obscure Tome Scribe Blueprint - Updated 2025-04-02
## Current Date: April 02, 2025
## Note: "Obscure Tome Scribe" is a working title for this project, chosen to keep it public yet discreet while reflecting its D&D campaign management purpose.

## Chat Rules
1. **Code Delivery**: Share snippets with file name, line numbers, and surrounding context; full files only if requested.
2. **Bugs & Enhancements**: Prioritize bug fixes (e.g., login, campaigns) before enhancements (e.g., Stat Block UI); track enhancements in TDL.
3. **Conciseness**: Keep responses short, focused on user’s immediate question or task.
4. **Memory Check**: Provide updated blueprint after each response for user to save in repo.
5. **Blueprint Format**: Use Markdown code blocks for VS Code compatibility.
6. **Blueprint Content**: Include rules, TDL, file links, detailed state, issues, and full chat history.
7. **Feature Review**: Review existing features (e.g., auth, CRUD) before adding new ones; log ideas in TDL.
8. **Rule Updates**: Add new workflow rules from chat (e.g., GitHub linking).
9. **Code Verification**: Request current file links or contents if unsure of code state.
10. **Test Maintenance**: Update tests (e.g., `App.test.js`) alongside feature/bug fixes; aim for 7/10 robustness.
11. **User Guidance**: Provide exact steps (e.g., “Open VS Code, paste at line 50”) assuming minimal dev knowledge.
12. **File Requests**: Ask for specific file links (e.g., `App.js`) if blueprint links are outdated or unclear.
13. **Context Management**: Start new chat if context limit warning appears; user provides latest blueprint link to resume.

## Project Files
- **Blueprint**: [https://raw.githubusercontent.com/ViciousDefinity/obscure-tome-scribe/main/docs/Blueprint.md]
- **Backend**:
  - `models.py`: [https://raw.githubusercontent.com/ViciousDefinity/obscure-tome-scribe/main/backend/api/models.py]
  - `serializers.py`: [https://raw.githubusercontent.com/ViciousDefinity/obscure-tome-scribe/main/backend/api/serializers.py]
  - `views.py`: [https://raw.githubusercontent.com/ViciousDefinity/obscure-tome-scribe/main/backend/api/views.py]
  - `urls.py`: [https://raw.githubusercontent.com/ViciousDefinity/obscure-tome-scribe/main/backend/api/urls.py]
  - `settings.py`: [https://raw.githubusercontent.com/ViciousDefinity/obscure-tome-scribe/main/backend/backend/settings.py]
  - `requirements.txt`: [https://raw.githubusercontent.com/ViciousDefinity/obscure-tome-scribe/main/backend/requirements.txt]
- **Frontend**:
  - `App.js`: [https://raw.githubusercontent.com/ViciousDefinity/obscure-tome-scribe/main/frontend/src/App.js]
  - `App.test.js`: [https://raw.githubusercontent.com/ViciousDefinity/obscure-tome-scribe/main/frontend/src/App.test.js]
  - `package.json`: [https://raw.githubusercontent.com/ViciousDefinity/obscure-tome-scribe/main/frontend/package.json]

## Current State
### Backend
- **Models** (from `models.py`):
  - `Campaign`: Fields: `id` (UUID), `name` (CharField, max 100), `description` (TextField, blank), `is_active` (Boolean, default True).
  - `EntityType`: Fields: `id` (UUID), `campaign` (ForeignKey to Campaign), `name` (CharField, max 100), `description` (TextField, blank).
  - `Entity`: Fields: `id` (UUID), `campaign` (ForeignKey to Campaign, nullable), `entity_type` (ForeignKey to EntityType), `name` (CharField, max 100), `description` (TextField, blank).
  - `Relationship`: Fields: `id` (UUID), `source` (ForeignKey to Entity), `target` (ForeignKey to Entity), `description` (TextField, blank).
- **API**:
  - Endpoints: `/api/login/` (POST, JWT auth), `/api/campaigns/` (GET/POST), `/api/entity-types/` (GET/POST), `/api/entities/` (GET/POST), `/api/relationships/` (GET/POST).
  - Auth: JWT with 365-day access tokens, refresh tokens supported.
- **Tests**: 5/5 passing (e.g., model creation, API CRUD), robustness 8/10 (missing edge cases like invalid JWTs).
- **Dependencies** (from `requirements.txt`): `pytest`, `pytest-django`, `requests` (Django/DRF assumed but not listed—standard versions implied).
- **Location**: `C:\Users\vicio\dnd_campaign_manager\backend`.

### Frontend
- **App.js**:
  - Components: Login form (username, password, rememberMe), campaign list, entity management UI.
  - State: `token`, `refreshToken`, `username`, `password`, `rememberMe`, `campaigns`, `entityTypes`, `entities`, `relationships`.
  - Functions: `apiCall` (exported, handles axios requests with token refresh), `handleLogin`, `fetchCampaigns`, `fetchEntityTypes`.
  - Hooks: `useState` for all state, `useEffect` triggers `fetchCampaigns` on `token` change.
  - Bugs: Login fails (token not set), campaigns don’t render (stuck at login).
- **App.test.js**: 12 tests (e.g., “renders login”, “fetches campaigns”), 1/12 passing (login test broken due to `apiCall` mocking).
- **package.json**: 
  - Dependencies: `react ^19.0.0`, `react-dom ^19.0.0`, `axios ^1.8.4`.
  - Dev Dependencies: `react-scripts 5.0.1` (includes Jest).
- **Location**: `C:\Users\vicio\dnd_campaign_manager\frontend`.

## Chat History (2025-04-02)
### Initial Prompt (User)
- “Thanks for sharing the files! I’ve got a solid grasp of your project now with the blueprints (03-31 and 04-01), `models.py`, `App.js`, and `requirements.txt`. Your setup is well-structured, and the issues (login failure, campaigns not rendering) are clear priorities. Let’s address your feedback and get started.”

### Workflow Discussion
- **User**: Proposed workflow with hub docs, context management, code snippets.
- **Grok**: Suggested tweaks: blueprint as hub, snippets with context, git repo for persistence.
- **User**: Asked about context loss, snippet clarity, git repo access.
- **Grok**: Confirmed blueprint + git solves context; enhanced snippets with locations; can’t browse repo but can fetch links.
- **User**: Asked if GitHub links avoid uploads.
- **Grok**: Yes, links keep chat lean; proposed linking all files in blueprint.
- **User**: Asked if blueprint must be linked every time.
- **Grok**: Only per new chat, not per response; memory resets between chats.

### Git Setup
- **User**: Requested setup in Markdown, then switched to plain steps.
- **Grok**: Provided steps: install git, init repo, add/commit files, create GitHub repo, push.
- **User**: Hit “dubious ownership” error at `git add .`.
- **Grok**: Fixed with `git config --global --add safe.directory`.
- **User**: Hit “author identity unknown” error at `git commit`.
- **Grok**: Fixed with `git config --global user.email/name`.
- **User**: Confirmed step 4 success, moved to step 5.
- **Grok**: Suggested `obscure-tome-scribe` as working title; outlined steps 5-9.
- **User**: Noted all steps done, asked what’s next.
- **Grok**: Suggested sharing blueprint link to start development.

### Blueprint Update
- **User**: Noted project file links missing, shared current link: [https://raw.githubusercontent.com/ViciousDefinity/obscure-tome-scribe/refs/heads/main/docs/Blueprint.md].
- **Grok**: Updated blueprint with real links from `ViciousDefinity/obscure-tome-scribe`.

## Conversation Summary (2025-03-25 - 2025-04-02)
### Bugs Fixed (Pre-Chat)
- 8 fixes (e.g., 500 errors on API, TypeError in frontend) per 03-31 blueprint.
- Regression: Login broken (2025-04-01), token not set, `AggregateError` in tests.
### Progress (This Chat)
- Defined workflow: blueprint as hub, GitHub for code, links for context.
- Set up git locally, resolved ownership/identity errors, pushed to `ViciousDefinity/obscure-tome-scribe`.

## To-Do List (TDL)
1. **Fix Login**: Update `handleLogin` to use `apiCall`, set token, mock in tests.
2. **Fix Campaigns**: Ensure `fetchCampaigns` triggers post-login, renders “Campaign 1”.
3. **Stat Block UI**: Add UI to render/edit entity fields (e.g., name, description).
4. **Sorting**: Implement UI for `sort_order` on entities or campaigns.
5. **Relationships**: Build modal for editing `Relationship` source/target/description.
6. **UX**: Add loading spinners, error messages, input validation.
7. **D&D Beyond**: Fix iframe integration for external content.
8. **Tests**: Add backend edge cases (e.g., invalid JWT), frontend coverage (target 10/12 passing).
9. **Deployment**: Set up production environment (e.g., Heroku, Docker).
10. **Entity.campaign**: Change `campaign` field to non-nullable in `Entity` model.

## Test Suite Robustness (2025-04-01)
- **Backend**: 8/10 (5/5 passing; lacks edge cases like token expiry).
- **Frontend**: 3/10 (1/12 passing; login test fails due to `apiCall` mock).
- **Overall**: 5/10; target 7/10 after login/campaign fixes.

## Current Issues
- **Login Failure**: Token not persisted, `handleLogin` doesn’t trigger `fetchCampaigns`, `AggregateError` in JSDOM tests.
- **Campaigns Not Rendering**: UI stuck at login screen, `fetchCampaigns` not called or fails silently.

## Next Step
- **User**: Update `docs/Blueprint.md` with this version, commit, push, then share link with task (e.g., “Blueprint: [link]. Fix login”).
- **Grok**: Fetch files via links, provide `handleLogin` snippet, update blueprint.