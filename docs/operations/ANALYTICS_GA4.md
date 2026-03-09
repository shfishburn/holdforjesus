# GA4 Analytics: Event Taxonomy and Funnel Setup

Measurement ID: `G-2FDVE014T8`

## Consent Model
- Analytics is disabled by default.
- Events fire only when `analyticsConsent = true` in `hotline-preferences`.
- Consent is requested via `AnalyticsConsentBanner` and can be changed on `/privacy`.

## Event Catalog

### Auto / Navigation
- `page_view`
  - Params: `page_title`, `page_location`, `page_path`

### Landing CTAs
- `cta_clicked`
  - Params: `cta`
  - Known values: `submit_prayer_hero`, `community_wall`, `crisis_resources`, `global_pain_index`

### Prayer Flow
- `prayer_submitted`
  - Params: `faith_id`, `department`, `category`, `prayer_length`, `share_to_wall`, `research_consent`
- `prayer_response_received`
  - Params: `faith_id`, `department`, `category`, `response_mode`, `has_closing_prayer`
- `prayer_response_error`
  - Params: `faith_id`, `department`, `category`, `error_title`
- `prayer_transferred`
  - Params: `faith_id`, `from_department`, `to_department`, `category`

### Response Engagement
- `response_rated`
  - Params: `faith_id`, `department`, `category`, `rating`
- `response_favorite_toggled`
  - Params: `faith_id`, `department`, `category`, `favorited`
- `response_action_clicked`
  - Params: `faith_id`, `department`, `action`
  - Known `action` values: `hang_up`, `call_again`
- `transcript_copied`
  - Params: `faith_id`, `department`
- `response_shared`
  - Params: `faith_id`, `department`, `method`
  - Known `method` values: `native_share`, `clipboard`
- `response_share_failed`
  - Params: `faith_id`, `department`
- `share_card_downloaded`
  - Params: `faith_id`, `department`
- `share_card_shared`
  - Params: `faith_id`, `department`, `method`
- `crisis_hotline_clicked`
  - Params: `source`, `faith_id`

## GA4 Setup: Mark Key Conversions
In Google Analytics (Admin):
1. Open `Events`.
2. Mark these as conversions:
   - `prayer_submitted`
   - `prayer_response_received`
   - `response_shared`
   - `crisis_hotline_clicked`

## GA4 Funnel Exploration (Suggested)
Create an Exploration: `Explore` -> `Funnel exploration`.

### Funnel A: Primary Prayer Journey
1. Step 1: `cta_clicked` where `cta = submit_prayer_hero`
2. Step 2: `prayer_submitted`
3. Step 3: `prayer_response_received`

Recommended settings:
- Funnel type: Closed
- Time window: 30 minutes
- Breakdown: `faith_id`

### Funnel B: Engagement After Response
1. Step 1: `prayer_response_received`
2. Step 2: Any of:
   - `response_rated`
   - `response_favorite_toggled`
   - `response_shared`
   - `share_card_downloaded`

Recommended settings:
- Funnel type: Open
- Breakdown: `department`

### Funnel C: Crisis Support Clickthrough
1. Step 1: `prayer_response_received`
2. Step 2: `crisis_hotline_clicked`

Recommended settings:
- Funnel type: Open
- Breakdown: `response_mode`

## QA Checklist
- With analytics disabled, verify no events are sent.
- Opt in from banner or `/privacy` and verify events appear in Realtime.
- Trigger each major action at least once:
  - Submit prayer
  - Receive response
  - Rate response
  - Save favorite
  - Copy transcript
  - Share response/card
  - Click 988 link
