import { useState } from "react";
import { Loader2, MessageSquareText, Send, Undo2 } from "lucide-react";
import { Button } from "./ui/button";
import type { RefineSummary } from "@/types/itinerary";
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "error";
  text: string;
  summary?: RefineSummary;
  canUndo?: boolean;
  undone?: boolean;
}
const examples = [
  "תרגיע את היום הזה",
  "תוסיף מסעדה מקומית לצהריים",
  "תחליף את הפעילות האחרונה במשהו לילדים",
];
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
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || busy || disabled) return;
    onSend(value);
    setText("");
  };
  return (
    <section className="refine-panel" aria-label="עידון המסלול בשיחה">
      <div className="refine-heading">
        <MessageSquareText size={16} />
        <strong>לשנות משהו? פשוט תגידו</strong>
      </div>
      {messages.length === 0 && (
        <div className="refine-examples">
          {examples.map((x) => (
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
              <p>{m.text}</p>
              {m.summary && (
                <small>
                  נוספו {m.summary.added} · הוסרו {m.summary.removed} · עודכנו{" "}
                  {m.summary.changed}
                </small>
              )}
              {m.canUndo && !m.undone && (
                <button
                  type="button"
                  className="refine-undo"
                  onClick={() => onUndo(m.id)}
                  title="מחזיר את המסלול למצב שלפני השינוי"
                >
                  <Undo2 size={13} />
                  בטל
                </button>
              )}
              {m.undone && <small>השינוי בוטל</small>}
            </div>
          ))}
          {busy && (
            <div className="refine-message assistant pending">
              <Loader2 size={14} className="animate-spin" />
              מעדכנים את המסלול…
            </div>
          )}
        </div>
      )}
      <form className="refine-input" onSubmit={submit}>
        <input
          aria-label="מה לשנות במסלול"
          placeholder="מה לשנות? למשל: תרגיע את יום 2, או תוסיף מוזיאון לילדים"
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
          שליחה
        </Button>
      </form>
    </section>
  );
}
