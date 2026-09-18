import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * ParticleField
 * A field of "data node" points drifting in 3D space.
 */
function ParticleField({ active, count = 900 }) {
  const pointsRef = useRef(null);
  const rotationSpeed = useRef(0);

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 6 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
      pos[i * 3 + 2] = radius * Math.cos(phi) - 4;
    }
    return [pos];
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const target = active ? 0.02 : 0;
    rotationSpeed.current += (target - rotationSpeed.current) * 0.05;
    pointsRef.current.rotation.y += delta * (0.5 + rotationSpeed.current * 4);
    pointsRef.current.rotation.x = Math.sin(Date.now() * 0.00005) * 0.08;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#2563eb"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/**
 * WireframeCore
 * Multi-layer 3D geometric core (outer wireframe icosahedron, inner octahedron,
 * orbital rings, and central energy nucleus).
 *
 * Interactivity mechanics:
 * 1. Mouse/Cursor Parallax (weightless lerp):
 *    - Normalized window cursor tracking (NDC)
 *    - Fluid lerp interpolation in useFrame for tilt & translation without jumps
 * 2. Scroll-Triggered Motion (GSAP ScrollTrigger):
 *    - Smooth 3D path travel across X, Y, Z depth axes as user scrolls
 *    - Dynamic zoom/scale transitions between sections
 *    - Rotation speed acceleration directly mapped to scroll progress & velocity
 * 3. Seamless Matrix Composition:
 *    - Additive combination of scroll, cursor, idle, and pulse transforms
 */
function WireframeCore({
  active,
  controlsRef,
  scrollTransformRef,
  scrollVelocityRef,
  mouseTargetRef,
}) {
  const groupRef = useRef(null);
  const innerRef = useRef(null);
  const ringRef = useRef(null);
  const nucleusRef = useRef(null);

  // Smooth lerp states for cursor parallax
  const mouseCurrent = useRef({ x: 0, y: 0 });
  const cursorTilt = useRef({ x: 0, y: 0, z: 0 });
  const cursorOffset = useRef({ x: 0, y: 0 });

  // Idle continuous rotationaccumulators
  const idleSpin = useRef({ x: 0, y: 0, z: 0 });
  const pulseScale = useRef(1);
  const velocityBoost = useRef(0);

  // Expose imperative methods to parent (reset & pulse)
  useImperativeHandle(controlsRef, () => ({
    reset: () => {
      mouseTargetRef.current = { x: 0, y: 0 };
      if (groupRef.current) {
        gsap.to(cursorTilt.current, { x: 0, y: 0, z: 0, duration: 1.2, ease: 'power3.out' });
        gsap.to(cursorOffset.current, { x: 0, y: 0, duration: 1.2, ease: 'power3.out' });
      }
    },
    pulse: () => {
      pulseScale.current = 1.45;
    },
  }));

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // -------------------------------------------------------------
    // 1. CURSOR PARALLAX INTERACTIVITY (Weightless Lerp)
    // -------------------------------------------------------------
    const lerpFactor = active ? 1 - Math.exp(-9 * delta) : 0.05;

    mouseCurrent.current.x += (mouseTargetRef.current.x - mouseCurrent.current.x) * lerpFactor;
    mouseCurrent.current.y += (mouseTargetRef.current.y - mouseCurrent.current.y) * lerpFactor;

    // Smooth tilt angles towards cursor position
    cursorTilt.current.x = -mouseCurrent.current.y * 0.45;
    cursorTilt.current.y = mouseCurrent.current.x * 0.65;
    cursorTilt.current.z = mouseCurrent.current.x * mouseCurrent.current.y * 0.2;

    // Subtle translation sway towards cursor
    cursorOffset.current.x = mouseCurrent.current.x * 0.75;
    cursorOffset.current.y = mouseCurrent.current.y * 0.45;

    // -------------------------------------------------------------
    // 2. SCROLL VELOCITY ACCELERATION & IDLE ROTATION
    // -------------------------------------------------------------
    const rawVel = Math.abs(scrollVelocityRef.current || 0);
    // Smoothly decay velocity boost for fluid momentum feeling
    velocityBoost.current += (rawVel * 0.0006 - velocityBoost.current) * 0.1;

    if (active) {
      const baseSpeed = 0.25 + velocityBoost.current * 3.5;
      idleSpin.current.y += delta * baseSpeed;
      idleSpin.current.x += delta * (baseSpeed * 0.4);
      idleSpin.current.z += delta * (baseSpeed * 0.2);
    }

    // Inner element secondary rotations
    if (innerRef.current) {
      innerRef.current.rotation.x -= delta * (0.35 + velocityBoost.current * 4);
      innerRef.current.rotation.z += delta * (0.2 + velocityBoost.current * 2);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (0.15 + velocityBoost.current * 3);
      ringRef.current.rotation.y -= delta * (0.25 + velocityBoost.current * 2);
    }
    if (nucleusRef.current) {
      nucleusRef.current.scale.setScalar(
        0.55 + Math.sin(Date.now() * 0.003) * 0.08 + pulseScale.current * 0.1
      );
    }

    // Pulse decay back to 1.0
    pulseScale.current += (1 - pulseScale.current) * 0.08;

    // -------------------------------------------------------------
    // 3. SEAMLESS MATRIX COMBINATION (Scroll + Cursor + Idle)
    // -------------------------------------------------------------
    const st = scrollTransformRef.current;

    // Additive position: Scroll timeline position + cursor parallax offset
    groupRef.current.position.x = st.x + cursorOffset.current.x;
    groupRef.current.position.y = st.y + cursorOffset.current.y;
    groupRef.current.position.z = st.z;

    // Additive rotation: Scroll rotation progress + cursor tilt + idle spin
    groupRef.current.rotation.x = st.rotX + cursorTilt.current.x + idleSpin.current.x;
    groupRef.current.rotation.y = st.rotY + cursorTilt.current.y + idleSpin.current.y;
    groupRef.current.rotation.z = st.rotZ + cursorTilt.current.z + idleSpin.current.z;

    // Combined scale: Scroll section scale * pulse scale
    const finalScale = Math.max(0.2, st.scale * pulseScale.current);
    groupRef.current.scale.setScalar(finalScale);
  });

  return (
    <group ref={groupRef} position={[2.5, 0.2, -1.5]}>
      {/* Outer Wireframe Icosahedron (Sapphire Blue) */}
      <mesh>
        <icosahedronGeometry args={[1.9, 1]} />
        <meshBasicMaterial color="#1e40af" wireframe transparent opacity={0.5} />
      </mesh>

      {/* Inner Wireframe Octahedron (Indigo / Violet) */}
      <mesh ref={innerRef} scale={0.62}>
        <octahedronGeometry args={[1.9, 0]} />
        <meshBasicMaterial color="#4338ca" wireframe transparent opacity={0.65} />
      </mesh>

      {/* Orbital Wireframe Ring (Vibrant Amber/Orange accent) */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, Math.PI / 6, 0]}>
        <torusGeometry args={[2.7, 0.015, 16, 80]} />
        <meshBasicMaterial color="#d97706" wireframe transparent opacity={0.45} />
      </mesh>

      {/* Glowing Energy Nucleus (Sapphire Core) */}
      <mesh ref={nucleusRef} scale={0.55}>
        <icosahedronGeometry args={[0.8, 0]} />
        <meshBasicMaterial color="#2563eb" transparent opacity={0.7} wireframe={false} />
      </mesh>
    </group>
  );
}

/**
 * CameraRig
 * Smooth camera tilt parallax tracking the mouse to add volumetric depth perception.
 */
function CameraRig({ active, mouseTargetRef }) {
  const { camera } = useThree();
  const current = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    const targetX = active ? mouseTargetRef.current.x * 0.7 : 0;
    const targetY = active ? mouseTargetRef.current.y * 0.4 : 0;
    const lerpFactor = 1 - Math.exp(-8 * delta);

    current.current.x += (targetX - current.current.x) * lerpFactor;
    current.current.y += (targetY - current.current.y) * lerpFactor;

    camera.position.x = current.current.x;
    camera.position.y = current.current.y;
    camera.lookAt(0, 0, -2);
  });

  return null;
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.75} />
      <pointLight position={[10, 10, 10]} intensity={0.9} color="#2563eb" />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#d97706" />
    </>
  );
}

/**
 * Canvas3DBackground
 * Fixed, full-viewport WebGL background with dual Cursor & Scroll mechanics.
 */
const Canvas3DBackground = forwardRef(function Canvas3DBackground(
  { active, enableScrollMapping = true },
  ref
) {
  const controlsRef = useRef(null);

  // Mouse tracking ref (NDC coordinates: -1 to 1)
  const mouseTarget = useRef({ x: 0, y: 0 });

  // Scroll tracking refs
  const scrollVelocity = useRef(0);
  const scrollTransform = useRef({
    x: 2.5,
    y: 0.2,
    z: -1.5,
    scale: 1.0,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
  });

  useImperativeHandle(ref, () => ({
    reset: () => controlsRef.current?.reset(),
    pulse: () => controlsRef.current?.pulse(),
  }));

  // 1. Mouse Tracking Listener with Memory Cleanup
  useEffect(() => {
    const handlePointerMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseTarget.current = { x, y };
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  // 2. GSAP ScrollTrigger Motion & Section Parallax with Memory Cleanup
  useEffect(() => {
    if (!enableScrollMapping) return undefined;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6, // Smooth momentum scrub
          onUpdate: (self) => {
            scrollVelocity.current = self.getVelocity();
          },
        },
      });

      // Keyframed motion path as user scrolls through sections:
      // Hero (0%) -> Services (30%) -> Telematics (60%) -> Network/Stats (85%) -> Footer (100%)
      tl.to(scrollTransform.current, {
        x: -2.2,
        y: -0.3,
        z: 0.4,
        scale: 1.35,
        rotX: Math.PI * 0.9,
        rotY: Math.PI * 1.4,
        rotZ: Math.PI * 0.4,
        ease: 'power1.inOut',
      })
        .to(scrollTransform.current, {
          x: 2.1,
          y: 0.7,
          z: -2.2,
          scale: 0.85,
          rotX: Math.PI * 2.1,
          rotY: Math.PI * 2.8,
          rotZ: -Math.PI * 0.5,
          ease: 'power1.inOut',
        })
        .to(scrollTransform.current, {
          x: 0.0,
          y: -0.4,
          z: 1.1,
          scale: 1.55,
          rotX: Math.PI * 3.4,
          rotY: Math.PI * 4.4,
          rotZ: Math.PI * 1.2,
          ease: 'power1.inOut',
        })
        .to(scrollTransform.current, {
          x: 2.4,
          y: 0.3,
          z: -1.2,
          scale: 1.1,
          rotX: Math.PI * 4.4,
          rotY: Math.PI * 5.6,
          rotZ: Math.PI * 1.8,
          ease: 'power1.inOut',
        });
    });

    return () => {
      ctx.revert(); // Clean up all GSAP ScrollTrigger instances & animations
    };
  }, [enableScrollMapping]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <Canvas
        style={{ pointerEvents: 'none' }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 9], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <SceneLighting />
        <ParticleField active={active} />
        <WireframeCore
          active={active}
          controlsRef={controlsRef}
          scrollTransformRef={scrollTransform}
          scrollVelocityRef={scrollVelocity}
          mouseTargetRef={mouseTarget}
        />
        <CameraRig active={active} mouseTargetRef={mouseTarget} />
        <fog attach="fog" args={['#f8fafc', 8, 22]} />
      </Canvas>
      <div className="absolute inset-0 bg-grid-fade pointer-events-none" />
    </div>
  );
});

export default Canvas3DBackground;
