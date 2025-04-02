# D&D Campaign Manager Blueprint - Updated 2025-04-01

## Current Date: April 01, 2025

## Chat Rules
1. **Code Delivery**: Share snippets; full files only if requested.
2. **Bugs & Enhancements**: Fix bugs first; TDL for enhancements.
3. **Conciseness**: Short responses, focus on user issue.
4. **Memory Check**: Revised blueprint after each response.
5. **Blueprint Format**: Code block for VS Code.
6. **Blueprint Content**: Rules, TDL, key details.
7. **Feature Review**: Review before new features; ideas to TDL.
8. **Rule Updates**: Add new rules from chat.
9. **Code Verification**: Request files if unsure of state.
10. **Test Maintenance**: Update tests with features.
11. **User Guidance**: Exact steps, no assumptions.
12. **File Requests**: Ask for needed files.
13. **Context Management**: Start new chat if attachment size warning appears.

## Current State
### Backend
- **Models**: Campaign, EntityType, Entity, Relationship.
- **API**: CRUD, JWT auth (365-day tokens).
- **Tests**: 5/5 passing (8/10 robustness).
- **Location**: `C:\Users\vicio\dnd_campaign_manager\backend`.

### Frontend
- **App.js**: Auth, CRUD, UI. `apiCall` exported (2025-04-01).
- **App.test.js**: 12 tests; 1/12 passed (2025-04-01).
- **package.json**: `react-scripts 5.0.1`, `axios ^1.8.4`, `react ^19.0.0`.
- **Location**: `C:\Users\vicio\dnd_campaign_manager\frontend`.

## Conversation Summary (2025-03-25 - 2025-04-01)
### Bugs Fixed
- 8 prior fixes (e.g., 500 errors, TypeError).
- Regression: Login broken (2025-04-01).

## To-Do List (TDL)
1. **Fix Login**: `handleLogin` to use `apiCall`, mock correctly.
2. **Fix Campaigns**: Ensure "Campaign 1" renders.
3. **Stat Block UI**: Render/edit fields.
4. **Sorting**: UI for `sort_order`.
5. **Relationships**: Edit modal.
6. **UX**: Loading, errors, validation.
7. **D&D Beyond**: Iframe fixes.
8. **Tests**: Backend edge cases, frontend coverage.
9. **Deployment**: Production setup.
10. **Entity.campaign**: Make non-nullable.

## Test Suite Robustness (2025-04-01)
- **Backend**: 8/10 (5/5 passing).
- **Frontend**: 3/10 (1/12 passing).
- **Overall**: 5/10.

## Current Issues
- **Login Failure**: Token not set, `AggregateError` from JSDOM.
- **Campaigns Not Rendering**: Stuck at login screen.

## Next Step
- **User**: Start new chat with `handleLogin`, `fetchCampaigns`, first two tests, test summary.
- **Grok**: Fix login, mock `apiCall`, pass initial tests.

## Recent Changes (2025-04-01)
- **App.js**: `apiCall` exported.
- **App.test.js**: Mocked `apiCall`, regressed to 1/12.