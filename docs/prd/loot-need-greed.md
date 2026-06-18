# PRD — Need/Greed Loot Rolls (raid loot)

> Part of the v0.10.0 release (tracker #634, Priority 2 — raid support). Kickoff
> spec — implementation lands in follow-up commits on this branch.

## 1. Summary

A **need-before-greed** roll system for distributing raid-quality drops to a group.
Extends the existing party loot strategies (fair-split copper / random shared rolls,
#363) with an explicit, deterministic Need/Greed roll: each eligible member may roll
**Need**, **Greed**, or **Pass**; any Need beats every Greed; ties break by highest
roll. Resolves server-side, seeded through `Rng` (never `Math.random`).

## 2. Motivation

- Raids drop contested gear; random-only distribution is unfair for main-spec upgrades.
- Need/Greed is the genre-standard fairness mechanism and a prerequisite for shipping the
  10-man raid (#634 Priority 2).

## 3. Behavior

- Triggered for drops at/above a configured quality threshold (e.g. uncommon+/raid loot)
  when looted by a group rather than a solo player.
- Each eligible, in-range, living member is offered Need / Greed / Pass within a timeout.
- Resolution: any **Need** rolls win over all **Greed** rolls; within the winning tier,
  highest `Rng` roll (1–100) wins; remaining members are ordered for tiebreak audit.
- No responses / all pass → fall back to the existing random shared-loot strategy (#363).
- Need eligibility may be class/usability gated in a later iteration; v1 allows Need by all.
- Quest drops remain **personal** and never enter the roll (preserve #363 behavior).
- Fully deterministic and authoritative: same seed + same inputs ⇒ same winner.

## 4. Hook points (re-find exact file:line before editing)

- The party loot strategy code from #363 (sim loot resolution; see `tests/loot_drops.test.ts`).
  Add `need_greed` to the loot-strategy set and branch resolution there.
- `IWorld` (`src/world_api.ts`): a roll prompt/response surface so render/ui can show the
  roll window and submit Need/Greed/Pass; implement in both `Sim` and `ClientWorld`.
- Server command handling: accept roll submissions at 20 Hz like other commands; resolve
  authoritatively and emit a `SimEvent` with the winner + roll table.
- `src/ui/`: a Need/Greed roll window + result toast; all strings are `t()` keys.
- i18n: roll prompt, Need/Greed/Pass labels, winner/result text (`en` first + matcher for
  any sim/server-emitted text).

## 5. Acceptance criteria

- [ ] Need beats Greed; highest roll wins within a tier; deterministic by seed.
- [ ] Pass/no-response excludes the member; all-pass falls back to random (#363).
- [ ] Quest drops stay personal and never roll.
- [ ] Only triggers for grouped loot at/above the configured quality threshold.
- [ ] Server-authoritative; client only displays and submits intent.
- [ ] All roll UI/text localized; S3 guard + release-tier i18n gate pass.

## 6. Test plan

- Sim/unit: Need>Greed precedence; tie-break by roll; all-pass → random fallback; quest
  drops excluded; determinism (same seed ⇒ same winner) — extend `tests/loot_drops.test.ts`.
- Parity: roll prompt/response present and identical in `Sim` and `ClientWorld`.
- i18n: S3 (`tests/localization_fixes.test.ts`) + release-tier gate green.
- Manual: 2–10 player group, contested drop, Need/Greed/Pass paths, result toast.
