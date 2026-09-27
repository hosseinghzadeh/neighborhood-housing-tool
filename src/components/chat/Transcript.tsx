import { useEffect, useRef, useState } from "react";

import type { ChatMessage } from "../../state/useAreaFit";

export function Transcript({ messages, thinking }: { messages: ChatMessage[]; thinking: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, thinking]);

  if (!messages.length) return null;

  return (
    <div className="space-y-3">
      {messages.map((m) =>
        m.role === "user" ? (
          <UserBubble key={m.id} content={m.content} />
        ) : (
          <div key={m.id} className="af-rise flex gap-2.5">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <p className="max-w-[92%] whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {m.content}
            </p>
          </div>
        ),
      )}
      {thinking ? (
        <div className="flex items-center gap-2 pl-4 text-sm text-muted-foreground">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </span>
          Reading your situation and re-scoring areas…
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = content.length > 220;

  return (
    <div className="af-rise flex justify-end">
      <div className="max-w-[85%] rounded-xl rounded-br-sm bg-secondary px-3.5 py-2.5 text-sm leading-relaxed text-secondary-foreground">
        <p className={`whitespace-pre-wrap ${long && !expanded ? "line-clamp-3" : ""}`}>
          {content}
        </p>
        {long ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-1 text-[11px] text-muted-foreground underline-offset-2 hover:underline"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
