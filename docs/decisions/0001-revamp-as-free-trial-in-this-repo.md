# 0001. Revamp as a free trial that promotes the app, in this repo

- **Date:** 2026-11-19
- **Status:** accepted
- **The owner:** "Next up is going to be revamping the focustones.co site to be a free trial that promotes the app. I want to keep the operating system within the browser feel but have it promote the real app. This should revive the existing repo that is archived. its set to be public so it should be cleaned up."

## Context

This repo was the FocusTones web app (a Windows 98–style desktop), archived 2026-04. The iOS app FocusTones: Binaural Beats went live on the App Store on 2026-11-19.

## Decision

focustones.co becomes the free web trial and promotion site for the iOS app, in this repo. The repo was unarchived, history is kept (a full `git log -p` scan found no secrets), and the old app code, Docker and deploy tooling, and Win98 components are removed. Work lands on `revamp`; `main` deploys production.

## Consequences

The old site stays reachable in git history only. Visitors get one job: try the free set, then find the app.

## Revisit when

The owner changes what the site is for.
