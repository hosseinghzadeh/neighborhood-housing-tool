import { useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Loader2 } from "lucide-react";

export function Composer({
  onSend,
  disabled,
  large = false,
  placeholder = "Tell me about your household and what you're looking for…",
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  large?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-[6px] border border-border-strong/70 bg-surface-raised transition-colors focus-within:border-ink"
    >
      <label htmlFor="af-composer" className="sr-only">
        Describe your household
      </label>
      <textarea
        id="af-composer"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        rows={large ? 4 : 2}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent px-3.5 pt-3 text-[13.5px] leading-relaxed text-text-primary outline-none placeholder:text-text-muted"
      />
      <div className="flex items-center justify-between gap-3 px-3.5 pb-2.5">
        <span className="text-[11px] text-text-muted">
          Enter to send · Shift + Enter for a new line
        </span>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] bg-brand text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </div>
    </form>
  );
}
