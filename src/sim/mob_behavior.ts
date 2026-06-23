import type { Entity, MobAggression, MobTemplate, Vec3 } from './types';
import { RUN_SPEED, dist2d } from './types';

export const WORLD_LEASH_DISTANCE = 45;
export const FLEE_HP_THRESHOLD = 0.2;
export const FLEE_DURATION = 5;
export const FLEE_SPEED_MULT = 0.8;
export const FLEE_MAX_SPEED = RUN_SPEED * 0.9;
export const FLEE_RETURN_GRACE = 8;
export const FLEE_HELP_RADIUS = 8;
export const DEFAULT_SOCIAL_PULL_RADIUS = 5;
export const MURLOC_SOCIAL_PULL_RADIUS = 8;

export function mobAggression(template: MobTemplate | undefined): MobAggression {
  return template?.aggression ?? 'aggressive';
}

export function mobWillFlee(template: MobTemplate | undefined): boolean {
  return template?.willFlee === true;
}

export function mobAllegiance(template: MobTemplate | undefined): string | null {
  return template?.allegiance ?? null;
}

export function effectiveFleeMoveSpeed(baseMoveSpeed: number, moveSpeedMult: number): number {
  return Math.min(baseMoveSpeed * FLEE_SPEED_MULT * moveSpeedMult, FLEE_MAX_SPEED);
}

export function sameAllegiance(a: Entity, b: Entity): boolean {
  return a.allegiance !== null && a.allegiance === b.allegiance;
}

export function socialPullRadius(template: MobTemplate | undefined): number {
  return template?.mobType === 'murloc' ? MURLOC_SOCIAL_PULL_RADIUS : DEFAULT_SOCIAL_PULL_RADIUS;
}

export function mobIsInInstance(mob: Entity, dungeonXThreshold: number): boolean {
  return mob.spawnPos.x > dungeonXThreshold || mob.dungeonId !== null;
}

export function mobCanDistanceLeash(mob: Entity, dungeonXThreshold: number): boolean {
  return !mobIsInInstance(mob, dungeonXThreshold);
}

export function targetEscapedMobInstance(
  mob: Entity,
  target: Entity,
  dungeonXThreshold: number,
  dungeonAtX: (x: number) => { id: string } | null,
): boolean {
  if (!mobIsInInstance(mob, dungeonXThreshold)) return false;
  const mobDungeon = mob.dungeonId ?? dungeonAtX(mob.spawnPos.x)?.id ?? dungeonAtX(mob.pos.x)?.id ?? null;
  if (!mobDungeon) return false;
  return dungeonAtX(target.pos.x)?.id !== mobDungeon;
}

export function exceededWorldLeash(mob: Entity, leashAnchor: Vec3): boolean {
  return dist2d(mob.pos, leashAnchor) > WORLD_LEASH_DISTANCE;
}
