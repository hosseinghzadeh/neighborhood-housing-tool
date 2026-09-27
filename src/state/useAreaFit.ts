import { useCallback, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import type { HouseholdProfile, PriorityKey } from "../domain/household-profile";
import { emptyProfile } from "../domain/household-profile";
import { stockholmDemoRepository } from "../data/providers/stockholm-demo-data";
import { rankAreas } from "../services/recommendation-engine";
import { applyPatch, heuristicParse, sanitisePatch } from "../services/preference-parser";
import { interpretRequest } from "../lib/areafit-ai.functions";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

const uid = () => Math.random().toString(36).slice(2);

export type RegionId = "greater-stockholm" | "stockholm-city";

export function useAreaFit() {
  const interpret = useServerFn(interpretRequest);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profile, setProfile] = useState<HouseholdProfile>(emptyProfile);
  const [hasProfile, setHasProfile] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [regionId, setRegionId] = useState<RegionId>("greater-stockholm");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const areas = useMemo(() => stockholmDemoRepository.getAreas(regionId), [regionId]);

  const result = useMemo(
    () => (hasProfile ? rankAreas(areas, profile) : { recommendations: [], excludedCount: 0 }),
    [areas, profile, hasProfile],
  );

  const top = useMemo(() => result.recommendations.slice(0, 5), [result]);

  const selected = useMemo(
    () => result.recommendations.find((r) => r.area.id === selectedId) ?? null,
    [result, selectedId],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking) return;
      setMessages((m) => [...m, { id: uid(), role: "user", content: trimmed }]);
      setThinking(true);

      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      let reply = "";
      let patch = heuristicParse(trimmed);
      let fallback = true;

      try {
        const res = await interpret({
          data: { message: trimmed, profile: profileRef.current, history },
        });
        if (res.ok) {
          const aiPatch = sanitisePatch(res.patch);
          if (Object.keys(aiPatch).length) patch = aiPatch;
          reply = res.reply;
          fallback = false;
        }
      } catch {
        /* keep heuristic fallback */
      }

      const next = applyPatch(profileRef.current, patch);
      setProfile(next);
      setHasProfile(true);
      setUsedFallback(fallback);

      const ranked = rankAreas(stockholmDemoRepository.getAreas(regionId), next);
      const best = ranked.recommendations[0];
      if (!reply) {
        reply = best
          ? `Got it. I've weighted ${describeTopPriority(next)} highest and re-scored ${ranked.recommendations.length} areas across greater Stockholm.`
          : "I couldn't find areas matching those constraints — try widening the geography or budget.";
      }
      setMessages((m) => [...m, { id: uid(), role: "assistant", content: reply }]);
      setSelectedId(null);
      void best;
      setThinking(false);
    },
    [interpret, messages, regionId, thinking],
  );

  const setPriority = useCallback((key: PriorityKey, value: number) => {
    setProfile((p) => ({ ...p, priorities: { ...p.priorities, [key]: value } }));
  }, []);

  const removePreference = useCallback((id: string) => {
    setProfile((p) => {
      const next: HouseholdProfile = {
        ...p,
        household: { ...p.household },
        budget: { ...p.budget },
        commute: [...p.commute],
        priorities: { ...p.priorities },
      };
      if (id === "budget") next.budget = {};
      else if (id === "commute") next.commute = [];
      else if (id === "children")
        next.household = { ...next.household, children: 0, childAges: [] };
      else if (id === "sectors") next.sectors = undefined;
      else next.priorities[id as PriorityKey] = 0.4;
      return next;
    });
  }, []);

  const toggleCompare = useCallback((areaId: string) => {
    setCompareIds((ids) =>
      ids.includes(areaId)
        ? ids.filter((i) => i !== areaId)
        : ids.length >= 3
          ? ids
          : [...ids, areaId],
    );
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setProfile(emptyProfile());
    setHasProfile(false);
    setSelectedId(null);
    setCompareIds([]);
  }, []);

  return {
    messages,
    profile,
    hasProfile,
    thinking,
    regionId,
    setRegionId,
    areas,
    result,
    top,
    selected,
    selectedId,
    setSelectedId,
    hoveredId,
    setHoveredId,
    compareIds,
    toggleCompare,
    setCompareIds,
    send,
    setPriority,
    removePreference,
    usedFallback,
    reset,
  };
}

function describeTopPriority(p: HouseholdProfile): string {
  const entries = Object.entries(p.priorities) as Array<[PriorityKey, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  const labels: Record<PriorityKey, string> = {
    safety: "reported-crime levels",
    schools: "school results",
    commute: "commute time",
    affordability: "affordability",
    educationLevel: "education levels",
    familyFriendliness: "family friendliness",
  };
  return labels[entries[0]![0]];
}
