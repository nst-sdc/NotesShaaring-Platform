# Contributing to Notes Sharing Platform

Thank you for your interest in improving Notes Sharing Platform! We welcome contributions of all sizes — bug fixes, documentation improvements, UI tweaks (non-breaking), tests, and new features.

> ⚠️ Note: Do **not** change the existing UI layout or component structure without approval from a maintainer. Small styling tweaks for responsiveness or accessibility are fine but major UI changes require a design discussion in an issue first.

---

## Table of Contents

- [How to get started](#how-to-get-started)
- [Development setup](#development-setup)
- [Branching & commit guidelines](#branching--commit-guidelines)
- [Pull request checklist](#pull-request-checklist)
- [Reporting issues](#reporting-issues)
- [Labels & Hacktoberfest](#labels--hacktoberfest)

---

## How to get started

1. Fork the repository.
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/notes-sharing-platform.git
   cd notes-sharing-platform
   ```
3. Create a branch:
   - Feature: `feature/short-description`
   - Bugfix: `fix/short-description`
   ```bash
   git checkout -b feature/your-feature
   ```

---

## Development setup

**Install**

```bash
cd backend && npm install
cd ../frontend && npm install
```

**Environment**
Create `.env` files in `backend/` and `frontend/`.

**Run locally**

```bash
cd backend && npm start
cd frontend && npm run dev
```

---

## Branching & commit guidelines

**Branch naming**

- `feature/<short-description>`
- `fix/<short-description>`
- `chore/<short-description>`
- `docs/<short-description>`

**Commit message format**

```
type(scope): Short description
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.

Example:

```
feat(auth): add Google OAuth success redirect
```

---

## Pull request process

1. Push your branch to your fork.
2. Open a Pull Request targeting the `main` branch of the upstream repo.
3. Fill in the PR template.
4. Link related issues (e.g., Fixes #123).
5. Address feedback and keep commits clean.

**Checklist**

- [ ] Branch is up-to-date with `main`
- [ ] Code follows existing patterns
- [ ] No console errors or warnings
- [ ] Relevant docs/tests updated

---

## Reporting issues

Include:

- Title and summary
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node, Browser)
- Screenshots/logs (if any)

Use provided issue templates.

---

## Labels & Hacktoberfest

- `good first issue`
- `help wanted`
- `documentation`
- `enhancement`
- `bug`
- `hacktoberfest`

---

## Need help?

Comment on an issue or start a discussion — maintainers are happy to help!

---

## Thank you!

Your time and effort help students everywhere — thank you for supporting this project! 🎉
