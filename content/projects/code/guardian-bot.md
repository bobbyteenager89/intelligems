---
title: Guardian Bot (v1)
type: code
status: shipped
repo: ~/Projects/intelligems-slack-tools
description: First version of Guardian — built in Claude Code, deployed to Slack
---

## Overview

First-generation Guardian Bot built entirely in Claude Code. Monitors Intelligems test data and alerts the team when tests show concerning patterns (e.g., 10 orders vs 0 across variants).

## Technical Implementation

- Built with Claude Code + Terminal integration
- Calls Intelligems API to pull live test data
- Sends Slack alerts on concerning patterns
- Runs as a scheduled job

## Status

Shipped and live. v2 is being built as part of intelligems-slack-tools Phase 2.

## Tasks

- [x] Build initial alerting logic
- [x] Connect to Intelligems API
- [x] Deploy to Slack
- [ ] Migrate to intelligems-slack-tools Phase 2 architecture
