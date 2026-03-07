"use client";

// ============================================
// FlagBuilder — Simple SVG flag designer
// Decision 89: 5 controls, outputs clean SVG
// ============================================

import { useState, useMemo } from "react";

interface FlagBuilderProps {
  teamId: string;
  gameId: string;
  onSave: (svgString: string) => void;
}

type ShapeType = "none" | "stripe_h" | "stripe_v" | "cross" | "chevron" | "star" | "circle" | "crescent";

const SHAPES: { value: ShapeType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "stripe_h", label: "Horizontal Stripe" },
  { value: "stripe_v", label: "Vertical Stripe" },
  { value: "cross", label: "Cross" },
  { value: "chevron", label: "Chevron" },
  { value: "star", label: "Star" },
  { value: "circle", label: "Circle" },
  { value: "crescent", label: "Crescent" },
];

const WIDTH = 300;
const HEIGHT = 200;

export default function FlagBuilder({
  teamId,
  gameId,
  onSave,
}: FlagBuilderProps) {
  const [bgColor, setBgColor] = useState("#1a237e");
  const [fgColor, setFgColor] = useState("#ffd700");
  const [shape, setShape] = useState<ShapeType>("star");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const shapeSVG = useMemo(() => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;

    switch (shape) {
      case "stripe_h":
        return `<rect x="0" y="${HEIGHT * 0.35}" width="${WIDTH}" height="${HEIGHT * 0.3}" fill="${fgColor}" />`;
      case "stripe_v":
        return `<rect x="${WIDTH * 0.35}" y="0" width="${WIDTH * 0.3}" height="${HEIGHT}" fill="${fgColor}" />`;
      case "cross":
        return `<rect x="${WIDTH * 0.42}" y="0" width="${WIDTH * 0.16}" height="${HEIGHT}" fill="${fgColor}" /><rect x="0" y="${HEIGHT * 0.38}" width="${WIDTH}" height="${HEIGHT * 0.24}" fill="${fgColor}" />`;
      case "chevron":
        return `<polygon points="0,0 ${WIDTH * 0.4},${cy} 0,${HEIGHT}" fill="${fgColor}" />`;
      case "star": {
        const r1 = 40, r2 = 18;
        const points: string[] = [];
        for (let i = 0; i < 10; i++) {
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          const r = i % 2 === 0 ? r1 : r2;
          points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
        }
        return `<polygon points="${points.join(" ")}" fill="${fgColor}" />`;
      }
      case "circle":
        return `<circle cx="${cx}" cy="${cy}" r="40" fill="${fgColor}" />`;
      case "crescent": {
        return `<circle cx="${cx - 8}" cy="${cy}" r="35" fill="${fgColor}" /><circle cx="${cx + 10}" cy="${cy}" r="30" fill="${bgColor}" />`;
      }
      default:
        return "";
    }
  }, [shape, fgColor, bgColor]);

  const textSVG = text
    ? `<text x="${WIDTH / 2}" y="${HEIGHT - 20}" text-anchor="middle" font-size="16" font-family="sans-serif" fill="${fgColor}" font-weight="bold">${text.replace(/[<>&"]/g, "")}</text>`
    : "";

  const fullSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" fill="${bgColor}" />${shapeSVG}${textSVG}</svg>`;

  async function handleSave() {
    setSaving(true);
    try {
      // Upload SVG to API
      const res = await fetch(`/api/games/${gameId}/flags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          flagType: "svg",
          svgContent: fullSVG,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      onSave(fullSVG);
    } catch (err) {
      console.error("Flag save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <h3 className="text-sm font-bold text-amber-400 mb-3">
        🎨 Design Digital Flag
      </h3>

      {/* Live Preview */}
      <div className="mb-4 flex justify-center rounded-lg border border-gray-600 bg-gray-900 p-4">
        <div dangerouslySetInnerHTML={{ __html: fullSVG }} />
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* 1. Background color */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 w-24">Background</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-gray-600 bg-transparent"
          />
          <span className="text-xs text-gray-500 font-mono">{bgColor}</span>
        </div>

        {/* 2. Shape overlay */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 w-24">Shape</label>
          <select
            value={shape}
            onChange={(e) => setShape(e.target.value as ShapeType)}
            className="rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white"
          >
            {SHAPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Foreground color */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 w-24">Foreground</label>
          <input
            type="color"
            value={fgColor}
            onChange={(e) => setFgColor(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-gray-600 bg-transparent"
          />
          <span className="text-xs text-gray-500 font-mono">{fgColor}</span>
        </div>

        {/* 4. Text overlay */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 w-24">Text</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value.substring(0, 20))}
            placeholder="Optional (max 20 chars)"
            maxLength={20}
            className="flex-1 rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white placeholder-gray-600"
          />
        </div>
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full rounded-md bg-amber-700 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-all"
      >
        {saving ? "Saving..." : "💾 Save Flag Design"}
      </button>

      <p className="mt-2 text-xs text-gray-500">
        Scott must approve before it appears on the projector and map.
      </p>
    </div>
  );
}
