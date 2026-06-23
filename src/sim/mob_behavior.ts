import type { Entity, MobAggression, MobTemplate, Vec3 } from "./types";
import { dist2d, RUN_SPEED } from "./types";

export const WORLD_LEASH_DISTANCE = 45;
export const FLEE_HP_THRESHOLD = 0.2;
export const FLEE_DURATION = 5;
export const FLEE_SPEED_MULT = 0.8;
export const FLEE_MAX_SPEED = RUN_SPEED * 0.9;
export const FLEE_RETURN_GRACE = 8;
export const FLEE_HELP_RADIUS = 8;
export const DEFAULT_SOCIAL_PULL_RADIUS = 5;

export class MobRuntime {
	constructor(
		readonly entity: Entity,
		readonly template: MobTemplate | undefined,
	) {}

	get aggression(): MobAggression {
		return this.template?.aggression ?? "aggressive";
	}

	get willFlee(): boolean {
		return this.template?.willFlee === true;
	}

	get allegiance(): string | null {
		return this.entity.allegiance ?? this.template?.allegiance ?? null;
	}

	get socialPullRadius(): number {
		return socialPullRadius(this.template);
	}

	fleeMoveSpeed(moveSpeedMult: number): number {
		return Math.min(
			this.entity.moveSpeed * FLEE_SPEED_MULT * moveSpeedMult,
			FLEE_MAX_SPEED,
		);
	}

	sameAllegiance(other: MobRuntime): boolean {
		return this.allegiance !== null && this.allegiance === other.allegiance;
	}

	isInInstance(dungeonXThreshold: number): boolean {
		return (
			this.entity.spawnPos.x > dungeonXThreshold ||
			this.entity.dungeonId !== null
		);
	}

	canDistanceLeash(dungeonXThreshold: number): boolean {
		return !this.isInInstance(dungeonXThreshold);
	}
}

export interface MobLeashPolicy {
	shouldReset(mob: MobRuntime, target: Entity, leashAnchor: Vec3): boolean;
}

export class WorldLeashPolicy implements MobLeashPolicy {
	constructor(private readonly leashDistance = WORLD_LEASH_DISTANCE) {}

	shouldReset(mob: MobRuntime, _target: Entity, leashAnchor: Vec3): boolean {
		return dist2d(mob.entity.pos, leashAnchor) > this.leashDistance;
	}
}

export class InstanceLeashPolicy implements MobLeashPolicy {
	constructor(
		private readonly dungeonXThreshold: number,
		private readonly dungeonAtX: (x: number) => { id: string } | null,
	) {}

	shouldReset(mob: MobRuntime, target: Entity, _leashAnchor: Vec3): boolean {
		if (!mob.isInInstance(this.dungeonXThreshold)) return false;
		const mobDungeon =
			mob.entity.dungeonId ??
			this.dungeonAtX(mob.entity.spawnPos.x)?.id ??
			this.dungeonAtX(mob.entity.pos.x)?.id ??
			null;
		if (!mobDungeon) return false;
		return this.dungeonAtX(target.pos.x)?.id !== mobDungeon;
	}
}

export function leashPolicyForMob(
	mob: Entity,
	dungeonXThreshold: number,
	dungeonAtX: (x: number) => { id: string } | null,
): MobLeashPolicy {
	const runtime = new MobRuntime(mob, undefined);
	return runtime.canDistanceLeash(dungeonXThreshold)
		? new WorldLeashPolicy()
		: new InstanceLeashPolicy(dungeonXThreshold, dungeonAtX);
}

export function sameAllegiance(a: Entity, b: Entity): boolean {
	return a.allegiance !== null && a.allegiance === b.allegiance;
}

export function socialPullRadius(template: MobTemplate | undefined): number {
	return template?.socialPullRadius ?? DEFAULT_SOCIAL_PULL_RADIUS;
}
