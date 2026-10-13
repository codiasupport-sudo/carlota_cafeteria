"use client";

import { useRef } from "react";

export function PinInput({
  length = 4,
  value,
  onChange,
  hasError = false,
}: {
  length?: number;
  value: string;
  onChange: (pin: string) => void;
  hasError?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function setDigit(index: number, digit: string) {
    const next = (value + " ".repeat(length)).slice(0, length).split("");
    next[index] = digit;
    onChange(next.join("").trimEnd().replace(/ /g, ""));
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    setDigit(index, digit);
    if (index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key !== "Backspace") return;
    e.preventDefault();
    if (digits[index]) {
      setDigit(index, "");
    } else if (index > 0) {
      setDigit(index - 1, "");
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (pasted) onChange(pasted);
  }

  return (
    <div className="flex justify-center gap-3">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          autoComplete="off"
          className={`h-16 w-14 rounded-xl border-2 bg-cream text-center font-display text-3xl font-semibold outline-none transition-colors ${
            hasError
              ? "border-red-400 text-red-700"
              : "border-ink/15 focus:border-wine"
          }`}
        />
      ))}
    </div>
  );
}
