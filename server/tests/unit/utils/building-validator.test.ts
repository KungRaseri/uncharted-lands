import { describe, it, expect } from "vitest";
import { STRUCTURES } from "../../../src/data/structures.js";

describe("Building Validator - Structure Definitions", () => {
  it("should have Town Hall with unique=true and minTownHallLevel=0", () => {
    const townHall = STRUCTURES.find((s) => s.name === "Town Hall");
    expect(townHall).toBeDefined();
    expect(townHall.category).toBe("BUILDING");
    expect(townHall.unique).toBe(true);
    expect(townHall.minTownHallLevel).toBe(0);
    expect(townHall.areaCost).toBe(100);
  });

  it("should have Workshop with unique=true and minTownHallLevel=1", () => {
    const workshop = STRUCTURES.find((s) => s.name === "Workshop");
    expect(workshop).toBeDefined();
    expect(workshop.category).toBe("BUILDING");
    expect(workshop.unique).toBe(true);
    expect(workshop.minTownHallLevel).toBe(1);
    expect(workshop.areaCost).toBe(75);
  });

  it("should have Marketplace with unique=true and minTownHallLevel=3", () => {
    const marketplace = STRUCTURES.find((s) => s.name === "Marketplace");
    expect(marketplace).toBeDefined();
    expect(marketplace.category).toBe("BUILDING");
    expect(marketplace.unique).toBe(true);
    expect(marketplace.minTownHallLevel).toBe(3);
    expect(marketplace.areaCost).toBe(100);
  });

  it("should have all buildings with positive areaCost", () => {
    const buildings = STRUCTURES.filter((s) => s.category === "BUILDING");
    buildings.forEach((building) => {
      expect(building.areaCost).toBeGreaterThan(0);
    });
  });

  it("should have all extractors with areaCost=0", () => {
    const extractors = STRUCTURES.filter((s) => s.category === "EXTRACTOR");
    extractors.forEach((extractor) => {
      expect(extractor.areaCost).toBe(0);
    });
  });
});
