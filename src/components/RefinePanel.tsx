import { useState } from "react";
import { Loader2, MessageSquareText, Send, Undo2 } from "lucide-react";
import { Button } from "./ui/button";
import type { RefineSummary } from "@/types/itinerary";
import { useT } from "@/i18n";
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "error";
  text: string;
  summary?: RefineSummary;
  canUndo?: boolean;
  undone?: boolean;
}
export function RefinePanel({
  messages,
  busy,
  disabled,
  onSend,
  onUndo,
}: {
  messages: ChatMessage[];
  busy: boolean;
  disabled: boolean;
  onSend: (text: string) => void;
  onUndo: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const words = useT().trip.refine;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || busy || disabled) return;
    onSend(value);
    setText("");
  };
  return (
    <section className="refine-panel" aria-label={words.label}>
      <div className="refine-heading">
        <MessageSquareText size={16} />
        <strong>{words.heading}</strong>
      </div>
      {messages.length === 0 && (
        <div className="refine-examples">
          {words.examples.map((x) => (
            <button
              type="button"
              key={x}
              disabled={disabled}
              onClick={() => setText(x)}
            >
              {x}
            </button>
          ))}
        </div>
      )}
      {messages.length > 0 && (
        <div className="refine-messages" role="log" aria-live="polite">
          {messages.map((m) => (
            <div key={m.id} className={`refine-message ${m.role}`}>
              <p dir="auto">{m.text}</p>
              {m.summary && (
                <small>
                  {words.summary(
                    m.summary.added,
                    m.summary.removed,
                    m.summary.changed,
                  )}
                </small>
              )}
              {m.canUndo && !m.undone && (
                <button
                  type="button"
                  className="refine-undo"
                  onClick={() => onUndo(m.id)}
                  title={words.undoTitle}
                >
                  <Undo2 size={13} />
                  {words.undo}
                </button>
              )}
              {m.undone && <small>{words.undone}</small>}
            </div>
          ))}
          {busy && (
            <div className="refine-message assistant pending">
              <Loader2 size={14} className="animate-spin" />
              {words.busy}
            </div>
          )}
        </div>
      )}
      <form className="refine-input" onSubmit={submit}>
        <input
          aria-label={words.inputLabel}
          placeholder={words.placeholder}
          maxLength={500}
          enterKeyHint="send"
          value={text}
          disabled={disabled || busy}
          onChange={(e) => setText(e.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          disabled={disabled || busy || !text.trim()}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Send size={15} />}
          {words.send}
        </Button>
      </form>
    </section>
  );
}
