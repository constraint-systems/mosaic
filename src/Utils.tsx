import { useEffect } from "react";

export const useLayout = (srcBoxRef: any, dstBoxRef: any, mscBoxRef: any) => {
  useEffect(() => {
    const srcBox = srcBoxRef.current!;
    const dstBox = dstBoxRef.current!;
    const mscBox = mscBoxRef.current!;

    const runLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width > height) {
        srcBox.style.left = `${0}px`;
        srcBox.style.top = `${0}px`;
        srcBox.style.width = `${width / 2}px`;
        srcBox.style.height = `${height / 2}px`;

        dstBox.style.left = `${0}px`;
        dstBox.style.top = `${height / 2}px`;
        dstBox.style.width = `${width / 2}px`;
        dstBox.style.height = `${height / 2}px`;

        mscBox.style.left = `${width / 2}px`;
        mscBox.style.top = `${0}px`;
        mscBox.style.width = `${width / 2}px`;
        mscBox.style.height = `${height}px`;
      } else {
        srcBox.style.left = `${0}px`;
        srcBox.style.top = `${0}px`;
        srcBox.style.width = `${width / 2}px`;
        srcBox.style.height = `${height / 2}px`;

        dstBox.style.left = `${width / 2}px`;
        dstBox.style.top = `${0}px`;
        dstBox.style.width = `${width / 2}px`;
        dstBox.style.height = `${height / 2}px`;

        mscBox.style.left = `${0}px`;
        mscBox.style.top = `${height / 2}px`;
        mscBox.style.width = `${width}px`;
        mscBox.style.height = `${height / 2}px`;
      }
    };
    runLayout();
    window.addEventListener("resize", runLayout);
    return () => window.removeEventListener("resize", runLayout);
  }, []);
};
