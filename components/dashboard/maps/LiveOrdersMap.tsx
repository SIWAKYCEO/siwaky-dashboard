"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { lineRevenue } from "@/lib/dashboard/kpi";
import { stableOrderFingerprint } from "@/lib/dashboard/orderFingerprint";
import type { OrderRow } from "@/lib/dashboard/types";

// ── Palette ───────────────────────────────────────────────────────────────────

const OCEAN_COLOR  = "#0a1628";
const LAND_COLOR   = "#1a2744";
const SAUDI_COLOR  = "#1e3d2a";
const GCC_COLOR    = "#1a2d3d";
const BORDER_COLOR = "rgba(201,168,76,0.28)";
const GOLD_HEX     = 0xc9a84c;
const GOLD_BRIGHT  = 0xffd97a;
const GEO_URL      = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ISO numeric IDs
const SAUDI_ID = 682;
const GCC_IDS  = new Set([784, 414, 634, 48, 512]); // UAE, Kuwait, Qatar, Bahrain, Oman

const CANVAS_W = 2048;
const CANVAS_H = 1024;
const AUTO_ROTATE_SPEED = 0.0015;
const RESUME_DELAY_MS   = 2200;

// ── City data ─────────────────────────────────────────────────────────────────

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "الرياض":  { lat: 24.7136, lng: 46.6753 },
  "جدة":     { lat: 21.4858, lng: 39.1925 },
  "الدمام":  { lat: 26.4207, lng: 50.0888 },
  "مكة":     { lat: 21.3891, lng: 39.8579 },
  "المدينة": { lat: 24.5247, lng: 39.5692 },
  "دبي":     { lat: 25.2048, lng: 55.2708 },
  "الكويت":  { lat: 29.3759, lng: 47.9774 },
  "الدوحة":  { lat: 25.2854, lng: 51.5310 },
  "أبوظبي":  { lat: 24.4539, lng: 54.3773 },
  "مسقط":    { lat: 23.5880, lng: 58.5922 },
};

const CITY_LOOKUP: Record<string, string> = {
  "الرياض": "الرياض", "الدمام": "الدمام", "جدة": "جدة",
  "مكة": "مكة", "مكة المكرمة": "مكة",
  "المدينة": "المدينة", "المدينة المنورة": "المدينة",
  "دبي": "دبي", "الكويت": "الكويت", "مدينة الكويت": "الكويت",
  "الدوحة": "الدوحة", "أبوظبي": "أبوظبي", "أبو ظبي": "أبوظبي",
  "مسقط": "مسقط",
  riyadh: "الرياض", arriyadh: "الرياض", riyad: "الرياض",
  jeddah: "جدة", jidda: "جدة", jedda: "جدة",
  dammam: "الدمام", dhahran: "الدمام", khobar: "الدمام",
  "al khobar": "الدمام", alkhobar: "الدمام",
  makkah: "مكة", mecca: "مكة", "makkah almukarramah": "مكة",
  madinah: "المدينة", medina: "المدينة", "al madinah": "المدينة",
  dubai: "دبي", dubayy: "دبي",
  kuwait: "الكويت", "kuwait city": "الكويت",
  doha: "الدوحة", "ad dawhah": "الدوحة",
  "abu dhabi": "أبوظبي", abudhabi: "أبوظبي",
  muscat: "مسقط", masqat: "مسقط",
};

function resolveCity(raw: string | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  if (CITY_COORDS[s]) return s;
  const lower = s.toLowerCase();
  return CITY_LOOKUP[s] ?? CITY_LOOKUP[lower] ?? null;
}

// ── Aggregation ───────────────────────────────────────────────────────────────

type CityData = { key: string; lat: number; lng: number; count: number; sar: number; isBurst: boolean };

function aggregateCities(orders: OrderRow[], pulseSet: ReadonlySet<string>): CityData[] {
  const map = new Map<string, { count: number; sar: number; burst: boolean }>();
  for (const o of orders) {
    const key = resolveCity(o.city);
    if (!key) continue;
    const cur = map.get(key) ?? { count: 0, sar: 0, burst: false };
    cur.count++;
    cur.sar += lineRevenue(o);
    if (!cur.burst && pulseSet.has(stableOrderFingerprint(o))) cur.burst = true;
    map.set(key, cur);
  }
  return [...map.entries()]
    .filter(([, v]) => v.count > 0)
    .map(([key, v]) => ({ key, lat: CITY_COORDS[key].lat, lng: CITY_COORDS[key].lng, ...v, isBurst: v.burst }));
}

function buildRibbonLines(orders: OrderRow[]): string[] {
  const last5 = [...orders].reverse().slice(0, 5);
  const items = last5.map((o) => {
    const name = (o.name ?? "").trim() || "عميل";
    const city = (o.city ?? "").trim() || "—";
    return `${name} · ${city} · SAR ${Math.round(lineRevenue(o))}`;
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

function dotBaseRadius(count: number): number {
  if (count <= 2)  return 0.016;
  if (count <= 5)  return 0.022;
  if (count <= 10) return 0.028;
  return 0.036;
}

// ── TopoJSON decoder (no extra dependency) ────────────────────────────────────

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

  // Draw in layers: rest → GCC → Saudi
  for (const pass of [0, 1, 2] as const) {
    for (const g of geoms) {
      const isSaudi = g.id === SAUDI_ID;
      const isGcc   = GCC_IDS.has(g.id ?? -1);
      if (pass === 0 && (isSaudi || isGcc)) continue;
      if (pass === 1 && !isGcc)  continue;
      if (pass === 2 && !isSaudi) continue;
      const fill = isSaudi ? SAUDI_COLOR : isGcc ? GCC_COLOR : LAND_COLOR;
      ctx.fillStyle   = fill;
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth   = 0.4;
      drawGeoGeom(ctx, g, decoded, CANVAS_W, CANVAS_H);
      ctx.fill();
      ctx.stroke();
    }
  }
}

// ── Dot entry ─────────────────────────────────────────────────────────────────

type DotEntry = {
  key: string; count: number; sar: number; isBurst: boolean;
  group: THREE.Group;
  mainMesh: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  rings: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>[];
  burstT: number; // elapsed time when burst was registered
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

  // Mutable scene refs — never trigger re-renders
  const rendererRef    = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef       = useRef<THREE.Scene | null>(null);
  const cameraRef      = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef  = useRef<THREE.Group | null>(null);
  const textureRef     = useRef<THREE.CanvasTexture | null>(null);
  const clockRef       = useRef<THREE.Clock | null>(null);
  const dotEntriesRef  = useRef<DotEntry[]>([]);
  const rafRef         = useRef(0);
  const autoRotateRef  = useRef(true);
  const draggingRef    = useRef(false);
  const prevMouseRef   = useRef({ x: 0, y: 0 });
  const resumeRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Initialised lazily inside the effect — never evaluated during SSR
  const mouse2dRef     = useRef<THREE.Vector2 | null>(null);

  const [tooltip, setTooltip] = useState<{ x: number; y: number; city: string; count: number; sar: number } | null>(null);

  const cities      = useMemo(() => aggregateCities(orders, pulseOrderFingerprints), [orders, pulseOrderFingerprints]);
  const ribbonLines = useMemo(() => buildRibbonLines(orders), [orders]);

  // ── Three.js bootstrap (runs once) ───────────────────────────────────────

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || typeof window === "undefined") return;

    // Mouse tracking (created here to stay SSR-safe)
    const mouse2d = new THREE.Vector2(-9, -9);
    mouse2dRef.current = mouse2d;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    rendererRef.current = renderer;

    // Scene + background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0c);
    sceneRef.current = scene;

    // Camera — positioned to look at Saudi Arabia
    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.copy(latLngToVec3(24, 46, 2.45));
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Globe group (everything that spins)
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // Canvas texture — ocean color immediately, countries drawn async
    const texCanvas  = document.createElement("canvas");
    texCanvas.width  = CANVAS_W;
    texCanvas.height = CANVAS_H;
    const texCtx = texCanvas.getContext("2d")!;
    texCtx.fillStyle = OCEAN_COLOR;
    texCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const texture = new THREE.CanvasTexture(texCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textureRef.current = texture;

    // Globe sphere
    const sphereGeo = new THREE.SphereGeometry(1, 72, 72);
    const sphereMat = new THREE.MeshPhongMaterial({ map: texture, specular: new THREE.Color(0x223344), shininess: 10 });
    const globe = new THREE.Mesh(sphereGeo, sphereMat);
    globe.userData.isGlobe = true;
    globeGroup.add(globe);

    // Atmosphere — back-face sphere, blue glow rim
    const atmoGeo = new THREE.SphereGeometry(1.045, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({ color: 0x2244aa, transparent: true, opacity: 0.075, side: THREE.BackSide });
    globeGroup.add(new THREE.Mesh(atmoGeo, atmoMat));

    // Outer atmosphere halo
    const haloGeo = new THREE.SphereGeometry(1.09, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x112266, transparent: true, opacity: 0.035, side: THREE.BackSide });
    globeGroup.add(new THREE.Mesh(haloGeo, haloMat));

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 0.95);
    sun.position.set(4, 2, 4);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x4466aa, 0.25);
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

    // ── Render loop ──────────────────────────────────────────────────────────
    function tick() {
      rafRef.current = requestAnimationFrame(tick);
      const elapsed = clock.getElapsedTime();

      // Auto-rotate
      if (autoRotateRef.current && !draggingRef.current) {
        globeGroup.rotation.y += AUTO_ROTATE_SPEED;
      }

      // Animate dots
      for (const entry of dotEntriesRef.current) {
        // Staggered pulse rings
        entry.rings.forEach((ring, ri) => {
          const phase = (elapsed * 1.1 + ri * 0.333) % 1;
          ring.scale.setScalar(1 + phase * 2.8);
          ring.material.opacity = Math.max(0, 0.55 * (1 - phase));
        });

        // Burst flash on new order
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

      // Tooltip: raycast against dot main meshes
      raycaster.setFromCamera(mouse2d, camera);
      const hits = raycaster.intersectObjects(dotEntriesRef.current.map((e) => e.mainMesh));
      if (hits.length > 0) {
        const hit   = hits[0];
        const entry = dotEntriesRef.current.find((e) => e.mainMesh === hit.object);
        if (entry && container) {
          const wp  = new THREE.Vector3();
          entry.mainMesh.getWorldPosition(wp);
          wp.project(camera);
          const { width, height } = container.getBoundingClientRect();
          setTooltip({ x: (wp.x * 0.5 + 0.5) * width, y: (-wp.y * 0.5 + 0.5) * height, city: entry.key, count: entry.count, sar: entry.sar });
        }
      } else {
        setTooltip(null);
      }

      renderer.render(scene, camera);
    }
    tick();

    // ── Interaction ──────────────────────────────────────────────────────────
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

    const onMouseDown  = (e: MouseEvent) => startDrag(e.clientX, e.clientY);
    const onMouseMove  = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse2d.set(
        ((e.clientX - rect.left) / rect.width)  * 2 - 1,
        -((e.clientY - rect.top)  / rect.height) * 2 + 1,
      );
      moveDrag(e.clientX, e.clientY);
    };
    const onMouseUp    = () => endDrag();
    const onMouseLeave = () => endDrag();

    const onTouchStart = (e: TouchEvent) => { const t = e.touches[0]; if (t) startDrag(t.clientX, t.clientY); };
    const onTouchMove  = (e: TouchEvent) => { const t = e.touches[0]; if (t) moveDrag(t.clientX, t.clientY); };
    const onTouchEnd   = () => endDrag();

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
    canvas.addEventListener("touchmove",  onTouchMove,  { passive: true });
    canvas.addEventListener("touchend",   onTouchEnd,   { passive: true });

    // ── Cleanup ──────────────────────────────────────────────────────────────
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

      renderer.dispose();
      texture.dispose();
      sphereGeo.dispose(); sphereMat.dispose();
      atmoGeo.dispose();   atmoMat.dispose();
      haloGeo.dispose();   haloMat.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync dots whenever city data changes ──────────────────────────────────

  useEffect(() => {
    const globeGroup = globeGroupRef.current;
    const clock      = clockRef.current;
    if (!globeGroup || !clock) return;

    const elapsed = clock.getElapsedTime();

    // Dispose and remove old dots
    for (const e of dotEntriesRef.current) {
      globeGroup.remove(e.group);
      e.mainMesh.geometry.dispose(); e.mainMesh.material.dispose();
      for (const r of e.rings) { r.geometry.dispose(); r.material.dispose(); }
    }

    // Create new dots
    const entries: DotEntry[] = cities.map((city) => {
      const normal = latLngToVec3(city.lat, city.lng, 1).normalize();
      const pos    = normal.clone().multiplyScalar(1.002);

      const group = new THREE.Group();
      group.position.copy(pos);
      // Orient so local +Z faces outward (normal direction)
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

      const r = dotBaseRadius(city.count);

      // Main glowing dot
      const mainGeo = new THREE.CircleGeometry(r, 20);
      const mainMat = new THREE.MeshBasicMaterial({ color: GOLD_HEX, transparent: true, opacity: 0.92, depthTest: true });
      const mainMesh = new THREE.Mesh(mainGeo, mainMat);
      group.add(mainMesh);

      // 3 staggered pulse rings
      const rings: DotEntry["rings"] = [];
      for (let i = 0; i < 3; i++) {
        const rgeo = new THREE.CircleGeometry(r * 1.1, 20);
        const rmat = new THREE.MeshBasicMaterial({ color: GOLD_HEX, transparent: true, opacity: 0, depthTest: true, depthWrite: false });
        const ring = new THREE.Mesh(rgeo, rmat);
        group.add(ring);
        rings.push(ring);
      }

      globeGroup.add(group);
      return { key: city.key, count: city.count, sar: city.sar, isBurst: city.isBurst, group, mainMesh, rings, burstT: city.isBurst ? elapsed : 0 };
    });

    dotEntriesRef.current = entries;
  }, [cities]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: "100%" }}>
      <style>{`
        @keyframes sw-ribbon { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes sw-ping   { 75%,100% { transform: scale(2); opacity: 0 } }
        .sw-ribbon     { animation: sw-ribbon 36s linear infinite; display: inline-flex; gap: 2rem; white-space: nowrap; }
        .sw-ribbon:hover { animation-play-state: paused }
        .sw-live-ping  { animation: sw-ping 1s cubic-bezier(0,0,0.2,1) infinite }
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
          Total orders: <strong style={{ color: "#fff" }}>{orders.length}</strong>
        </span>
      </div>

      {/* ── Globe card ── */}
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(201,168,76,0.2)", background: "#0a0a0c" }}>
        <div ref={containerRef} style={{ position: "relative", width: "100%", height: 520 }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", cursor: "grab" }} />

          {/* Tooltip */}
          {tooltip && (
            <div style={{ position: "absolute", left: tooltip.x + 14, top: tooltip.y - 44, background: "rgba(5,7,14,0.96)", border: "1px solid rgba(201,168,76,0.55)", borderRadius: 8, padding: "7px 11px", pointerEvents: "none", backdropFilter: "blur(10px)", zIndex: 20, minWidth: 130 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f3e7c8", fontFamily: "system-ui,Tahoma,sans-serif" }}>{tooltip.city}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 3, fontFamily: "system-ui,sans-serif" }}>
                {tooltip.count} {tooltip.count === 1 ? "order" : "orders"} · SAR {Math.round(tooltip.sar).toLocaleString()}
              </div>
            </div>
          )}
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
