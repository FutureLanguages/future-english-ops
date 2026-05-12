"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { HelperText } from "@/components/ui/helper-text";

export function SignaturePadField({ name = "signature" }: { name?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signatureRef = useRef("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    function configureContext(context: CanvasRenderingContext2D) {
      context.lineWidth = 2.4;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-text-primary")
        .trim() || "CanvasText";
    }

    function resizeCanvas() {
      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const previousSignature = signatureRef.current;
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      const context = canvas.getContext("2d");
      if (context) {
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        configureContext(context);
        if (previousSignature) {
          const image = new Image();
          image.onload = () => {
            context.drawImage(image, 0, 0, rect.width, rect.height);
          };
          image.src = previousSignature;
        }
      }
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    const point = getPoint(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    setIsDrawing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) {
      return;
    }

    const context = canvasRef.current?.getContext("2d");
    if (!context) {
      return;
    }

    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    event.preventDefault();
  }

  function stopDrawing() {
    const canvas = canvasRef.current;
    setIsDrawing(false);
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      signatureRef.current = dataUrl;
      setSignature(dataUrl);
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    context.clearRect(0, 0, rect.width, rect.height);
    signatureRef.current = "";
    setSignature("");
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-body font-bold text-text-primary">التوقيع</label>
        <Button
          type="button"
          onClick={clearSignature}
          variant="secondary"
          size="sm"
        >
          مسح التوقيع
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width={720}
        height={220}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        className="h-44 w-full touch-none rounded-input border border-border-subtle bg-bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
      />
      <input type="hidden" name={name} value={signature} required />
      <HelperText>ارسم توقيعك داخل المساحة أعلاه باستخدام الماوس أو اللمس.</HelperText>
    </div>
  );
}
