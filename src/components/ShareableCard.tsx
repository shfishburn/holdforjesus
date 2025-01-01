import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { FaithConfig } from "@/lib/faiths";

interface ShareableCardProps {
  response: string;
  faith: FaithConfig;
  ticketId: string;
  currentDepartment: string;
}

const CARD_W = 1080;
const CARD_H = 1350;

const FAITH_GRADIENTS: Record<string, [string, string]> = {
  christian: ["#1e3a5f", "#0d1b2a"],
  catholic: ["#4a1942", "#1a0a1a"],
  jewish: ["#1a3a2a", "#0a1a10"],
  muslim: ["#1a2a4a", "#0a1020"],
  buddhist: ["#3a2a1a", "#1a1008"],
  hindu: ["#4a1a0a", "#1a0a04"],
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  _lineHeight: number,
): string[] {
  const lines: string[] = [];
  const paragraphs = text.split("\n");
  for (const para of paragraphs) {
    const words = para.split(" ");
    let currentLine = "";
    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);
    else lines.push("");
  }
  return lines;
}

function drawCard(canvas: HTMLCanvasElement, props: ShareableCardProps) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = CARD_W;
  canvas.height = CARD_H;

  const [c1, c2] = FAITH_GRADIENTS[props.faith.id] || ["#1a1a2e", "#0a0a14"];
  const grad = ctx.createLinearGradient(0, 0, 0, CARD_H);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Subtle decorative circle
  ctx.beginPath();
  ctx.arc(CARD_W * 0.8, CARD_H * 0.15, 200, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fill();

  const pad = 80;

  // Faith emoji + hotline name
  ctx.font = "48px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "center";
  ctx.fillText(`${props.faith.emoji} ${props.faith.hotlineName}`, CARD_W / 2, 120);

  // Ticket ID + department
  const dept = props.faith.departments.find((d) => d.id === props.currentDepartment);
  ctx.font = "28px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(
    `${props.ticketId}  •  ${dept?.emoji || ""} ${dept?.label || props.currentDepartment}`,
    CARD_W / 2,
    180,
  );

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, 220);
  ctx.lineTo(CARD_W - pad, 220);
  ctx.stroke();

  // Response text
  ctx.font = "36px Georgia, serif";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.textAlign = "left";
  const maxTextWidth = CARD_W - pad * 2;
  const lineHeight = 52;
  const maxLines = Math.floor((CARD_H - 220 - 200) / lineHeight);
  let lines = wrapText(ctx, props.response, maxTextWidth, lineHeight);
  let _truncated = false;
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/\s+\S*$/, "")}…`;
    _truncated = true;
  }

  let y = 280;
  for (const line of lines) {
    ctx.fillText(line, pad, y);
    y += lineHeight;
  }

  // Footer divider
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.moveTo(pad, CARD_H - 140);
  ctx.lineTo(CARD_W - pad, CARD_H - 140);
  ctx.stroke();

  // Footer
  ctx.font = "26px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.textAlign = "center";
  ctx.fillText(props.faith.phoneNumber, CARD_W / 2, CARD_H - 90);
  ctx.font = "22px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("holdforjesus.com", CARD_W / 2, CARD_H - 50);
}

const ShareableCard = (props: ShareableCardProps) => {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const render = useCallback(() => {
    if (canvasRef.current) drawCard(canvasRef.current, props);
  }, [props]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(render);
    }
  }, [open, render]);

  const getBlob = (): Promise<Blob | null> =>
    new Promise((resolve) => {
      if (!canvasRef.current) return resolve(null);
      canvasRef.current.toBlob((b) => resolve(b), "image/png");
    });

  const handleDownload = async () => {
    const blob = await getBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prayer-${props.ticketId}.png`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "📥 Downloaded!", description: "Prayer card saved." });
  };

  const handleShare = async () => {
    const blob = await getBlob();
    if (!blob) return;
    const file = new File([blob], `prayer-${props.ticketId}.png`, { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: props.faith.hotlineName });
      } else {
        await handleDownload();
      }
    } catch {
      // cancelled
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          🖼️ Share as Image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Prayer Card Preview</DialogTitle>
        </DialogHeader>
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg border border-border"
          style={{ aspectRatio: `${CARD_W}/${CARD_H}` }}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
            📥 Download
          </Button>
          <Button size="sm" onClick={handleShare} className="gap-2">
            📤 Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareableCard;
