"use client";

interface Props {
  message: string | null;
  isError?: boolean;
}

export function Toast({ message, isError }: Props) {
  if (!message) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-3 rounded-sm font-mono text-xs uppercase tracking-wider text-white max-w-[400px] z-50 transition-all duration-150 ${
        isError ? "bg-[#dc2626]" : "bg-navy"
      }`}
    >
      {message}
    </div>
  );
}
