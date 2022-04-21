import React, { useEffect, useRef, useState } from "react";
import { layoutBox } from "./App";
import * as THREE from "three";
import { MeshBasicMaterial } from "three";
import Button from "./Button";
import { UseWheelZoom, UsePointerPan } from "./PointerUtils";
import { v4 as uuidv4 } from "uuid";
import { imageScaler } from "./Constants";

const cellSize = 16;

const DstBlock = ({
  camera,
  box,
  scene,
  setDstInfo,
  dstCanvasRef,
  swapInfo,
  dstCanvasTextureRef,
  dstPlaneRef,
  setDstId,
  dstInfo,
  activeRef,
  pasteSrc,
  srcInfo,
  srcId,
  dstId,
}: {
  camera: THREE.PerspectiveCamera;
  box: layoutBox;
  scene: THREE.Scene;
  setDstInfo: any;
  dstCanvasRef: any;
  swapInfo: any;
  dstCanvasTextureRef: any;
  dstPlaneRef: any;
  setDstId: any;
  dstInfo: any;
  activeRef: any;
  pasteSrc: string | null;
  srcInfo: any;
  srcId: string | null;
  dstId: string | null;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const smallCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const extraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sizeReadout, setSizeReadout] = useState("");

  useEffect(() => {
    camera.position.z = 0;

    const canvas = dstCanvasRef.current || document.createElement("canvas");
    dstCanvasRef.current = canvas;
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const canvasTexture = new THREE.CanvasTexture(canvas);
    dstCanvasTextureRef.current = canvasTexture;

    const geometry = new THREE.PlaneGeometry(6, 6);
    const material = new THREE.MeshBasicMaterial({ map: canvasTexture });
    const plane = new THREE.Mesh(geometry, material);
    dstPlaneRef.current = plane;
    scene.add(plane);

    camera.position.z = 8;
  }, []);

  useEffect(() => {
    if (pasteSrc) {
      loadImage(pasteSrc);
    }
  }, [pasteSrc]);

  const counterRef = useRef(0);
  const loadImage = (src: string) => {
    counterRef.current++;
    const image = new Image();
    const id = uuidv4();
    setDstId(id);
    image.onload = () => {
      const counter = counterRef.current;
      const cols = Math.round(image.width / cellSize);
      const rows = Math.round(image.height / cellSize);
      const width = cols * cellSize;
      const height = rows * cellSize;
      setSizeReadout(`${width}x${height}`);

      const plane = dstPlaneRef.current!;
      plane.scale.x = image.width / imageScaler;
      plane.scale.y = image.height / imageScaler;

      const extraCanvas =
        extraCanvasRef.current || document.createElement("canvas");
      extraCanvasRef.current = extraCanvas;
      extraCanvas.width = width;
      extraCanvas.height = height;
      const etx = extraCanvas.getContext("2d")!;
      etx.drawImage(image, 0, 0, extraCanvas.width, extraCanvas.height);

      const lookups: any[] = [];
      const smallCanvas =
        smallCanvasRef.current || document.createElement("canvas");
      smallCanvas.width = cols * 2;
      smallCanvas.height = rows * 2;
      const stx = smallCanvas.getContext("2d")!;
      stx.drawImage(image, 0, 0, smallCanvas.width, smallCanvas.height);

      const canvas = dstCanvasRef.current!;
      canvas.width = width;
      canvas.height = height;
      dstCanvasTextureRef.current! = new THREE.CanvasTexture(canvas);
      (plane.material as MeshBasicMaterial).map = dstCanvasTextureRef.current!;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cells = Array(cols * rows)
        .fill(0)
        .map((_, i) => i);
      const batchSize = 16;
      const drawCell = () => {
        for (let b = 0; b < batchSize; b++) {
          const i = cells.shift();
          if (i !== undefined) {
            const c = i % cols;
            const r = Math.floor(i / cols);

            const data = stx.getImageData(c * 2, r * 2, 2, 2).data;
            let quad = [];
            for (let j = 0; j < 4 * 4; j += 4) {
              const pixel = [data[j], data[j + 1], data[j + 2]];
              quad.push(pixel);
            }
            lookups.push(quad);

            ctx.drawImage(
              image,
              c * cellSize,
              r * cellSize,
              cellSize,
              cellSize,
              c * cellSize,
              r * cellSize,
              cellSize,
              cellSize
            );
            dstCanvasTextureRef.current!.needsUpdate = true;
            if (cells.length === 0) {
              setDstInfo({ id, cols, rows, lookups });
            }
          }
          if (b === batchSize - 1 && counterRef.current === counter) {
            setTimeout(() => {
              drawCell();
            }, 0);
          }
        }
      };
      drawCell();
    };
    image.src = src;
  };

  useEffect(() => {
    loadImage("/computers.jpg?=1");
  }, []);

  useEffect(() => {
    async function handleChange(this: any) {
      for (let item of this.files) {
        if (item.type.indexOf("image") < 0) {
          continue;
        }
        let src = URL.createObjectURL(item);
        loadImage(src);
      }
    }
    inputRef.current!.addEventListener("change", handleChange);
    return () => {
      inputRef.current!.removeEventListener("change", handleChange);
    };
  });

  useEffect(() => {
    if (dstInfo) {
      setSizeReadout(`${dstInfo.cols * cellSize}x${dstInfo.rows * cellSize}`);
    }
  }, [dstInfo]);

  const elementRef = useRef<HTMLDivElement | null>(null);
  UseWheelZoom(elementRef, camera);
  UsePointerPan(elementRef, camera);

  return (
    <div
      ref={elementRef}
      className="portion"
      style={{
        position: "absolute",
        bottom: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
        color: "#ddd",
        outline: "1px solid #3333",
        zIndex: 1,
      }}
      onPointerDown={() => (activeRef.current = 2)}
    >
      <div
        style={{
          padding: "12px 8px",
        }}
      >
        DST
      </div>
      <input
        type="file"
        ref={inputRef}
        accept=".jpg,.png,.jpeg"
        style={{ display: "none" }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          display: "flex",
          justifyContent: "end",
          alignItems: "center",
          padding: 16,
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 16,
        }}
      >
        <div className="readout">{sizeReadout}</div>
        <div style={{ display: "flex", gap: 16 }}>
          {srcInfo &&
          srcInfo.id === srcId &&
          dstInfo &&
          dstInfo.id === dstId ? (
            <Button
              text="↕"
              title="Swap src and dst"
              style={{
                transformOrigin: "center center",
                transform: "rotate(90deg)",
              }}
              onClick={() => {
                swapInfo();
              }}
            />
          ) : null}
          <Button
            text="↑"
            title="Upload image"
            onClick={() => {
              const input = inputRef.current!;
              input.dispatchEvent(
                new MouseEvent("click", {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                })
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DstBlock;
