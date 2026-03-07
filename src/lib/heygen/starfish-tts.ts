// ============================================
// Starfish TTS — HeyGen text-to-speech
// Decision 46: Exit hook audio
// Cost: ~$0.000333/sec → ~$0.003 per 10-second hook
// ============================================

export interface StarfishTTSConfig {
  apiKey: string;
  voiceId: string;       // Historian voice
  speed: number;         // 0.95 recommended
  pitch: number;         // -2 for gravitas
}

export interface TTSResult {
  audioUrl: string;
  durationSeconds: number;
  cost: number;
}

const DEFAULT_CONFIG: Omit<StarfishTTSConfig, "apiKey"> = {
  voiceId: "historian_default",
  speed: 0.95,
  pitch: -2,
};

/**
 * Generate speech audio from text using HeyGen Starfish TTS.
 * Returns an audio URL that can be played on the projector.
 */
export async function generateSpeech(
  text: string,
  config?: Partial<StarfishTTSConfig>
): Promise<TTSResult> {
  const apiKey = config?.apiKey ?? process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    throw new Error("HEYGEN_API_KEY not set");
  }

  const voiceId = config?.voiceId ?? DEFAULT_CONFIG.voiceId;
  const speed = config?.speed ?? DEFAULT_CONFIG.speed;
  const pitch = config?.pitch ?? DEFAULT_CONFIG.pitch;

  const response = await fetch("https://api.heygen.com/v1/audio/text_to_speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      text,
      voice_id: voiceId,
      speed,
      pitch,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Starfish TTS failed: ${response.status} ${errorBody}`);
  }

  const result = await response.json();

  // Estimate duration from text length (~150 words/minute at 0.95x speed)
  const wordCount = text.split(/\s+/).length;
  const durationSeconds = Math.ceil((wordCount / 150) * 60 * (1 / speed));
  const cost = durationSeconds * 0.000333;

  return {
    audioUrl: result.audio_url ?? result.data?.audio_url ?? "",
    durationSeconds,
    cost,
  };
}

/**
 * Generate exit hook audio for the daily recap.
 * Takes the Haiku-generated hook sentence, generates TTS,
 * and returns the audio URL.
 */
export async function generateExitHookAudio(
  hookText: string
): Promise<{ audioUrl: string; durationSeconds: number }> {
  const result = await generateSpeech(hookText);
  return {
    audioUrl: result.audioUrl,
    durationSeconds: result.durationSeconds,
  };
}
