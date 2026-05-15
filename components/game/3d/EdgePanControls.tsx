"use client";

import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";


// Edge-pan à la Civ / RTS : quand la souris s'approche d'un bord de la
// fenêtre, on translate la cible des OrbitControls (et la caméra en parallèle,
// pour conserver l'orbite) dans la direction du bord. Le pan se fait dans le
// plan XZ, en cohérence avec l'axe « forward » de la caméra projeté à plat.

const EDGE_THRESHOLD_PX = 90;
const NAVBAR_OFFSET_PX = 48;
const PAN_SPEED = 38;
const MAX_TARGET_DIST = 120; // dépasse les bords de la map procédurale (~100u half)
// Le pan est désactivé si la souris survole un overlay UI marqué de
// l'attribut [data-no-edge-pan]. La barre supérieure, l'ActionPanel, les
// modales le portent.
const UI_OVERLAY_SELECTOR = "[data-no-edge-pan]";

type PannableControls = {
  target: Vector3;
  update: () => void;
};

export function EdgePanControls() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as PannableControls | null;
  const size = useThree((s) => s.size);
  const mouse = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      // Désactive l'edge-pan quand le curseur survole un overlay UI : le
      // joueur ne veut pas que la caméra pane quand il vise la TopBar ou
      // un panneau. On regarde toute la chaîne d'ancêtres.
      const target = e.target as Element | null;
      const onUi = target?.closest(UI_OVERLAY_SELECTOR) !== null && target !== null;
      mouse.current.active = !onUi;
    };
    const onLeave = () => {
      mouse.current.active = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useFrame((_, delta) => {
    if (!controls || !mouse.current.active) return;

    const { x, y } = mouse.current;
    const { width, height } = size;
    let px = 0;
    let py = 0;
    if (x < EDGE_THRESHOLD_PX) px = -(1 - x / EDGE_THRESHOLD_PX);
    else if (x > width - EDGE_THRESHOLD_PX) {
      px = (x - (width - EDGE_THRESHOLD_PX)) / EDGE_THRESHOLD_PX;
    }
    // Le trigger top démarre juste en dessous de la navbar (qui couvre
    // 0..NAVBAR_OFFSET_PX), pour qu'on ait une vraie marge de pan vers
    // le nord sans devoir survoler la navbar (et donc désactiver l'edge-pan).
    if (y >= NAVBAR_OFFSET_PX && y < NAVBAR_OFFSET_PX + EDGE_THRESHOLD_PX) {
      py = -(1 - (y - NAVBAR_OFFSET_PX) / EDGE_THRESHOLD_PX);
    } else if (y > height - EDGE_THRESHOLD_PX) {
      py = (y - (height - EDGE_THRESHOLD_PX)) / EDGE_THRESHOLD_PX;
    }
    if (px === 0 && py === 0) return;

    // Axes de pan dans le plan XZ, dérivés de la caméra projetée à plat.
    const forward = new Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) return;
    forward.normalize();
    const right = new Vector3().crossVectors(forward, UP).normalize();

    const amount = PAN_SPEED * delta;
    const move = new Vector3()
      .addScaledVector(right, px * amount)
      .addScaledVector(forward, -py * amount);

    const nextTarget = controls.target.clone().add(move);
    const flatDist = Math.hypot(nextTarget.x, nextTarget.z);
    if (flatDist > MAX_TARGET_DIST) {
      const k = MAX_TARGET_DIST / flatDist;
      nextTarget.x *= k;
      nextTarget.z *= k;
    }

    const delta3 = nextTarget.clone().sub(controls.target);
    camera.position.add(delta3);
    controls.target.copy(nextTarget);
    controls.update();
  });

  return null;
}

const UP = new Vector3(0, 1, 0);
