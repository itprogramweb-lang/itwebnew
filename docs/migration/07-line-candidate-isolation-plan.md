# LINE Candidate Isolation Plan

## Constraint

Production LINE webhook must remain untouched during Candidate setup.

## Preferred Safe Options

1. Separate Candidate LINE channel / OA / callback configuration
2. Candidate LINE features kept disabled until isolated test infrastructure exists
3. Manual/local non-live testing only

## Preferred Topology

```text
Candidate LINE channel/OA
    ->
Temporary Candidate callback/webhook URL
    ->
Candidate Ubuntu server
```

## Why Isolation Is Required

Confirmed repository behavior includes:

- webhook signature verification
- reply messages
- push notifications in complaint flow
- LINE Login account linking
- news-draft creation and publish flow from LINE

Without isolation, Candidate could:

- receive or process live Production events
- send real outbound LINE messages
- create or publish content unintentionally

## Fallback Rule

If separate Candidate LINE infrastructure is unavailable, all LINE side effects should remain disabled until a human explicitly authorizes a safe controlled test.