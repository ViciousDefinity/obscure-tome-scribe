# D&D Campaign Manager Blueprint - Updated 2025-03-31

## Current Date: March 31, 2025

## Chat Rules
1. **Code Delivery**: If too large, specify exact lines to replace/change.
2. **Bugs & Enhancements**: Fix bugs first; add enhancements to TDL.
3. **Conciseness**: Keep responses short. Focus on user issues without extra steps.
4. **Memory Check**: Output revised blueprint after every response to ensure continuity.
5. **Blueprint Format**: Code block for VS Code copy-paste.
6. **Blueprint Content**: Include rules, TDL, and ancillary details.
7. **Feature Review**: Review before new features; new ideas to TDL.
8. **Rule Updates**: Update blueprint with new rules mentioned in chat.
9. **Code Verification**: If updating a file and not confident in its current state, ask to see the file first.
10. **Test Maintenance**: Keep automated tests current with each new feature.

## Current State
### Backend (Django REST Framework)
- **Models**: Campaign, EntityType, Entity (nullable campaign), Relationship.
- **Migrations**: Up to 0008.
- **API**: CRUD endpoints, JWT auth (365-day tokens), nested routes.
- **Views**: `EntityViewSet.perform_create` uses `request.data` (~lines 41-44).
- **Settings**: PostgreSQL, CORS, media handling.
- **Tests**: `api/tests.py` - 5 tests, all passing (8/10 robustness).

### Frontend (React)
- **App.js**: Auth, campaign/entity CRUD, UI with sidebar/modals; `isAuthenticated` added, `data-testid` for testing; incomplete Stat Block UI, sorting.
- **App.test.js**: 12 tests; currently 0/12 due to Jest ESM error (previously 6/12 failing); mocks updated for all endpoints.
- **package.json**: `react-scripts 5.0.1`, `axios ^1.8.4`, `react ^19.0.0`; Jest config with `moduleNameMapper` and `transformIgnorePatterns` (updated 2025-03-31).
- **Dependencies**: Testing libs (`@testing-library/*`), `babel-jest`; 3 moderate vulnerabilities (postcss).

### Integration
- **Backend-Frontend**: Axios with JWT, token refresh, media fetching.
- **Gaps**: Stat block fields, sorting UI, relationship editing.

## Conversation Summary (2025-03-25 - 2025-03-31)
### Bugs Fixed
1. 500 Error on `/api/entities/<id>/` (2025-03-25).
2. 404 on `/api/entities/<id>/` (2025-03-25).
3. TypeError 'toLowerCase' (2025-03-25).
4. Malformed Image URLs (2025-03-25).
5. 400 on Entity Edit (2025-03-25).
6. KeyError in Entity Creation (2025-03-31).
7. Jest SyntaxError for Axios ESM (2025-03-31, pending confirmation).
8. Jest Test Failures (2025-03-31, partial fix with mocks).

### Testing Journey
- **Backend**: 5/5 passing after `dm`, JSON serialization fixes (8/10 robustness).
- **Frontend**: 
  - Initial: 5/12 passing (5/10 robustness).
  - Post-Mocks: 6/12 failing (login, campaign/entity actions due to mock gaps).
  - Current: 0/12 (Jest ESM error blocks execution).
- **Target**: Frontend to 8/10 (10/12 passing).

## To-Do List (TDL)
1. **Stat Block UI**: Render/edit fields (Priority 1).
2. **Sorting Functionality**: UI for `sort_order` (Priority 2).
3. **Relationship Editing**: Modal for updates (Priority 3).
4. **UX Enhancements**: Loading, errors, validation.
5. **D&D Beyond Fixes**: Iframe improvements.
6. **Backend Tests**: Add edge cases.
7. **Frontend Tests**: Cover stat block, images, sorting.
8. **Deployment**: Production setup.
9. **Entity.campaign Non-Nullable**: Post-migration.
10. **Vulnerabilities**: Revisit postcss issues.

## Test Suite Robustness (2025-03-31)
- **Backend**: 8/10 - All 5 tests pass; basic CRUD covered.
- **Frontend**: 3/10 - 0/12 running due to Jest error; previously 5/10 (5/12 passing).
- **Overall**: 6/10 - Backend solid; frontend stalled at Jest setup.
- **Target**: Frontend to 8/10 (10/12 passing).

## Progress Tracker (Frontend Test Stabilization)
1. **Initial State**: 5/12 passing (5/10 robustness).
2. **Updated `App.js`**: Added `isAuthenticated`, `data-testid` (2025-03-31).
3. **First Test Run**: 6/12 failing; mock gaps identified (2025-03-31).
4. **Updated `App.test.js`**: Full mocks added (2025-03-31).
5. **Current State**: 0/12; Jest ESM error (axios `import`) blocks execution.
6. **Next Step**: Apply ESM fix, rerun tests.

## Current Issues
- **Jest ESM Error**:
  - Error: `SyntaxError: Cannot use import statement outside a module` in `axios/index.js`.
  - Cause: Jest expects CommonJS; `axios v1.8.4` uses ESM.
  - Fix Applied: Added `"transformIgnorePatterns": ["/node_modules/(?!axios)/"]` to `package.json` (2025-03-31).

## Next Step (Small & Focused)
- **User to**: 
  1. Update `package.json` with revised Jest config.
  2. Run `npm test` in `C:\Users\vicio\dnd_campaign_manager\frontend`.
  3. Share output.
- **Grok to**: 
  1. Confirm Jest fix.
  2. Assess test results (target 10/12 passing).
  3. Update blueprint with results.

## Recent Changes (2025-03-31)
- **App.js**: Added `isAuthenticated`, `data-testid` for login, campaign, entity actions.
- **App.test.js**: Updated mocks for `/api/login/`, `/api/campaigns/`, `/api/campaigns/:id/entity-types/`, `/api/entities/:id/`.
- **package.json**: Added `transformIgnorePatterns` to `jest` section (2025-03-31).

## Safeguard Against Forgetting
- **Rule 4 Enforced**: Blueprint output after every response, even minor ones, to lock in progress and prevent drift.
- **Small Steps**: Limit each response to 1-2 actionable tasks (e.g., fix Jest, then test results).