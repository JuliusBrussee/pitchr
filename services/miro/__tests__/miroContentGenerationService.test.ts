import { describe, expect, it, vi } from "vitest";
import {
  buildTemplateMiroBoardCopy,
  generateMiroBoardCopy,
} from "@/services/miro/miroContentGenerationService";
import type { MiroFixBoardRequest } from "@/services/miro/miroTypes";

const sampleInput: MiroFixBoardRequest = {
  runId: "run_123456789abc",
  mode: "vc_pitch",
  oneLineVerdict: "Good momentum but weak proof.",
  topFixes: [
    {
      rank: 1,
      category: "evidence",
      impact: "high",
      issue: "No hard traction metric",
      fix: "Add latest MRR and growth rate",
    },
    {
      rank: 2,
      category: "ask",
      impact: "medium",
      issue: "Ask is vague",
      fix: "Tie raise to milestones and runway",
    },
  ],
  rewriteScript: "Rewritten script goes here.",
  transcript: "We are building a SaaS platform for B2B teams...",
};

function makeValidJson() {
  return JSON.stringify({
    layoutStyle: "mindmap_hybrid",
    kanbanSize: "small",
    overviewCardHtml:
      "<strong>Verdict</strong>: Tighten proof<br/><strong>Mode</strong>: VC Pitch",
    rewriteCardText: "Condensed rewrite.",
    columnGuides: {
      todo: "Owner:<br/>Next Step:<br/>Success Metric:",
      doing: "Latest update:<br/>Risk:<br/>Next checkpoint:",
      blocked: "Blocker:<br/>Needed decision:<br/>Escalate to:",
      done: "Outcome:<br/>Evidence link:<br/>What changed:",
    },
    fixCards: [
      {
        rank: 1,
        category: "evidence",
        impact: "high",
        issue: "Missing traction metric",
        action: "Add MRR and growth in opening",
        status: "doing",
        owner: "alex",
        notes: "Need finance export by Friday",
        nextStep: "Draft a proof slide",
        successMetric: "Mention MRR in first 20 sec",
        blocker: "None",
      },
      {
        rank: 2,
        category: "ask",
        impact: "medium",
        issue: "Ask not specific",
        action: "State amount + milestones",
        status: "todo",
        owner: "",
        notes: "",
        nextStep: "Define 12-month plan",
        successMetric: "Ask includes runway months",
        blocker: "",
      },
    ],
    mindMap: {
      centerTitle: "Pitch Fix Strategy",
      centerBullets: ["Tighten proof", "Prioritize traction and ask"],
      nodes: [
        {
          id: "fix-1",
          title: "#1 Evidence Gap",
          bullets: ["Add MRR", "Add growth rate"],
          rank: 1,
          tool: "bubble",
        },
        {
          id: "fix-2",
          title: "#2 Ask Clarity",
          bullets: ["State raise", "Map milestones"],
          rank: 2,
          tool: "shape",
        },
      ],
    },
  });
}

function makeHybridVisualJson() {
  const parsed = JSON.parse(makeValidJson()) as Record<string, unknown>;
  const mindMap = parsed.mindMap as { nodes?: Array<Record<string, unknown>> } | undefined;
  const firstNode = mindMap?.nodes?.[0];
  if (firstNode) {
    firstNode.tool = "shape";
    firstNode.title = "#1 Evidence Architecture";
    firstNode.bullets = ["Lead with metric", "Support with source"];
  }
  parsed.layoutStyle = "mindmap_hybrid";
  parsed.kanbanSize = "small";
  return JSON.stringify(parsed);
}

describe("generateMiroBoardCopy", () => {
  it("uses OpenRouter output when OpenRouter succeeds", async () => {
    const openrouterComplete = vi.fn(async () => makeValidJson());
    const anthropicComplete = vi.fn(async () => makeValidJson());

    const result = await generateMiroBoardCopy(sampleInput, {
      openrouterComplete,
      anthropicComplete,
      hasOpenRouterApiKey: () => true,
      hasAnthropicApiKey: () => true,
      shouldRunHybridVisualPass: () => false,
    });

    expect(result.providerUsed).toBe("openrouter");
    expect(result.fallbackUsed).toBe(false);
    expect(result.generated.layoutStyle).toBe("mindmap_hybrid");
    expect(result.generated.kanbanSize).toBe("small");
    expect(result.generated.mindMap.nodes[0]?.tool).toBe("bubble");
    expect(result.generated.fixCards[0]?.status).toBe("doing");
    expect(anthropicComplete).not.toHaveBeenCalled();
  });

  it("falls back to Anthropic when OpenRouter fails", async () => {
    const openrouterComplete = vi.fn(async () => {
      throw new Error("OpenRouter unavailable");
    });
    const anthropicComplete = vi.fn(async () => makeValidJson());

    const result = await generateMiroBoardCopy(sampleInput, {
      openrouterComplete,
      anthropicComplete,
      hasOpenRouterApiKey: () => true,
      hasAnthropicApiKey: () => true,
      shouldRunHybridVisualPass: () => false,
    });

    expect(result.providerUsed).toBe("anthropic");
    expect(result.fallbackUsed).toBe(true);
    expect(anthropicComplete).toHaveBeenCalledTimes(1);
  });

  it("applies hybrid visual pass when enabled", async () => {
    const openrouterComplete = vi
      .fn(async () => makeValidJson())
      .mockResolvedValueOnce(makeValidJson())
      .mockResolvedValueOnce(makeHybridVisualJson());
    const anthropicComplete = vi.fn(async () => makeValidJson());

    const result = await generateMiroBoardCopy(sampleInput, {
      openrouterComplete,
      anthropicComplete,
      hasOpenRouterApiKey: () => true,
      hasAnthropicApiKey: () => true,
      shouldRunHybridVisualPass: () => true,
    });

    expect(result.providerUsed).toBe("openrouter");
    expect(result.fallbackUsed).toBe(false);
    expect(result.generated.mindMap.nodes[0]?.tool).toBe("shape");
    expect(result.message).toContain("Hybrid visual pass applied");
    expect(openrouterComplete).toHaveBeenCalledTimes(2);
    expect(anthropicComplete).not.toHaveBeenCalled();
  });

  it("falls back to template when both providers fail", async () => {
    const result = await generateMiroBoardCopy(sampleInput, {
      openrouterComplete: async () => {
        throw new Error("fail");
      },
      anthropicComplete: async () => {
        throw new Error("fail");
      },
      hasOpenRouterApiKey: () => true,
      hasAnthropicApiKey: () => true,
      shouldRunHybridVisualPass: () => false,
    });

    expect(result.providerUsed).toBe("template");
    expect(result.fallbackUsed).toBe(true);
    expect(result.generated.fixCards[0]?.issue).toBe(sampleInput.topFixes[0].issue);
  });

  it("uses template fallback when LLM returns invalid JSON", async () => {
    const result = await generateMiroBoardCopy(sampleInput, {
      openrouterComplete: async () => "not json",
      anthropicComplete: async () => {
        throw new Error("fallback failed");
      },
      hasOpenRouterApiKey: () => true,
      hasAnthropicApiKey: () => true,
      shouldRunHybridVisualPass: () => false,
    });

    expect(result.providerUsed).toBe("template");
    expect(result.generated.rewriteCardText).toBe(buildTemplateMiroBoardCopy(sampleInput).rewriteCardText);
  });

  it("uses template fallback when LLM returns invalid fix ranks", async () => {
    const invalidRanks = JSON.stringify({
      layoutStyle: "compact_kanban",
      kanbanSize: "full",
      overviewCardHtml: "Overview",
      rewriteCardText: "Rewrite",
      columnGuides: {
        todo: "todo",
        doing: "doing",
        blocked: "blocked",
        done: "done",
      },
      fixCards: [
        {
          rank: 9,
          category: "evidence",
          impact: "high",
          issue: "bad",
          action: "bad",
          status: "todo",
          owner: "",
          notes: "",
          nextStep: "",
          successMetric: "",
          blocker: "",
        },
      ],
      mindMap: {
        centerTitle: "Fallback",
        centerBullets: ["bad rank"],
        nodes: [],
      },
    });

    const result = await generateMiroBoardCopy(sampleInput, {
      openrouterComplete: async () => invalidRanks,
      anthropicComplete: async () => {
        throw new Error("fallback failed");
      },
      hasOpenRouterApiKey: () => true,
      hasAnthropicApiKey: () => true,
      shouldRunHybridVisualPass: () => false,
    });

    expect(result.providerUsed).toBe("template");
    expect(result.generated.fixCards.map((fix) => fix.rank)).toEqual([1, 2]);
  });
});
