# NOK OS connector for Claude

The NOK OS connector lets Claude read your NOK OS data and save its work back as **drafts**. You do the thinking in a Claude chat or Project. Every draft shows up in NOK OS with an orange **Drafted by Claude** badge, and you review and approve it there as usual.

Claude can't approve, publish, schedule, send, delete, or touch proposals, payments or client links.

## Setup (already done)

- Server: `https://nok-os-api.onrender.com/mcp`. The code lives in [mcp/](mcp/), mounted in [server.ts](server.ts).
- Auth: Claude sends the `MCP_API_KEY` secret (set in Render) in the `x-api-key` header, configured under **Request headers** in the custom connector.
- To use it in a chat: click **+** → **Connectors**, then turn on **NOK OS**.
- Every tool call is logged in Firestore under `mcpAuditLog` (tool, brand, time, success or failure).
- If the first call times out, Render is waking up. Wait a minute and ask again.

To change the secret: generate a new one (`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`), update `MCP_API_KEY` in Render, then remove the connector in Claude and add it again with the new value.

## Read tools

| Tool | What it gives Claude |
|---|---|
| `list_brands` | Your client brands and their ids. Claude calls this first. |
| `get_brand_context` | The brand guide (description, objective, voice, pillars, personas, competitors, platform notes) plus the **knowledge pack**: positioning, offers, audiences and their own words, voice do/don't examples, banned phrases, proof points, competitors, platform notes. Only proof points marked verified may be quoted. Empty fields come back empty, so Claude can't guess them. |
| `get_analytics_summary` | Stats computed from imported analytics: totals, engagement rate, breakdowns by platform, format, weekday and month, top and bottom posts, and change vs the previous period or a comparison dataset. Notes say what the data can't support, such as missing dates, small samples or partly tracked metrics. |
| `get_analytics_rows` | Individual posts with their metrics, filtered and sorted. Use it for detail behind the summary. |
| `list_insights` / `list_directions` | Strategic insights and content directions, filterable by status and by who created them. |
| `list_briefs` | Briefs with short fields: version, status, date, platform, format, pillar, and unconfirmed count. |
| `get_brief` | One brief in full: assets, slides, scenes and captions. |
| `get_calendar` | Calendar events and dated briefs for one month. |
| `list_recent_feedback` | Review decisions, newest first: approved, rejected (with the reason) and needs changes (with what to change), by staff or the client, with dates. Filter by days or decision. Items reviewed before October 2026 show their status without a date. |
| `list_leads` / `list_discovery_requests` | Resource downloads and discovery-call bookings. Read-only, and they include names and emails. |

Sample and demo records (the old Acme, Global and Horizon data) are hidden from every tool. Responses say how many were hidden.

## Write tools (drafts only)

| Tool | What it saves |
|---|---|
| `create_insights` | 1–10 insights. `change` must be what the data actually shows, or "insufficient data", never a forecast. Each needs `evidence` (the figures behind it) and `confidence` (high, medium or low). |
| `create_directions` | 1–10 content directions: pillar, strategy, focus, checklist. |
| `create_briefs` | 1–10 v2 briefs. Each is one topic developed into 1–3 finished assets: carousel slides, reel or video scenes, blog article, static or text post. Each asset has the real copy and a caption per platform. Anything Claude can't confirm becomes an **unconfirmed** item, and it **blocks approval** until you click **Mark confirmed**. |
| `update_draft` | Edits a Claude item that is in Draft, or that you sent back with **Needs changes**. A revised item returns to Draft for you to re-review. It can't set status, and it can't touch anything you created, approved or rejected. |

Each write takes a `requestId`. If Claude retries after a timeout, the same id returns the drafts it already made instead of creating duplicates.

## Reviewing Claude's work in NOK OS

- **Insights / Directions:** click **Drafted by Claude**, or choose the **Draft** status filter. Use **Approve**, **Needs changes** (say what to change) or **Reject** (give a reason). Claude reads these notes, so specific reasons make its next drafts better.
- **Briefs:** Content Calendar → **Drafted by Claude**. Open a brief (click a calendar card, or **View** in Unscheduled Briefs) to read it. Use **Edit** to change it, and **Mark confirmed** once you've checked an unconfirmed item. **Request Changes** sends it back to Claude with a note, and **Reject** needs a reason. Use **Push to Calendar** to make it Proposed (the client can review it) or Approved.
- **Knowledge pack:** Brands → **Knowledge** on a brand. The more you fill in (their words, do/don't examples, verified proof points), the closer both Claude and the in-app AI get to the brand's voice.
- Clients never see Drafts. When they do see a brief, they don't see internal notes or Claude badges.

## Example prompts

### Monthly insight run

> Using the NOK OS connector, review **Standout Clothing** for **October 2026**.
> 1. Read the brand context and the analytics summary for 2026-10-01 to 2026-10-31 compared with the previous period. Also read recent feedback.
> 2. Tell me the 3–5 most important things the data shows, with the actual numbers. Flag anything the data notes say is weak (small samples, missing dates).
> 3. After I agree, save them as draft insights. Use standpoint "analytics" only where the numbers back it, and put the observed change in `change`.

### Directions from approved insights

> For **Standout Clothing**, read the approved insights and the brand context. Propose 3 content directions for November that build on them, each with a pillar, strategy, focus and a 3–4 item checklist. Show me first, then save the ones I pick as drafts.

### Brief run

> For **Standout Clothing**, read the brand context, approved directions, the October analytics summary and the November calendar.
> Draft 4 briefs for the weeks of 3, 10, 17 and 24 November (one per week, on the days that performed best).
> Each brief should have 1–2 finished assets. For carousels, write every slide's headline and body copy. For reels, write every scene with timings, on-screen text and voiceover. Write one caption per platform in the brand's voice.
> Don't invent stats, results or quotes. Use a bracketed placeholder and add an unconfirmed item instead.
> Show me the plan as a short list first, then save them as drafts.

### Revising after feedback

> For **Standout Clothing**, read the recent feedback for the last 14 days. For each Claude item marked "needs changes", apply the note and update the draft. Then summarise what you changed, and any pattern in what I keep rejecting.

### Fixing a draft

> In NOK OS, open the Claude draft brief "Behind the seams" for Standout Clothing. Shorten every slide's body copy to under 15 words and make the Instagram caption end with a question. Update the draft.

### Quick checks

> Which Standout Clothing briefs are blocked by unconfirmed items, and what does each one need?

> What did clients approve or ask to change last month, and what pattern do you see in the change requests?

## Limits to know

- Analytics are only as good as the import. Posts without a date can't be filtered by period, and reach, saves and similar metrics only count for posts where the export included them.
- Tiny posts (well below typical impressions) are left out of top/bottom rankings, because their rates are noise.
- Leads and discovery requests contain personal data. Only use them in chats you'd be comfortable keeping.
