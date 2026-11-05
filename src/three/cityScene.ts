/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ActiveTool, BuildingDefinition, PlacedBuilding, WeatherType } from '../types/game';
import { getBuildingById } from '../data/buildings';
import {
  buildProceduralBuilding,
  buildRoadMesh,
  BuildingObjectWithGlow,
  createCar,
  createPedestrian,
  createTree,
} from './proceduralModels';

export interface SceneCallbacks {
  onTileClick: (x: number, z: number) => void;
  onBuildingSelect: (instanceId: string | null) => void;
  onTileHover?: (x: number, z: number, valid: boolean) => void;
}

interface TrafficCar {
  mesh: THREE.Group;
  currentTile: [number, number];
  targetTile: [number, number];
  progress: number;
  speed: number;
  direction: 'N' | 'S' | 'E' | 'W';
}

interface WalkingPedestrian {
  mesh: THREE.Group;
  tile: [number, number];
  angle: number;
  speed: number;
}

export class CitySceneController {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private pmrem!: THREE.PMREMGenerator;

  // Camera controls
  private cameraTarget = new THREE.Vector3(0, 0, 0);
  private cameraDistance = 24;
  private cameraPitch = Math.PI / 4.2; // ~43 degrees isometric tilt
  private cameraYaw = Math.PI / 4; // 45 degree angle
  private targetYaw = Math.PI / 4;
  private targetDistance = 24;
  private targetTarget = new THREE.Vector3(0, 0, 0);

  // Interaction
  private isPointerDown = false;
  private pointerButton = 0; // 0: left, 2: right
  private lastPointerX = 0;
  private lastPointerY = 0;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private hoveredCell: [number, number] | null = null;
  private ghostMesh: THREE.Group | null = null;

  // Grid and objects
  private gridSize: number = 24;
  private cellWorldSize: number = 2.0;
  private gridGroup = new THREE.Group();
  private buildingsGroup = new THREE.Group();
  private roadsGroup = new THREE.Group();
  private foliageGroup = new THREE.Group();
  private trafficGroup = new THREE.Group();
  private waterMesh!: THREE.Mesh;
  private groundMesh!: THREE.Mesh;
  private rainParticles: THREE.Points | null = null;
  private cloudsGroup = new THREE.Group();

  // Active state
  private activeTool: ActiveTool = { type: 'select' };
  private activeBuildingDef: BuildingDefinition | null = null;
  private activeRotation: number = 0;
  private buildingMeshMap = new Map<string, BuildingObjectWithGlow>();
  private placedBuildings: PlacedBuilding[] = [];
  private unlockedTilesSet = new Set<string>();
  private waterTilesSet = new Set<string>();
  private roadTilesSet = new Set<string>();

  // Lighting & Day/Night
  private dirSunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private ambientLight!: THREE.AmbientLight;
  private currentHour: number = 12; // 0-24
  private currentWeather: WeatherType = 'sunny';

  // Traffic
  private trafficCars: TrafficCar[] = [];
  private pedestrians: WalkingPedestrian[] = [];

  // Lifecycle
  private animFrameId: number = 0;
  private isDestroyed = false;
  private callbacks: SceneCallbacks;
  private isSoftwareGl: boolean = false;

  constructor(container: HTMLDivElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.checkSoftwareGl();
    this.initScene();
    this.initTerrain();
    this.initClouds();
    this.initRain();
    this.initEvents();
    this.startLoop();
  }

  private checkSoftwareGl() {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        this.isSoftwareGl = true;
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      this.isSoftwareGl = false;
    }
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 300);
    this.updateCameraTransform();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Procedural RoomEnvironment reflections
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // Lighting rig (Key sun, Hemi, Soft rim)
    this.dirSunLight = new THREE.DirectionalLight(0xfffaed, 1.8);
    this.dirSunLight.position.set(25, 45, 20);
    this.dirSunLight.castShadow = !this.isSoftwareGl;
    this.dirSunLight.shadow.mapSize.width = 2048;
    this.dirSunLight.shadow.mapSize.height = 2048;
    this.dirSunLight.shadow.camera.near = 1;
    this.dirSunLight.shadow.camera.far = 120;
    const d = 32;
    this.dirSunLight.shadow.camera.left = -d;
    this.dirSunLight.shadow.camera.right = d;
    this.dirSunLight.shadow.camera.top = d;
    this.dirSunLight.shadow.camera.bottom = -d;
    this.dirSunLight.shadow.bias = -0.0003;
    this.dirSunLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirSunLight);

    this.hemiLight = new THREE.HemisphereLight(0xdff0ff, 0x4a6040, 0.7);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(this.ambientLight);

    // Add groups
    this.scene.add(this.gridGroup);
    this.scene.add(this.roadsGroup);
    this.scene.add(this.buildingsGroup);
    this.scene.add(this.foliageGroup);
    this.scene.add(this.trafficGroup);
    this.scene.add(this.cloudsGroup);
  }

  private initTerrain() {
    const totalSize = this.gridSize * this.cellWorldSize + 20;

    // Base ground plane
    const groundGeo = new THREE.PlaneGeometry(totalSize, totalSize, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x559e3e,
      roughness: 0.9,
      metalness: 0.05,
    });
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.position.y = -0.02;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // Curving scenic river through the map
    // River runs through approximately column index 7 to 9
    const waterGeo = new THREE.PlaneGeometry(totalSize * 1.2, 5.5, 32, 8);
    waterGeo.rotateX(-Math.PI / 2);
    waterGeo.rotateY(0.2); // diagonal gentle curve
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.15,
      transmission: 0.65,
      transparent: true,
      opacity: 0.88,
      ior: 1.333,
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.set(-6, -0.06, 0);
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    // Populate default water cells along the river
    for (let z = 0; z < this.gridSize; z++) {
      const riverCenter = Math.round(5 + Math.sin(z * 0.3) * 1.5);
      this.waterTilesSet.add(`${riverCenter},${z}`);
      this.waterTilesSet.add(`${riverCenter + 1},${z}`);
    }

    // Border scenery trees around the outer perimeter to frame the city
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const radius = totalSize * 0.44 + (Math.sin(i * 3) * 3);
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;
      const tree = createTree(1.0 + Math.random() * 0.4, Math.random() > 0.8);
      tree.position.set(tx, 0, tz);
      this.foliageGroup.add(tree);
    }
  }

  private initClouds() {
    for (let c = 0; c < 12; c++) {
      const cloud = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 3);
      const puffMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.95,
        transparent: true,
        opacity: 0.85,
      });

      for (let p = 0; p < numPuffs; p++) {
        const puffGeo = new THREE.DodecahedronGeometry(1.4 + Math.random() * 0.8, 1);
        const puff = new THREE.Mesh(puffGeo, puffMat);
        puff.position.set((p - numPuffs / 2) * 1.2, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.8);
        cloud.add(puff);
      }
      cloud.position.set((Math.random() - 0.5) * 80, 22 + Math.random() * 6, (Math.random() - 0.5) * 80);
      this.cloudsGroup.add(cloud);
    }
  }

  private initRain() {
    const particleCount = 1200;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 70;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.15,
      transparent: true,
      opacity: 0.65,
    });
    this.rainParticles = new THREE.Points(geom, mat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  public updateTimeAndWeather(hour: number, weather: WeatherType) {
    this.currentHour = hour;
    this.currentWeather = weather;

    // Day/Night sky & light cycle
    // Hour 6: Dawn, 12: Noon, 18: Sunset, 0: Midnight
    const isDay = hour >= 6 && hour <= 19;
    const isSunset = (hour >= 5 && hour < 7) || (hour >= 18 && hour <= 20);

    let skyColor: THREE.Color;
    let sunColor: THREE.Color;
    let sunIntensity: number;
    let hemiSky: THREE.Color;
    let hemiGround: THREE.Color;

    if (weather === 'rainy') {
      skyColor = new THREE.Color(0x52606d);
      sunColor = new THREE.Color(0xcfd8dc);
      sunIntensity = 0.7;
      hemiSky = new THREE.Color(0x64748b);
      hemiGround = new THREE.Color(0x334155);
      if (this.rainParticles) this.rainParticles.visible = true;
    } else if (isSunset) {
      skyColor = new THREE.Color(0xf97316);
      sunColor = new THREE.Color(0xfeb272);
      sunIntensity = 1.3;
      hemiSky = new THREE.Color(0xfb923c);
      hemiGround = new THREE.Color(0x431407);
      if (this.rainParticles) this.rainParticles.visible = false;
    } else if (isDay) {
      skyColor = new THREE.Color(0x7dd3fc);
      sunColor = new THREE.Color(0xfffaed);
      sunIntensity = 1.8;
      hemiSky = new THREE.Color(0xdff0ff);
      hemiGround = new THREE.Color(0x4a6040);
      if (this.rainParticles) this.rainParticles.visible = false;
    } else {
      // Night
      skyColor = new THREE.Color(0x0a0e1a);
      sunColor = new THREE.Color(0x94a3b8);
      sunIntensity = 0.35;
      hemiSky = new THREE.Color(0x1e293b);
      hemiGround = new THREE.Color(0x0f172a);
      if (this.rainParticles) this.rainParticles.visible = false;
    }

    this.scene.background = skyColor;
    if (this.scene.fog) {
      (this.scene.fog as THREE.FogExp2).color.copy(skyColor);
    }
    this.dirSunLight.color.copy(sunColor);
    this.dirSunLight.intensity = sunIntensity;
    this.hemiLight.color.copy(hemiSky);
    this.hemiLight.groundColor.copy(hemiGround);

    // Orbit sun direction smoothly
    const sunAngle = ((hour - 6) / 24) * Math.PI * 2;
    this.dirSunLight.position.set(Math.cos(sunAngle) * 35, Math.max(10, Math.sin(sunAngle) * 45), 20);

    // Toggle building window & street night glow
    const nightMode = !isDay || weather === 'rainy';
    this.buildingMeshMap.forEach((buildingGroup) => {
      if (buildingGroup.nightGlowMeshes) {
        buildingGroup.nightGlowMeshes.forEach((mesh) => {
          mesh.visible = nightMode || Math.random() > 0.4;
        });
      }
    });
  }

  public setGridData(
    gridSize: number,
    unlockedTiles: [number, number][],
    buildings: PlacedBuilding[]
  ) {
    this.gridSize = gridSize;
    this.unlockedTilesSet.clear();
    unlockedTiles.forEach(([x, z]) => this.unlockedTilesSet.add(`${x},${z}`));

    this.placedBuildings = buildings;
    this.roadTilesSet.clear();

    buildings.forEach((b) => {
      if (b.defId === 'road' || b.defId === 'bridge') {
        this.roadTilesSet.add(`${b.x},${b.z}`);
      }
    });

    this.rebuildGridVisualization();
    this.rebuildRoadNetwork();
    this.rebuildBuildings();
    this.updateTrafficAgents();
  }

  private rebuildGridVisualization() {
    while (this.gridGroup.children.length > 0) {
      const child = this.gridGroup.children[0];
      this.gridGroup.remove(child);
    }

    const half = (this.gridSize * this.cellWorldSize) / 2;
    const tileGeo = new THREE.PlaneGeometry(this.cellWorldSize * 0.94, this.cellWorldSize * 0.94);
    tileGeo.rotateX(-Math.PI / 2);

    const borderMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });

    // Grid lines for unlocked cells
    for (let x = 0; x < this.gridSize; x++) {
      for (let z = 0; z < this.gridSize; z++) {
        const isUnlocked = this.unlockedTilesSet.has(`${x},${z}`);
        const isWater = this.waterTilesSet.has(`${x},${z}`);
        const wx = x * this.cellWorldSize - half + this.cellWorldSize / 2;
        const wz = z * this.cellWorldSize - half + this.cellWorldSize / 2;

        if (isUnlocked && !isWater) {
          // Subtle tile border
          const edges = new THREE.EdgesGeometry(tileGeo);
          const line = new THREE.LineSegments(edges, borderMat);
          line.position.set(wx, 0.005, wz);
          this.gridGroup.add(line);
        } else if (!isUnlocked) {
          // Locked territory marker: subtle darker plot with small lock pin
          const lockedMat = new THREE.MeshBasicMaterial({
            color: 0x1e293b,
            transparent: true,
            opacity: 0.25,
          });
          const lockedMesh = new THREE.Mesh(tileGeo, lockedMat);
          lockedMesh.position.set(wx, 0.01, wz);
          this.gridGroup.add(lockedMesh);
        }
      }
    }
  }

  private rebuildRoadNetwork() {
    while (this.roadsGroup.children.length > 0) {
      const child = this.roadsGroup.children[0];
      this.roadsGroup.remove(child);
    }

    const half = (this.gridSize * this.cellWorldSize) / 2;

    this.placedBuildings.forEach((b) => {
      if (b.defId !== 'road' && b.defId !== 'bridge') return;

      const isBridge = b.defId === 'bridge' || this.waterTilesSet.has(`${b.x},${b.z}`);

      const north = this.roadTilesSet.has(`${b.x},${b.z - 1}`);
      const south = this.roadTilesSet.has(`${b.x},${b.z + 1}`);
      const east = this.roadTilesSet.has(`${b.x + 1},${b.z}`);
      const west = this.roadTilesSet.has(`${b.x - 1},${b.z}`);

      const roadMesh = buildRoadMesh({ north, south, east, west }, isBridge);
      const wx = b.x * this.cellWorldSize - half + this.cellWorldSize / 2;
      const wz = b.z * this.cellWorldSize - half + this.cellWorldSize / 2;
      roadMesh.position.set(wx, 0, wz);
      this.roadsGroup.add(roadMesh);
    });
  }

  private rebuildBuildings() {
    while (this.buildingsGroup.children.length > 0) {
      const child = this.buildingsGroup.children[0];
      this.buildingsGroup.remove(child);
    }
    this.buildingMeshMap.clear();

    const half = (this.gridSize * this.cellWorldSize) / 2;

    this.placedBuildings.forEach((b) => {
      if (b.defId === 'road' || b.defId === 'bridge') return;

      const def = getBuildingById(b.defId);
      if (!def) return;

      const buildingMesh = buildProceduralBuilding(def);
      const [wCells, dCells] = def.size;

      const wx = b.x * this.cellWorldSize - half + (wCells * this.cellWorldSize) / 2;
      const wz = b.z * this.cellWorldSize - half + (dCells * this.cellWorldSize) / 2;

      buildingMesh.position.set(wx, 0, wz);
      buildingMesh.rotation.y = (b.rotation * Math.PI) / 180;
      buildingMesh.userData = { instanceId: b.instanceId, defId: b.defId };

      this.buildingsGroup.add(buildingMesh);
      this.buildingMeshMap.set(b.instanceId, buildingMesh);
    });
  }

  private updateTrafficAgents() {
    // If roads exist, spawn cute little cars and pedestrians
    const roadCoords: [number, number][] = [];
    this.roadTilesSet.forEach((key) => {
      const [x, z] = key.split(',').map(Number);
      roadCoords.push([x, z]);
    });

    // Clean up old cars if count exceeds
    const targetCars = Math.min(8, Math.max(2, Math.floor(roadCoords.length / 3)));
    while (this.trafficCars.length < targetCars && roadCoords.length > 1) {
      const startIdx = Math.floor(Math.random() * roadCoords.length);
      const startTile = roadCoords[startIdx];
      const colors = [0xef4444, 0x3b82f6, 0xf59e0b, 0x10b981, 0x8b5cf6, 0xffffff];
      const carMesh = createCar(colors[Math.floor(Math.random() * colors.length)]);
      this.trafficGroup.add(carMesh);

      this.trafficCars.push({
        mesh: carMesh,
        currentTile: startTile,
        targetTile: startTile,
        progress: 1,
        speed: 0.02 + Math.random() * 0.015,
        direction: 'N',
      });
    }

    // Spawn pedestrians around residential & parks
    const targetPeds = Math.min(12, Math.max(2, Math.floor(roadCoords.length / 2)));
    while (this.pedestrians.length < targetPeds && roadCoords.length > 0) {
      const t = roadCoords[Math.floor(Math.random() * roadCoords.length)];
      const pedColors = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b];
      const ped = createPedestrian(pedColors[Math.floor(Math.random() * pedColors.length)]);
      this.trafficGroup.add(ped);

      this.pedestrians.push({
        mesh: ped,
        tile: t,
        angle: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.01,
      });
    }
  }

  public setActiveTool(tool: ActiveTool, rotation: number = 0) {
    this.activeTool = tool;
    this.activeRotation = rotation;

    if (tool.type === 'build') {
      this.activeBuildingDef = getBuildingById(tool.buildingId) || null;
      this.updateGhostMesh();
    } else {
      this.activeBuildingDef = null;
      this.removeGhostMesh();
    }
  }

  public setRotation(rotation: number) {
    this.activeRotation = rotation;
    if (this.ghostMesh) {
      this.ghostMesh.rotation.y = (this.activeRotation * Math.PI) / 180;
    }
  }

  private updateGhostMesh() {
    this.removeGhostMesh();
    if (!this.activeBuildingDef) return;

    this.ghostMesh = buildProceduralBuilding(this.activeBuildingDef);
    this.ghostMesh.rotation.y = (this.activeRotation * Math.PI) / 180;

    // Make all materials semi-transparent holographic
    this.ghostMesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshBasicMaterial({
          color: 0x22c55e,
          transparent: true,
          opacity: 0.55,
          wireframe: false,
        });
      }
    });

    this.ghostMesh.visible = false;
    this.scene.add(this.ghostMesh);
  }

  private removeGhostMesh() {
    if (this.ghostMesh) {
      this.scene.remove(this.ghostMesh);
      this.ghostMesh = null;
    }
  }

  private initEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('pointerdown', this.onPointerDown.bind(this));
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));
    el.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private onPointerDown(e: PointerEvent) {
    this.isPointerDown = true;
    this.pointerButton = e.button;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
  }

  private onPointerMove(e: PointerEvent) {
    const deltaX = e.clientX - this.lastPointerX;
    const deltaY = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;

    if (this.isPointerDown) {
      if (this.pointerButton === 2 || e.shiftKey) {
        // Rotate camera with right-click or Shift+drag
        this.targetYaw -= deltaX * 0.008;
      } else if (this.pointerButton === 0) {
        // Drag / Pan across the city
        const moveScale = this.cameraDistance * 0.0016;
        const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
        const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));

        this.targetTarget.addScaledVector(right, -deltaX * moveScale);
        this.targetTarget.addScaledVector(forward, -deltaY * moveScale);

        // Clamp camera target inside playable boundaries
        const maxBound = (this.gridSize * this.cellWorldSize) / 1.5;
        this.targetTarget.x = THREE.MathUtils.clamp(this.targetTarget.x, -maxBound, maxBound);
        this.targetTarget.z = THREE.MathUtils.clamp(this.targetTarget.z, -maxBound, maxBound);
      }
    }

    // Update raycaster pointer position
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycastGridTile();
  }

  private onPointerUp(e: PointerEvent) {
    const wasDragging = Math.abs(e.clientX - this.lastPointerX) > 4 || Math.abs(e.clientY - this.lastPointerY) > 4;
    this.isPointerDown = false;

    if (!wasDragging && e.button === 0 && this.hoveredCell) {
      const [gx, gz] = this.hoveredCell;
      if (this.activeTool.type === 'select') {
        // Check if building was clicked
        this.raycastBuildingClick();
      } else {
        this.callbacks.onTileClick(gx, gz);
      }
    }
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    this.targetDistance += e.deltaY * 0.02;
    this.targetDistance = THREE.MathUtils.clamp(this.targetDistance, 8, 60);
  }

  private onWindowResize() {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private raycastGridTile() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hitPoint = new THREE.Vector3();
    const intersect = this.raycaster.ray.intersectPlane(this.groundPlane, hitPoint);

    if (intersect) {
      const half = (this.gridSize * this.cellWorldSize) / 2;
      const gx = Math.floor((hitPoint.x + half) / this.cellWorldSize);
      const gz = Math.floor((hitPoint.z + half) / this.cellWorldSize);

      if (gx >= 0 && gx < this.gridSize && gz >= 0 && gz < this.gridSize) {
        this.hoveredCell = [gx, gz];

        if (this.ghostMesh && this.activeBuildingDef) {
          const [wCells, dCells] = this.activeBuildingDef.size;
          const wx = gx * this.cellWorldSize - half + (wCells * this.cellWorldSize) / 2;
          const wz = gz * this.cellWorldSize - half + (dCells * this.cellWorldSize) / 2;
          this.ghostMesh.position.set(wx, 0, wz);
          this.ghostMesh.visible = true;

          // Check validity
          const isValid = this.isCellValidToBuild(gx, gz, this.activeBuildingDef);
          this.ghostMesh.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).color.setHex(
                isValid ? 0x22c55e : 0xef4444
              );
            }
          });

          if (this.callbacks.onTileHover) {
            this.callbacks.onTileHover(gx, gz, isValid);
          }
        }
        return;
      }
    }

    this.hoveredCell = null;
    if (this.ghostMesh) {
      this.ghostMesh.visible = false;
    }
  }

  private raycastBuildingClick() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.buildingsGroup.children, true);

    if (intersects.length > 0) {
      let topObj: THREE.Object3D | null = intersects[0].object;
      while (topObj && !topObj.userData?.instanceId && topObj.parent) {
        topObj = topObj.parent;
      }
      if (topObj && topObj.userData?.instanceId) {
        this.callbacks.onBuildingSelect(topObj.userData.instanceId);
        return;
      }
    }
    this.callbacks.onBuildingSelect(null);
  }

  private isCellValidToBuild(x: number, z: number, def: BuildingDefinition): boolean {
    const [wCells, dCells] = def.size;
    for (let dx = 0; dx < wCells; dx++) {
      for (let dz = 0; dz < dCells; dz++) {
        const cx = x + dx;
        const cz = z + dz;
        if (cx >= this.gridSize || cz >= this.gridSize) return false;
        if (!this.unlockedTilesSet.has(`${cx},${cz}`)) return false;

        const isWater = this.waterTilesSet.has(`${cx},${cz}`);
        if (def.id === 'bridge') {
          if (!isWater) return false; // bridge must go on water
        } else {
          if (isWater) return false; // regular buildings cannot go on water
        }

        // Check collision with already placed buildings
        const occupied = this.placedBuildings.some((pb) => {
          const pdef = getBuildingById(pb.defId);
          if (!pdef) return false;
          const [pw, pd] = pdef.size;
          return cx >= pb.x && cx < pb.x + pw && cz >= pb.z && cz < pb.z + pd;
        });

        if (occupied) return false;
      }
    }
    return true;
  }

  private updateCameraTransform() {
    const cx = this.cameraTarget.x + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const cy = this.cameraTarget.y + Math.sin(this.cameraPitch) * this.cameraDistance;
    const cz = this.cameraTarget.z + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.cameraTarget);
  }

  public rotateCameraClockwise() {
    this.targetYaw += Math.PI / 4;
  }

  public rotateCameraCounterClockwise() {
    this.targetYaw -= Math.PI / 4;
  }

  public zoomIn() {
    this.targetDistance = Math.max(8, this.targetDistance - 5);
  }

  public zoomOut() {
    this.targetDistance = Math.min(60, this.targetDistance + 5);
  }

  public resetCamera() {
    this.targetDistance = 24;
    this.targetYaw = Math.PI / 4;
    this.targetTarget.set(0, 0, 0);
  }

  public captureScreenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  private startLoop() {
    const clock = new THREE.Clock();

    const tick = () => {
      if (this.isDestroyed) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera damping
      this.cameraDistance = THREE.MathUtils.damp(this.cameraDistance, this.targetDistance, 8, delta);
      this.cameraYaw = THREE.MathUtils.damp(this.cameraYaw, this.targetYaw, 8, delta);
      this.cameraTarget.lerp(this.targetTarget, 0.12);
      this.updateCameraTransform();

      // Animate wind turbine blades and water fountains
      this.buildingMeshMap.forEach((bg) => {
        if (bg.rotatingBlades) {
          bg.rotatingBlades.rotation.z += delta * 2.5;
        }
        if (bg.fountainJets) {
          bg.fountainJets.forEach((jet) => {
            jet.scale.y = 0.8 + Math.sin(elapsed * 4) * 0.25;
          });
        }
      });

      // Animate drifting clouds
      this.cloudsGroup.children.forEach((cloud, i) => {
        cloud.position.x += delta * (0.8 + (i % 3) * 0.3);
        if (cloud.position.x > 50) cloud.position.x = -50;
      });

      // Animate rain drops falling
      if (this.rainParticles && this.rainParticles.visible) {
        const positions = this.rainParticles.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= delta * 25;
          if (positions[i] < 0) {
            positions[i] = 30;
          }
        }
        this.rainParticles.geometry.attributes.position.needsUpdate = true;
      }

      // Animate traffic cars along road grid
      const half = (this.gridSize * this.cellWorldSize) / 2;
      this.trafficCars.forEach((car) => {
        car.progress += delta * car.speed * 20;
        if (car.progress >= 1) {
          // Arrived at target tile, pick next adjacent road tile
          car.progress = 0;
          car.currentTile = car.targetTile;

          const [cx, cz] = car.currentTile;
          const neighbors: { tile: [number, number]; dir: 'N' | 'S' | 'E' | 'W' }[] = [];

          if (this.roadTilesSet.has(`${cx},${cz - 1}`)) neighbors.push({ tile: [cx, cz - 1], dir: 'N' });
          if (this.roadTilesSet.has(`${cx},${cz + 1}`)) neighbors.push({ tile: [cx, cz + 1], dir: 'S' });
          if (this.roadTilesSet.has(`${cx + 1},${cz}`)) neighbors.push({ tile: [cx + 1, cz], dir: 'E' });
          if (this.roadTilesSet.has(`${cx - 1},${cz}`)) neighbors.push({ tile: [cx - 1, cz], dir: 'W' });

          if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            car.targetTile = next.tile;
            car.direction = next.dir;
          }
        }

        // Interpolate world position
        const [x1, z1] = car.currentTile;
        const [x2, z2] = car.targetTile;
        const curX = THREE.MathUtils.lerp(x1, x2, car.progress) * this.cellWorldSize - half + this.cellWorldSize / 2;
        const curZ = THREE.MathUtils.lerp(z1, z2, car.progress) * this.cellWorldSize - half + this.cellWorldSize / 2;

        car.mesh.position.set(curX, 0.05, curZ);

        // Orient car
        if (car.direction === 'N') car.mesh.rotation.y = Math.PI;
        else if (car.direction === 'S') car.mesh.rotation.y = 0;
        else if (car.direction === 'E') car.mesh.rotation.y = -Math.PI / 2;
        else if (car.direction === 'W') car.mesh.rotation.y = Math.PI / 2;
      });

      // Animate pedestrians
      this.pedestrians.forEach((ped, idx) => {
        ped.angle += delta * 0.8;
        const [px, pz] = ped.tile;
        const wx = px * this.cellWorldSize - half + this.cellWorldSize / 2 + Math.cos(ped.angle + idx) * 0.6;
        const wz = pz * this.cellWorldSize - half + this.cellWorldSize / 2 + Math.sin(ped.angle + idx) * 0.6;
        ped.mesh.position.set(wx, 0.05, wz);
        ped.mesh.rotation.y = ped.angle + Math.PI / 2;
      });

      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('pointermove', this.onPointerMove.bind(this));
    window.removeEventListener('pointerup', this.onPointerUp.bind(this));
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.dispose();
  }
}
