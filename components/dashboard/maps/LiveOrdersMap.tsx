"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { lineRevenue, sarToUsd } from "@/lib/dashboard/kpi";
import { stableOrderFingerprint } from "@/lib/dashboard/orderFingerprint";
import type { OrderRow } from "@/lib/dashboard/types";

// ── Palette ───────────────────────────────────────────────────────────────────

const OCEAN_COLOR   = "#1a6b9e";
const DESERT_COLOR  = "#c8a855";
const GREEN_COLOR   = "#2d5a27";
const GOLD_HEX      = 0xc9a84c;
const GOLD_BRIGHT   = 0xffd97a;
const GEO_URL       = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CANVAS_W = 2048;
const CANVAS_H = 1024;
const AUTO_ROTATE_SPEED = 0.001;
const RESUME_DELAY_MS   = 2000;
const DOT_RADIUS        = 0.014;

// ISO numeric IDs for desert / arid countries
const DESERT_IDS = new Set([
  4,   // Afghanistan
  12,  // Algeria
  48,  // Bahrain
  148, // Chad
  262, // Djibouti
  818, // Egypt
  232, // Eritrea
  364, // Iran
  368, // Iraq
  400, // Jordan
  414, // Kuwait
  434, // Libya
  478, // Mauritania
  496, // Mongolia
  516, // Namibia
  562, // Niger
  512, // Oman
  586, // Pakistan
  634, // Qatar
  682, // Saudi Arabia
  706, // Somalia
  736, // Sudan
  760, // Syria
  788, // Tunisia
  795, // Turkmenistan
  784, // UAE
  732, // Western Sahara
  887, // Yemen
]);

// ── Country data ──────────────────────────────────────────────────────────────

const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  "السعودية":          { lat: 24.0,   lng: 45.0   },
  "الإمارات":          { lat: 24.0,   lng: 54.0   },
  "الكويت":            { lat: 29.3,   lng: 47.7   },
  "قطر":               { lat: 25.3,   lng: 51.2   },
  "البحرين":           { lat: 26.1,   lng: 50.5   },
  "عُمان":             { lat: 22.0,   lng: 57.0   },
  "اليمن":             { lat: 15.5,   lng: 48.5   },
  "الأردن":            { lat: 31.2,   lng: 36.5   },
  "العراق":            { lat: 33.2,   lng: 43.7   },
  "سوريا":             { lat: 34.8,   lng: 38.9   },
  "لبنان":             { lat: 33.9,   lng: 35.9   },
  "مصر":               { lat: 26.8,   lng: 30.8   },
  "ليبيا":             { lat: 26.3,   lng: 17.2   },
  "المغرب":            { lat: 31.8,   lng: -7.1   },
  "تونس":              { lat: 34.0,   lng: 9.0    },
  "الجزائر":           { lat: 28.0,   lng: 2.6    },
  "السودان":           { lat: 12.9,   lng: 30.2   },
  "المملكة المتحدة":   { lat: 55.4,   lng: -3.4   },
  "الولايات المتحدة":  { lat: 37.1,   lng: -95.7  },
  "كندا":              { lat: 56.1,   lng: -106.3 },
  "أستراليا":          { lat: -25.3,  lng: 133.8  },
  "ألمانيا":           { lat: 51.2,   lng: 10.5   },
  "فرنسا":             { lat: 46.2,   lng: 2.2    },
  "تركيا":             { lat: 38.9,   lng: 35.2   },
  "باكستان":           { lat: 30.4,   lng: 69.3   },
};

// Maps English/transliterated names → canonical Arabic key
const COUNTRY_LOOKUP: Record<string, string> = {
  "saudi arabia": "السعودية", "saudi": "السعودية", "sa": "السعودية",
  "المملكة العربية السعودية": "السعودية", "السعوديه": "السعودية",
  "uae": "الإمارات", "united arab emirates": "الإمارات",
  "الامارات": "الإمارات", "الإمارات العربية المتحدة": "الإمارات",
  "ae": "الإمارات",
  "kuwait": "الكويت", "kw": "الكويت",
  "qatar": "قطر", "qa": "قطر",
  "bahrain": "البحرين", "bh": "البحرين",
  "oman": "عُمان", "om": "عُمان", "عمان": "عُمان",
  "yemen": "اليمن", "ye": "اليمن",
  "jordan": "الأردن", "jo": "الأردن",
  "iraq": "العراق", "iq": "العراق",
  "syria": "سوريا", "sy": "سوريا",
  "lebanon": "لبنان", "lb": "لبنان",
  "egypt": "مصر", "eg": "مصر",
  "libya": "ليبيا", "ly": "ليبيا",
  "morocco": "المغرب", "ma": "المغرب",
  "tunisia": "تونس", "tn": "تونس",
  "algeria": "الجزائر", "dz": "الجزائر",
  "sudan": "السودان", "sd": "السودان",
  "uk": "المملكة المتحدة", "united kingdom": "المملكة المتحدة", "britain": "المملكة المتحدة", "gb": "المملكة المتحدة",
  "usa": "الولايات المتحدة", "us": "الولايات المتحدة", "united states": "الولايات المتحدة",
  "canada": "كندا", "ca": "كندا",
  "australia": "أستراليا", "au": "أستراليا",
  "germany": "ألمانيا", "de": "ألمانيا",
  "france": "فرنسا", "fr": "فرنسا",
  "turkey": "تركيا", "turkiye": "تركيا", "tr": "تركيا",
  "pakistan": "باكستان", "pk": "باكستان",
};

function resolveCountry(raw: string | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  if (COUNTRY_COORDS[s]) return s;
  const lower = s.toLowerCase();
  return COUNTRY_LOOKUP[s] ?? COUNTRY_LOOKUP[lower] ?? null;
}

// ── Aggregation ───────────────────────────────────────────────────────────────

type CountryData = { key: string; lat: number; lng: number; count: number; sar: number; isBurst: boolean };

function aggregateCountries(orders: OrderRow[], pulseSet: ReadonlySet<string>): CountryData[] {
  const map = new Map<string, { count: number; sar: number; burst: boolean }>();
  for (const o of orders) {
    // Try country field first, fall back to city field
    const key = resolveCountry(o.country) ?? resolveCountry(o.city);
    if (!key) continue;
    const cur = map.get(key) ?? { count: 0, sar: 0, burst: false };
    cur.count++;
    cur.sar += lineRevenue(o);
    if (!cur.burst && pulseSet.has(stableOrderFingerprint(o))) cur.burst = true;
    map.set(key, cur);
  }
  return [...map.entries()]
    .filter(([, v]) => v.count > 0)
    .map(([key, v]) => ({
      key,
      lat: COUNTRY_COORDS[key].lat,
      lng: COUNTRY_COORDS[key].lng,
      ...v,
      isBurst: v.burst,
    }));
}

function buildRibbonLines(orders: OrderRow[]): string[] {
  const last5 = [...orders].reverse().slice(0, 5);
  const items = last5.map((o) => {
    const name    = (o.name ?? "").trim() || "عميل";
    const country = resolveCountry(o.country) ?? resolveCountry(o.city) ?? ((o.country ?? o.city ?? "").trim() || "—");
    const usd     = Math.round(sarToUsd(lineRevenue(o)));
    return name + " · " + country + " · $" + usd.toLocaleString("en-US");
  });
  if (!items.length) return ["لا يوجد طلبات بعد…", "لا يوجد طلبات بعد…"];
  return [...items, ...items];
}

// ── Three.js helpers ──────────────────────────────────────────────────────────

function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

function makeStarField(count: number, pixelSize: number): THREE.Points {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const phi   = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = 85;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: pixelSize, sizeAttenuation: false });
  return new THREE.Points(geo, mat);
}

// ── TopoJSON decoder ──────────────────────────────────────────────────────────

type TopoPoint = [number, number];
type TopoGeom = { type: string; id?: number; arcs: unknown };
type Topology  = {
  type: "Topology";
  transform?: { scale: [number, number]; translate: [number, number] };
  arcs: TopoPoint[][];
  objects: { countries: { type: string; geometries: TopoGeom[] } };
};

function decodeArcs(topo: Topology): TopoPoint[][] {
  const scale     = topo.transform?.scale     ?? [1, 1];
  const translate = topo.transform?.translate ?? [0, 0];
  return topo.arcs.map((arc) => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => {
      x += dx; y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]] as TopoPoint;
    });
  });
}

function resolveArc(i: number, decoded: TopoPoint[][]): TopoPoint[] {
  const arc = decoded[i < 0 ? ~i : i];
  return i < 0 ? [...arc].reverse() : arc;
}

function drawGeoGeom(
  ctx: CanvasRenderingContext2D,
  geom: TopoGeom,
  decoded: TopoPoint[][],
  w: number,
  h: number,
): void {
  const toX = (lng: number) => ((lng + 180) / 360) * w;
  const toY = (lat: number) => ((90 - lat) / 180) * h;

  function drawRing(ring: number[]): void {
    let first = true;
    for (const i of ring) {
      for (const [lng, lat] of resolveArc(i, decoded)) {
        if (first) { ctx.moveTo(toX(lng), toY(lat)); first = false; }
        else ctx.lineTo(toX(lng), toY(lat));
      }
    }
    ctx.closePath();
  }

  ctx.beginPath();
  if (geom.type === "Polygon") {
    for (const ring of geom.arcs as number[][]) drawRing(ring);
  } else if (geom.type === "MultiPolygon") {
    for (const polygon of geom.arcs as number[][][])
      for (const ring of polygon) drawRing(ring);
  }
}

async function paintTexture(canvas: HTMLCanvasElement): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let topo: Topology;
  try {
    topo = (await fetch(GEO_URL).then((r) => r.json())) as Topology;
  } catch {
    return;
  }
  const decoded = decodeArcs(topo);
  const geoms   = topo.objects.countries.geometries;

  for (const g of geoms) {
    const isDesert = DESERT_IDS.has(g.id ?? -1);
    ctx.fillStyle = isDesert ? DESERT_COLOR : GREEN_COLOR;
    drawGeoGeom(ctx, g, decoded, CANVAS_W, CANVAS_H);
    ctx.fill();
    // No country border lines
  }
}

// ── Dot entry ─────────────────────────────────────────────────────────────────

type DotEntry = {
  key: string; count: number; sar: number; isBurst: boolean;
  group: THREE.Group;
  mainMesh: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  rings: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>[];
  burstT: number;
};

// ── Props ─────────────────────────────────────────────────────────────────────

export type LiveOrdersMapProps = {
  orders: OrderRow[];
  pulseOrderFingerprints: Set<string>;
};

// ── Component ─────────────────────────────────────────────────────────────────

const LiveOrdersMap = memo(function LiveOrdersMap({ orders, pulseOrderFingerprints }: LiveOrdersMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const tooltipRef   = useRef<HTMLDivElement>(null);

  const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef      = useRef<THREE.Scene | null>(null);
  const cameraRef     = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const clockRef      = useRef<THREE.Clock | null>(null);
  const dotEntriesRef = useRef<DotEntry[]>([]);
  const rafRef        = useRef(0);
  const autoRotateRef = useRef(true);
  const draggingRef   = useRef(false);
  const prevMouseRef  = useRef({ x: 0, y: 0 });
  const resumeRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipCityRef = useRef<string | null>(null);

  const [tooltip, setTooltip] = useState<{ city: string; count: number; sar: number } | null>(null);

  const countries   = useMemo(() => aggregateCountries(orders, pulseOrderFingerprints), [orders, pulseOrderFingerprints]);
  const ribbonLines = useMemo(() => buildRibbonLines(orders), [orders]);

  // ── Bootstrap (runs once) ──────────────────────────────────────────────────

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || typeof window === "undefined") return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000008);
    sceneRef.current = scene;

    // Stars (3 size groups: small, medium, large)
    const starMeshes = [
      makeStarField(50, 0.5),
      makeStarField(35, 1.0),
      makeStarField(15, 2.0),
    ];
    starMeshes.forEach((s) => scene.add(s));

    // Camera
    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.copy(latLngToVec3(24, 46, 2.45));
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Globe group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // Canvas texture
    const texCanvas  = document.createElement("canvas");
    texCanvas.width  = CANVAS_W;
    texCanvas.height = CANVAS_H;
    const texCtx = texCanvas.getContext("2d")!;
    texCtx.fillStyle = OCEAN_COLOR;
    texCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const texture = new THREE.CanvasTexture(texCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    // Globe sphere
    const sphereGeo = new THREE.SphereGeometry(1, 72, 72);
    const sphereMat = new THREE.MeshPhongMaterial({ map: texture, specular: new THREE.Color(0x336688), shininess: 18 });
    const globe = new THREE.Mesh(sphereGeo, sphereMat);
    globe.userData.isGlobe = true;
    globeGroup.add(globe);

    // Atmosphere rim — soft blue glow
    const atmoGeo = new THREE.SphereGeometry(1.045, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({ color: 0x4488cc, transparent: true, opacity: 0.12, side: THREE.BackSide });
    globeGroup.add(new THREE.Mesh(atmoGeo, atmoMat));

    const haloGeo = new THREE.SphereGeometry(1.09, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x2255aa, transparent: true, opacity: 0.05, side: THREE.BackSide });
    globeGroup.add(new THREE.Mesh(haloGeo, haloMat));

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(4, 2, 4);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x4466aa, 0.2);
    fill.position.set(-4, -1, -2);
    scene.add(fill);

    // Clock
    const clock = new THREE.Clock();
    clockRef.current = clock;

    // Raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.02 };

    // Async texture paint
    let cancelled = false;
    void paintTexture(texCanvas).then(() => {
      if (!cancelled) texture.needsUpdate = true;
    });

    // ── Render loop ────────────────────────────────────────────────────────

    function tick() {
      rafRef.current = requestAnimationFrame(tick);
      const elapsed = clock.getElapsedTime();

      if (autoRotateRef.current && !draggingRef.current) {
        globeGroup.rotation.y += AUTO_ROTATE_SPEED;
      }

      // Animate dot rings and burst
      for (const entry of dotEntriesRef.current) {
        entry.rings.forEach((ring, ri) => {
          const phase = (elapsed * 1.1 + ri * 0.333) % 1;
          ring.scale.setScalar(1 + phase * 2.8);
          ring.material.opacity = Math.max(0, 0.55 * (1 - phase));
        });

        if (entry.isBurst) {
          const t = elapsed - entry.burstT;
          if (t < 0.6) {
            entry.mainMesh.material.color.setHex(GOLD_BRIGHT);
            entry.mainMesh.scale.setScalar(1 + Math.sin(t * Math.PI / 0.6) * 0.5);
          } else {
            entry.mainMesh.material.color.setHex(GOLD_HEX);
            entry.mainMesh.scale.setScalar(1);
          }
        }
      }

      // Update tooltip position via direct DOM (no React re-render)
      if (tooltipCityRef.current && tooltipRef.current && container) {
        const entry = dotEntriesRef.current.find((e) => e.key === tooltipCityRef.current);
        if (entry) {
          const wp = new THREE.Vector3();
          entry.mainMesh.getWorldPosition(wp);
          wp.project(camera);
          const { width, height } = container.getBoundingClientRect();
          tooltipRef.current.style.left  = `${(wp.x * 0.5 + 0.5) * width + 14}px`;
          tooltipRef.current.style.top   = `${(-wp.y * 0.5 + 0.5) * height - 52}px`;
          tooltipRef.current.style.display = "block";
        } else {
          tooltipRef.current.style.display = "none";
        }
      }

      renderer.render(scene, camera);
    }
    tick();

    // ── Interaction ────────────────────────────────────────────────────────

    const startDrag = (x: number, y: number) => {
      draggingRef.current = true;
      autoRotateRef.current = false;
      if (resumeRef.current) clearTimeout(resumeRef.current);
      prevMouseRef.current = { x, y };
    };
    const moveDrag = (x: number, y: number) => {
      if (!draggingRef.current) return;
      const dx = x - prevMouseRef.current.x;
      const dy = y - prevMouseRef.current.y;
      globeGroup.rotation.y += dx * 0.005;
      globeGroup.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, globeGroup.rotation.x + dy * 0.005));
      prevMouseRef.current = { x, y };
    };
    const endDrag = () => {
      draggingRef.current = false;
      resumeRef.current = setTimeout(() => { autoRotateRef.current = true; }, RESUME_DELAY_MS);
    };

    // Click / tap: raycast to show tooltip
    const handlePointClick = (nx: number, ny: number) => {
      const clickVec = new THREE.Vector2(nx, ny);
      raycaster.setFromCamera(clickVec, camera);
      const hits = raycaster.intersectObjects(dotEntriesRef.current.map((e) => e.mainMesh));
      if (hits.length > 0) {
        const entry = dotEntriesRef.current.find((e) => e.mainMesh === hits[0].object);
        if (entry) {
          tooltipCityRef.current = entry.key;
          setTooltip({ city: entry.key, count: entry.count, sar: entry.sar });
          return;
        }
      }
      tooltipCityRef.current = null;
      setTooltip(null);
      if (tooltipRef.current) tooltipRef.current.style.display = "none";
    };

    let clickStartPos = { x: 0, y: 0 };

    const onMouseDown  = (e: MouseEvent) => {
      clickStartPos = { x: e.clientX, y: e.clientY };
      startDrag(e.clientX, e.clientY);
    };
    const onMouseMove  = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const onMouseUp    = (e: MouseEvent) => {
      const dx = e.clientX - clickStartPos.x;
      const dy = e.clientY - clickStartPos.y;
      if (Math.sqrt(dx * dx + dy * dy) < 5) {
        const rect = canvas.getBoundingClientRect();
        handlePointClick(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
      }
      endDrag();
    };
    const onMouseLeave = () => endDrag();

    // Touch: single finger drag, two-finger pinch zoom
    let touchStartPos = { x: 0, y: 0 };
    let pinchDist = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchDist = Math.sqrt(dx * dx + dy * dy);
        autoRotateRef.current = false;
        if (resumeRef.current) clearTimeout(resumeRef.current);
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        touchStartPos = { x: t.clientX, y: t.clientY };
        startDrag(t.clientX, t.clientY);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.sqrt(dx * dx + dy * dy);
        if (pinchDist > 0) {
          const scale = pinchDist / newDist;
          const cam = cameraRef.current;
          if (cam) {
            const dist = cam.position.length();
            const next = Math.max(1.6, Math.min(4.5, dist * scale));
            cam.position.normalize().multiplyScalar(next);
            cam.lookAt(0, 0, 0);
          }
        }
        pinchDist = newDist;
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        moveDrag(t.clientX, t.clientY);
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0 && e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartPos.x;
        const dy = t.clientY - touchStartPos.y;
        if (Math.sqrt(dx * dx + dy * dy) < 8) {
          const rect = canvas.getBoundingClientRect();
          handlePointClick(
            ((t.clientX - rect.left) / rect.width) * 2 - 1,
            -((t.clientY - rect.top) / rect.height) * 2 + 1,
          );
        }
      }
      if (e.touches.length === 0) endDrag();
      pinchDist = 0;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dist = camera.position.length();
      const next = Math.max(1.6, Math.min(4.5, dist * (1 + e.deltaY * 0.001)));
      camera.position.normalize().multiplyScalar(next);
      camera.lookAt(0, 0, 0);
    };

    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    canvas.addEventListener("mousedown",  onMouseDown);
    canvas.addEventListener("mousemove",  onMouseMove);
    canvas.addEventListener("mouseup",    onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("wheel",      onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove",  onTouchMove,  { passive: false });
    canvas.addEventListener("touchend",   onTouchEnd,   { passive: true });

    // ── Cleanup ────────────────────────────────────────────────────────────

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (resumeRef.current) clearTimeout(resumeRef.current);
      ro.disconnect();
      canvas.removeEventListener("mousedown",  onMouseDown);
      canvas.removeEventListener("mousemove",  onMouseMove);
      canvas.removeEventListener("mouseup",    onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("wheel",      onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove",  onTouchMove);
      canvas.removeEventListener("touchend",   onTouchEnd);

      starMeshes.forEach((s) => { s.geometry.dispose(); (s.material as THREE.PointsMaterial).dispose(); });
      renderer.dispose();
      texture.dispose();
      sphereGeo.dispose(); sphereMat.dispose();
      atmoGeo.dispose();   atmoMat.dispose();
      haloGeo.dispose();   haloMat.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync dots when country data changes ──────────────────────────────────

  useEffect(() => {
    const globeGroup = globeGroupRef.current;
    const clock      = clockRef.current;
    if (!globeGroup || !clock) return;

    const elapsed = clock.getElapsedTime();

    for (const e of dotEntriesRef.current) {
      globeGroup.remove(e.group);
      e.mainMesh.geometry.dispose(); e.mainMesh.material.dispose();
      for (const r of e.rings) { r.geometry.dispose(); r.material.dispose(); }
    }

    const entries: DotEntry[] = countries.map((country) => {
      const normal = latLngToVec3(country.lat, country.lng, 1).normalize();
      const pos    = normal.clone().multiplyScalar(1.002);

      const group = new THREE.Group();
      group.position.copy(pos);
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

      const mainGeo  = new THREE.CircleGeometry(DOT_RADIUS, 20);
      const mainMat  = new THREE.MeshBasicMaterial({ color: GOLD_HEX, transparent: true, opacity: 0.92, depthTest: true });
      const mainMesh = new THREE.Mesh(mainGeo, mainMat);
      group.add(mainMesh);

      const rings: DotEntry["rings"] = [];
      for (let i = 0; i < 3; i++) {
        const rgeo = new THREE.CircleGeometry(DOT_RADIUS * 1.1, 20);
        const rmat = new THREE.MeshBasicMaterial({ color: GOLD_HEX, transparent: true, opacity: 0, depthTest: true, depthWrite: false });
        const ring = new THREE.Mesh(rgeo, rmat);
        group.add(ring);
        rings.push(ring);
      }

      globeGroup.add(group);
      return { key: country.key, count: country.count, sar: country.sar, isBurst: country.isBurst, group, mainMesh, rings, burstT: country.isBurst ? elapsed : 0 };
    });

    dotEntriesRef.current = entries;

    // If tooltip was showing, keep it if city still exists
    if (tooltipCityRef.current) {
      const found = entries.find((e) => e.key === tooltipCityRef.current);
      if (!found) {
        tooltipCityRef.current = null;
        setTooltip(null);
        if (tooltipRef.current) tooltipRef.current.style.display = "none";
      }
    }
  }, [countries]);

  // ── Render ────────────────────────────────────────────────────────────────

  const usd = tooltip ? Math.round(sarToUsd(tooltip.sar)) : 0;

  return (
    <div style={{ width: "100%" }}>
      <style>{`
        @keyframes sw-ribbon { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes sw-ping   { 75%,100% { transform: scale(2); opacity: 0 } }
        .sw-ribbon     { animation: sw-ribbon 36s linear infinite; display: inline-flex; gap: 2rem; white-space: nowrap; }
        .sw-ribbon:hover { animation-play-state: paused }
        .sw-live-ping  { animation: sw-ping 1s cubic-bezier(0,0,0.2,1) infinite }
        .sw-globe-h    { height: 280px }
        @media (min-width: 768px) { .sw-globe-h { height: 520px } }
        @media (prefers-reduced-motion: reduce) { .sw-ribbon, .sw-live-ping { animation: none } }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", marginBottom: 12, background: "rgba(0,0,0,0.5)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(8px)" }}>
        <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8, flexShrink: 0 }}>
          <span className="sw-live-ping" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#34d399", opacity: 0.75 }} />
          <span style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "#6ee7b7", boxShadow: "0 0 8px rgba(52,211,153,.6)", flexShrink: 0 }} />
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#6ee7b7", fontFamily: "system-ui,sans-serif" }}>LIVE</span>
        <span style={{ width: 1, height: 20, background: "rgba(255,255,255,.08)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: "rgba(255,255,255,.75)", fontFamily: "system-ui,sans-serif" }}>
          Total orders: <strong style={{ color: "#fff" }}>{orders.length.toLocaleString("en-US")}</strong>
        </span>
      </div>

      {/* ── Globe card ── */}
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(201,168,76,0.2)", background: "#000008" }}>
        <div ref={containerRef} className="sw-globe-h" style={{ position: "relative", width: "100%" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", cursor: "grab" }} />

          {/* Tooltip — position managed by RAF, content by React state */}
          <div
            ref={tooltipRef}
            style={{
              display: "none",
              position: "absolute",
              background: "rgba(5,7,14,0.96)",
              border: "1px solid rgba(201,168,76,0.55)",
              borderRadius: 8,
              padding: "8px 12px",
              pointerEvents: "none",
              backdropFilter: "blur(10px)",
              zIndex: 20,
              minWidth: 160,
            }}
          >
            {tooltip && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f3e7c8", fontFamily: "system-ui,Tahoma,sans-serif" }}>
                  {tooltip.city}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 4, fontFamily: "system-ui,sans-serif" }}>
                  {tooltip.count.toLocaleString("en-US")} {tooltip.count === 1 ? "order" : "orders"} · ${usd.toLocaleString("en-US")}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Bottom ribbon ── */}
        <div style={{ borderTop: "1px solid rgba(201,168,76,0.15)", background: "#030509", paddingBottom: 10 }}>
          <p style={{ margin: 0, padding: "9px 16px 5px", fontSize: 9, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(201,168,76,0.75)", fontFamily: "system-ui,sans-serif" }}>
            Latest orders
          </p>
          <div style={{ overflow: "hidden" }}>
            <div className="sw-ribbon">
              {ribbonLines.map((line, i) => (
                <span key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontFamily: "system-ui,Tahoma,sans-serif", display: "inline-block" }}>
                  {line}&nbsp;<span style={{ color: "rgba(201,168,76,0.85)" }} aria-hidden>◆</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

LiveOrdersMap.displayName = "LiveOrdersMap";
export default LiveOrdersMap;
