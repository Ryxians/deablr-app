# better-auth with username-only credentials and a hidden /admin surface

Status: accepted

The site needs Users with global Roles (Admin, Denizen) mapped to named permission statements, with minimal infrastructure and minimal UI. We decided to use better-auth with username + password credentials — the site sends no email — and better-auth's access control (`createAccessControl`) for permission statements, with the admin plugin powering the /admin dashboard (create users, set roles, reset passwords). /admin is the only auth UI: logged out it shows a login form, an Admin sees the dashboard, a Denizen sees the not-found page. The first Admin is created through a one-time setup form at /admin, shown only while no Users exist. Ongoing onboarding supports three paths: Admin-created accounts, invite links, and open signup with Admin approval.

## Considered Options

- **Email + password with an email provider** — rejected: adds an external service, secrets, and deliverability concerns; at ~10 users a forgotten password can be a manual Admin reset.
- **Social login (OAuth)** — rejected: per-provider app setup and it complicates the Admin-created-accounts flow.
- **Raw role-string checks instead of permission statements** — rejected: "roles with permissions" was an explicit requirement; scattered `role === 'admin'` checks don't scale across projects.

## Consequences

- Password resets are manual: a Denizen who forgets their password asks an Admin.
- The first-run setup form means the first visitor on an empty database could claim Admin — accepted risk; create the Admin immediately after a fresh deploy.
- New projects introduce new permission statements (e.g. `question:submit`) rather than new roles; statements are global, never per-user-per-project.
