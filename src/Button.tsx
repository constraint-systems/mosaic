import React, { useEffect, useRef, useState } from "react";

const Button = ({
  text,
  style,
  onClick,
  title,
}: {
  text: string;
  style?: any;
  onClick?: any;
  title?: string;
}) => {
  const buttonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      e.stopPropagation();
    };
    buttonRef.current!.addEventListener("pointerdown", handlePointerDown);
    return () => {
      buttonRef.current!.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      e.stopPropagation();
      onClick(e);
    };
    buttonRef.current!.addEventListener("click", handlePointerDown);
    return () => {
      buttonRef.current!.removeEventListener("click", handlePointerDown);
    };
  }, []);

  return (
    <div
      ref={buttonRef}
      role="button"
      title={title}
      style={{
        ...style,
        height: 32,
        lineHeight: "32px",
        minWidth: 32,
        padding: "0 8px",
        textAlign: "center",
        pointerEvents: "auto",
      }}
      className="button"
    >
      {text}
    </div>
  );
};

export default Button;
