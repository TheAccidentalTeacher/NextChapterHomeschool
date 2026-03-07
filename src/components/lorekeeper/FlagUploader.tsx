"use client";

// ============================================
// FlagUploader — Physical flag art upload
// Decision 89: Upload JPG/PNG to Supabase Storage
// Lorekeeper dashboard component
// ============================================

import { useState, useRef } from "react";

interface FlagUploaderProps {
  teamId: string;
  gameId: string;
  existingFlagUrl?: string;
  isApproved?: boolean;
  onUpload: (fileUrl: string) => void;
}

export default function FlagUploader({
  teamId,
  gameId,
  existingFlagUrl,
  isApproved,
  onUpload,
}: FlagUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(existingFlagUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG, or WebP files are accepted");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);

      // Upload to API
      const formData = new FormData();
      formData.append("file", file);
      formData.append("teamId", teamId);
      formData.append("gameId", gameId);
      formData.append("flagType", "upload");

      const res = await fetch(`/api/games/${gameId}/flags`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      onUpload(data.fileUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <h3 className="text-sm font-bold text-amber-400 mb-3">
        🏳️ Upload Physical Flag Art
      </h3>

      {/* Preview */}
      {preview && (
        <div className="mb-3 flex justify-center">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Flag preview"
              className="max-h-48 rounded-lg border border-gray-600 object-contain"
            />
            {isApproved && (
              <span className="absolute -top-2 -right-2 rounded-full bg-green-600 px-2 py-0.5 text-xs text-white">
                ✓ Approved
              </span>
            )}
            {isApproved === false && (
              <span className="absolute -top-2 -right-2 rounded-full bg-yellow-600 px-2 py-0.5 text-xs text-white">
                Pending
              </span>
            )}
          </div>
        </div>
      )}

      {/* File input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full rounded-md border border-dashed border-gray-600 py-3 text-sm text-gray-400 hover:border-amber-500 hover:text-amber-400 transition-all disabled:opacity-50"
      >
        {uploading
          ? "Uploading..."
          : preview
            ? "Replace Photo"
            : "📷 Choose Photo (JPG/PNG, max 5MB)"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}

      <p className="mt-2 text-xs text-gray-500">
        Take a photo of your team&apos;s hand-drawn flag and upload it here.
        Scott must approve before it appears on the projector.
      </p>
    </div>
  );
}
