import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransferMode, SimStep } from "../../engine/types";
import {
  RotateCw,
  Activity,
  Tag,
} from "lucide-react";

interface Motherboard3DProps {
  transferMode: TransferMode;
  isBuffering: boolean;
  cpuUtilizationFree: number;
  hitRatio: number;
  currentAddressHex?: string;
  lastStep?: SimStep;
  blockSizeB?: number;
  cacheSizeKB?: number;
}

type ChipId = "cpu" | "cache" | "dma" | "ram" | "nic";

export const Motherboard3D: React.FC<Motherboard3DProps> = ({
  transferMode,
  isBuffering,
  cpuUtilizationFree,
  hitRatio,
  currentAddressHex = "0x200001A0",
  lastStep,
  blockSizeB = 64,
  cacheSizeKB = 16,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeChip, setActiveChip] = useState<ChipId>("cpu");
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [cameraView, setCameraView] = useState<"iso" | "top" | "cpu" | "dma">("iso");

  // Three.js mutable state refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const reqIdRef = useRef<number | null>(null);

  // Dynamic mesh refs
  const cpuDieRef = useRef<THREE.Mesh | null>(null);
  const cpuLightRef = useRef<THREE.PointLight | null>(null);
  const cacheMeshesRef = useRef<THREE.Mesh[]>([]);
  const dmaLedRef = useRef<THREE.Mesh | null>(null);
  const dmaLightRef = useRef<THREE.PointLight | null>(null);
  const packetMeshesRef = useRef<{ mesh: THREE.Mesh; progress: number; pathType: "dma" | "cpu" | "mem" }[]>([]);
  const labelSpritesRef = useRef<THREE.Sprite[]>([]);

  // Flash animation state
  const lastFlashTimeRef = useRef<number>(0);
  const flashColorRef = useRef<THREE.Color>(new THREE.Color(0xd7ff38));

  const chipsInfo: Record<
    ChipId,
    { title: string; subtitle: string; role: string; status: string; domain: string }
  > = {
    cpu: {
      title: "RISC-V Execution Core (ALU & Pipeline)",
      subtitle: "Primary Video Frame Decoder",
      role:
        transferMode === "CPU"
          ? "CRITICAL BOTTLENECK: Core is 100% saturated executing manual load/store word-copy loops for incoming network packets."
          : "OPTIMAL: Core is 95%+ free for video decompression (H.264/HEVC), executing 5-stage pipeline smoothly without stalls.",
      status: transferMode === "CPU" ? "Core Stalled (100% Load)" : `${Math.round(cpuUtilizationFree)}% Headroom Available`,
      domain: "Processor Architecture & Instruction Pipeline",
    },
    cache: {
      title: `On-Chip SRAM Cache Matrix (${cacheSizeKB} KB, ${blockSizeB}B Lines)`,
      subtitle: "High-Speed Memory Filter",
      role: `Intercepts macroblock reads in 1 clock cycle. Servicing hits prevents DRAM stalls. Current Hit Ratio: ${hitRatio}%.`,
      status: `${hitRatio}% Hit Ratio (AMAT Sweet Spot: 64B)`,
      domain: "Memory Hierarchy & Spatial/Temporal Locality",
    },
    dma: {
      title: "Direct Memory Access Controller (DMAC)",
      subtitle: "Autonomous Bus Master",
      role:
        transferMode === "DMA"
          ? "ACTIVE: Streaming video packets directly from NIC into DDR RAM via bus cycle stealing, bypassing CPU."
          : "BYPASSED / IDLE: Programmed I/O active. CPU handles all memory copies manually.",
      status: transferMode === "DMA" ? "Bus Master Active" : "Standby (CPU Programmed I/O)",
      domain: "I/O Organization & Autonomous Bus Mastering",
    },
    ram: {
      title: "DDR Main Memory (Circular Frame Buffer)",
      subtitle: "Primary High-Capacity Store",
      role: "Stores incoming compressed bitstreams, decoded frame surfaces, and texture buffers. 80-cycle access latency.",
      status: "80 Cycle Access Latency (800 MB/s Bandwidth)",
      domain: "Primary Memory Subsystem & Bus Contention",
    },
    nic: {
      title: "Network Streaming Ingestion Controller (PCIe)",
      subtitle: "High-Speed Network Interface",
      role: "Ingests raw compressed video packets from network socket and buffers chunks for memory transfer.",
      status: isBuffering ? "STARVED / WAITING FOR REFILL" : "INGESTION STREAM ACTIVE",
      domain: "High-Speed Peripheral Interconnect",
    },
  };

  // Helper to create high-resolution crisp 2D billboard sprite labels
  const createChipLabel = (text: string, accentHex: string = "#D7FF38") => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.Sprite();

    // Background pill badge
    ctx.fillStyle = "rgba(10, 14, 22, 0.92)";
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(14, 14, 484, 100, 26);
    ctx.fill();
    ctx.stroke();

    // Glowing status dot
    ctx.fillStyle = accentHex;
    ctx.shadowColor = accentHex;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(58, 64, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label Text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 36px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 92, 65);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(5.0, 1.25, 1.0);
    return sprite;
  };

  // Trigger cache flash on new memory access step
  useEffect(() => {
    if (!lastStep) return;
    lastFlashTimeRef.current = performance.now();
    flashColorRef.current = lastStep.hit
      ? new THREE.Color(0xd7ff38) // Neon Lime for Hit
      : new THREE.Color(0xff3b30); // Red for Miss
  }, [lastStep]);

  // Sync label visibility
  useEffect(() => {
    labelSpritesRef.current.forEach((sprite) => {
      sprite.visible = showLabels;
    });
  }, [showLabels]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0d14);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 500);
    camera.position.set(24, 22, 24);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.minDistance = 14;
    controls.maxDistance = 65;
    controls.target.set(0, 1, 0);
    controlsRef.current = controls;

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight(0x2d3748, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(18, 32, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x2457ff, 0.9);
    fillLight.position.set(-20, 16, -16);
    scene.add(fillLight);

    // Component point lights
    const cpuLight = new THREE.PointLight(0x2457ff, 3, 15);
    cpuLight.position.set(-3, 2.5, -3);
    scene.add(cpuLight);
    cpuLightRef.current = cpuLight;

    const dmaLight = new THREE.PointLight(0xd7ff38, 2, 12);
    dmaLight.position.set(-4, 2, 5.5);
    scene.add(dmaLight);
    dmaLightRef.current = dmaLight;

    // 5. Motherboard PCB Base
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x0c1017,
      roughness: 0.75,
      metalness: 0.25,
    });
    const boardMesh = new THREE.Mesh(new THREE.BoxGeometry(32, 0.8, 24), boardMat);
    boardMesh.position.y = 0;
    boardMesh.receiveShadow = true;
    scene.add(boardMesh);

    // Gold PCB Edge Connector Fingers
    const edgeConnectorMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.2,
    });
    const edgeConnector = new THREE.Mesh(new THREE.BoxGeometry(28, 0.2, 0.6), edgeConnectorMat);
    edgeConnector.position.set(0, 0.45, 11.5);
    scene.add(edgeConnector);

    // Standoff screws at 4 corners
    const screwMat = new THREE.MeshStandardMaterial({ color: 0x8e99a8, metalness: 0.9, roughness: 0.3 });
    [
      [-15, -11],
      [15, -11],
      [-15, 11],
      [15, 11],
    ].forEach(([x, z]) => {
      const standoff = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.9, 16), screwMat);
      standoff.position.set(x, 0.45, z);
      scene.add(standoff);
    });

    // 6. Copper Circuit Bus Tracks (Surface Ribbons)
    const traceMat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
    const blueTraceMat = new THREE.MeshBasicMaterial({ color: 0x2457ff });
    const greenTraceMat = new THREE.MeshBasicMaterial({ color: 0xd7ff38 });

    const addTrace = (x1: number, z1: number, x2: number, z2: number, mat: THREE.Material = traceMat) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);
      const track = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.12), mat);
      track.rotation.x = -Math.PI / 2;
      track.rotation.z = -angle;
      track.position.set((x1 + x2) / 2, 0.42, (z1 + z2) / 2);
      scene.add(track);
    };

    // NIC to DMA Expressway
    addTrace(-11.5, 0, -4, 5.5, greenTraceMat);
    addTrace(-4, 5.5, 6.5, 0, greenTraceMat);

    // NIC to CPU Programmed I/O Track
    addTrace(-11.5, 0, -3, -3, traceMat);
    addTrace(-3, -3, 6.5, 0, traceMat);

    // RAM to Cache to CPU High-Speed Bus
    addTrace(6.5, 0, 1.5, -3, blueTraceMat);
    addTrace(1.5, -3, -3, -3, blueTraceMat);

    // Additional decorative bus lines
    for (let i = -1; i <= 1; i += 0.5) {
      addTrace(6.5 + i, 6.0, 14, 6.0 + i * 0.4, traceMat);
    }

    // 7. NAMED COMPONENT 1: CPU Socket & Processor Die
    const socketBase = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 0.3, 6.4),
      new THREE.MeshStandardMaterial({ color: 0x1f242e, roughness: 0.6 })
    );
    socketBase.position.set(-3, 0.55, -3);
    socketBase.castShadow = true;
    socketBase.receiveShadow = true;
    scene.add(socketBase);

    // CPU Integrated Heat Spreader (IHS)
    const cpuIHS = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 0.4, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x718096, metalness: 0.85, roughness: 0.25 })
    );
    cpuIHS.position.set(-3, 0.9, -3);
    cpuIHS.castShadow = true;
    scene.add(cpuIHS);

    // Central CPU Silicon Core with Emissive Ring
    const cpuDieMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      emissive: 0x2457ff,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.5,
    });
    const cpuDie = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 2.6), cpuDieMat);
    cpuDie.position.set(-3, 1.15, -3);
    scene.add(cpuDie);
    cpuDieRef.current = cpuDie;

    const ringMesh = new THREE.Mesh(
      new THREE.TorusGeometry(1.0, 0.08, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.set(-3, 1.25, -3);
    scene.add(ringMesh);

    // 8. NAMED COMPONENT 2: On-Chip SRAM Cache Bank (L1 / L2 Chips)
    const cacheMat1 = new THREE.MeshStandardMaterial({
      color: 0x171923,
      emissive: 0x2457ff,
      emissiveIntensity: 0.4,
      metalness: 0.6,
      roughness: 0.3,
    });
    const cacheMat2 = new THREE.MeshStandardMaterial({
      color: 0x171923,
      emissive: 0xd7ff38,
      emissiveIntensity: 0.4,
      metalness: 0.6,
      roughness: 0.3,
    });

    const cacheChipA = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 2.6), cacheMat1);
    cacheChipA.position.set(0.8, 0.65, -3);
    cacheChipA.castShadow = true;
    scene.add(cacheChipA);

    const cacheChipB = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 2.6), cacheMat2);
    cacheChipB.position.set(2.8, 0.65, -3);
    cacheChipB.castShadow = true;
    scene.add(cacheChipB);
    cacheMeshesRef.current = [cacheChipA, cacheChipB];

    // 9. NAMED COMPONENT 3: DMA Controller (DMAC) IC Chip
    const dmaChipMat = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      roughness: 0.4,
      metalness: 0.5,
    });
    const dmaChip = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.35, 3.4), dmaChipMat);
    dmaChip.position.set(-4, 0.6, 5.5);
    dmaChip.castShadow = true;
    scene.add(dmaChip);

    // DMAC Status LED
    const dmaLedMat = new THREE.MeshBasicMaterial({ color: 0xd7ff38 });
    const dmaLed = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12), dmaLedMat);
    dmaLed.position.set(-4, 0.8, 5.5);
    scene.add(dmaLed);
    dmaLedRef.current = dmaLed;

    // 10. NAMED COMPONENT 4: Dual-Channel DDR RAM DIMM Slots & Sticks
    const ramSlotMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.7 });
    [-0.7, 0.7].forEach((offset) => {
      const ramSlot = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 13.5), ramSlotMat);
      ramSlot.position.set(6.5 + offset, 0.6, 0);
      scene.add(ramSlot);

      // RAM Stick PCB
      const ramStickMat = new THREE.MeshStandardMaterial({
        color: 0x1e3a2f,
        roughness: 0.5,
        metalness: 0.3,
      });
      const ramStick = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.8, 12.8), ramStickMat);
      ramStick.position.set(6.5 + offset, 2.0, 0);
      ramStick.castShadow = true;
      scene.add(ramStick);

      // 6 Memory Chips on each RAM Stick
      for (let i = -5; i <= 5; i += 2) {
        const memChipMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.7 });
        const memChip = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.75, 1.2), memChipMat);
        memChip.position.set(6.5 + offset, 2.1, i);
        scene.add(memChip);
      }
    });

    // 11. NAMED COMPONENT 5: Network Streaming Ingestion Interface (PCIe Controller)
    const pcieSlot = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.4, 11),
      new THREE.MeshStandardMaterial({ color: 0x171923 })
    );
    pcieSlot.position.set(-11.5, 0.6, 0);
    scene.add(pcieSlot);

    // NIC Add-in Card
    const nicCardMat = new THREE.MeshStandardMaterial({ color: 0x2457ff, roughness: 0.5 });
    const nicCard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 10.4), nicCardMat);
    nicCard.position.set(-11.5, 1.9, 0);
    nicCard.castShadow = true;
    scene.add(nicCard);

    // RJ45 Port on bracket
    const rj45 = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.9, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x8e99a8, metalness: 0.9 })
    );
    rj45.position.set(-11.5, 2.2, 5.4);
    scene.add(rj45);

    // ==========================================
    // --- 3D FLOATING COMPONENT LABELS (NAMED) ---
    // ==========================================
    const labelList: THREE.Sprite[] = [];

    // 1. CPU Label
    const cpuLabel = createChipLabel("CPU CORE (RISC-V)", "#00F0FF");
    cpuLabel.position.set(-3, 3.4, -3);
    scene.add(cpuLabel);
    labelList.push(cpuLabel);

    // 2. SRAM Cache Label
    const cacheLabel = createChipLabel("L1/L2 SRAM CACHE", "#D7FF38");
    cacheLabel.position.set(1.8, 2.6, -3);
    scene.add(cacheLabel);
    labelList.push(cacheLabel);

    // 3. DMA Controller Label
    const dmaLabel = createChipLabel("DMA CONTROLLER", "#00FF66");
    dmaLabel.position.set(-4, 2.5, 5.5);
    scene.add(dmaLabel);
    labelList.push(dmaLabel);

    // 4. DDR RAM Label
    const ramLabel = createChipLabel("DDR5 MAIN MEMORY", "#2457FF");
    ramLabel.position.set(6.5, 4.4, 0);
    scene.add(ramLabel);
    labelList.push(ramLabel);

    // 5. Network NIC Label
    const nicLabel = createChipLabel("NETWORK NIC (PCIe)", "#FFAA00");
    nicLabel.position.set(-11.5, 4.0, 0);
    scene.add(nicLabel);
    labelList.push(nicLabel);

    labelSpritesRef.current = labelList;

    // ==========================================================
    // --- ADDITIONAL REALISTIC HARDWARE COMPONENTS (UNNAMED) ---
    // ==========================================================

    // A. VRM Power Delivery Stage (Capacitors, Chokes & MOSFETs around CPU)
    const chokeMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.6, roughness: 0.3 });
    const capBodyMat = new THREE.MeshStandardMaterial({ color: 0xa0aec0, metalness: 0.85, roughness: 0.2 });
    const capStripeMat = new THREE.MeshBasicMaterial({ color: 0x2457ff });

    // Left VRM bank (vertical)
    for (let z = -6.0; z <= 0.0; z += 1.2) {
      // Ferrite Choke
      const choke = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), chokeMat);
      choke.position.set(-7.2, 0.7, z);
      choke.castShadow = true;
      scene.add(choke);

      // Solid Aluminum Capacitor
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.75, 12), capBodyMat);
      cap.position.set(-8.4, 0.78, z);
      cap.castShadow = true;
      scene.add(cap);

      // Capacitor blue stripe
      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.305, 0.305, 0.2, 12), capStripeMat);
      stripe.position.set(-8.4, 1.0, z);
      scene.add(stripe);
    }

    // Top VRM bank (horizontal)
    for (let x = -5.0; x <= -1.0; x += 1.2) {
      const choke = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), chokeMat);
      choke.position.set(x, 0.7, -7.2);
      choke.castShadow = true;
      scene.add(choke);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.75, 12), capBodyMat);
      cap.position.set(x, 0.78, -8.4);
      cap.castShadow = true;
      scene.add(cap);
    }

    // B. PCH / Southbridge Heatsink (Lower-right corner)
    const pchBaseMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.7, roughness: 0.3 });
    const pchBase = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.6, 4.2), pchBaseMat);
    pchBase.position.set(7.5, 0.7, 7.5);
    pchBase.castShadow = true;
    scene.add(pchBase);

    // Aluminum cooling fins on PCH
    const finMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.8, roughness: 0.2 });
    for (let f = -1.6; f <= 1.6; f += 0.5) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.5, 0.15), finMat);
      fin.position.set(7.5, 1.2, 7.5 + f);
      scene.add(fin);
    }

    // C. M.2 NVMe PCIe 4.0 SSD Drive & Slot
    const m2Slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.3, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x1a202c })
    );
    m2Slot.position.set(-6.5, 0.55, 1.5);
    scene.add(m2Slot);

    // M.2 2280 PCB Stick
    const m2Stick = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.12, 5.2),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 })
    );
    m2Stick.position.set(-6.5, 0.7, -1.2);
    m2Stick.castShadow = true;
    scene.add(m2Stick);

    // 2x NAND Flash ICs on SSD
    [-0.5, 1.0].forEach((zOff) => {
      const nand = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.18, 1.3),
        new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.3, metalness: 0.6 })
      );
      nand.position.set(-6.5, 0.85, -1.2 + zOff);
      scene.add(nand);
    });

    // M.2 Standoff Screw
    const m2Screw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.35, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9 })
    );
    m2Screw.position.set(-6.5, 0.6, -3.8);
    scene.add(m2Screw);

    // D. CMOS Coin Cell Battery (CR2032)
    const cmosHolder = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.35, 24),
      new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.7 })
    );
    cmosHolder.position.set(1.5, 0.58, 6.8);
    scene.add(cmosHolder);

    const cmosBattery = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.0, 0.25, 24),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 })
    );
    cmosBattery.position.set(1.5, 0.75, 6.8);
    scene.add(cmosBattery);

    // E. 24-Pin ATX Main Power Connector (Right Edge)
    const atxMat = new THREE.MeshStandardMaterial({ color: 0x171923, roughness: 0.6 });
    const atxBlock = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 4.6), atxMat);
    atxBlock.position.set(14.8, 0.95, 0);
    atxBlock.castShadow = true;
    scene.add(atxBlock);

    // Gold Pin Sockets inside ATX
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9 });
    for (let pz = -1.8; pz <= 1.8; pz += 0.38) {
      [-0.25, 0.25].forEach((px) => {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.12), pinMat);
        pin.position.set(14.8 + px, 1.55, pz);
        scene.add(pin);
      });
    }

    // F. Rear I/O Shield Connectors (Top edge z = -11.4)
    const ioMetalMat = new THREE.MeshStandardMaterial({ color: 0x8e99a8, metalness: 0.85, roughness: 0.3 });

    // Stacked Dual USB Ports
    const usb1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.4), ioMetalMat);
    usb1.position.set(-11.5, 1.1, -11.2);
    scene.add(usb1);

    const usb2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.4), ioMetalMat);
    usb2.position.set(-8.5, 1.1, -11.2);
    scene.add(usb2);

    // HDMI / DisplayPort Box
    const hdmiBox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.2), ioMetalMat);
    hdmiBox.position.set(-5.5, 1.0, -11.2);
    scene.add(hdmiBox);

    // Audio Jacks (3 gold cylinder ports)
    [0.8, 1.8, 2.8].forEach((xOff, idx) => {
      const colors = [0x22c55e, 0xef4444, 0x3b82f6];
      const jack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: colors[idx], roughness: 0.5 })
      );
      jack.rotation.x = Math.PI / 2;
      jack.position.set(-2.5 + xOff, 1.0, -11.4);
      scene.add(jack);
    });

    // G. Quartz Crystal Oscillators (Clocks)
    const crystalMat = new THREE.MeshStandardMaterial({ color: 0xc0c7d0, metalness: 0.9, roughness: 0.2 });
    const crystal1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.7), crystalMat);
    crystal1.position.set(-0.8, 0.52, -7.5);
    scene.add(crystal1);

    const crystal2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.7), crystalMat);
    crystal2.position.set(-2.5, 0.52, 5.0);
    scene.add(crystal2);

    // H. Fan & Front Panel Pin Headers (Jumper Rows)
    const headerMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
    [-10, -5, 5, 10].forEach((hx) => {
      const header = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.4), headerMat);
      header.position.set(hx, 0.55, 11.0);
      scene.add(header);

      for (let p = -0.3; p <= 0.3; p += 0.2) {
        const hPin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), pinMat);
        hPin.position.set(hx + p, 0.8, 11.0);
        scene.add(hPin);
      }
    });

    // I. Dense SMD Micro Resistors & Decoupling Capacitors (80+ passives)
    const smdMatResistor = new THREE.MeshStandardMaterial({ color: 0x171923, roughness: 0.4 });
    const smdMatCapacitor = new THREE.MeshStandardMaterial({ color: 0xa87948, roughness: 0.4 }); // ceramic brown
    const smdMatSilver = new THREE.MeshStandardMaterial({ color: 0x8e99a8, metalness: 0.8 });

    // Seeded pseudo-random placement around components
    const placeSMDCluster = (cx: number, cz: number, count: number, spreadX: number, spreadZ: number) => {
      for (let i = 0; i < count; i++) {
        const px = cx + (Math.sin(i * 1.7) * spreadX);
        const pz = cz + (Math.cos(i * 2.3) * spreadZ);
        const mat = i % 3 === 0 ? smdMatCapacitor : i % 3 === 1 ? smdMatResistor : smdMatSilver;
        const smd = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.25), mat);
        smd.position.set(px, 0.44, pz);
        scene.add(smd);
      }
    };

    // Clusters around CPU, RAM, and Bus
    placeSMDCluster(-3, 0.8, 24, 2.5, 0.6); // Below CPU
    placeSMDCluster(6.5, 7.5, 18, 1.2, 0.8); // Top of RAM
    placeSMDCluster(6.5, -7.5, 18, 1.2, 0.8); // Bottom of RAM
    placeSMDCluster(-1.5, 4.0, 16, 1.8, 1.5); // Around DMAC
    placeSMDCluster(-7.5, 2.0, 14, 0.8, 2.0); // Near PCIe

    // 12. Dynamic Traveling Data Packets
    const packetGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const dmaPacketMat = new THREE.MeshBasicMaterial({ color: 0xd7ff38 });
    const cpuPacketMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    const memPacketMat = new THREE.MeshBasicMaterial({ color: 0x2457ff });

    const packets: { mesh: THREE.Mesh; progress: number; pathType: "dma" | "cpu" | "mem" }[] = [];

    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(packetGeo, dmaPacketMat);
      scene.add(mesh);
      packets.push({ mesh, progress: i / 8, pathType: "dma" });
    }

    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(packetGeo, cpuPacketMat);
      scene.add(mesh);
      packets.push({ mesh, progress: i / 8, pathType: "cpu" });
    }

    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(packetGeo, memPacketMat);
      scene.add(mesh);
      packets.push({ mesh, progress: i / 6, pathType: "mem" });
    }
    packetMeshesRef.current = packets;

    // 13. Animation Loop
    let lastTime = performance.now();
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      controls.update();

      if (isAutoRotate) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.2;
      } else {
        controls.autoRotate = false;
      }

      // Update CPU Core Ring & Light
      if (cpuDieRef.current && cpuLightRef.current) {
        if (transferMode === "CPU") {
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.008);
          (cpuDieRef.current.material as THREE.MeshStandardMaterial).emissive.setHex(0xff3b30);
          (cpuDieRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 + 0.5 * pulse;
          cpuLightRef.current.color.setHex(0xff3b30);
          cpuLightRef.current.intensity = 2.0 + 1.5 * pulse;
        } else {
          (cpuDieRef.current.material as THREE.MeshStandardMaterial).emissive.setHex(0x00f0ff);
          (cpuDieRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
          cpuLightRef.current.color.setHex(0x00f0ff);
          cpuLightRef.current.intensity = 1.8;
        }
      }

      // Update DMA Controller LED & Light
      if (dmaLedRef.current && dmaLightRef.current) {
        if (transferMode === "DMA") {
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
          (dmaLedRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xd7ff38);
          dmaLightRef.current.color.setHex(0xd7ff38);
          dmaLightRef.current.intensity = 2.0 + pulse;
        } else {
          (dmaLedRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x4a5568);
          dmaLightRef.current.intensity = 0.2;
        }
      }

      // Update Cache Flash Decay
      const flashElapsed = now - lastFlashTimeRef.current;
      if (flashElapsed < 400) {
        const decay = 1.0 - flashElapsed / 400;
        cacheMeshesRef.current.forEach((mesh) => {
          (mesh.material as THREE.MeshStandardMaterial).emissive.copy(flashColorRef.current);
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = decay * 1.5;
        });
      } else {
        cacheMeshesRef.current.forEach((mesh, idx) => {
          (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(idx === 0 ? 0x2457ff : 0xd7ff38);
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
        });
      }

      // Update Data Packet Conduits along Bus Lines
      packetMeshesRef.current.forEach((item) => {
        item.progress = (item.progress + dt * (transferMode === "DMA" ? 0.35 : 0.2)) % 1.0;
        const p = item.progress;

        if (item.pathType === "dma") {
          item.mesh.visible = transferMode === "DMA";
          if (transferMode === "DMA") {
            if (p < 0.5) {
              const subP = p / 0.5;
              item.mesh.position.set(
                THREE.MathUtils.lerp(-11.5, -4, subP),
                0.55,
                THREE.MathUtils.lerp(0, 5.5, subP)
              );
            } else {
              const subP = (p - 0.5) / 0.5;
              item.mesh.position.set(
                THREE.MathUtils.lerp(-4, 6.5, subP),
                0.55,
                THREE.MathUtils.lerp(5.5, 0, subP)
              );
            }
          }
        } else if (item.pathType === "cpu") {
          item.mesh.visible = transferMode === "CPU";
          if (transferMode === "CPU") {
            if (p < 0.5) {
              const subP = p / 0.5;
              item.mesh.position.set(
                THREE.MathUtils.lerp(-11.5, -3, subP),
                0.55,
                THREE.MathUtils.lerp(0, -3, subP)
              );
            } else {
              const subP = (p - 0.5) / 0.5;
              item.mesh.position.set(
                THREE.MathUtils.lerp(-3, 6.5, subP),
                0.55,
                THREE.MathUtils.lerp(-3, 0, subP)
              );
            }
          }
        } else if (item.pathType === "mem") {
          if (p < 0.6) {
            const subP = p / 0.6;
            item.mesh.position.set(
              THREE.MathUtils.lerp(6.5, 1.5, subP),
              0.55,
              THREE.MathUtils.lerp(0, -3, subP)
            );
          } else {
            const subP = (p - 0.6) / 0.4;
            item.mesh.position.set(
              THREE.MathUtils.lerp(1.5, -3, subP),
              0.55,
              THREE.MathUtils.lerp(-3, -3, subP)
            );
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      renderer.dispose();
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [transferMode, isAutoRotate]);

  // Camera preset handler
  const handleCameraPreset = (preset: "iso" | "top" | "cpu" | "dma") => {
    setCameraView(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (preset === "iso") {
      camera.position.set(24, 22, 24);
      controls.target.set(0, 1, 0);
    } else if (preset === "top") {
      camera.position.set(0, 36, 0.1);
      controls.target.set(0, 0, 0);
    } else if (preset === "cpu") {
      camera.position.set(-3, 12, 6);
      controls.target.set(-3, 1, -3);
    } else if (preset === "dma") {
      camera.position.set(-4, 12, 14);
      controls.target.set(-4, 1, 5.5);
    }
    controls.update();
  };

  return (
    <div className="card-tactile overflow-hidden flex flex-col bg-[#0A0D14]">
      {/* Top Header Bar */}
      <div className="bg-[#171717] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#171717]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D7FF38] animate-pulse"></span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">
            BufferZero 3D Architecture Simulator
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              transferMode === "DMA"
                ? "bg-[#D7FF38]/20 text-[#D7FF38] border border-[#D7FF38]/40"
                : "bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/40"
            }`}
          >
            {transferMode === "DMA" ? "⚡ DMA EXPRESSWAY ACTIVE" : "⚠️ CPU BOUND (WORD COPY)"}
          </span>
        </div>

        {/* Camera View & Label Toggle Controls */}
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
              showLabels ? "bg-[#D7FF38] text-[#171717] font-bold" : "text-[#8E99A8] hover:text-white"
            }`}
            title="Toggle Component Labels in 3D"
          >
            <Tag size={12} />
            <span>Labels: {showLabels ? "ON" : "OFF"}</span>
          </button>
          <button
            onClick={() => handleCameraPreset("iso")}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              cameraView === "iso" ? "bg-[#D7FF38] text-[#171717] font-bold" : "text-[#8E99A8] hover:text-white"
            }`}
          >
            3D Iso
          </button>
          <button
            onClick={() => handleCameraPreset("top")}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              cameraView === "top" ? "bg-[#D7FF38] text-[#171717] font-bold" : "text-[#8E99A8] hover:text-white"
            }`}
          >
            Top CAD
          </button>
          <button
            onClick={() => handleCameraPreset("cpu")}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              cameraView === "cpu" ? "bg-[#D7FF38] text-[#171717] font-bold" : "text-[#8E99A8] hover:text-white"
            }`}
          >
            CPU Focus
          </button>
          <button
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
              isAutoRotate ? "bg-[#2457FF] text-white font-bold" : "text-[#8E99A8] hover:text-white"
            }`}
            title="Toggle 3D Orbit Rotation"
          >
            <RotateCw size={12} className={isAutoRotate ? "animate-spin" : ""} />
            <span>Orbit</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="relative w-full h-[580px] bg-[#0A0D14] overflow-hidden">
        {/* Three.js Canvas Container */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Live Kinetic HUD Telemetry Overlay */}
        <div className="absolute top-3 left-3 pointer-events-none z-10 flex flex-col gap-1.5 font-mono text-[11px]">
          <div className="bg-[#171717]/90 text-white px-2.5 py-1 rounded border border-[#D7FF38]/40 backdrop-blur-xs flex items-center gap-2 shadow-[2px_2px_0_#000]">
            <span className="w-2 h-2 rounded-full bg-[#D7FF38] animate-ping"></span>
            <span>
              BUS ADDR: <strong className="text-[#D7FF38]">{currentAddressHex}</strong>
            </span>
          </div>

          <div
            className={`px-2.5 py-1 rounded border text-[10px] font-bold backdrop-blur-xs shadow-[2px_2px_0_#000] ${
              transferMode === "DMA"
                ? "bg-[#D7FF38]/20 text-[#D7FF38] border-[#D7FF38]"
                : "bg-[#FF3B30]/20 text-[#FF3B30] border-[#FF3B30]"
            }`}
          >
            {transferMode === "DMA"
              ? "⚡ DMA ROUTE: NIC ➔ DMAC ➔ DDR RAM (CPU 100% UNBURDENED)"
              : "⚠️ CPU PROGRAMMED I/O: NIC ➔ CPU CORE ➔ DDR RAM (STALL HAZARD)"}
          </div>

          {lastStep && (
            <div
              className={`px-2.5 py-1 rounded border text-[10px] font-bold backdrop-blur-xs shadow-[2px_2px_0_#000] ${
                lastStep.hit
                  ? "bg-[#2457FF]/20 text-[#D7FF38] border-[#2457FF]"
                  : "bg-[#FF3B30]/20 text-[#FF3B30] border-[#FF3B30]"
              }`}
            >
              {lastStep.hit
                ? `⚡ SRAM HIT (Set ${lastStep.setIndex}, Tag 0x${lastStep.tag.toString(16).toUpperCase()}) ➔ 1 CYCLE`
                : `⚠️ SRAM MISS ➔ BUS FETCH PENALTY ~80 CYCLES`}
            </div>
          )}
        </div>

        {/* Bottom Interactive Component Quick-Selector */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 bg-[#171717]/90 p-1.5 rounded-lg border border-[#2A303A] backdrop-blur-xs">
            {(["cpu", "cache", "dma", "ram", "nic"] as const).map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setActiveChip(chip);
                  if (chip === "cpu" || chip === "cache") handleCameraPreset("cpu");
                  else if (chip === "dma") handleCameraPreset("dma");
                  else handleCameraPreset("iso");
                }}
                className={`px-2 py-1 rounded font-mono text-[10px] uppercase font-bold transition-all cursor-pointer ${
                  activeChip === chip
                    ? "bg-[#D7FF38] text-[#171717] shadow-[2px_2px_0_#000]"
                    : "text-[#8E99A8] hover:text-white bg-[#1E242D]"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="bg-[#171717]/90 text-xs font-mono text-white px-3 py-1.5 rounded border border-[#2A303A] hidden sm:flex items-center gap-2">
            <Activity size={13} className="text-[#D7FF38]" />
            <span>Interactive 3D WebGL • Click & Drag to Orbit • Scroll to Zoom</span>
          </div>
        </div>
      </div>

      {/* Selected Chip Architecture Telemetry Bar */}
      <div className="p-3.5 bg-[#FFFFFF] border-t-2 border-[#171717] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#171717] text-sm block">
              {chipsInfo[activeChip].title}
            </span>
            <span className="text-[10px] bg-[#EBEBE6] px-1.5 py-0.5 rounded text-[#525252]">
              {chipsInfo[activeChip].subtitle}
            </span>
          </div>
          <p className="text-[#525252] text-[11px] mt-0.5 max-w-2xl">
            {chipsInfo[activeChip].role}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-[#FFFFFF] border border-[#171717] px-2.5 py-1 rounded">
            <span className="text-[10px] text-[#525252] block">STATUS</span>
            <span className="font-bold text-[#171717]">{chipsInfo[activeChip].status}</span>
          </div>
          <div className="bg-[#171717] text-[#D7FF38] px-2.5 py-1 rounded border border-[#171717]">
            <span className="text-[10px] text-[#8E99A8] block">SUBSYSTEM</span>
            <span className="font-bold text-[10px]">{chipsInfo[activeChip].domain}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
