import { useCallback, useEffect, useState } from "react";
import { Bookmark } from "lucide-react";

import type { HouseholdProfile } from "../../domain/household-profile";
import {
  listSavedSearches,
  saveSearch,
  type SavedSearch,
} from "../../lib/saved-searches.functions";
import { summariseProfile } from "../../services/saved-searches";

/** "Save this search" button plus the most recent saved searches (stored in Postgres). */
export function SavedSearches({ profile }: { profile: HouseholdProfile }) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [available, setAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await listSavedSearches();
      setAvailable(res.ok);
      setSearches(res.searches);
    } catch {
      setError("Could not load saved searches.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await saveSearch({ data: { profile } });
      if (!res.ok) setAvailable(false);
      await refresh();
    } catch {
      setError("Could not save this search.");
    } finally {
      setSaving(false);
    }
  };

  if (!available) return null;

  return (
    <div className="space-y-2.5 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3">
        <p className="wm-label">Saved searches</p>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-[4px] border border-border-strong/70 px-2.5 py-1.5 text-[12px] text-text-primary transition-colors hover:bg-surface-subtle disabled:opacity-50"
        >
          <Bookmark className="h-3 w-3" /> {saving ? "Saving…" : "Save this search"}
        </button>
      </div>
      {error ? <p className="text-[12px] text-destructive">{error}</p> : null}
      {searches.length ? (
        <ul className="space-y-1.5">
          {searches.map((s) => (
            <li
              key={s.id}
              className="flex items-baseline justify-between gap-3 text-[12.5px] text-text-secondary"
            >
              <span className="text-text-primary">{summariseProfile(s.profile)}</span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-text-muted">
                {new Date(s.createdAt).toLocaleDateString("sv-SE")}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-text-muted">No saved searches yet.</p>
      )}
    </div>
  );
}
