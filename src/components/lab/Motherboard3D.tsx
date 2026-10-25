import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransferMode, SimStep } from "../../engine/types";
import {
  RotateCw,
  Activity,
  Tag,
  Maximize2,
  Minimize2,
  Info,
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
  const boardCardRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeChip, setActiveChip] = useState<ChipId>("cpu");
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [cameraView, setCameraView] = useState<"iso" | "top" | "cpu" | "dma">("iso");
  const [isInfoBoxCollapsed, setIsInfoBoxCollapsed] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Three.js mutable state refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const reqIdRef = useRef<number | null>(null);

  // Toggle fullscreen mode
  const handleToggleFullscreen = () => {
    if (!boardCardRef.current) return;
    if (!document.fullscreenElement) {
      boardCardRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Sync fullscreen change & resize Three.js
  useEffect(() => {
    const onFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      setTimeout(() => {
        if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
        const newW = mountRef.current.clientWidth;
        const newH = mountRef.current.clientHeight;
        cameraRef.current.aspect = newW / newH;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newW, newH);
      }, 150);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
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
    const ambientLight = new THREE.AmbientLight(0x334155, 1.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.6);
    sunLight.position.set(20, 36, 22);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.1);
    rimLight.position.set(-22, 18, -18);
    scene.add(rimLight);

    const warmSpecularLight = new THREE.DirectionalLight(0xd4af37, 0.7);
    warmSpecularLight.position.set(16, 14, -20);
    scene.add(warmSpecularLight);

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
      color: 0x090e17,
      roughness: 0.6,
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

    // A. CPU Socket Retention Frame & Chrome Lever Arm
    const leverMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.1 });
    const cpuLever = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6.2, 12), leverMat);
    cpuLever.rotation.z = Math.PI / 2;
    cpuLever.position.set(-3.0, 0.75, -6.1);
    scene.add(cpuLever);

    const leverHook = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.4), leverMat);
    leverHook.position.set(0.1, 0.8, -6.1);
    scene.add(leverHook);

    // B. VRM Power Delivery Stage (DrMOS, Chokes, Solid Capacitors)
    const chokeMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.6, roughness: 0.3 });
    const capBodyMat = new THREE.MeshStandardMaterial({ color: 0xa0aec0, metalness: 0.85, roughness: 0.2 });
    const capStripeMat = new THREE.MeshBasicMaterial({ color: 0x2457ff });
    const drmosMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.5 });
    const solidCapMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });

    // Left VRM bank (vertical)
    for (let z = -6.0; z <= 0.0; z += 1.2) {
      // High-power Choke
      const choke = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), chokeMat);
      choke.position.set(-7.2, 0.7, z);
      choke.castShadow = true;
      scene.add(choke);

      // Main Electrolytic/Polymer Cap
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.75, 12), capBodyMat);
      cap.position.set(-8.4, 0.78, z);
      cap.castShadow = true;
      scene.add(cap);

      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.305, 0.305, 0.2, 12), capStripeMat);
      stripe.position.set(-8.4, 1.0, z);
      scene.add(stripe);

      // DrMOS Power Stage Chip behind choke
      const drmos = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.45), drmosMat);
      drmos.position.set(-6.2, 0.5, z);
      scene.add(drmos);

      // Low-ESR Solid Polymer Cap in front
      const sCap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12), solidCapMat);
      sCap.position.set(-5.5, 0.65, z);
      scene.add(sCap);
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

      const drmos = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.45), drmosMat);
      drmos.position.set(x, 0.5, -6.2);
      scene.add(drmos);

      const sCap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12), solidCapMat);
      sCap.position.set(x, 0.65, -5.5);
      scene.add(sCap);
    }

    // VRM Aluminum Heatsink Armor Blocks
    const vrmArmorMat = new THREE.MeshStandardMaterial({ color: 0x242a35, metalness: 0.8, roughness: 0.25 });
    const leftVrmArmor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 7.5), vrmArmorMat);
    leftVrmArmor.position.set(-9.4, 1.1, -3.0);
    leftVrmArmor.castShadow = true;
    scene.add(leftVrmArmor);

    const topVrmArmor = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.4, 1.2), vrmArmorMat);
    topVrmArmor.position.set(-3.0, 1.1, -9.4);
    topVrmArmor.castShadow = true;
    scene.add(topVrmArmor);

    // Heatpipe connecting Left and Top VRM Heatsinks
    const copperPipeMat = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.9, roughness: 0.2 });
    const heatpipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3.5, 12), copperPipeMat);
    heatpipe.rotation.z = Math.PI / 4;
    heatpipe.position.set(-8.0, 1.6, -8.0);
    scene.add(heatpipe);

    // C. PCH / Southbridge Heatsink (Lower-right corner)
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

    // Brushed Aluminum Accent Badge on PCH
    const pchBadge = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.08, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xd7ff38, metalness: 0.9, roughness: 0.2 })
    );
    pchBadge.position.set(7.5, 1.48, 7.5);
    scene.add(pchBadge);

    // D. M.2 NVMe PCIe 4.0 SSD Drive 1 & Slot
    const m2Slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.3, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x1a202c })
    );
    m2Slot.position.set(-6.5, 0.55, 1.5);
    scene.add(m2Slot);

    const m2Stick = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.12, 5.2),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 })
    );
    m2Stick.position.set(-6.5, 0.7, -1.2);
    m2Stick.castShadow = true;
    scene.add(m2Stick);

    [-0.5, 1.0].forEach((zOff) => {
      const nand = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.18, 1.3),
        new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.3, metalness: 0.6 })
      );
      nand.position.set(-6.5, 0.85, -1.2 + zOff);
      scene.add(nand);
    });

    const m2Screw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.35, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9 })
    );
    m2Screw.position.set(-6.5, 0.6, -3.8);
    scene.add(m2Screw);

    // E. Second M.2 Armor Heatshield (Between CPU and PCH)
    const m2Armor2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.3, 5.6),
      new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.8, roughness: 0.3 })
    );
    m2Armor2.position.set(1.5, 0.55, 1.8);
    m2Armor2.castShadow = true;
    scene.add(m2Armor2);

    // F. CMOS Coin Cell Battery (CR2032)
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

    // G. Secondary & Tertiary PCIe Expansion Slots + Retention Latches
    const pcie2Slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.45, 11),
      new THREE.MeshStandardMaterial({ color: 0x718096, metalness: 0.9, roughness: 0.25 }) // Metal armor shield
    );
    pcie2Slot.position.set(-8.8, 0.62, 5.5);
    pcie2Slot.castShadow = true;
    scene.add(pcie2Slot);

    const pcieX1Slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.4, 3.4),
      new THREE.MeshStandardMaterial({ color: 0x171923 })
    );
    pcieX1Slot.position.set(-8.8, 0.6, -7.0);
    scene.add(pcieX1Slot);

    // Third PCIe slot (PCIe x4)
    const pcie3Slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.4, 7.0),
      new THREE.MeshStandardMaterial({ color: 0x1f2937 })
    );
    pcie3Slot.position.set(-6.0, 0.6, 8.2);
    scene.add(pcie3Slot);

    // Translucent white retention clip latches at slot ends
    const latchMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
    [[-11.5, 5.8], [-8.8, 11.2], [-6.0, 11.8]].forEach(([lx, lz]) => {
      const latch = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.5), latchMat);
      latch.position.set(lx, 0.75, lz);
      scene.add(latch);
    });

    // M.2 Key-E Wi-Fi / Bluetooth Module Card Slot
    const wifiSlot = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.35, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6 })
    );
    wifiSlot.position.set(-13.8, 0.6, -5.5);
    scene.add(wifiSlot);

    // H. Isolated Hi-Fi Audio Section (Bottom Left Corner)
    // Solder mask isolation trace line (amber glow)
    addTrace(-15.5, 4.0, -10.5, 11.5, new THREE.MeshBasicMaterial({ color: 0xffaa00 }));

    // Audio DAC Chip with Metal Shield
    const dacShield = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.35, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 })
    );
    dacShield.position.set(-13.0, 0.6, 7.5);
    dacShield.castShadow = true;
    scene.add(dacShield);

    // Realtek ALC1220 / ESS Sabre Audio Codec Chip
    const audioCodec = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
    );
    audioCodec.position.set(-11.2, 0.55, 8.5);
    scene.add(audioCodec);

    // 6x Japanese Nichicon Gold Audio Capacitors
    const goldCapMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.15 });
    [-0.6, 0, 0.6].forEach((gx) => {
      [-0.6, 0.6].forEach((gz) => {
        const aCap = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.8, 16), goldCapMat);
        aCap.position.set(-13.0 + gx, 0.8, 9.5 + gz);
        aCap.castShadow = true;
        scene.add(aCap);
      });
    });

    // I. High-Capacity Stacked SATA 6 Gbps Storage Towers (Right Edge)
    const sataMat = new THREE.MeshStandardMaterial({ color: 0x171923, roughness: 0.5 });
    const redSataMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });

    // Primary 6-port SATA block
    const sataPortBlock = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 4.2), sataMat);
    sataPortBlock.position.set(14.8, 1.05, 6.5);
    sataPortBlock.castShadow = true;
    scene.add(sataPortBlock);

    [-1.2, 0, 1.2].forEach((sz) => {
      const redPort = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.8), redSataMat);
      redPort.position.set(15.4, 0.9, 6.5 + sz);
      scene.add(redPort);
    });

    // Secondary 4-port SATA block
    const sataPortBlock2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 2.8), sataMat);
    sataPortBlock2.position.set(14.8, 1.05, 2.2);
    sataPortBlock2.castShadow = true;
    scene.add(sataPortBlock2);

    [-0.6, 0.6].forEach((sz) => {
      const redPort = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.8), redSataMat);
      redPort.position.set(15.4, 0.9, 2.2 + sz);
      scene.add(redPort);
    });

    // J. Front Panel USB Internal Headers (Right Edge)
    // USB 3.2 Gen 2x2 Type-C Front Header (Metal Shielded Box)
    const typeCHeader = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.9, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x8e99a8, metalness: 0.9, roughness: 0.2 })
    );
    typeCHeader.position.set(14.8, 0.85, -3.2);
    scene.add(typeCHeader);

    // USB 3.0 19-Pin Front Panel Header (Blue Keyed Box)
    const usb3Header = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.7, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 })
    );
    usb3Header.position.set(14.8, 0.75, -5.0);
    scene.add(usb3Header);

    // 24-Pin ATX Main Power Connector
    const atxMat = new THREE.MeshStandardMaterial({ color: 0x171923, roughness: 0.6 });
    const atxBlock = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 4.6), atxMat);
    atxBlock.position.set(14.8, 0.95, -0.5);
    atxBlock.castShadow = true;
    scene.add(atxBlock);

    const pinMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9 });
    for (let pz = -1.8; pz <= 1.8; pz += 0.38) {
      [-0.25, 0.25].forEach((px) => {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.12), pinMat);
        pin.position.set(14.8 + px, 1.55, -0.5 + pz);
        scene.add(pin);
      });
    }

    // K. 8-Pin + 4-Pin EPS CPU 12V Power Connectors (Top Left)
    const epsBlock = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.1, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x171923, roughness: 0.6 })
    );
    epsBlock.position.set(-13.5, 0.95, -10.5);
    epsBlock.castShadow = true;
    scene.add(epsBlock);

    const epsAux4 = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.1, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x171923, roughness: 0.6 })
    );
    epsAux4.position.set(-11.5, 0.95, -10.5);
    epsAux4.castShadow = true;
    scene.add(epsAux4);

    // L. 7-Segment Debug LED POST Display & Hardware Buttons (Top Right)
    const postDisplayMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
    const postDisplay = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 1.4), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    postDisplay.position.set(13.2, 0.65, -9.5);
    scene.add(postDisplay);

    const postDigit = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.35), postDisplayMat);
    postDigit.rotation.x = -Math.PI / 2;
    postDigit.position.set(13.2, 0.9, -9.5);
    scene.add(postDigit);

    // Onboard Power & Reset Tactile Buttons
    const startBtn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.35, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.2 })
    );
    startBtn.position.set(13.2, 0.65, -7.5);
    scene.add(startBtn);

    const resetBtn = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.35, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
    );
    resetBtn.position.set(13.2, 0.65, -6.0);
    scene.add(resetBtn);

    // M. Rear I/O Shield Full Armor Casing & Complete Port Stack
    const ioArmorMat = new THREE.MeshStandardMaterial({ color: 0x1e242d, metalness: 0.8, roughness: 0.3 });
    const ioShroud = new THREE.Mesh(new THREE.BoxGeometry(11.0, 1.8, 2.2), ioArmorMat);
    ioShroud.position.set(-9.5, 1.3, -11.0);
    ioShroud.castShadow = true;
    scene.add(ioShroud);

    // Subtle Cyan Gamer Stripe along I/O Shroud
    const shroudStripe = new THREE.Mesh(
      new THREE.BoxGeometry(10.8, 0.08, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    shroudStripe.position.set(-9.5, 2.22, -10.0);
    scene.add(shroudStripe);

    const ioMetalMat = new THREE.MeshStandardMaterial({ color: 0x8e99a8, metalness: 0.85, roughness: 0.3 });

    // DisplayPort 1.4
    const dpBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), ioMetalMat);
    dpBox.position.set(-7.0, 1.0, -11.4);
    scene.add(dpBox);

    // Dual Stacked RJ45 Ethernet Towers
    const lanTower = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.4), ioMetalMat);
    lanTower.position.set(-10.2, 1.2, -11.4);
    scene.add(lanTower);

    // Dual Ethernet Activity Micro LEDs (Amber & Green)
    const ledAmber = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
    ledAmber.position.set(-10.4, 1.9, -11.9);
    scene.add(ledAmber);
    const ledGreen = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00ff66 }));
    ledGreen.position.set(-10.0, 1.9, -11.9);
    scene.add(ledGreen);

    // Optical SPDIF TOSLINK Port (Square black with red emitter)
    const toslinkBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 })
    );
    toslinkBox.position.set(-3.8, 0.9, -11.4);
    scene.add(toslinkBox);
    const optCore = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    optCore.position.set(-3.8, 0.9, -11.9);
    scene.add(optCore);

    // Dual Brass Gold Wi-Fi 6E/7 Antenna Screw Terminals
    const goldAntennaMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.1 });
    [-12.8, -12.0].forEach((ax) => {
      const sma = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 16), goldAntennaMat);
      sma.rotation.x = Math.PI / 2;
      sma.position.set(ax, 1.2, -11.5);
      scene.add(sma);
    });

    // BIOS Flashback tactile button & Type-C rear port
    const biosFbBtn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.3, 12),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
    );
    biosFbBtn.rotation.x = Math.PI / 2;
    biosFbBtn.position.set(-14.2, 1.4, -11.5);
    scene.add(biosFbBtn);

    // N. Super I/O Controller, Clock Synthesizer & Dual BIOS Chips
    // Nuvoton / ITE Super I/O Controller (QFP-128 flat chip with 4-sided silver leads)
    const superIoChip = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.25, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.6 })
    );
    superIoChip.position.set(-3.0, 0.55, 9.8);
    superIoChip.castShadow = true;
    scene.add(superIoChip);

    // Silver gull-wing leads around Super I/O perimeter
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95 });
    [-1.2, 1.2].forEach((lx) => {
      const pinBand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 1.8), leadMat);
      pinBand.position.set(-3.0 + lx, 0.44, 9.8);
      scene.add(pinBand);
    });
    [-1.2, 1.2].forEach((lz) => {
      const pinBand = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.12), leadMat);
      pinBand.position.set(-3.0, 0.44, 9.8 + lz);
      scene.add(pinBand);
    });

    // Dual SPI Flash BIOS Chips (SOIC-8 packages)
    const biosChipMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    [-0.5, 0.5].forEach((bx) => {
      const bChip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.8), biosChipMat);
      bChip.position.set(0.5 + bx, 0.52, 4.2);
      scene.add(bChip);
    });

    // BIOS Select Jumper (Yellow jumper cap)
    const jumperCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.35, 0.45),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
    );
    jumperCap.position.set(1.5, 0.6, 4.2);
    scene.add(jumperCap);

    // Clock Synthesizer / PCIe 5.0 Buffer IC
    const clkGen = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.2, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
    );
    clkGen.position.set(-0.5, 0.52, 3.5);
    scene.add(clkGen);

    // Motherboard Piezo Beeper / Buzzer Cylinder
    const buzzer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.55, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    );
    buzzer.position.set(11.5, 0.7, 9.5);
    buzzer.castShadow = true;
    scene.add(buzzer);

    // Clear CMOS 2-Pin Jumper with Blue Cap
    const clrCmos = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.35, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 })
    );
    clrCmos.position.set(3.2, 0.6, 7.0);
    scene.add(clrCmos);

    // TPM 2.0 Security Module Header (14-pin dual row)
    const tpmHeader = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.3, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x1f2937 })
    );
    tpmHeader.position.set(-0.5, 0.55, 11.0);
    scene.add(tpmHeader);

    // Front Panel Audio (AAFP) 9-pin header (Left corner)
    const aafpHeader = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.3, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x171923 })
    );
    aafpHeader.position.set(-14.0, 0.55, 11.0);
    scene.add(aafpHeader);

    // Dual Internal USB 2.0 9-Pin Headers
    [-7.5, -5.5].forEach((ux) => {
      const uHeader = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.3, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x171923 })
      );
      uHeader.position.set(ux, 0.55, 11.0);
      scene.add(uHeader);
    });

    // Front Panel Control Switch Header (Colored pins: Power SW, Reset SW, HDD LED)
    const fpHeader = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.3, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x1f2937 })
    );
    fpHeader.position.set(13.5, 0.55, 11.0);
    scene.add(fpHeader);

    const fpColors = [0xef4444, 0x22c55e, 0x3b82f6, 0xfacc15];
    [-0.5, -0.2, 0.1, 0.4].forEach((fx, idx) => {
      const fpin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8),
        new THREE.MeshStandardMaterial({ color: fpColors[idx] })
      );
      fpin.position.set(13.5 + fx, 0.75, 11.0);
      scene.add(fpin);
    });

    // 12V 4-Pin RGB & 5V 3-Pin ARGB Lighting Headers
    const rgbHeader = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc })
    );
    rgbHeader.position.set(8.5, 0.55, 11.0);
    scene.add(rgbHeader);

    // O. DDR5 DIMM Ejector Latches & Onboard PMIC ICs
    [-0.7, 0.7].forEach((offset) => {
      // Ejector clips at top and bottom of each RAM slot
      [-6.8, 6.8].forEach((ez) => {
        const latch = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.7, 0.4),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
        );
        latch.position.set(6.5 + offset, 1.4, ez);
        scene.add(latch);
      });

      // On-DIMM Power Management IC (PMIC)
      const pmic = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 })
      );
      pmic.position.set(6.5 + offset, 2.8, 0);
      scene.add(pmic);
    });

    // P. Quartz Crystal Oscillators (Clocks)
    const crystalMat = new THREE.MeshStandardMaterial({ color: 0xc0c7d0, metalness: 0.9, roughness: 0.2 });
    const crystal1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.7), crystalMat);
    crystal1.position.set(-0.8, 0.52, -7.5);
    scene.add(crystal1);

    const crystal2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.7), crystalMat);
    crystal2.position.set(-2.5, 0.52, 5.0);
    scene.add(crystal2);

    const crystal3 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.7), crystalMat);
    crystal3.position.set(-11.5, 0.52, 7.0);
    scene.add(crystal3);

    // Q. CPU Fan & Water Pump Headers near CPU Socket
    [[-1.0, -6.0], [3.5, -6.0], [-7.5, -9.5], [10.0, -6.5]].forEach(([fx, fz]) => {
      const fanH = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
      fanH.position.set(fx, 0.55, fz);
      scene.add(fanH);
      for (let fp = -0.25; fp <= 0.25; fp += 0.17) {
        const fpin = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), pinMat);
        fpin.position.set(fx + fp, 0.75, fz);
        scene.add(fpin);
      }
    });

    // R. High-Speed Serpentine Matched-Length Bus Traces
    const serpentineMat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
    for (let s = -2; s <= 2; s += 0.8) {
      addTrace(3.8, s - 2.5, 4.4, s - 2.0, serpentineMat);
      addTrace(4.4, s - 2.0, 4.8, s - 2.7, serpentineMat);
      addTrace(4.8, s - 2.7, 5.4, s - 2.2, serpentineMat);
    }

    // S. Barcode Inventory Sticker & Silkscreen Fiducials
    const sticker = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 1.0),
      new THREE.MeshBasicMaterial({ color: 0xf8fafc })
    );
    sticker.rotation.x = -Math.PI / 2;
    sticker.position.set(10.5, 0.42, -5.5);
    scene.add(sticker);

    // Silkscreen corner fiducial registration crosses (+)
    const fiducialMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    [[-14.5, -10.5], [14.5, -10.5], [-14.5, 10.5], [14.5, 10.5]].forEach(([fx, fz]) => {
      const f1 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.06), fiducialMat);
      f1.rotation.x = -Math.PI / 2;
      f1.position.set(fx, 0.42, fz);
      scene.add(f1);
      const f2 = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.4), fiducialMat);
      f2.rotation.x = -Math.PI / 2;
      f2.position.set(fx, 0.42, fz);
      scene.add(f2);
    });

    // T. Dense SMD Micro Resistors & Decoupling Capacitors (300+ passives across the entire plate)
    const smdMatResistor = new THREE.MeshStandardMaterial({ color: 0x171923, roughness: 0.4 });
    const smdMatCapacitor = new THREE.MeshStandardMaterial({ color: 0xa87948, roughness: 0.4 }); // ceramic brown
    const smdMatSilver = new THREE.MeshStandardMaterial({ color: 0x8e99a8, metalness: 0.8 });

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

    // Distributed dense SMD clusters across all regions of the PCB plate
    placeSMDCluster(-3, 0.8, 32, 2.8, 0.8);  // Below CPU
    placeSMDCluster(6.5, 7.5, 28, 1.5, 1.0);  // Top of RAM
    placeSMDCluster(6.5, -7.5, 28, 1.5, 1.0); // Bottom of RAM
    placeSMDCluster(-1.5, 4.0, 26, 2.0, 1.8); // Around DMAC
    placeSMDCluster(-7.5, 2.0, 22, 1.0, 2.2); // Near PCIe
    placeSMDCluster(11.0, 3.0, 26, 2.0, 2.5); // Between RAM and SATA
    placeSMDCluster(10.5, -3.0, 26, 2.0, 2.5); // Right of RAM
    placeSMDCluster(-12.5, -5.0, 22, 1.8, 2.0); // Above PCIe NIC
    placeSMDCluster(3.0, 9.5, 24, 2.5, 1.0);  // Lower center edge
    placeSMDCluster(-1.0, 8.5, 20, 1.5, 1.2); // Near Super I/O
    placeSMDCluster(4.5, 5.0, 18, 1.2, 1.5);  // Around CMOS battery

    // U. PCB Ground Perimeter Stitching Vias (Gold dots along perimeter)
    const viaMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95 });
    for (let vx = -14.5; vx <= 14.5; vx += 1.4) {
      [-11.2, 11.2].forEach((vz) => {
        const via = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 8), viaMat);
        via.position.set(vx, 0.42, vz);
        scene.add(via);
      });
    }
    for (let vz = -10.5; vz <= 10.5; vz += 1.4) {
      [-15.2, 15.2].forEach((vx) => {
        const via = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 8), viaMat);
        via.position.set(vx, 0.42, vz);
        scene.add(via);
      });
    }

    // V. 4-Position Red Configuration DIP Switch Bank
    const dipHousing = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.45, 1.0),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
    );
    dipHousing.position.set(10.5, 0.6, -2.0);
    dipHousing.castShadow = true;
    scene.add(dipHousing);

    const toggleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    [-0.5, -0.16, 0.16, 0.5].forEach((dx, idx) => {
      const toggle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.25, 0.28), toggleMat);
      toggle.position.set(10.5 + dx, 0.78, -2.0 + (idx % 2 === 0 ? 0.15 : -0.15));
      scene.add(toggle);
    });

    // W. Clock Synthesizer Quartz Resonators with Solder Terminals & RTC Crystal
    const quartzBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.15 })
    );
    quartzBody.position.set(-1.2, 0.6, 2.5);
    quartzBody.castShadow = true;
    scene.add(quartzBody);

    const rtcCrystal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
    );
    rtcCrystal.rotation.x = Math.PI / 2;
    rtcCrystal.position.set(2.8, 0.52, 6.8);
    scene.add(rtcCrystal);

    // X. Auxiliary Logic Buffers & Bus Transceiver ICs (SOIC-16 packages)
    [-4.5, 3.2].forEach((lx) => {
      const soicChip = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.22, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
      );
      soicChip.position.set(lx, 0.52, 3.5);
      scene.add(soicChip);

      for (let pz = -0.5; pz <= 0.5; pz += 0.25) {
        [-0.45, 0.45].forEach((px) => {
          const pin = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.06, 0.08),
            new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95 })
          );
          pin.position.set(lx + px, 0.43, 3.5 + pz);
          scene.add(pin);
        });
      }
    });

    // Y. Miniature SOT-23 Surface-Mount Transistors
    [
      [-5.5, -4.5],
      [4.2, -4.5],
      [9.5, 0.5],
      [-2.0, 7.2],
      [-10.5, 3.2],
      [12.0, -1.5],
    ].forEach(([tx, tz]) => {
      const sot = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.12, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 })
      );
      sot.position.set(tx, 0.45, tz);
      scene.add(sot);
    });

    // Z. Hardware Test Points (Gold Circular Pads with Silkscreen Rings)
    const tpMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.98, roughness: 0.1 });
    const tpRingMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    [
      [-1.5, -1.0],
      [0.2, -1.0],
      [4.2, 1.2],
      [-5.2, 3.8],
      [8.5, -4.5],
      [12.5, 4.5],
      [-10.2, -2.5],
      [2.5, -7.5],
    ].forEach(([tpx, tpz]) => {
      const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 16), tpMat);
      tp.position.set(tpx, 0.42, tpz);
      scene.add(tp);

      const tpRing = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.22, 16), tpRingMat);
      tpRing.rotation.x = -Math.PI / 2;
      tpRing.position.set(tpx, 0.422, tpz);
      scene.add(tpRing);
    });

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
    <div
      ref={boardCardRef}
      className={`card-tactile overflow-hidden flex flex-col h-full justify-between bg-[#0A0D14] transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-[100] w-screen h-screen rounded-none border-0 shadow-2xl"
          : ""
      }`}
    >
      {/* Top Header Bar */}
      <div className="bg-[#171717] text-white px-4 py-2 flex items-center justify-between border-b-2 border-[#171717]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D7FF38] animate-pulse"></span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">
            3D Motherboard Architecture
          </span>
        </div>

        {/* Camera View, Label Toggle & Fullscreen Controls */}
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

          {/* Guide Explainer Toggle */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
              showGuide ? "bg-[#D7FF38] text-[#171717] font-bold" : "text-[#8E99A8] hover:text-white"
            }`}
            title="Toggle Video Architecture Explanation Guide"
          >
            <Info size={12} />
            <span>Guide</span>
          </button>

          {/* Fullscreen Mode Button */}
          <button
            onClick={handleToggleFullscreen}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
              isFullscreen
                ? "bg-[#2457FF] text-white shadow-[2px_2px_0_#000]"
                : "bg-[#1E242D] text-[#D7FF38] border border-[#D7FF38]/40 hover:bg-[#D7FF38] hover:text-[#171717]"
            }`}
            title="Toggle Immersive Fullscreen 3D View"
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div
        className={`relative w-full flex-1 bg-[#0A0D14] overflow-hidden ${
          isFullscreen ? "h-full min-h-[500px]" : "min-h-[480px]"
        }`}
      >
        {/* Three.js Canvas Container */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Sleek Minimal HUD Capsule (Clean, single-line, uncluttered) */}
        <div className="absolute top-3 left-3 pointer-events-none z-10 flex items-center gap-2.5 font-mono text-[11px] bg-[#0A0D14]/85 text-white px-3 py-1.5 rounded-lg border border-[#2A303A] backdrop-blur-md shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#D7FF38] animate-ping shrink-0" />
          <span className="text-white/80">
            BUS <strong className="text-[#D7FF38]">{currentAddressHex}</strong>
          </span>
          <span className="text-[#3A4454]">|</span>
          <span className={transferMode === "DMA" ? "text-[#D7FF38] font-bold" : "text-[#FF3B30] font-bold"}>
            {transferMode === "DMA" ? "DMA ROUTE" : "CPU I/O"}
          </span>
          {lastStep && (
            <>
              <span className="text-[#3A4454]">|</span>
              <span className={lastStep.hit ? "text-[#00F0FF] font-semibold" : "text-[#FF3B30] font-semibold"}>
                {lastStep.hit ? "SRAM HIT (1c)" : "SRAM MISS"}
              </span>
            </>
          )}
        </div>

        {/* Compact Floating Information Box: How Video Streaming Architecture Works */}
        {(isFullscreen || showGuide) && (
          <div
            className={`absolute top-3 right-3 z-20 pointer-events-auto transition-all duration-300 ${
              isInfoBoxCollapsed ? "w-auto" : "w-60 sm:w-68"
            }`}
          >
            <div className="bg-[#0A0D14]/92 border border-[#2A303A] text-white rounded-lg shadow-xl backdrop-blur-md overflow-hidden">
              {/* Header */}
              <div className="px-2.5 py-1.5 bg-[#171923] border-b border-[#2A303A] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF38] animate-pulse" />
                  <span className="font-mono text-[10px] font-bold text-[#D7FF38] uppercase tracking-wider">
                    How Streaming Works
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsInfoBoxCollapsed(!isInfoBoxCollapsed)}
                    className="text-[9px] font-mono text-[#8E99A8] hover:text-white px-1.5 py-0.5 rounded bg-[#242A35] transition-colors cursor-pointer"
                  >
                    {isInfoBoxCollapsed ? "Expand" : "Min"}
                  </button>
                  {showGuide && !isFullscreen && (
                    <button
                      onClick={() => setShowGuide(false)}
                      className="text-[9px] font-mono text-[#8E99A8] hover:text-white px-1.5 py-0.5 rounded bg-[#242A35] transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Body */}
              {!isInfoBoxCollapsed && (
                <div className="p-2 space-y-1.5 font-mono text-[9px] leading-snug">
                  <div className="space-y-1 text-[#C9D1D9]">
                    <div className="p-1.5 bg-[#12161F] rounded border border-[#202736]">
                      <div className="font-bold text-[#D7FF38] flex items-center gap-1 mb-0.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#D7FF38]/20 text-[#D7FF38] text-[8px] flex items-center justify-center font-bold">1</span>
                        <span>NIC Ingestion</span>
                      </div>
                      <p className="text-[9px] text-[#8E99A8]">
                        Network card ingests compressed packets from socket.
                      </p>
                    </div>

                    <div className="p-1.5 bg-[#12161F] rounded border border-[#202736]">
                      <div className="font-bold text-[#00F0FF] flex items-center gap-1 mb-0.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] text-[8px] flex items-center justify-center font-bold">2</span>
                        <span>DMA Bus Bypass</span>
                      </div>
                      <p className="text-[9px] text-[#8E99A8]">
                        DMAC writes directly to DDR RAM (0% CPU load).
                      </p>
                    </div>

                    <div className="p-1.5 bg-[#12161F] rounded border border-[#202736]">
                      <div className="font-bold text-[#2457FF] flex items-center gap-1 mb-0.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#2457FF]/30 text-[#2457FF] text-[8px] flex items-center justify-center font-bold">3</span>
                        <span>SRAM Locality</span>
                      </div>
                      <p className="text-[9px] text-[#8E99A8]">
                        L1/L2 hits service in 1 cycle, avoiding 80-cycle stall.
                      </p>
                    </div>

                    <div className="p-1.5 bg-[#12161F] rounded border border-[#202736]">
                      <div className="font-bold text-[#22C55E] flex items-center gap-1 mb-0.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] text-[8px] flex items-center justify-center font-bold">4</span>
                        <span>Stall-Free 60 FPS</span>
                      </div>
                      <p className="text-[9px] text-[#8E99A8]">
                        CPU decodes smoothly with zero buffer stutter!
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="pt-1 border-t border-[#202736] flex items-center justify-between text-[9px]">
                    <span className="text-[#8E99A8]">Mode:</span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded ${
                        transferMode === "DMA"
                          ? "bg-[#D7FF38]/20 text-[#D7FF38] border border-[#D7FF38]/40"
                          : "bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/40"
                      }`}
                    >
                      {transferMode === "DMA" ? "DMA Active (0% CPU Load)" : "CPU Copy (Stall Hazard)"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
      <div className="p-3 bg-[#FFFFFF] border-t-2 border-[#171717] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#171717] text-xs sm:text-sm block">
              {chipsInfo[activeChip].title}
            </span>
            <span className="text-[10px] bg-[#EBEBE6] px-1.5 py-0.5 rounded text-[#525252] font-semibold">
              {chipsInfo[activeChip].subtitle}
            </span>
          </div>
          <p className="text-[#333333] text-xs mt-0.5 max-w-2xl leading-relaxed">
            {chipsInfo[activeChip].role}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-[#FFFFFF] border border-[#171717] px-2.5 py-1 rounded">
            <span className="text-[9px] text-[#525252] font-bold block">STATUS</span>
            <span className="font-bold text-xs text-[#171717]">{chipsInfo[activeChip].status}</span>
          </div>
          <div className="bg-[#171717] text-[#D7FF38] px-2.5 py-1 rounded border border-[#171717]">
            <span className="text-[9px] text-[#8E99A8] font-bold block">SUBSYSTEM</span>
            <span className="font-bold text-xs">{chipsInfo[activeChip].domain}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
