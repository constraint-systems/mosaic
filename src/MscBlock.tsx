import React, { useEffect, useRef, useState } from "react";
import { layoutBox } from "./App";
import * as THREE from "three";
import { CanvasTexture, MeshBasicMaterial } from "three";
import Button from "./Button";
import { UseWheelZoom, UsePointerPan } from "./PointerUtils";
import { imageScaler } from "./Constants";

const cellSize = 16;

const MscBlock = ({
  camera,
  box,
  scene,
  srcInfo,
  dstInfo,
  srcCanvasRef,
  dstId,
  srcId,
  activeRef,
}: {
  camera: THREE.PerspectiveCamera;
  box: layoutBox;
  scene: THREE.Scene;
  srcCanvasRef: React.RefObject<HTMLCanvasElement>;
  srcInfo: any;
  dstInfo: any;
  dstId: string | null;
  srcId: string | null;
  activeRef: any;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const planeRef = useRef<THREE.Mesh | null>(null);
  const [sizeReadout, setSizeReadout] = useState("");

  useEffect(() => {
    camera.position.z = 0;

    const canvas = canvasRef.current || document.createElement("canvas");
    canvasRef.current = canvas;
    canvas.width = 64;
    canvas.height = 64;

    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTextureRef.current = canvasTexture;

    const geometry = new THREE.PlaneGeometry(6, 6);
    const material = new THREE.MeshBasicMaterial({ map: canvasTexture });
    const plane = new THREE.Mesh(geometry, material);
    planeRef.current = plane;
    scene.add(plane);
    camera.position.z = 5;
  }, []);

  const counterRef = useRef(0);
  useEffect(() => {
    console.log("fire");
    console.log(srcInfo, dstInfo);
    if (srcInfo && dstInfo) {
      counterRef.current++;
      console.log("regen");
      const width = dstInfo.cols * cellSize;
      const height = dstInfo.rows * cellSize;
      setSizeReadout(`${width}x${height}`);

      const plane = planeRef.current!;
      plane.scale.x = width / imageScaler;
      plane.scale.y = height / imageScaler;

      const canvas = canvasRef.current!;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, width, height);
      (planeRef.current!.material as MeshBasicMaterial).map = new CanvasTexture(
        canvas
      );
      (planeRef.current!.material as MeshBasicMaterial).needsUpdate = true;

      const cells = Array(dstInfo.cols * dstInfo.rows)
        .fill(0)
        .map((_, i) => i);

      const counter = counterRef.current;
      const batchSize = 8;
      const drawCell = () => {
        if (
          counterRef.current === counter &&
          srcId === srcInfo.id &&
          dstId === dstInfo.id
        ) {
          for (let b = 0; b < batchSize; b++) {
            const i = cells.shift();
            if (i !== undefined) {
              const c = i % dstInfo.cols;
              const r = Math.floor(i / dstInfo.cols);
              let min = Infinity;
              let minIndex = -1;
              const dstLookup = dstInfo.lookups[i];
              for (let j = 0; j < srcInfo.cols * srcInfo.rows; j++) {
                const srcLookup = srcInfo.lookups[j];
                let fullSum = 0;
                for (let k = 0; k < 4; k++) {
                  const lookupPixel = srcLookup[k];
                  const pixel = dstLookup[k];
                  // @ts-ignore
                  const diff = pixel.map((v, l) =>
                    Math.abs(v - lookupPixel[l])
                  );
                  const sum = diff.reduce((a: number, b: number) => a + b, 0);
                  fullSum += sum;
                }
                if (fullSum < min) {
                  min = fullSum;
                  minIndex = j;
                }
              }

              const sc = minIndex % srcInfo.cols;
              const sr = Math.floor(minIndex / srcInfo.cols);
              ctx.drawImage(
                srcCanvasRef.current!,
                sc * cellSize,
                sr * cellSize,
                cellSize,
                cellSize,
                c * cellSize,
                r * cellSize,
                cellSize,
                cellSize
              );
              (
                planeRef.current!.material as MeshBasicMaterial
              ).map!.needsUpdate = true;
              if (cells.length === 0) {
                console.log("done");
              }
            }
            if (b === batchSize - 1) {
              setTimeout(() => {
                drawCell();
              }, 0);
            }
          }
        }
      };
      drawCell();
    }
  }, [srcInfo, dstInfo, srcId, dstId]);

  const elementRef = useRef<HTMLDivElement | null>(null);
  UseWheelZoom(elementRef, camera);
  UsePointerPan(elementRef, camera);

  return (
    <div
      ref={elementRef}
      className="portion"
      onPointerDown={() => (activeRef.current = 2)}
      style={{
        position: "absolute",
        bottom: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
        color: "#ddd",
      }}
    >
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
        <Button
          text="↓"
          title="Download image"
          onClick={() => {
            canvasRef.current!.toBlob(async (blob) => {
              const imageURL = URL.createObjectURL(blob!);
              let link = document.createElement("a");
              link.setAttribute(
                "download",
                "mosaic-" + Math.round(new Date().getTime() / 1000) + ".png"
              );
              link.setAttribute("href", imageURL);
              link.dispatchEvent(
                new MouseEvent(`click`, {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                })
              );
            });
          }}
        />
      </div>
    </div>
  );
};

export default MscBlock;
