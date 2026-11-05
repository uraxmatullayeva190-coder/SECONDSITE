/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BuildingDefinition } from '../types/game';

// Shared material cache and palettes
const materials = {
  grass: new THREE.MeshStandardMaterial({ color: 0x5da845, roughness: 0.85, metalness: 0.05 }),
  water: new THREE.MeshPhysicalMaterial({
    color: 0x228be6,
    roughness: 0.15,
    metalness: 0.2,
    transmission: 0.6,
    transparent: true,
    opacity: 0.85,
    ior: 1.333,
  }),
  roadAsphalt: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, metalness: 0.1 }),
  roadMarking: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 }),
  sidewalk: new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.8 }),
  curb: new THREE.MeshStandardMaterial({ color: 0x90a4ae, roughness: 0.8 }),
  curbGrass: new THREE.MeshStandardMaterial({ color: 0x488a35, roughness: 0.8 }),
  bridgeStone: new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.7, metalness: 0.2 }),
  bridgeRail: new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.4, metalness: 0.7 }),

  // Building components
  concrete: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.85 }),
  darkRoof: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 }),
  redRoof: new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.6 }),
  orangeRoof: new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.6 }),
  blueRoof: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 }),
  woodPlank: new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 }),
  whiteWall: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 }),
  beigeWall: new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.85 }),
  brickWall: new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.9 }),
  modernWall: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 }),
  glassWindow: new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    roughness: 0.1,
    metalness: 0.8,
    clearcoat: 1.0,
  }),
  windowNightGlow: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
  doorDark: new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 }),
  metalGrey: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.85 }),
  goldBronze: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.9 }),
  treeWood: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }),
  foliageBright: new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.85 }),
  foliageDark: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 }),
  foliageAutumn: new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.85 }),
  waterFountain: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, transparent: true, opacity: 0.85 }),
  solarPanel: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.15, metalness: 0.9 }),
  awningRedWhite: new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.7 }),
  awningYellow: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 }),
  lampGlow: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
};

// Night glow meshes container list for day/night toggle
export interface BuildingObjectWithGlow extends THREE.Group {
  nightGlowMeshes?: THREE.Mesh[];
  rotatingBlades?: THREE.Group;
  fountainJets?: THREE.Mesh[];
}

/**
 * Creates a detailed tree composite group (3-4 parts: trunk, canopy layers)
 */
export function createTree(scale: number = 1, autumn: boolean = false): THREE.Group {
  const group = new THREE.Group();

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.08 * scale, 0.13 * scale, 0.8 * scale, 6);
  const trunk = new THREE.Mesh(trunkGeo, materials.treeWood);
  trunk.position.y = 0.4 * scale;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const foliageMat = autumn ? materials.foliageAutumn : (scale > 1.1 ? materials.foliageDark : materials.foliageBright);

  // Lower canopy cone/dome
  const lowerGeo = new THREE.ConeGeometry(0.55 * scale, 0.8 * scale, 7);
  const lower = new THREE.Mesh(lowerGeo, foliageMat);
  lower.position.y = 0.8 * scale;
  lower.castShadow = true;
  lower.receiveShadow = true;
  group.add(lower);

  // Mid canopy
  const midGeo = new THREE.ConeGeometry(0.42 * scale, 0.7 * scale, 7);
  const mid = new THREE.Mesh(midGeo, foliageMat);
  mid.position.y = 1.15 * scale;
  mid.castShadow = true;
  group.add(mid);

  // Top canopy
  const topGeo = new THREE.ConeGeometry(0.28 * scale, 0.5 * scale, 7);
  const top = new THREE.Mesh(topGeo, foliageMat);
  top.position.y = 1.45 * scale;
  top.castShadow = true;
  group.add(top);

  return group;
}

/**
 * Creates a bench prop
 */
export function createBench(): THREE.Group {
  const bench = new THREE.Group();
  const seatGeo = new THREE.BoxGeometry(0.6, 0.05, 0.22);
  const seat = new THREE.Mesh(seatGeo, materials.woodPlank);
  seat.position.y = 0.15;
  bench.add(seat);

  const backGeo = new THREE.BoxGeometry(0.6, 0.2, 0.04);
  const back = new THREE.Mesh(backGeo, materials.woodPlank);
  back.position.set(0, 0.27, -0.09);
  bench.add(back);

  const legGeo = new THREE.BoxGeometry(0.05, 0.2, 0.22);
  const leg1 = new THREE.Mesh(legGeo, materials.metalGrey);
  leg1.position.set(-0.25, 0.1, 0);
  const leg2 = leg1.clone();
  leg2.position.set(0.25, 0.1, 0);
  bench.add(leg1, leg2);

  return bench;
}

/**
 * Creates a street lamp post
 */
export function createStreetLamp(): { group: THREE.Group; glow: THREE.Mesh } {
  const group = new THREE.Group();
  const poleGeo = new THREE.CylinderGeometry(0.03, 0.05, 1.2, 6);
  const pole = new THREE.Mesh(poleGeo, materials.metalGrey);
  pole.position.y = 0.6;
  pole.castShadow = true;
  group.add(pole);

  const armGeo = new THREE.BoxGeometry(0.25, 0.04, 0.04);
  const arm = new THREE.Mesh(armGeo, materials.metalGrey);
  arm.position.set(0.1, 1.18, 0);
  group.add(arm);

  const headGeo = new THREE.ConeGeometry(0.08, 0.08, 6);
  const head = new THREE.Mesh(headGeo, materials.metalGrey);
  head.position.set(0.2, 1.15, 0);
  group.add(head);

  const bulbGeo = new THREE.SphereGeometry(0.06, 6, 6);
  const bulb = new THREE.Mesh(bulbGeo, materials.lampGlow);
  bulb.position.set(0.2, 1.1, 0);
  group.add(bulb);

  return { group, glow: bulb };
}

/**
 * Helper to add windows with day/night glow support
 */
function addWindowGrid(
  parent: THREE.Group,
  glowList: THREE.Mesh[],
  xCount: number,
  yCount: number,
  startX: number,
  startY: number,
  spacingX: number,
  spacingY: number,
  zPos: number,
  winW: number = 0.18,
  winH: number = 0.25
) {
  const winGeo = new THREE.BoxGeometry(winW, winH, 0.02);
  for (let ix = 0; ix < xCount; ix++) {
    for (let iy = 0; iy < yCount; iy++) {
      const win = new THREE.Mesh(winGeo, materials.glassWindow);
      win.position.set(startX + ix * spacingX, startY + iy * spacingY, zPos);
      parent.add(win);
      glowList.push(win);
    }
  }
}

/**
 * Main procedural building factory
 */
export function buildProceduralBuilding(def: BuildingDefinition): BuildingObjectWithGlow {
  const group: BuildingObjectWithGlow = new THREE.Group();
  const glowMeshes: THREE.Mesh[] = [];

  const [wCells, dCells] = def.size;
  const width = wCells * 1.9; // grid cell size ~ 2.0 with margin
  const depth = dCells * 1.9;

  // Foundation platform
  const foundationGeo = new THREE.BoxGeometry(width, 0.12, depth);
  const foundationMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.9,
  });
  const foundation = new THREE.Mesh(foundationGeo, foundationMat);
  foundation.position.y = 0.06;
  foundation.receiveShadow = true;
  group.add(foundation);

  switch (def.styleVariant) {
    case 'cottage': {
      // Main walls
      const wallMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.75 });
      const bodyGeo = new THREE.BoxGeometry(width * 0.75, 1.1, depth * 0.75);
      const body = new THREE.Mesh(bodyGeo, wallMat);
      body.position.y = 0.67;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Pitched roof (gable)
      const roofGeo = new THREE.ConeGeometry(width * 0.65, 0.7, 4);
      roofGeo.rotateY(Math.PI / 4);
      const roof = new THREE.Mesh(roofGeo, materials.orangeRoof);
      roof.position.y = 1.55;
      roof.scale.set(1.1, 1, 1.1);
      roof.castShadow = true;
      group.add(roof);

      // Chimney
      const chimneyGeo = new THREE.BoxGeometry(0.18, 0.5, 0.18);
      const chimney = new THREE.Mesh(chimneyGeo, materials.brickWall);
      chimney.position.set(0.35, 1.6, 0.2);
      chimney.castShadow = true;
      group.add(chimney);

      // Front door
      const doorGeo = new THREE.BoxGeometry(0.24, 0.45, 0.04);
      const door = new THREE.Mesh(doorGeo, materials.doorDark);
      door.position.set(0, 0.35, depth * 0.375 + 0.02);
      group.add(door);

      // Porch lamp
      const lampGeo = new THREE.SphereGeometry(0.05, 6, 6);
      const lamp = new THREE.Mesh(lampGeo, materials.lampGlow);
      lamp.position.set(0.18, 0.52, depth * 0.375 + 0.03);
      group.add(lamp);
      glowMeshes.push(lamp);

      // Windows
      addWindowGrid(group, glowMeshes, 2, 1, -0.3, 0.75, 0.6, 0, depth * 0.375 + 0.02);
      addWindowGrid(group, glowMeshes, 2, 1, -0.3, 0.75, 0.6, 0, -depth * 0.375 - 0.02);

      // Garden tree & fence
      const tree = createTree(0.7);
      tree.position.set(width * 0.35, 0.12, -depth * 0.3);
      group.add(tree);
      break;
    }

    case 'apartment': {
      const isLarge = wCells >= 2;
      const height = isLarge ? 2.8 : 2.0;

      // Main facade
      const wallMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.6 });
      const bodyGeo = new THREE.BoxGeometry(width * 0.85, height, depth * 0.82);
      const body = new THREE.Mesh(bodyGeo, wallMat);
      body.position.y = height / 2 + 0.12;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Roof parapet
      const parapetGeo = new THREE.BoxGeometry(width * 0.88, 0.16, depth * 0.85);
      const parapet = new THREE.Mesh(parapetGeo, materials.concrete);
      parapet.position.y = height + 0.18;
      parapet.castShadow = true;
      group.add(parapet);

      // Rooftop AC and access box
      const acGeo = new THREE.BoxGeometry(0.35, 0.25, 0.45);
      const ac = new THREE.Mesh(acGeo, materials.metalGrey);
      ac.position.set(-width * 0.2, height + 0.3, 0);
      group.add(ac);

      // Balconies with railings
      const balcGeo = new THREE.BoxGeometry(0.5, 0.06, 0.22);
      const balcRailGeo = new THREE.BoxGeometry(0.5, 0.22, 0.02);
      const floors = isLarge ? 3 : 2;

      for (let f = 1; f <= floors; f++) {
        const by = 0.5 + f * 0.65;
        const balc = new THREE.Mesh(balcGeo, materials.concrete);
        balc.position.set(0, by, depth * 0.41 + 0.1);
        const rail = new THREE.Mesh(balcRailGeo, materials.metalGrey);
        rail.position.set(0, by + 0.12, depth * 0.41 + 0.2);
        group.add(balc, rail);
      }

      // Windows grid on front and back
      const cols = isLarge ? 4 : 2;
      const startX = -((cols - 1) * 0.42) / 2;
      addWindowGrid(group, glowMeshes, cols, floors + 1, startX, 0.6, 0.42, 0.6, depth * 0.41 + 0.02);
      addWindowGrid(group, glowMeshes, cols, floors + 1, startX, 0.6, 0.42, 0.6, -depth * 0.41 - 0.02);

      // Entrance glass canopy
      const canopyGeo = new THREE.BoxGeometry(0.7, 0.04, 0.35);
      const canopy = new THREE.Mesh(canopyGeo, materials.glassWindow);
      canopy.position.set(0, 0.6, depth * 0.41 + 0.2);
      group.add(canopy);
      break;
    }

    case 'skyscraper': {
      // 3-tiered modern glass tower
      const baseHeight = 2.4;
      const midHeight = 2.2;
      const topHeight = 1.8;

      // Tier 1 Base
      const t1Geo = new THREE.BoxGeometry(width * 0.88, baseHeight, depth * 0.88);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        roughness: 0.1,
        metalness: 0.85,
        clearcoat: 1.0,
      });
      const t1 = new THREE.Mesh(t1Geo, glassMat);
      t1.position.y = baseHeight / 2 + 0.12;
      t1.castShadow = true;
      group.add(t1);

      // Tier 2 Middle
      const t2Geo = new THREE.BoxGeometry(width * 0.72, midHeight, depth * 0.72);
      const t2 = new THREE.Mesh(t2Geo, glassMat);
      t2.position.y = baseHeight + midHeight / 2 + 0.12;
      t2.castShadow = true;
      group.add(t2);

      // Tier 3 Top
      const t3Geo = new THREE.BoxGeometry(width * 0.55, topHeight, depth * 0.55);
      const t3 = new THREE.Mesh(t3Geo, glassMat);
      t3.position.y = baseHeight + midHeight + topHeight / 2 + 0.12;
      t3.castShadow = true;
      group.add(t3);

      // Helipad on setback terrace
      const heliGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.04, 16);
      const heli = new THREE.Mesh(heliGeo, materials.darkRoof);
      heli.position.set(0, baseHeight + midHeight + topHeight + 0.14, 0);
      group.add(heli);

      // Glowing Spire antenna
      const spireGeo = new THREE.CylinderGeometry(0.02, 0.05, 1.4, 6);
      const spire = new THREE.Mesh(spireGeo, materials.metalGrey);
      spire.position.set(0, baseHeight + midHeight + topHeight + 0.85, 0);
      group.add(spire);

      const beaconGeo = new THREE.SphereGeometry(0.08, 6, 6);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, baseHeight + midHeight + topHeight + 1.55, 0);
      group.add(beacon);
      glowMeshes.push(beacon);

      // Window grid rows across all tiers
      addWindowGrid(group, glowMeshes, 4, 3, -0.6, 0.6, 0.4, 0.6, depth * 0.44 + 0.02);
      addWindowGrid(group, glowMeshes, 3, 3, -0.4, baseHeight + 0.5, 0.4, 0.6, depth * 0.36 + 0.02);
      addWindowGrid(group, glowMeshes, 2, 2, -0.2, baseHeight + midHeight + 0.5, 0.4, 0.6, depth * 0.27 + 0.02);
      break;
    }

    case 'shop':
    case 'cafe': {
      // Storefront with striped awning and showcase glass
      const wallMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.7 });
      const bodyGeo = new THREE.BoxGeometry(width * 0.8, 1.25, depth * 0.78);
      const body = new THREE.Mesh(bodyGeo, wallMat);
      body.position.y = 0.74;
      body.castShadow = true;
      group.add(body);

      // Upper decorative cornice
      const corniceGeo = new THREE.BoxGeometry(width * 0.84, 0.15, depth * 0.82);
      const cornice = new THREE.Mesh(corniceGeo, materials.concrete);
      cornice.position.y = 1.42;
      group.add(cornice);

      // Large display window
      const shopWinGeo = new THREE.BoxGeometry(0.7, 0.6, 0.05);
      const shopWin = new THREE.Mesh(shopWinGeo, materials.glassWindow);
      shopWin.position.set(-0.2, 0.55, depth * 0.39 + 0.02);
      group.add(shopWin);
      glowMeshes.push(shopWin);

      // Shop door
      const shopDoorGeo = new THREE.BoxGeometry(0.3, 0.65, 0.04);
      const shopDoor = new THREE.Mesh(shopDoorGeo, materials.glassWindow);
      shopDoor.position.set(0.35, 0.52, depth * 0.39 + 0.02);
      group.add(shopDoor);

      // Striped awning
      const awningGeo = new THREE.BoxGeometry(0.9, 0.08, 0.35);
      awningGeo.rotateX(0.25);
      const awning = new THREE.Mesh(awningGeo, def.styleVariant === 'cafe' ? materials.awningRedWhite : materials.awningYellow);
      awning.position.set(0, 0.95, depth * 0.39 + 0.18);
      awning.castShadow = true;
      group.add(awning);

      // Outdoor table & parasol if cafe
      if (def.styleVariant === 'cafe') {
        const tableGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.03, 8);
        const table = new THREE.Mesh(tableGeo, materials.woodPlank);
        table.position.set(width * 0.32, 0.3, -depth * 0.25);
        group.add(table);

        const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.28, 6);
        const leg = new THREE.Mesh(legGeo, materials.metalGrey);
        leg.position.set(width * 0.32, 0.15, -depth * 0.25);
        group.add(leg);

        const parasolGeo = new THREE.ConeGeometry(0.35, 0.18, 8);
        const parasol = new THREE.Mesh(parasolGeo, materials.awningRedWhite);
        parasol.position.set(width * 0.32, 0.65, -depth * 0.25);
        group.add(parasol);
      }
      break;
    }

    case 'mall': {
      // Large 2x2 shopping mall with central atrium
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 });
      const bodyGeo = new THREE.BoxGeometry(width * 0.88, 1.8, depth * 0.88);
      const body = new THREE.Mesh(bodyGeo, wallMat);
      body.position.y = 1.02;
      body.castShadow = true;
      group.add(body);

      // Glass atrium dome
      const domeGeo = new THREE.SphereGeometry(0.8, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, materials.glassWindow);
      dome.position.set(0, 1.9, 0);
      group.add(dome);

      // Grand entrance canopy
      const entryGeo = new THREE.BoxGeometry(1.4, 0.1, 0.5);
      const entry = new THREE.Mesh(entryGeo, materials.concrete);
      entry.position.set(0, 0.9, depth * 0.44 + 0.25);
      group.add(entry);

      // Glowing logo billboard
      const signGeo = new THREE.BoxGeometry(0.9, 0.35, 0.08);
      const signMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, 1.45, depth * 0.44 + 0.05);
      group.add(sign);
      glowMeshes.push(sign);

      addWindowGrid(group, glowMeshes, 4, 2, -0.9, 0.65, 0.6, 0.6, depth * 0.44 + 0.02);
      break;
    }

    case 'office': {
      // Modern corporate twin-towers on shared podium
      const podiumGeo = new THREE.BoxGeometry(width * 0.9, 0.8, depth * 0.9);
      const podium = new THREE.Mesh(podiumGeo, materials.concrete);
      podium.position.y = 0.52;
      podium.castShadow = true;
      group.add(podium);

      // Tower A
      const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0284c7, roughness: 0.15, metalness: 0.9 });
      const towerGeo1 = new THREE.BoxGeometry(width * 0.38, 3.2, depth * 0.7);
      const tower1 = new THREE.Mesh(towerGeo1, glassMat);
      tower1.position.set(-width * 0.22, 2.3, 0);
      tower1.castShadow = true;
      group.add(tower1);

      // Tower B
      const towerGeo2 = new THREE.BoxGeometry(width * 0.38, 2.6, depth * 0.7);
      const tower2 = new THREE.Mesh(towerGeo2, glassMat);
      tower2.position.set(width * 0.22, 2.0, 0);
      tower2.castShadow = true;
      group.add(tower2);

      // Skybridge connecting the towers
      const bridgeGeo = new THREE.BoxGeometry(width * 0.44, 0.25, 0.25);
      const skybridge = new THREE.Mesh(bridgeGeo, materials.concrete);
      skybridge.position.set(0, 2.2, 0);
      group.add(skybridge);

      addWindowGrid(group, glowMeshes, 2, 4, -width * 0.22 - 0.2, 1.2, 0.4, 0.55, depth * 0.35 + 0.02);
      addWindowGrid(group, glowMeshes, 2, 3, width * 0.22 - 0.2, 1.2, 0.4, 0.55, depth * 0.35 + 0.02);
      break;
    }

    case 'wind': {
      // Tapered tower pole
      const poleGeo = new THREE.CylinderGeometry(0.06, 0.16, 2.8, 12);
      const pole = new THREE.Mesh(poleGeo, materials.whiteWall);
      pole.position.y = 1.46;
      pole.castShadow = true;
      group.add(pole);

      // Nacelle generator box
      const nacelleGeo = new THREE.BoxGeometry(0.24, 0.2, 0.45);
      const nacelle = new THREE.Mesh(nacelleGeo, materials.metalGrey);
      nacelle.position.set(0, 2.86, 0);
      nacelle.castShadow = true;
      group.add(nacelle);

      // Red navigation light
      const navLightGeo = new THREE.SphereGeometry(0.04, 6, 6);
      const navLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const navLight = new THREE.Mesh(navLightGeo, navLightMat);
      navLight.position.set(0, 2.98, -0.15);
      group.add(navLight);
      glowMeshes.push(navLight);

      // 3 Blades attached to rotor hub
      const bladesGroup = new THREE.Group();
      bladesGroup.position.set(0, 2.86, 0.24);

      const hubGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const hub = new THREE.Mesh(hubGeo, materials.whiteWall);
      bladesGroup.add(hub);

      const bladeGeo = new THREE.BoxGeometry(0.08, 1.2, 0.02);
      bladeGeo.translate(0, 0.6, 0);

      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(bladeGeo, materials.whiteWall);
        blade.rotation.z = (b * Math.PI * 2) / 3;
        blade.castShadow = true;
        bladesGroup.add(blade);
      }
      group.add(bladesGroup);
      group.rotatingBlades = bladesGroup;

      // Small transformer box
      const boxGeo = new THREE.BoxGeometry(0.4, 0.3, 0.3);
      const box = new THREE.Mesh(boxGeo, materials.metalGrey);
      box.position.set(0.4, 0.25, 0.3);
      group.add(box);
      break;
    }

    case 'solar': {
      // 4 tilted solar panels on steel framework
      const rowX = [-0.45, 0.45];
      const rowZ = [-0.35, 0.35];

      for (const rx of rowX) {
        for (const rz of rowZ) {
          const mountGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6);
          const mount = new THREE.Mesh(mountGeo, materials.metalGrey);
          mount.position.set(rx, 0.2, rz);
          group.add(mount);

          const panelGeo = new THREE.BoxGeometry(0.7, 0.04, 0.5);
          panelGeo.rotateX(0.4); // 23 degree solar tilt
          const panel = new THREE.Mesh(panelGeo, materials.solarPanel);
          panel.position.set(rx, 0.38, rz);
          panel.castShadow = true;
          group.add(panel);
        }
      }

      // Inverter control cabinet
      const cabinetGeo = new THREE.BoxGeometry(0.3, 0.45, 0.25);
      const cabinet = new THREE.Mesh(cabinetGeo, materials.whiteWall);
      cabinet.position.set(0.75, 0.32, 0);
      group.add(cabinet);
      break;
    }

    case 'factory': {
      // Industrial plant with sawtooth roof and smoke chimneys
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
      const mainGeo = new THREE.BoxGeometry(width * 0.8, 1.4, depth * 0.78);
      const main = new THREE.Mesh(mainGeo, wallMat);
      main.position.y = 0.82;
      main.castShadow = true;
      group.add(main);

      // 2 Chimneys with safety rings
      const chim1Geo = new THREE.CylinderGeometry(0.12, 0.16, 1.6, 8);
      const chim1 = new THREE.Mesh(chim1Geo, materials.brickWall);
      chim1.position.set(-width * 0.25, 1.8, -depth * 0.2);
      chim1.castShadow = true;
      group.add(chim1);

      const chim2Geo = new THREE.CylinderGeometry(0.1, 0.14, 1.3, 8);
      const chim2 = new THREE.Mesh(chim2Geo, materials.brickWall);
      chim2.position.set(-width * 0.1, 1.65, -depth * 0.2);
      chim2.castShadow = true;
      group.add(chim2);

      // Loading bay door
      const bayGeo = new THREE.BoxGeometry(0.65, 0.7, 0.04);
      const bay = new THREE.Mesh(bayGeo, materials.metalGrey);
      bay.position.set(0.2, 0.45, depth * 0.39 + 0.02);
      group.add(bay);

      addWindowGrid(group, glowMeshes, 3, 1, -0.6, 1.0, 0.4, 0, depth * 0.39 + 0.02);
      break;
    }

    case 'school': {
      // Classic red brick schoolhouse with central clock/bell tower
      const schoolMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.8 });
      const mainGeo = new THREE.BoxGeometry(width * 0.85, 1.4, depth * 0.75);
      const main = new THREE.Mesh(mainGeo, schoolMat);
      main.position.y = 0.82;
      main.castShadow = true;
      group.add(main);

      // Bell tower
      const towerGeo = new THREE.BoxGeometry(0.5, 1.8, 0.5);
      const tower = new THREE.Mesh(towerGeo, materials.whiteWall);
      tower.position.set(0, 1.7, 0);
      tower.castShadow = true;
      group.add(tower);

      const bRoofGeo = new THREE.ConeGeometry(0.42, 0.6, 4);
      bRoofGeo.rotateY(Math.PI / 4);
      const bRoof = new THREE.Mesh(bRoofGeo, materials.blueRoof);
      bRoof.position.set(0, 2.8, 0);
      group.add(bRoof);

      // Clock face
      const clockGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 12);
      clockGeo.rotateX(Math.PI / 2);
      const clock = new THREE.Mesh(clockGeo, materials.windowNightGlow);
      clock.position.set(0, 2.2, 0.26);
      group.add(clock);
      glowMeshes.push(clock);

      addWindowGrid(group, glowMeshes, 4, 2, -0.65, 0.5, 0.45, 0.55, depth * 0.38 + 0.02);
      break;
    }

    case 'hospital': {
      // Modern medical clinic with emergency bay and rooftop red cross
      const clinicMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
      const mainGeo = new THREE.BoxGeometry(width * 0.85, 1.8, depth * 0.8);
      const main = new THREE.Mesh(mainGeo, clinicMat);
      main.position.y = 1.02;
      main.castShadow = true;
      group.add(main);

      // Red cross on rooftop
      const bar1Geo = new THREE.BoxGeometry(0.6, 0.04, 0.18);
      const bar2Geo = new THREE.BoxGeometry(0.18, 0.04, 0.6);
      const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const bar1 = new THREE.Mesh(bar1Geo, redMat);
      const bar2 = new THREE.Mesh(bar2Geo, redMat);
      bar1.position.set(0, 1.95, 0);
      bar2.position.set(0, 1.95, 0);
      group.add(bar1, bar2);
      glowMeshes.push(bar1, bar2);

      // Emergency ambulance bay canopy
      const emCanopyGeo = new THREE.BoxGeometry(0.7, 0.05, 0.4);
      const emCanopy = new THREE.Mesh(emCanopyGeo, materials.redRoof);
      emCanopy.position.set(width * 0.25, 0.75, depth * 0.4 + 0.2);
      group.add(emCanopy);

      addWindowGrid(group, glowMeshes, 4, 2, -0.65, 0.65, 0.45, 0.55, depth * 0.4 + 0.02);
      break;
    }

    case 'fire':
    case 'police': {
      const isFire = def.styleVariant === 'fire';
      const wallMat = new THREE.MeshStandardMaterial({
        color: isFire ? 0xef4444 : 0x1d4ed8,
        roughness: 0.7,
      });
      const bodyGeo = new THREE.BoxGeometry(width * 0.8, 1.5, depth * 0.8);
      const body = new THREE.Mesh(bodyGeo, wallMat);
      body.position.y = 0.87;
      body.castShadow = true;
      group.add(body);

      // Garage shutter doors
      const shutterGeo = new THREE.BoxGeometry(0.5, 0.7, 0.04);
      const shutter = new THREE.Mesh(shutterGeo, materials.metalGrey);
      shutter.position.set(0, 0.45, depth * 0.4 + 0.02);
      group.add(shutter);

      // Emergency siren light bar
      const sirenGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8);
      sirenGeo.rotateZ(Math.PI / 2);
      const sirenMat = new THREE.MeshBasicMaterial({ color: isFire ? 0xff0000 : 0x0088ff });
      const siren = new THREE.Mesh(sirenGeo, sirenMat);
      siren.position.set(0, 1.66, depth * 0.3);
      group.add(siren);
      glowMeshes.push(siren);

      addWindowGrid(group, glowMeshes, 2, 1, -0.25, 1.15, 0.5, 0, depth * 0.4 + 0.02);
      break;
    }

    case 'fountain': {
      // Ornate stone basin with animated water jets
      const basinGeo = new THREE.CylinderGeometry(0.75, 0.85, 0.35, 16);
      const basin = new THREE.Mesh(basinGeo, materials.concrete);
      basin.position.y = 0.28;
      basin.castShadow = true;
      group.add(basin);

      const poolGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.08, 16);
      const pool = new THREE.Mesh(poolGeo, materials.waterFountain);
      pool.position.y = 0.38;
      group.add(pool);

      // Central pedestal
      const pedGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.6, 8);
      const ped = new THREE.Mesh(pedGeo, materials.concrete);
      ped.position.y = 0.58;
      group.add(ped);

      // Animated water spout jets
      const jetGeo = new THREE.ConeGeometry(0.18, 0.5, 8);
      const jet = new THREE.Mesh(jetGeo, materials.waterFountain);
      jet.position.y = 0.95;
      group.add(jet);
      group.fountainJets = [jet];

      // Surrounding park benches
      const b1 = createBench();
      b1.position.set(width * 0.38, 0.12, 0);
      b1.rotation.y = -Math.PI / 2;

      const b2 = createBench();
      b2.position.set(-width * 0.38, 0.12, 0);
      b2.rotation.y = Math.PI / 2;
      group.add(b1, b2);

      // Corner flowers
      const flowerTree = createTree(0.65);
      flowerTree.position.set(-width * 0.35, 0.12, -depth * 0.35);
      group.add(flowerTree);
      break;
    }

    case 'park': {
      // Lush green grove with variety of trees and flower beds
      const grassPatch = new THREE.Mesh(
        new THREE.CylinderGeometry(width * 0.42, width * 0.45, 0.08, 16),
        materials.foliageBright
      );
      grassPatch.position.y = 0.14;
      group.add(grassPatch);

      // 3 trees of different sizes
      const t1 = createTree(0.9);
      t1.position.set(-0.35, 0.12, -0.2);
      const t2 = createTree(0.75, true);
      t2.position.set(0.3, 0.12, 0.25);
      const t3 = createTree(0.6);
      t3.position.set(-0.15, 0.12, 0.35);
      group.add(t1, t2, t3);

      const bench = createBench();
      bench.position.set(0.25, 0.12, -0.2);
      bench.rotation.y = -0.5;
      group.add(bench);
      break;
    }

    case 'monument': {
      // Marble pedestal with bronze heroic statue
      const ped1Geo = new THREE.BoxGeometry(0.8, 0.3, 0.8);
      const ped1 = new THREE.Mesh(ped1Geo, materials.concrete);
      ped1.position.y = 0.25;
      ped1.castShadow = true;
      group.add(ped1);

      const ped2Geo = new THREE.BoxGeometry(0.5, 0.6, 0.5);
      const ped2 = new THREE.Mesh(ped2Geo, materials.concrete);
      ped2.position.y = 0.65;
      ped2.castShadow = true;
      group.add(ped2);

      // Bronze sculpture (abstract heroic figure)
      const statueTorsoGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.55, 8);
      const statueTorso = new THREE.Mesh(statueTorsoGeo, materials.goldBronze);
      statueTorso.position.y = 1.15;
      statueTorso.castShadow = true;
      group.add(statueTorso);

      const statueHeadGeo = new THREE.SphereGeometry(0.11, 8, 8);
      const statueHead = new THREE.Mesh(statueHeadGeo, materials.goldBronze);
      statueHead.position.y = 1.5;
      statueHead.castShadow = true;
      group.add(statueHead);

      const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6);
      armGeo.rotateZ(0.8);
      const arm = new THREE.Mesh(armGeo, materials.goldBronze);
      arm.position.set(0.22, 1.35, 0);
      group.add(arm);
      break;
    }

    default: {
      // Fallback clean building
      const boxGeo = new THREE.BoxGeometry(width * 0.8, 1.2, depth * 0.8);
      const boxMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.7 });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.y = 0.72;
      box.castShadow = true;
      group.add(box);
      break;
    }
  }

  group.nightGlowMeshes = glowMeshes;
  return group;
}

/**
 * Procedural road piece generator that smoothly adapts based on neighbor connections:
 * - straight (N-S or E-W)
 * - corner (90-degree turn)
 * - T-junction (3-way)
 * - crossroad (4-way intersection)
 * - dead-end (1 connection)
 * - bridge (over water)
 */
export function buildRoadMesh(
  neighbors: { north: boolean; south: boolean; east: boolean; west: boolean },
  isBridge: boolean = false
): THREE.Group {
  const group = new THREE.Group();
  const roadSize = 2.0;

  if (isBridge) {
    // Water bridge with wooden/stone piers and safety railings
    const deckGeo = new THREE.BoxGeometry(roadSize, 0.16, roadSize * 0.85);
    const deck = new THREE.Mesh(deckGeo, materials.bridgeStone);
    deck.position.y = 0.22;
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    // Piers into water
    const pierGeo = new THREE.BoxGeometry(0.2, 0.6, roadSize * 0.85);
    const pier1 = new THREE.Mesh(pierGeo, materials.bridgeStone);
    pier1.position.set(-0.7, -0.05, 0);
    const pier2 = pier1.clone();
    pier2.position.set(0.7, -0.05, 0);
    group.add(pier1, pier2);

    // Red railings
    const railGeo = new THREE.BoxGeometry(roadSize, 0.14, 0.05);
    const rail1 = new THREE.Mesh(railGeo, materials.bridgeRail);
    rail1.position.set(0, 0.36, 0.75);
    const rail2 = rail1.clone();
    rail2.position.set(0, 0.36, -0.75);
    group.add(rail1, rail2);
    return group;
  }

  // Asphalt base
  const asphaltGeo = new THREE.BoxGeometry(roadSize, 0.04, roadSize);
  const asphalt = new THREE.Mesh(asphaltGeo, materials.roadAsphalt);
  asphalt.position.y = 0.02;
  asphalt.receiveShadow = true;
  group.add(asphalt);

  const n = neighbors.north;
  const s = neighbors.south;
  const e = neighbors.east;
  const w = neighbors.west;
  const count = (n ? 1 : 0) + (s ? 1 : 0) + (e ? 1 : 0) + (w ? 1 : 0);

  // Sidewalks on edges that have NO connection
  const sidewalkThick = 0.28;
  const sidewalkHeight = 0.06;

  if (!n) {
    const swGeo = new THREE.BoxGeometry(roadSize, sidewalkHeight, sidewalkThick);
    const sw = new THREE.Mesh(swGeo, materials.sidewalk);
    sw.position.set(0, 0.05, -roadSize / 2 + sidewalkThick / 2);
    sw.receiveShadow = true;
    group.add(sw);
  }
  if (!s) {
    const swGeo = new THREE.BoxGeometry(roadSize, sidewalkHeight, sidewalkThick);
    const sw = new THREE.Mesh(swGeo, materials.sidewalk);
    sw.position.set(0, 0.05, roadSize / 2 - sidewalkThick / 2);
    sw.receiveShadow = true;
    group.add(sw);
  }
  if (!w) {
    const swGeo = new THREE.BoxGeometry(sidewalkThick, sidewalkHeight, roadSize);
    const sw = new THREE.Mesh(swGeo, materials.sidewalk);
    sw.position.set(-roadSize / 2 + sidewalkThick / 2, 0.05, 0);
    sw.receiveShadow = true;
    group.add(sw);
  }
  if (!e) {
    const swGeo = new THREE.BoxGeometry(sidewalkThick, sidewalkHeight, roadSize);
    const sw = new THREE.Mesh(swGeo, materials.sidewalk);
    sw.position.set(roadSize / 2 - sidewalkThick / 2, 0.05, 0);
    sw.receiveShadow = true;
    group.add(sw);
  }

  // Lane Markings
  if (count === 4) {
    // 4-way zebra crosswalks
    const zebraGeo = new THREE.BoxGeometry(0.35, 0.005, 0.08);
    for (let i = -0.5; i <= 0.5; i += 0.25) {
      const zN = new THREE.Mesh(zebraGeo, materials.roadMarking);
      zN.position.set(i, 0.045, -0.65);
      const zS = zN.clone();
      zS.position.set(i, 0.045, 0.65);
      group.add(zN, zS);
    }
  } else if ((n || s) && !e && !w) {
    // N-S dashed center lines
    for (const z of [-0.6, -0.2, 0.2, 0.6]) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.005, 0.25), materials.roadMarking);
      dash.position.set(0, 0.045, z);
      group.add(dash);
    }
  } else if ((e || w) && !n && !s) {
    // E-W dashed center lines
    for (const x of [-0.6, -0.2, 0.2, 0.6]) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.005, 0.08), materials.roadMarking);
      dash.position.set(x, 0.045, 0);
      group.add(dash);
    }
  } else {
    // Junction dot/marking
    const dot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.005, 0.12), materials.roadMarking);
    dot.position.set(0, 0.045, 0);
    group.add(dot);
  }

  // Street lamp on sidewalk corner if appropriate
  if (!n && !w) {
    const lamp = createStreetLamp();
    lamp.group.position.set(-0.7, 0.06, -0.7);
    lamp.group.rotation.y = Math.PI / 4;
    group.add(lamp.group);
  }

  return group;
}

/**
 * Creates animated procedural cars
 */
export function createCar(colorHex: number = 0xef4444): THREE.Group {
  const car = new THREE.Group();

  // Car chassis
  const chassisGeo = new THREE.BoxGeometry(0.42, 0.15, 0.85);
  const chassisMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35, metalness: 0.7 });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.y = 0.14;
  chassis.castShadow = true;
  car.add(chassis);

  // Cabin
  const cabinGeo = new THREE.BoxGeometry(0.36, 0.16, 0.44);
  const cabin = new THREE.Mesh(cabinGeo, materials.glassWindow);
  cabin.position.set(0, 0.28, -0.05);
  car.add(cabin);

  // 4 Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

  const wx = 0.22;
  const wz = 0.26;
  const wy = 0.08;

  const w1 = new THREE.Mesh(wheelGeo, wheelMat);
  w1.position.set(wx, wy, wz);
  const w2 = new THREE.Mesh(wheelGeo, wheelMat);
  w2.position.set(-wx, wy, wz);
  const w3 = new THREE.Mesh(wheelGeo, wheelMat);
  w3.position.set(wx, wy, -wz);
  const w4 = new THREE.Mesh(wheelGeo, wheelMat);
  w4.position.set(-wx, wy, -wz);
  car.add(w1, w2, w3, w4);

  // Headlights & Taillights
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const tlMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), hlMat);
  hl1.position.set(0.12, 0.15, 0.43);
  const hl2 = hl1.clone();
  hl2.position.set(-0.12, 0.15, 0.43);
  car.add(hl1, hl2);

  const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), tlMat);
  tl1.position.set(0.12, 0.15, -0.43);
  const tl2 = tl1.clone();
  tl2.position.set(-0.12, 0.15, -0.43);
  car.add(tl1, tl2);

  return car;
}

/**
 * Creates animated procedural pedestrians
 */
export function createPedestrian(shirtColor: number = 0x3b82f6): THREE.Group {
  const ped = new THREE.Group();

  // Body
  const bodyGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.28, 6);
  const bodyMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.8 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.24;
  ped.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.6 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 0.45;
  ped.add(head);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.16, 6);
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.9 });
  const leg1 = new THREE.Mesh(legGeo, pantsMat);
  leg1.position.set(0.04, 0.08, 0);
  const leg2 = new THREE.Mesh(legGeo, pantsMat);
  leg2.position.set(-0.04, 0.08, 0);
  ped.add(leg1, leg2);

  return ped;
}
