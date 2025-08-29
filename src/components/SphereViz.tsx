import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useAppState, BAND_RANGES } from "../state/appState";
import { BAND_COLORS } from "../utils/colors";

type Props = {
  onToggle?: () => void;
};

export default function SphereViz({ onToggle }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const sphere2Ref = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const materialsRef = useRef<{ sphere?: THREE.ShaderMaterial; sphere2?: THREE.ShaderMaterial; points?: THREE.PointsMaterial }>({});
  const scaleRef = useRef(1.0);

  const band = useAppState((s) => s.band);
  const offsetHz = useAppState((s) => s.offsetHz);
  const isPlaying = useAppState((s) => s.isPlaying);
  const reduceMotion = useAppState((s) => s.reduceMotion);

  // Initialize stateRef with current app state values
  const stateRef = useRef({ band, offsetHz, isPlaying, reduceMotion });

  // Keep latest values for animation loop
  useEffect(() => {
    stateRef.current.band = band;
  }, [band]);
  useEffect(() => {
    stateRef.current.offsetHz = offsetHz;
  }, [offsetHz]);
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    stateRef.current.reduceMotion = reduceMotion;
  }, [reduceMotion]);

      // One-time init
    useEffect(() => {
      const container = mountRef.current!;
      // Clear any existing canvases (e.g., StrictMode double-invoke in dev)
      while (container.firstChild) container.removeChild(container.firstChild);
      
      // Get container dimensions with fallback
      const getContainerSize = () => {
        const rect = container.getBoundingClientRect();
        return {
          width: rect.width || container.clientWidth || window.innerWidth,
          height: rect.height || container.clientHeight || window.innerHeight
        };
      };
      
      const { width, height } = getContainerSize();

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 3.5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Let CSS control canvas size; set drawing buffer only
    renderer.setSize(width, height, false);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    // Ensure no layout gap (canvas is block-level and fills parent)
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = "auto";
    renderer.domElement.style.cursor = "default";
    renderer.setClearColor(0x000000, 0);

    const seg = stateRef.current.reduceMotion ? 20 : 32; // line density (lower = fewer wireframe lines)
    const sphereGeom = new THREE.SphereGeometry(1.1, seg, seg);
    const sphereMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFreq: { value: 1 },
        uAmp: { value: 0.015 },
        uColor: { value: new THREE.Color(BAND_COLORS[stateRef.current.band]) },
        uPhase: { value: 0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uFreq;
        uniform float uAmp;
        uniform float uPhase;
        void main() {
          vec3 p = position;
          float phase = p.x * 2.13 + p.y * 1.71 + p.z * 2.69;
          float disp = uAmp * sin(uTime * uFreq * 6.28318 + phase + uPhase);
          vec3 newPosition = p + normal * disp;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        void main() {
          gl_FragColor = vec4(uColor, 0.85);
        }
      `,
      transparent: true,
      wireframe: true
    });
    materialsRef.current.sphere = sphereMat;
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    sphereRef.current = sphere;
    scene.add(sphere);

    // Secondary overlapping sphere (slightly offset color + warp offset)
    const sphereMat2 = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFreq: { value: 1 },
        uAmp: { value: 0.006 },
        uColor: { value: new THREE.Color(BAND_COLORS[stateRef.current.band]) },
        uPhase: { value: 0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uFreq;
        uniform float uAmp;
        uniform float uPhase;
        void main() {
          vec3 p = position;
          float phase = p.x * 2.13 + p.y * 1.71 + p.z * 2.69;
          float disp = uAmp * sin(uTime * uFreq * 6.28318 + phase + uPhase);
          vec3 newPosition = p + normal * disp;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        void main() {
          gl_FragColor = vec4(uColor, 0.35);
        }
      `,
      transparent: true,
      wireframe: true
    });
    materialsRef.current.sphere2 = sphereMat2;
    const sphere2 = new THREE.Mesh(sphereGeom, sphereMat2);
    sphere2Ref.current = sphere2;
    scene.add(sphere2);

    const particlesCount = 800; // fixed; reduced-motion handled via animation amplitudes
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      const r = 1.6 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particlesGeom = new THREE.BufferGeometry();
    particlesGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({ size: 0.01, color: BAND_COLORS[stateRef.current.band] });
    materialsRef.current.points = particlesMat;
    const particles = new THREE.Points(particlesGeom, particlesMat);
    particlesRef.current = particles;
    scene.add(particles);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(2, 2, 2);
    scene.add(ambient, dir);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hover = false;

    function onPointerMove(e: PointerEvent) {
      if (!rendererRef.current || !cameraRef.current || !sphereRef.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, cameraRef.current);
      const intersects = raycaster.intersectObject(sphereRef.current);
      hover = intersects.length > 0;
      rendererRef.current.domElement.style.cursor = hover ? "pointer" : "default";
    }

    function onClick(e: MouseEvent) {
      // Use raycaster to detect if click actually hit the sphere
      if (!rendererRef.current || !cameraRef.current || !sphereRef.current) return;
      
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      
      raycaster.setFromCamera(pointer, cameraRef.current);
      const intersects = raycaster.intersectObject(sphereRef.current);
      
      if (intersects.length > 0) {
        onToggle?.();
      }
    }

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("click", onClick);

    let animationId = 0;
    const clock = new THREE.Clock();
    let lastTime = 0;
    function computeTargetCameraZ(currentScale: number) {
      const camera = cameraRef.current!;
      const radius = 1.1 * currentScale;
      const fovRad = THREE.MathUtils.degToRad(camera.fov);
      const minZVert = radius / Math.tan(fovRad / 2);
      const minZHorz = radius / (Math.tan(fovRad / 2) * camera.aspect);
      const margin = 0.4;
      return Math.max(minZVert, minZHorz) + margin;
    }

    const baseScale = 0.5; // global downscale to leave breathing space in viewport
    function animate() {
      const t = clock.getElapsedTime();
      const dt = Math.max(0, t - lastTime);
      lastTime = t;
      const current = stateRef.current;
      const sphere = sphereRef.current!;
      const particles = particlesRef.current!;
      const camera = cameraRef.current!;
      const renderer = rendererRef.current!;
      const bandRange = BAND_RANGES[current.band];
      const freq = THREE.MathUtils.clamp(current.offsetHz, bandRange.min, bandRange.max);
      const mat = materialsRef.current.sphere!;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uFreq.value = current.isPlaying ? freq : 0.2; // slow breathing when stopped
      const baseAmp = 0.003;
      const playAmp = 0.0075;
      mat.uniforms.uAmp.value = (current.isPlaying ? playAmp : baseAmp) * (current.reduceMotion ? 0.5 : 1.0);
      mat.uniforms.uPhase.value = 0.0;

      // Secondary sphere: color and phase offsets driven by binaural offset
      const mat2 = materialsRef.current.sphere2!;
      mat2.uniforms.uTime.value = t;
      mat2.uniforms.uFreq.value = current.isPlaying ? freq : 0.2;
      mat2.uniforms.uAmp.value = ((current.isPlaying ? playAmp : baseAmp) * 0.6) * (current.reduceMotion ? 0.5 : 1.0);
      // phase offset scaled down to be subtle
      const phaseOffset = THREE.MathUtils.degToRad(Math.min(15, current.offsetHz * 0.5));
      mat2.uniforms.uPhase.value = phaseOffset;
      // hue shift based on offset amount (max ~0.05)
      const baseColor = new THREE.Color(BAND_COLORS[current.band]);
      const hsl: { h: number; s: number; l: number } = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);
      const hueShift = Math.min(0.05, current.offsetHz / 40 * 0.05);
      const shifted = new THREE.Color().setHSL((hsl.h + hueShift) % 1, hsl.s, hsl.l);
      mat2.uniforms.uColor.value = shifted;
      // Smooth scale to ~1.3x over ~1s on play, back to 1.0 on pause
      const targetScale = current.isPlaying ? 1.3 : 1.0;
      const k = Math.min(1, dt / 1.0); // ~1s time constant
      scaleRef.current = scaleRef.current + (targetScale - scaleRef.current) * k;
      const visualScale = scaleRef.current * baseScale;
      sphere.scale.setScalar(visualScale);
      if (sphere2Ref.current) {
        sphere2Ref.current.scale.setScalar(visualScale);
      }
      // keep camera centered and at appropriate distance
      const targetZ = computeTargetCameraZ(visualScale);
      camera.position.z += (targetZ - camera.position.z) * Math.min(1, dt * 4);
      camera.lookAt(0, 0, 0);
      sphere.rotation.y += 0.0025;
      const orbitSpeed = current.isPlaying ? 0.0015 : -0.0015;
      particles.rotation.y += orbitSpeed;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    }
    animate();

    // Track previous dimensions to detect actual changes
    let lastWidth = container.clientWidth;
    let lastHeight = container.clientHeight;
    
    // Define resize function that can access all necessary refs
    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;
      
      // Get the actual container dimensions
      const w = container.clientWidth;
      const h = container.clientHeight;
      
      // Check if dimensions actually changed
      if (w === lastWidth && h === lastHeight) {
        return; // No change, skip resize
      }
      
      // Update stored dimensions
      lastWidth = w;
      lastHeight = h;
      
      console.log('SphereViz dimensions changed:', { 
        oldWidth: lastWidth, 
        oldHeight: lastHeight, 
        newWidth: w, 
        newHeight: h 
      });
      
      // Update camera aspect ratio
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      
      // Update renderer size
      rendererRef.current.setSize(w, h, false);
      
      // Ensure camera is perfectly centered and at correct distance
      const targetZ = computeTargetCameraZ(scaleRef.current);
      cameraRef.current.position.z = targetZ;
      cameraRef.current.position.x = 0;
      cameraRef.current.position.y = 0;
      cameraRef.current.lookAt(0, 0, 0);
      
      // Force a render to update immediately
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      
      // Log resize for debugging (remove in production)
      console.log('SphereViz resized:', { width: w, height: h, cameraZ: targetZ });
    };
    
    // Use ResizeObserver for more reliable resize detection
    const resizeObserver = new ResizeObserver((entries) => {
      // Log what ResizeObserver detected
      entries.forEach(entry => {
        console.log('ResizeObserver detected change:', {
          contentRect: entry.contentRect,
          borderBoxSize: entry.borderBoxSize,
          contentBoxSize: entry.contentBoxSize
        });
      });
      
      // Immediate resize for immediate feedback
      handleResize();
      
      // Debounced resize for performance optimization
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    });
    resizeObserver.observe(container);
    
    // Also listen to window resize for compatibility
    let lastViewportHeight = window.innerHeight;
    let lastViewportWidth = window.innerWidth;
    
    const handleWindowResize = () => {
      console.log('Window resize event fired');
      
      const currentHeight = window.innerHeight;
      const currentWidth = window.innerWidth;
      const heightChanged = currentHeight !== lastViewportHeight;
      const widthChanged = currentWidth !== lastViewportWidth;
      
      if (heightChanged) {
        console.log('Viewport height changed:', { old: lastViewportHeight, new: currentHeight });
        lastViewportHeight = currentHeight;
        
        // Force container to update its dimensions
        if (mountRef.current) {
          mountRef.current.style.height = `${currentHeight}px`;
          mountRef.current.style.width = `${currentWidth}px`;
        }
        
        // Force immediate resize for height changes
        handleResize();
      }
      
      if (widthChanged) {
        console.log('Viewport width changed:', { old: lastViewportWidth, new: currentWidth });
        lastViewportWidth = currentWidth;
      }
      
      // Always do immediate resize for any resize event
      handleResize();
      
      // Debounced resize for performance
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };
    
    window.addEventListener("resize", handleWindowResize);
    
    // Handle orientation changes specifically
    window.addEventListener("orientationchange", () => {
      console.log('Orientation change detected');
      // Wait for orientation change to complete, then resize
      setTimeout(handleResize, 300);
    });
    
    // Listen for visual viewport changes (mobile keyboard, etc.)
    let visualViewportListener: (() => void) | null = null;
    if ('visualViewport' in window) {
      const visualViewport = (window as any).visualViewport;
      visualViewportListener = () => {
        console.log('Visual viewport changed:', {
          width: visualViewport.width,
          height: visualViewport.height,
          scale: visualViewport.scale
        });
        
        // Force container update
        if (mountRef.current) {
          mountRef.current.style.height = `${visualViewport.height}px`;
          mountRef.current.style.width = `${visualViewport.width}px`;
        }
        
        // Force resize
        handleResize();
      };
      visualViewport.addEventListener('resize', visualViewportListener);
    }
    
    // Initial resize to ensure perfect centering after container is fully rendered
    setTimeout(handleResize, 100);
    
    let resizeTimeout: number;

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
      window.removeEventListener("orientationchange", handleResize);
      
      // Clean up visual viewport listener
      if (visualViewportListener && 'visualViewport' in window) {
        const visualViewport = (window as any).visualViewport;
        visualViewport.removeEventListener('resize', visualViewportListener);
      }
      
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.dispose();
      particles.geometry.dispose();
      materialsRef.current.points?.dispose();
      sphere.geometry.dispose();
      materialsRef.current.sphere?.dispose();
      if (sphere2Ref.current) {
        sphere2Ref.current.geometry.dispose();
        materialsRef.current.sphere2?.dispose();
        sphere2Ref.current.removeFromParent();
      }
      particles.removeFromParent();
      sphere.removeFromParent();
      // Remove canvas element from container
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update colors when band changes
  useEffect(() => {
    const color = new THREE.Color(BAND_COLORS[band]);
    if (materialsRef.current.sphere) materialsRef.current.sphere.uniforms.uColor.value = color;
    if (materialsRef.current.points) materialsRef.current.points.color = color;
  }, [band]);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full select-none"
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      role="button"
      aria-label="Binaural sphere visualizer. Click to play or stop."
      tabIndex={0}

      onKeyDown={(e) => {
        if (e.code === "Space") onToggle?.();
      }}
    />
  );
}


