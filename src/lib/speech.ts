// Speaking instead of typing: the phone's own speech-to-text (Chrome on Android, Safari on iPhone).
// Free, and nothing extra is sent to Flowz's servers. Each pause becomes a line in the notebook.

import { useCallback, useEffect, useRef, useState } from "react";

/** Splits what was said into notebook lines: "next line" / "new line" starts a new one. */
export function spokenLines(said: string): string[] {
  return said
    .split(/\b(?:next|new)\s+line\b[.,!]?/i)
    .map((part) =>
      part
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^[,.;:!?\s]+|[,.;:!?\s]+$/g, ""),
    )
    .filter(Boolean)
    .map((line) => line.charAt(0).toUpperCase() + line.slice(1));
}

// The Web Speech API isn't in TypeScript's built-in types yet.
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function recognitionClass(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const speechSupported = () => recognitionClass() !== null;

const MESSAGES: Record<string, string> = {
  "not-allowed": "Flowz can't use the microphone. Allow microphone access for this site in your browser settings, then try again.",
  "service-not-allowed": "Flowz can't use the microphone. Allow microphone access for this site in your browser settings, then try again.",
  "audio-capture": "No microphone was found on this phone.",
  network: "Voice needs an internet connection. You can keep typing.",
};

/**
 * Listens until stopped. Each time the speaker pauses, `onPhrase` gets what was said.
 * Phones stop listening after a pause, so it quietly starts again until `stop()`.
 */
export function useDictation(onPhrase: (text: string) => void, lang = "en-NG") {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const wanted = useRef(false);
  const silent = useRef(0); // pauses in a row with nothing said
  const phrase = useRef(onPhrase);
  phrase.current = onPhrase;

  const stop = useCallback(() => {
    wanted.current = false;
    rec.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionClass();
    if (!Ctor) {
      setError("Voice isn't available in this browser. Use the microphone on your keyboard, or open Flowz in Chrome.");
      return;
    }
    setError(null);
    wanted.current = true;
    silent.current = 0;
    const r = new Ctor();
    r.lang = lang;
    r.continuous = false; // one phrase at a time is the most reliable on phones
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          const text = res[0].transcript.trim();
          if (text) {
            silent.current = 0;
            phrase.current(text);
          }
        } else live += res[0].transcript;
      }
      setInterim(live.trim());
    };
    r.onerror = (e) => {
      // A pause with nothing said isn't a problem, but stop after a couple so the phone doesn't keep beeping.
      if (e.error === "no-speech") {
        if (++silent.current >= 2) wanted.current = false;
        return;
      }
      if (e.error === "aborted") return;
      wanted.current = false;
      setError(MESSAGES[e.error] ?? "Voice stopped working. You can keep typing.");
    };
    r.onend = () => {
      setInterim("");
      if (wanted.current) {
        try {
          r.start();
          return;
        } catch {
          // fall through and stop
        }
      }
      wanted.current = false;
      setListening(false);
    };
    rec.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      wanted.current = false;
      setError("Voice couldn't start. Please try again.");
    }
  }, [lang]);

  // Stop listening when leaving the page.
  useEffect(
    () => () => {
      wanted.current = false;
      rec.current?.abort();
    },
    [],
  );

  return { listening, interim, error, start, stop, clearError: () => setError(null) };
}
