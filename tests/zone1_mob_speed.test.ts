import { describe, expect, it } from "vitest";
import { ZONE1_MOBS } from "../src/sim/content/zone1";
import { RUN_SPEED } from "../src/sim/types";

describe("Eastbrook Vale mob movement speed", () => {
	it("keeps starter-zone mobs slower than players, except Mogger", () => {
		for (const mob of Object.values(ZONE1_MOBS)) {
			if (mob.petRole) continue;
			if (mob.id === "mogger") {
				expect(mob.moveSpeed).toBe(RUN_SPEED);
				continue;
			}
			expect(mob.moveSpeed).toBeLessThan(RUN_SPEED);
		}
	});
});

describe("Eastbrook Vale mob behavior authoring", () => {
	it("marks harmless starter wildlife as neutral instead of relying only on zero aggro radius", () => {
		expect(ZONE1_MOBS.brightwood_hare.aggression).toBe("neutral");
		expect(ZONE1_MOBS.spotted_fawn.aggression).toBe("neutral");
	});

	it("provides a live starter-zone fleeing mob with same-allegiance allies", () => {
		expect(ZONE1_MOBS.vale_bandit.willFlee).toBe(true);
		expect(ZONE1_MOBS.vale_bandit.allegiance).toBe("vale_bandits");
	});
});
