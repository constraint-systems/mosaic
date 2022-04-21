import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import SrcBlock from "./SrcBlock";
import DstBlock from "./DstBlock";
import MscBlock from "./MscBlock";
import Button from "./Button";
import { CanvasTexture, MeshBasicMaterial } from "three";
import { imageScaler } from "./Constants";

export type layoutBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type srcInfoType = {
  id: string;
  width: number;
  height: number;
  lookups: any[];
};

export type dstInfoType = {
  id: string;
  width: number;
  height: number;
  lookups: any[];
};

function App() {
  const [loaded, setLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<layoutBox[]>([]);
  const [layouts, setLayouts] = useState<layoutBox[]>([]);
  const [srcInfo, setSrcInfo] = useState<srcInfoType | null>(null);
  const [dstInfo, setDstInfo] = useState<dstInfoType | null>(null);
  const [srcId, setSrcId] = useState<string | null>(null);
  const [dstId, setDstId] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const srcCanvasRef = useRef<HTMLCanvasElement>(null);
  const dstCanvasRef = useRef<HTMLCanvasElement>(null);
  const scenesRef = useRef<THREE.Scene[]>([]);
  const camerasRef = useRef<THREE.PerspectiveCamera[]>([]);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const srcCanvasTextureRef = useRef<CanvasTexture | null>(null);
  const dstCanvasTextureRef = useRef<CanvasTexture | null>(null);
  const srcPlaneRef = useRef<THREE.Mesh | null>(null);
  const dstPlaneRef = useRef<THREE.Mesh | null>(null);
  const holdCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef<number>(0);
  const [srcPasteSrc, setSrcPasteSrc] = useState<string | null>(null);
  const [dstPasteSrc, setDstPasteSrc] = useState<string | null>(null);
  const pressedRef = useRef<string[]>([]);

  const setLayout = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width > height) {
      layoutRef.current = [
        {
          left: 0,
          top: height / 2,
          width: width / 2,
          height: height / 2,
        },
        {
          left: 0,
          top: 0,
          width: width / 2,
          height: height / 2,
        },
        {
          left: width / 2,
          top: 0,
          width: width / 2,
          height: height,
        },
      ];
    } else {
      layoutRef.current = [
        {
          left: 0,
          top: height / 2,
          width: width / 2,
          height: height / 2,
        },
        {
          left: width / 2,
          top: height / 2,
          width: width / 2,
          height: height / 2,
        },
        {
          left: 0,
          top: 0,
          width: width,
          height: height / 2,
        },
      ];
    }
    console.log("set layout");
  };
  setLayout();

  const srcInfoRef = useRef<srcInfoType | null>(srcInfo);
  const dstInfoRef = useRef<dstInfoType | null>(dstInfo);
  useEffect(() => {
    srcInfoRef.current = srcInfo;
    dstInfoRef.current = dstInfo;
  }, [srcInfo, dstInfo]);
  const swapInfo = () => {
    const srcCanvas = srcCanvasRef.current!;
    const dstCanvas = dstCanvasRef.current!;

    // Hold src
    holdCanvasRef.current =
      holdCanvasRef.current || document.createElement("canvas");
    const holdCanvas = holdCanvasRef.current!;
    holdCanvas.width = srcCanvas.width;
    holdCanvas.height = srcCanvas.height;
    const htx = holdCanvas.getContext("2d")!;
    htx.drawImage(srcCanvas, 0, 0);
    const holdInfo = JSON.parse(JSON.stringify(srcInfoRef.current));

    // Set new src
    srcCanvas.width = dstCanvas.width;
    srcCanvas.height = dstCanvas.height;
    const stx = srcCanvas.getContext("2d")!;
    stx.drawImage(dstCanvas, 0, 0);
    srcCanvasTextureRef.current = new CanvasTexture(srcCanvas);
    (srcPlaneRef.current!.material as MeshBasicMaterial).map =
      srcCanvasTextureRef.current;
    const srcPlane = srcPlaneRef.current!;
    srcPlane.scale.x = srcCanvas.width / imageScaler;
    srcPlane.scale.y = srcCanvas.height / imageScaler;
    setSrcId(dstInfoRef.current!.id);
    setSrcInfo(dstInfoRef.current);

    // Set new dst
    dstCanvas.width = holdCanvas.width;
    dstCanvas.height = holdCanvas.height;
    const dtx = dstCanvas.getContext("2d")!;
    dtx.drawImage(holdCanvas, 0, 0);
    dstCanvasTextureRef.current = new CanvasTexture(dstCanvas);
    (dstPlaneRef.current!.material as MeshBasicMaterial).map =
      dstCanvasTextureRef.current;
    const dstPlane = dstPlaneRef.current!;
    dstPlane.scale.x = dstCanvas.width / imageScaler;
    dstPlane.scale.y = dstCanvas.height / imageScaler;
    setDstId(holdInfo.id);
    setDstInfo(holdInfo);
  };

  useEffect(() => {
    const [srcBox, dstBox, mscBox] = layoutRef.current!;

    const cameraSrc = new THREE.PerspectiveCamera(
      75,
      srcBox.width / srcBox.height,
      0.1,
      1000
    );
    const cameraDst = new THREE.PerspectiveCamera(
      75,
      dstBox.width / dstBox.height,
      0.1,
      1000
    );
    const cameraMsc = new THREE.PerspectiveCamera(
      75,
      mscBox.width / mscBox.height,
      0.1,
      1000
    );
    camerasRef.current = [cameraSrc, cameraDst, cameraMsc];

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current!,
    });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const sceneSrc = new THREE.Scene();
    const sceneDst = new THREE.Scene();
    const sceneMsc = new THREE.Scene();
    scenesRef.current = [sceneSrc, sceneDst, sceneMsc];

    {
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x000000 });

      const plane = new THREE.Mesh(geometry, material);
      sceneDst.add(plane);
    }
    {
      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const plane = new THREE.Mesh(geometry, material);
      sceneMsc.add(plane);
    }

    cameraSrc.position.z = 5;
    cameraDst.position.z = 5;
    cameraMsc.position.z = 5;

    renderer.autoClear = false;

    setLoaded(true);
  }, []);

  useEffect(() => {
    const animate = () => {
      const renderer = rendererRef.current!;
      renderer.clear();

      const [srcBox, dstBox, mscBox] = layoutRef.current!;
      const [cameraSrc, cameraDst, cameraMsc] = camerasRef.current!;
      const [sceneSrc, sceneDst, sceneMsc] = scenesRef.current!;
      {
        const { left, top, width, height } = srcBox;
        renderer.setScissor(left, top, width, height);
        renderer.setViewport(left, top, width, height);
        renderer.render(sceneSrc, cameraSrc);
      }
      {
        const { left, top, width, height } = dstBox;
        renderer.setScissor(left, top, width, height);
        renderer.setViewport(left, top, width, height);
        renderer.render(sceneDst, cameraDst);
      }
      {
        const { left, top, width, height } = mscBox;
        renderer.setScissor(left, top, width, height);
        renderer.setViewport(left, top, width, height);
        renderer.render(sceneMsc, cameraMsc);
      }
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setLayout();
      const layoutBoxes = layoutRef.current!;
      for (let i = 0; i < layoutBoxes.length; i++) {
        const box = layoutBoxes[i];
        const camera = camerasRef.current![i];
        camera.aspect = box.width / box.height;
        camera.updateProjectionMatrix();
      }
      rendererRef.current!.setSize(window.innerWidth, window.innerHeight);
      setLayouts(layoutBoxes);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (layoutRef.current) {
        let counter = 0;
        for (const box of layoutRef.current) {
          const x = e.clientX;
          const y = window.innerHeight - e.clientY;
          if (
            x >= box.left &&
            x <= box.left + box.width &&
            y >= box.top &&
            y <= box.top + box.height
          ) {
            activeRef.current = counter;
            break;
          }
          counter++;
        }
      }
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useEffect(() => {
    const onPaste = (e: any) => {
      const ref = activeRef;
      e.preventDefault();
      e.stopPropagation();
      for (const item of e.clipboardData.items) {
        if (item.type.indexOf("image") < 0) {
          continue;
        }
        let file = item.getAsFile();
        let src = URL.createObjectURL(file);
        if (ref.current === 0) {
          setSrcPasteSrc(src);
        } else if (ref.current === 1) {
          setDstPasteSrc(src);
        } else {
          alert("Choose the SRC or DST block to paste to");
        }
      }
    };

    const onDrop = (e: any) => {
      const ref = activeRef;
      e.preventDefault();
      e.stopPropagation();
      let file = e.dataTransfer.files[0];
      let src = URL.createObjectURL(file);
      if (ref.current === 0) {
        setSrcPasteSrc(src);
      } else if (ref.current === 1) {
        setDstPasteSrc(src);
      } else {
        alert("Drag to the SRC or DST block");
      }
    };

    const onDrag = (e: any) => {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    };

    window.addEventListener("paste", onPaste);
    window.addEventListener("dragover", onDrag);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("dragover", onDrag);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  // keyboard handler
  useEffect(() => {
    const pressed = pressedRef.current;

    const discretePanCamera = (diff: Array<number>) => {
      const camera = camerasRef.current![activeRef.current!];
      const visibleHeight =
        2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      const zoomPixel = visibleHeight / window.innerHeight;
      camera.position.x -= 16 * diff[0] * zoomPixel;
      camera.position.y += 16 * diff[1] * zoomPixel;
    };

    const discreteZoom = (change: number) => {
      const camera = camerasRef.current![activeRef.current!];
      const percent = (window.innerHeight - change) / window.innerHeight;
      camera.position.z = Math.min(
        32,
        Math.max(1, camera.position.z / percent)
      );
    };

    const downHandler = (e: KeyboardEvent) => {
      let press = e.key.toLowerCase();
      if (press === "escape") {
        setShowAbout(false);
      }
      if (press === "-") {
        discreteZoom(32 * 2);
      } else if (press === "+" || press === "=") {
        discreteZoom(-32 * 2);
      }
      if (!pressed.includes(press)) {
        pressed.push(press);
      }
      if (pressed.includes("arrowleft") || pressed.includes("h")) {
        discretePanCamera([1 * 2, 0]);
      }
      if (pressed.includes("arrowright") || pressed.includes("l")) {
        discretePanCamera([-1 * 2, 0]);
      }
      if (pressed.includes("arrowup") || pressed.includes("k")) {
        if (e.shiftKey) {
          discreteZoom(32 * 2);
        } else {
          discretePanCamera([0, 1 * 2]);
        }
      }
      if (pressed.includes("arrowdown") || pressed.includes("j")) {
        if (e.shiftKey) {
          discreteZoom(-32 * 2);
        } else {
          discretePanCamera([0, -1 * 2]);
        }
      }
    };

    const upHandler = (e: KeyboardEvent) => {
      let press = e.key.toLowerCase();
      const index = pressed.indexOf(press);
      if (index !== -1) {
        pressed.splice(index, 1);
      }
    };

    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, []);

  return (
    <>
      {loaded ? (
        <>
          {layouts[0] ? (
            <SrcBlock
              scene={scenesRef.current[0]}
              camera={camerasRef.current[0]}
              box={layouts[0]}
              setSrcInfo={setSrcInfo}
              srcCanvasRef={srcCanvasRef}
              srcCanvasTextureRef={srcCanvasTextureRef}
              srcPlaneRef={srcPlaneRef}
              setSrcId={setSrcId}
              srcInfo={srcInfo}
              activeRef={activeRef}
              pasteSrc={srcPasteSrc}
            />
          ) : null}
          {layouts[1] ? (
            <DstBlock
              scene={scenesRef.current[1]}
              camera={camerasRef.current[1]}
              box={layouts[1]}
              setDstInfo={setDstInfo}
              dstCanvasRef={dstCanvasRef}
              swapInfo={swapInfo}
              dstCanvasTextureRef={dstCanvasTextureRef}
              dstPlaneRef={dstPlaneRef}
              setDstId={setDstId}
              dstInfo={dstInfo}
              srcInfo={srcInfo}
              srcId={srcId}
              dstId={dstId}
              activeRef={activeRef}
              pasteSrc={dstPasteSrc}
            />
          ) : null}
          {layouts[1] ? (
            <MscBlock
              scene={scenesRef.current[2]}
              camera={camerasRef.current[2]}
              box={layouts[2]}
              srcId={srcId}
              dstId={dstId}
              srcInfo={srcInfo}
              dstInfo={dstInfo}
              srcCanvasRef={srcCanvasRef}
              activeRef={activeRef}
            />
          ) : null}
        </>
      ) : null}
      <canvas ref={canvasRef} />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          padding: 16,
          justifyContent: "end",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <Button text="About" onClick={() => setShowAbout(!showAbout)} />
      </div>
      <div
        style={{
          display: showAbout ? "flex" : "none",
          position: "fixed",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 3,
        }}
        onClick={() => setShowAbout(false)}
      >
        <div
          style={{
            background: "#222",
            maxWidth: 440,
            width: "100%",
            fontSize: "16px",
            lineHeight: "24px",
            color: "#ddd",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "16px 16px",
              borderBottom: "1px solid #444",
              position: "relative",
            }}
          >
            <div>About</div>
            <div
              role="button"
              style={{
                padding: 16,
                position: "absolute",
                right: 0,
                top: 0,
                cursor: "pointer",
              }}
              onClick={() => setShowAbout(false)}
            >
              X
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 16 }}>
              Recreate one image using the tiles from another image.
            </div>
            <div style={{ marginBottom: 16 }}>
              from{" "}
              <a href="https://constraint.systems/" rel="noreferrer" target="_blank">
                Constraint Systems
              </a>
            </div>
            <div>
              <a rel="noreferrer"
                href="https://github.com/constraint-systems/mosaic"
                target="_blank"
              >
                View source
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
