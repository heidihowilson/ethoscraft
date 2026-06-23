import { describe, expect, it } from "vitest";
import { ZONE1_MOBS } from "../src/sim/content/zone1";
import { createMob } from "../src/sim/entity";
import { RUN_SPEED } from "../src/sim/types";

describe("Eastbrook Vale mob movement speed", () => {
	it("keeps authored starter-zone base speeds at or below player speed, except pets", () => {
		for (const mob of Object.values(ZONE1_MOBS)) {
			if (mob.petRole) continue;
			expect(mob.moveSpeed).toBeLessThanOrEqual(RUN_SPEED);
		}
	});

	it("scales normal starter-zone mob speed by level when mobs initialize", () => {
		const levelOneWolf = createMob(1, ZONE1_MOBS.forest_wolf, 1, {
			x: 0,
			y: 0,
			z: 0,
		});
		const levelFiveWolf = createMob(2, ZONE1_MOBS.forest_wolf, 5, {
			x: 0,
			y: 0,
			z: 0,
		});
		const levelTenWolf = createMob(3, ZONE1_MOBS.forest_wolf, 10, {
			x: 0,
			y: 0,
			z: 0,
		});

		expect(levelOneWolf.moveSpeed).toBeCloseTo(RUN_SPEED * 0.7, 5);
		expect(levelFiveWolf.moveSpeed).toBeCloseTo(RUN_SPEED * (0.7 + 4 / 30), 5);
		expect(levelTenWolf.moveSpeed).toBe(RUN_SPEED);
	});

	it("does not speed-scale starter-zone elites or pets", () => {
		const elite = createMob(4, ZONE1_MOBS.elder_bristleback, 5, {
			x: 0,
			y: 0,
			z: 0,
		});
		const pet = createMob(5, ZONE1_MOBS.warlock_voidwalker, 10, {
			x: 0,
			y: 0,
			z: 0,
		});

		expect(elite.moveSpeed).toBe(ZONE1_MOBS.elder_bristleback.moveSpeed);
		expect(pet.moveSpeed).toBe(ZONE1_MOBS.warlock_voidwalker.moveSpeed);
	});
});

describe("Eastbrook Vale mob behavior authoring", () => {
	it("marks harmless starter wildlife as neutral instead of relying only on zero aggro radius", () => {
		expect(ZONE1_MOBS.brightwood_hare.aggression).toBe("neutral");
		expect(ZONE1_MOBS.spotted_fawn.aggression).toBe("neutral");
	});

	it("keeps starter wolves and boars neutral, non-fleeing, and unaffiliated", () => {
		for (const id of [
			"forest_wolf",
			"wild_boar",
			"elder_bristleback",
		] as const) {
			expect(ZONE1_MOBS[id].aggression).toBe("neutral");
			expect(ZONE1_MOBS[id].willFlee).toBe(false);
			expect(ZONE1_MOBS[id].allegiance).toBeUndefined();
		}
	});

	it("keeps Old Greyjaw aggressive while preventing flee and social help", () => {
		expect(ZONE1_MOBS.old_greyjaw.aggression).toBeUndefined();
		expect(ZONE1_MOBS.old_greyjaw.willFlee).toBe(false);
		expect(ZONE1_MOBS.old_greyjaw.allegiance).toBeUndefined();
	});

	it("makes starter humanoid camps hostile, fleeing, and socially allied", () => {
		expect(ZONE1_MOBS.tunnel_rat.aggression).toBeUndefined();
		expect(ZONE1_MOBS.tunnel_rat.willFlee).toBe(true);
		expect(ZONE1_MOBS.tunnel_rat.allegiance).toBe("tunnel_rats");

		expect(ZONE1_MOBS.vale_bandit.aggression).toBeUndefined();
		expect(ZONE1_MOBS.vale_bandit.willFlee).toBe(true);
		expect(ZONE1_MOBS.vale_bandit.allegiance).toBe("vale_bandits");
	});

	it("makes starter murlocs hostile, fleeing, and socially allied", () => {
		expect(ZONE1_MOBS.mudfin_murloc.aggression).toBeUndefined();
		expect(ZONE1_MOBS.mudfin_murloc.willFlee).toBe(true);
		expect(ZONE1_MOBS.mudfin_murloc.allegiance).toBe("mudfin_murlocs");
	});
});
