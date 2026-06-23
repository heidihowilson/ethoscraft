import { describe, expect, it } from "vitest";
import { MobTargeting } from "../src/sim/mob_targeting";
import type { Entity, MobTemplate, Vec3 } from "../src/sim/types";

type RadiusVisitor = (entity: Entity, distanceSquared: number) => void;

class TestSpatialIndex {
	constructor(private readonly entities: Entity[]) {}

	forEachInRadius(x: number, z: number, radius: number, visit: RadiusVisitor) {
		const r2 = radius * radius;
		for (const entity of this.entities) {
			const dx = entity.pos.x - x;
			const dz = entity.pos.z - z;
			const d2 = dx * dx + dz * dz;
			if (d2 <= r2) visit(entity, d2);
		}
	}
}

function template(overrides: Partial<MobTemplate> = {}): MobTemplate {
	return {
		id: "test_mob",
		name: "Test Mob",
		minLevel: 1,
		maxLevel: 1,
		type: "humanoid",
		hpBase: 10,
		hpPerLevel: 1,
		dmgBase: 1,
		dmgPerLevel: 1,
		attackSpeed: 2,
		armorPerLevel: 1,
		moveSpeed: 7,
		aggroRadius: 10,
		loot: [],
		scale: 1,
		color: 0xffffff,
		...overrides,
	};
}

function entity(overrides: Partial<Entity> = {}): Entity {
	const pos = overrides.pos ?? { x: 0, y: 0, z: 0 };
	return {
		id: 1,
		kind: "mob",
		templateId: "test_mob",
		name: "Test Mob",
		level: 1,
		guild: "",
		pos,
		prevPos: { ...pos },
		facing: 0,
		prevFacing: 0,
		vx: 0,
		vz: 0,
		vy: 0,
		onGround: true,
		jumping: false,
		fallStartY: 0,
		hp: 10,
		maxHp: 10,
		resource: 0,
		maxResource: 0,
		resourceType: null,
		overheadEmoteId: null,
		overheadEmoteUntil: 0,
		overheadEmoteSeq: 0,
		stats: { str: 0, agi: 0, sta: 0, int: 0, spi: 0, armor: 0 },
		weapon: { min: 1, max: 2, speed: 2 },
		attackPower: 0,
		rangedPower: 0,
		critChance: 0.05,
		dodgeChance: 0.05,
		moveSpeed: 7,
		hostile: true,
		targetId: null,
		autoAttack: false,
		swingTimer: 0,
		inCombat: false,
		combatTimer: 0,
		auras: [],
		ccDr: new Map(),
		castingAbility: null,
		castRemaining: 0,
		castTotal: 0,
		channeling: false,
		channelTickTimer: 0,
		channelTickEvery: 0,
		gcdRemaining: 0,
		cooldowns: new Map(),
		queuedOnSwing: null,
		fiveSecondRule: 0,
		comboPoints: 0,
		comboTargetId: null,
		overpowerUntil: -1,
		potionCooldownUntil: -1,
		chargeTargetId: null,
		chargeTimeLeft: 0,
		chargePath: [],
		followTargetId: null,
		savedMana: 0,
		sitting: false,
		eating: null,
		drinking: null,
		aiState: "idle",
		tappedById: null,
		threat: new Map(),
		forcedTargetId: null,
		forcedTargetTimer: 0,
		ownerId: null,
		allegiance: null,
		petMode: "defensive",
		petTauntTimer: 0,
		petPath: [],
		petPathCooldown: 0,
		pulseTimer: 0,
		stompTimer: 0,
		stoneskinTimer: 0,
		terrifyTimer: 0,
		detonateTimer: Infinity,
		mendTimer: 0,
		wardTimer: 0,
		rallyTimer: 0,
		warcryTimer: 0,
		firedSummons: 0,
		summonedIds: [],
		enraged: false,
		healedThisPull: false,
		spawnPos: { ...pos },
		leashAnchor: null,
		pursuitStallTimer: 0,
		evadeStall: 0,
		fleeTimer: 0,
		fleeReturnTimer: 0,
		hasFled: false,
		wanderTarget: null,
		wanderTimer: 0,
		aggroTargetId: null,
		respawnTimer: 0,
		corpseTimer: 0,
		lootable: false,
		loot: null,
		xpValue: 0,
		questIds: [],
		vendorItems: [],
		objectItemId: null,
		dungeonId: null,
		dead: false,
		scale: 1,
		color: 0xffffff,
		skinCatalog: "class",
		skin: 0,
		...overrides,
	};
}

function player(id: number, pos: Vec3): Entity {
	return entity({
		id,
		kind: "player",
		templateId: "player",
		name: `P${id}`,
		pos,
	});
}

function targeting(
	entities: Entity[],
	templates = new Map<string, MobTemplate>(),
) {
	const byId = new Map(entities.map((e) => [e.id, e]));
	const index = new TestSpatialIndex(entities);
	return new MobTargeting({
		entities: byId,
		grid: index,
		playerGrid: index,
		templateFor: (id) => templates.get(id),
		isTrivialTo: () => false,
		nythraxisAddFallbackTarget: () => null,
		scheduleNythraxisAddDespawnIfBossReset: () => false,
	});
}

describe("MobTargeting", () => {
	it("picks the highest living threat target and prunes stale entries", () => {
		const mob = entity({ id: 10 });
		const low = player(1, { x: 2, y: 0, z: 0 });
		const high = player(2, { x: 8, y: 0, z: 0 });
		mob.threat.set(low.id, 50);
		mob.threat.set(high.id, 100);
		mob.threat.set(999, 500);

		expect(targeting([mob, low, high]).highestThreatTarget(mob)).toBe(high);
		expect(mob.threat.has(999)).toBe(false);
	});

	it("switches targets only when the pull-over threshold is exceeded", () => {
		const mob = entity({ id: 10, aggroTargetId: 1 });
		const current = player(1, { x: 1, y: 0, z: 0 });
		const challenger = player(2, { x: 2, y: 0, z: 0 });
		mob.threat.set(current.id, 100);
		mob.threat.set(challenger.id, 109);
		const mobTargeting = targeting([mob, current, challenger]);

		mobTargeting.updateMobTarget(mob);
		expect(mob.aggroTargetId).toBe(current.id);

		mob.threat.set(challenger.id, 111);
		mobTargeting.updateMobTarget(mob);
		expect(mob.aggroTargetId).toBe(challenger.id);
	});

	it("seeds social aggro only into idle same-allegiance mobs", () => {
		const target = player(1, { x: 0, y: 0, z: 0 });
		const puller = entity({
			id: 10,
			allegiance: "crypt",
			pos: { x: 0, y: 0, z: 0 },
		});
		const ally = entity({
			id: 11,
			allegiance: "crypt",
			pos: { x: 2, y: 0, z: 0 },
		});
		const stranger = entity({
			id: 12,
			allegiance: "forest",
			pos: { x: 2, y: 0, z: 1 },
		});

		targeting([target, puller, ally, stranger]).aggroMob(puller, target, true);

		expect(puller.aggroTargetId).toBe(target.id);
		expect(puller.threat.get(target.id)).toBe(1);
		expect(ally.aggroTargetId).toBe(target.id);
		expect(ally.threat.get(target.id)).toBe(1);
		expect(stranger.aggroTargetId).toBeNull();
		expect(stranger.threat.size).toBe(0);
	});

	it("retargets to evade when no threat or encounter fallback remains", () => {
		const mob = entity({
			id: 10,
			aiState: "attack",
			inCombat: true,
			aggroTargetId: 1,
		});
		const dead = player(1, { x: 0, y: 0, z: 0 });
		dead.dead = true;
		mob.threat.set(dead.id, 100);

		targeting([mob, dead]).retargetMob(mob);

		expect(mob.aggroTargetId).toBeNull();
		expect(mob.aiState).toBe("evade");
		expect(mob.threat.size).toBe(0);
	});
});
