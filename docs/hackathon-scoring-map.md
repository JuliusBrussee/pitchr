```mermaid
flowchart LR
    %% =========================
    %% Pitchr transcript-derived grading map
    %% =========================

    subgraph OFFLINE["Offline mode-schema build"]
        VC_RAW["VC transcript corpus<br/>pitch backend/*.txt<br/>25 transcripts / 45,389 words"]
        EL_RAW["Elevator transcript corpus<br/>curated JSON dataset<br/>30 transcripts / 5,430 words"]
        HK_RAW["Hackathon corpus<br/>curated JSON dataset<br/>10 winner entries / 0 words<br/>+ 40 judging criteria docs<br/>+ 10 winner pattern analyses"]

        VC_SEEDS["VC dimension seeds<br/>- narrative_flow<br/>- clarity_of_story<br/>- proof_of_demand<br/>- market_case<br/>- fundraise_readiness<br/>- delivery_control"]
        EL_SEEDS["Elevator dimension seeds<br/>- instant_clarity<br/>- problem_solution_fit<br/>- credibility_signals<br/>- ask_precision<br/>- memorability<br/>- delivery_control"]
        HK_SEEDS["Hackathon dimension seeds<br/>- demo_quality<br/>- technical_credibility<br/>- theme_alignment<br/>- wow_factor<br/>- impact_clarity<br/>- delivery_energy"]

        BUILDER["build-knowledge-pack.ts<br/>Applies regex patterns per seeded dimension<br/>Scans transcript sentences for matches"]
        HK_BUILDER["build-knowledge-pack.ts hackathon section<br/>HACKATHON_BEAT_PATTERNS: demo, innovation,<br/>impact, theme_alignment, technical_stack<br/>Anti-patterns: no_demo, slides_only,<br/>no_theme_alignment, too_many_features, no_cta"]

        SIGNALS["Corpus-derived signals written to artifact<br/>- support_count<br/>- support_ratio<br/>- representative_quotes<br/>- top_terms"]
        HK_SIGNALS["Hackathon signals written to artifact<br/>- beat_patterns list<br/>- anti_patterns list<br/>- category_guidance per rubric dim<br/>- benchmark_profiles:<br/>  hackathon_winner + common_failures"]

        MODE_ARTIFACT["knowledge/patterns.v1.json<br/>Published mode base schemas<br/>Now includes hackathon section"]

        VC_RAW --> BUILDER
        EL_RAW --> BUILDER
        HK_RAW --> HK_BUILDER
        VC_SEEDS --> BUILDER
        EL_SEEDS --> BUILDER
        HK_SEEDS --> HK_BUILDER
        BUILDER --> SIGNALS
        HK_BUILDER --> HK_SIGNALS
        SIGNALS --> MODE_ARTIFACT
        HK_SIGNALS --> MODE_ARTIFACT
    end

    subgraph RUNTIME["Runtime evaluation path"]
        MODE_SELECT["User selects mode<br/>vc_pitch, elevator, or hackathon"]
        RUBRIC["Optional uploaded rubric text"]
        PROJECT_CTX["Project context<br/>- description<br/>- target market<br/>- metrics<br/>- notes"]

        LOAD_BASE["Load mode base schema<br/>PITCH_MODE_CONFIG[mode]"]
        RUBRIC_AST["buildRubricPolicy()<br/>Parse terms / caps / must-mentions<br/>Extended aliases for hackathon:<br/>practicality, wow factor, usability,<br/>ux, dx, impact, originality, creativity,<br/>presentation quality, storytelling"]
        MERGE["Rubric policy merged with<br/>mode-specific analysis profile<br/>getAnalysisPromptProfile(mode)"]
        RUNTIME_SCHEMA["Compiled evaluation config<br/>Source of truth for this run"]

        MODE_SELECT --> LOAD_BASE
        MODE_ARTIFACT --> LOAD_BASE
        RUBRIC --> RUBRIC_AST
        LOAD_BASE --> MERGE
        RUBRIC_AST --> MERGE
        MERGE --> RUNTIME_SCHEMA
    end

    subgraph PREP["Prep Agent — buildScoringContext()"]
        NORMALIZE_TX["normalizeText(transcript)<br/>dropInterviewerHeavySegments()"]
        STAGE_SELECT["defaultStageForMode(mode)<br/>hackathon → university_hack<br/>vc_pitch/elevator → seed<br/>User can override to:<br/>university_hack | corporate_hack<br/>web3_hack | science_hack"]

        DELIVERY_CALC["calculateDeliveryMetrics()<br/>Mode-aware from PITCH_MODE_CONFIG:<br/>─────────────────────────<br/>       elev  |  vc   | hack<br/>target: 30s  | 120s  | 180s<br/>WPM:   165   | 140   | 150<br/>min:    25s  | 110s  | 150s<br/>max:    35s  | 130s  | 210s<br/>─────────────────────────<br/>Formula: delivery20 =<br/>20 × (0.28×pace + 0.30×filler<br/>+ 0.18×stutter + 0.14×repeat<br/>+ 0.10×time)"]

        BEAT_DETECT["extractBeatEvidence()<br/>VC/Elev beats: one_liner, problem,<br/>mechanism, proof, differentiation,<br/>wedge, ask<br/>Hackathon adds detection for:<br/>demo, innovation, impact patterns"]

        ANTI_DETECT["detectAntiPatterns()<br/>Shared: jargon_overload, no_ask,<br/>no_proof, tam_only, slide_overload<br/>Hackathon-specific:<br/>• no_demo — no demo/prototype/live language<br/>• no_theme_alignment — no theme/challenge ref<br/>• slides_only — slides without demo<br/>• too_many_features — ≥4 feature markers<br/>• no_cta — no try/vote/star/github language"]

        STAGE_EXPECT["getStageExpectations()<br/>Hackathon stages:<br/>• university_hack: creativity, learning, collab<br/>• corporate_hack: sponsor align, feasibility<br/>• web3_hack: on-chain demo, protocol UX<br/>• science_hack: rigor, impact measurement"]

        KNOWLEDGE["buildKnowledgeDigest()<br/>Mode-conditional content:<br/>─────────────────────────<br/>VC/Elev do_rules:<br/>  Cover problem, mechanism, proof...<br/>Hackathon do_rules:<br/>  Show working demo within 45s<br/>  Focus on one core innovation<br/>  End with specific ask: try/vote/partner<br/>─────────────────────────<br/>Category guidance from:<br/>  vc/elev → DEFAULT_CATEGORY_GUIDANCE<br/>  hackathon → HACKATHON_CATEGORY_GUIDANCE<br/>─────────────────────────<br/>Anti-pattern playbook from:<br/>  vc/elev → DEFAULT_ANTI_PATTERN_PLAYBOOK<br/>  hackathon → HACKATHON_ANTI_PATTERN_PLAYBOOK"]

        SCORING_CTX["ScoringContext object<br/>mode + stage + coverage<br/>+ beats + anti_patterns<br/>+ delivery_metrics<br/>+ knowledge_digest<br/>+ stage_expectations<br/>+ benchmark_profiles<br/>+ retrieved_patterns"]

        NORMALIZE_TX --> BEAT_DETECT
        NORMALIZE_TX --> ANTI_DETECT
        NORMALIZE_TX --> DELIVERY_CALC
        MODE_SELECT --> STAGE_SELECT
        MODE_SELECT --> DELIVERY_CALC
        STAGE_SELECT --> STAGE_EXPECT
        STAGE_SELECT --> KNOWLEDGE
        ANTI_DETECT --> KNOWLEDGE
        BEAT_DETECT --> SCORING_CTX
        ANTI_DETECT --> SCORING_CTX
        DELIVERY_CALC --> SCORING_CTX
        STAGE_EXPECT --> SCORING_CTX
        KNOWLEDGE --> SCORING_CTX
    end

    subgraph PROMPTS["Prompt construction — buildJudgeUserPromptWithTelemetry()"]
        SYS_SELECT{"Mode check"}
        SYS_VC["JUDGE_SYSTEM_PROMPT<br/>You are Pitchr Judge Agent<br/>Evaluate against YC top-decile<br/>fundraising standards<br/>80+ rare: clear proof + ask + diff"]
        SYS_HK["HACKATHON_JUDGE_SYSTEM_PROMPT<br/>Evaluate hackathon demo pitches<br/>against hackathon winner quality<br/>80+ requires working demo +<br/>clear innovation + theme alignment<br/>Missing demo is single most damaging flaw<br/>Do not apply investor/VC standards<br/>Do not ask about revenue, TAM, fundraising"]

        BENCHMARK_VC["Benchmark policy in user prompt:<br/>Grade against YC top-decile quality<br/>80+ requires strong proof +<br/>clear differentiation + explicit ask"]
        BENCHMARK_HK["Benchmark policy in user prompt:<br/>Grade against hackathon winner quality<br/>80+ requires working demo +<br/>clear innovation + theme alignment<br/>Penalize slides-only presentations<br/>investor_questions should contain<br/>hackathon judge questions about<br/>technical implementation, feasibility,<br/>and theme alignment.<br/>Do NOT ask about revenue or TAM"]

        CTX_RULES["Project context appended<br/>as auxiliary context"]
        USER_PROMPT["User prompt includes:<br/>- mode + coverage + stage<br/>- rubricText 5 spoken categories<br/>- compact scoring context JSON<br/>- knowledge_digest<br/>- benchmark_profiles<br/>- retrieved_patterns<br/>- original transcript<br/>- deck text<br/>- response schema"]

        MODE_SELECT --> SYS_SELECT
        SYS_SELECT -->|"vc_pitch or elevator"| SYS_VC
        SYS_SELECT -->|"hackathon"| SYS_HK
        SYS_SELECT -->|"vc_pitch or elevator"| BENCHMARK_VC
        SYS_SELECT -->|"hackathon"| BENCHMARK_HK
        SYS_VC --> USER_PROMPT
        SYS_HK --> USER_PROMPT
        BENCHMARK_VC --> USER_PROMPT
        BENCHMARK_HK --> USER_PROMPT
        PROJECT_CTX --> CTX_RULES
        CTX_RULES --> USER_PROMPT
        RUNTIME_SCHEMA --> USER_PROMPT
        SCORING_CTX --> USER_PROMPT
    end

    subgraph JUDGE["Judging + deterministic scoring"]
        LLM["Claude claude-sonnet-4-6 temp 0.2<br/>Gemini fallback<br/>Returns JSON:<br/>- rubric_breakdown 5 spoken scores<br/>- top_fixes<br/>- rewrite_script<br/>- sentiment_profile<br/>- citations<br/>- do_next_checklist<br/>- qa_1min 3 questions"]

        NORMALIZE_RUBRIC["normalizeRubric()<br/>Clamp scores 0-20<br/>Fill missing categories<br/>Categories always:<br/>structure, clarity, evidence,<br/>market, delivery"]

        DELIVERY_OVERRIDE["Deterministic delivery override<br/>delivery score := delivery20<br/>from calculateDeliveryMetrics()<br/>LLM delivery score discarded"]

        HARD_GATES{"Hard gate caps applied<br/>based on mode"}
        VC_GATES["VC/Elevator HARD_GATE_CAPS:<br/>• no_proof → evidence ≤ 8<br/>• no_ask → structure ≤ 12<br/>• no_ask → deck_ask ≤ 8<br/>• tam_only → market ≤ 10"]
        HK_GATES["Hackathon HACKATHON_HARD_GATE_CAPS:<br/>• no_demo → evidence ≤ 6<br/>• no_demo → structure ≤ 10<br/>• no_theme_alignment → market ≤ 10<br/>• no_cta → structure ≤ 12"]

        COMPOSITE["calculateCompositeScore()<br/>spoken100 = structure + clarity +<br/>evidence + market + delivery20<br/>each 0-20, sum 0-100<br/><br/>deck100 = deck rubric sum if deck<br/><br/>overall_before_penalty =<br/>  spoken only: spoken100<br/>  with deck: 0.65×spoken + 0.35×deck<br/><br/>penalty = Σ hit.weight × hit.penalty<br/>capped at 12<br/><br/>finalScore = overall - penalty<br/>clamped 0-100"]

        CALIBRATE["calibrateFeedbackWithKnowledge()<br/>- Strip source references YC, Sequoia...<br/>- Replace generic rationales with<br/>  knowledge_digest guidance<br/>- Replace generic fix text with<br/>  anti-pattern playbook entries"]

        RUBRIC_POLICY["applyRubricPolicyToFeedback()<br/>If uploaded rubric has cap rules:<br/>- Check transcript for required terms<br/>- Cap category scores for missing terms<br/>- Add custom fix for missing term<br/>- Recalculate overall_score"]

        USER_PROMPT --> LLM
        LLM --> NORMALIZE_RUBRIC
        NORMALIZE_RUBRIC --> DELIVERY_OVERRIDE
        DELIVERY_OVERRIDE --> HARD_GATES
        HARD_GATES -->|"vc_pitch or elevator"| VC_GATES
        HARD_GATES -->|"hackathon"| HK_GATES
        VC_GATES --> COMPOSITE
        HK_GATES --> COMPOSITE
        COMPOSITE --> CALIBRATE
        CALIBRATE --> RUBRIC_POLICY
    end

    subgraph QA["Q&A Generation"]
        QA_FROM_LLM["qa_1min from judge LLM<br/>3 questions + 3 timed answers<br/>+ focus_tags + red_flags"]
        QA_FALLBACK["ensureQaPack() fallback<br/>Generates from weakest<br/>rubric categories"]
        QA_AGENT["buildQaAgentSystemPrompt()<br/>Mode-conditional persona:<br/>─────────────────────────<br/>VC/Elev: You are a venture<br/>investor running rapid-fire<br/>follow-up. Ask for metric,<br/>timeframe, denominator.<br/>─────────────────────────<br/>Hackathon: You are a hackathon<br/>judge. Ask about technical<br/>implementation, feasibility,<br/>team dynamics."]

        LLM --> QA_FROM_LLM
        QA_FROM_LLM --> QA_FALLBACK
        MODE_SELECT --> QA_AGENT
    end

    subgraph SECTIONS["Section analysis"]
        SECTION_BEATS{"Mode determines beats"}
        SEC_VC["VC beats:<br/>intro, problem, solution,<br/>market, model, traction,<br/>team, ask"]
        SEC_EL["Elevator beats:<br/>intro, problem,<br/>solution, ask"]
        SEC_HK["Hackathon beats:<br/>intro, problem,<br/>demo, innovation,<br/>impact, ask"]

        SECTION_PATTERNS["Beat detection patterns<br/>sectioningService.ts<br/>demo: /demo|prototype|live|screen-share/<br/>innovation: /novel|innovative|creative|unique/<br/>impact: /impact|benefit|help|solve|improve/"]

        SECTION_SCORING["Per-section scoring<br/>BEAT_CATEGORY_PRIORITY:<br/>demo → evidence, clarity<br/>innovation → evidence, market<br/>impact → market, clarity"]

        SECTION_BEATS -->|"vc_pitch"| SEC_VC
        SECTION_BEATS -->|"elevator"| SEC_EL
        SECTION_BEATS -->|"hackathon"| SEC_HK
        SEC_HK --> SECTION_PATTERNS
        SECTION_PATTERNS --> SECTION_SCORING
        MODE_SELECT --> SECTION_BEATS
    end

    subgraph UI["Adaptive presentation"]
        UI_SCHEMA["Results page rendering<br/>SectionAccordion labels:<br/>demo → Demo<br/>innovation → Innovation<br/>impact → Impact<br/>SegmentedControl: 3 modes<br/>UseCaseStep: Trophy icon, 3 min"]
        RESULTS["Final output:<br/>- overall_score 0-100<br/>- rubric_breakdown 5 categories<br/>- section_feedback per beat<br/>- top_fixes ranked<br/>- rewrite_script<br/>- delivery_metrics<br/>- qa_1min pack<br/>- anti_pattern_hits<br/>- stage_expectations<br/>- historical_links"]

        RUBRIC_POLICY --> UI_SCHEMA
        SECTION_SCORING --> UI_SCHEMA
        QA_FALLBACK --> UI_SCHEMA
        UI_SCHEMA --> RESULTS
    end

    subgraph VC_FINDINGS["What the VC corpus found"]
        VC1["narrative_flow support 0.84"]
        VC2["clarity_of_story support 0.88"]
        VC3["proof_of_demand support 0.88"]
        VC4["market_case support 0.76"]
        VC5["fundraise_readiness support 0.28"]
        VC6["delivery_control support 0<br/>Deterministic, not corpus-mined"]
    end

    subgraph EL_FINDINGS["What the elevator corpus found"]
        EL1["instant_clarity support 0.9667"]
        EL2["problem_solution_fit support 0.5333"]
        EL3["credibility_signals support 1.0"]
        EL4["ask_precision support 0.7667"]
        EL5["memorability support 0.1"]
        EL6["delivery_control support 0<br/>Deterministic, not corpus-mined"]
    end

    subgraph HK_FINDINGS["What the hackathon corpus found"]
        HK1["demo_quality support N/A<br/>No transcripts yet — derived from<br/>10 winner patterns + 40 judging docs"]
        HK2["technical_credibility support N/A<br/>Pattern weight 1.1<br/>95% of winners showed working demo"]
        HK3["theme_alignment support N/A<br/>Pattern weight 1.2<br/>88% explicitly referenced theme"]
        HK4["wow_factor support N/A<br/>Mapped via ETHGlobal/MLH criteria<br/>Creativity appears in every rubric"]
        HK5["impact_clarity support N/A<br/>Pattern weight 1.0<br/>Concrete impact quantification"]
        HK6["delivery_energy support 0<br/>Deterministic, not corpus-mined<br/>targetWpm: 150, informal OK"]
    end

    subgraph RUBRIC_COMPARE["Rubric category comparison across modes"]
        RC_HEAD["Same 5 categories, different criteria"]
        RC_STRUCT["STRUCTURE 0-20<br/>─────────────────────────<br/>VC: Problem→Solution→Why Now→<br/>Traction→Market→Ask<br/>Penalize missing beats<br/>─────────────────────────<br/>Elevator: One-liner→Problem→<br/>Solution→Proof→Ask in 30s<br/>Penalize missing ask or proof<br/>─────────────────────────<br/>Hackathon: Hook→Problem→Demo→<br/>Innovation→Impact→Ask<br/>Penalize missing demo or no CTA"]

        RC_CLARITY["CLARITY 0-20<br/>─────────────────────────<br/>VC: Direct language, minimal jargon<br/>Every sentence earns its place<br/>─────────────────────────<br/>Elevator: Instantly understandable<br/>Investor gets it in 8 seconds<br/>─────────────────────────<br/>Hackathon: Judge understands what<br/>you built in one sentence<br/>Penalize jargon, unclear product"]

        RC_EVIDENCE["EVIDENCE 0-20<br/>─────────────────────────<br/>VC: Concrete metrics, milestones<br/>Reward users/revenue/growth<br/>─────────────────────────<br/>Elevator: One proof signal that<br/>survives investor scrutiny<br/>metric + timeframe + denominator<br/>─────────────────────────<br/>Hackathon: Working demo shown<br/>Technical credibility<br/>Penalize slides-only presentations"]

        RC_MARKET["MARKET 0-20<br/>─────────────────────────<br/>VC: TAM/SAM framing, competitors<br/>Clear moat or positioning edge<br/>─────────────────────────<br/>Elevator: Clear buyer, clear<br/>alternative, clear reason to win<br/>─────────────────────────<br/>Hackathon: Theme alignment<br/>Real-world impact, scalability<br/>Differentiation from other hacks"]

        RC_DELIVERY["DELIVERY 0-20<br/>─────────────────────────<br/>All modes: Deterministic formula<br/>delivery20 = 20 × weighted sum<br/>Same formula, different targets:<br/>  VC: 140 WPM, 110-130s window<br/>  Elev: 165 WPM, 25-35s window<br/>  Hack: 150 WPM, 150-210s window"]
    end

    subgraph SYSTEM_COMPARE["System prompt comparison"]
        SP_VC["VC system prompt:<br/>Startup pitch coach and<br/>investor evaluator<br/>Prioritize by impact on<br/>investor decision-making<br/>Grade against YC top-decile"]
        SP_EL["Elevator system prompt:<br/>Base + Judging 30-second<br/>elevator pitch where investors<br/>expect immediate clarity<br/>Skeptical investor lens:<br/>unclear business, vague traction,<br/>weak differentiation penalized"]
        SP_HK["Hackathon system prompt:<br/>Base + Judging 3-minute<br/>hackathon demo pitch<br/>Missing demo is single most<br/>damaging flaw<br/>Judges care about: Does it work?<br/>Is it creative? Does it solve<br/>a real problem?<br/>Do not apply investor/VC standards"]
    end

    VC_SEEDS -. "seeded manually" .-> VC_FINDINGS
    EL_SEEDS -. "seeded manually" .-> EL_FINDINGS
    HK_SEEDS -. "seeded from winner patterns + judging criteria" .-> HK_FINDINGS
    SIGNALS -. "derived from transcripts" .-> VC_FINDINGS
    SIGNALS -. "derived from transcripts" .-> EL_FINDINGS
    HK_SIGNALS -. "derived from metadata + judging docs" .-> HK_FINDINGS

    LIMIT["Important limitation<br/>VC and Elevator modes are corpus-grounded:<br/>transcripts validate and enrich mode schemas.<br/><br/>Hackathon mode is criteria-grounded:<br/>no transcripts yet — schema derived from<br/>60 winner metadata entries + 40 judging<br/>criteria docs + 10 extracted winner patterns.<br/><br/>All three share the same scoring pipeline,<br/>delivery formula, and composite score math.<br/>Differences are in: system prompt persona,<br/>rubric criteria text, beat structure,<br/>anti-pattern detection, hard gate caps,<br/>knowledge digest content, and Q&A persona."]

    VC_FINDINGS --> LIMIT
    EL_FINDINGS --> LIMIT
    HK_FINDINGS --> LIMIT

    classDef source fill:#10213d,stroke:#60a5fa,color:#eef2ff,stroke-width:1px;
    classDef seed fill:#2a1831,stroke:#ff5941,color:#fff1ee,stroke-width:1px;
    classDef derived fill:#112b20,stroke:#22c55e,color:#ecfff3,stroke-width:1px;
    classDef runtime fill:#251f12,stroke:#f59e0b,color:#fff8e8,stroke-width:1px;
    classDef note fill:#2c1620,stroke:#ef4444,color:#fff0f3,stroke-width:1px;
    classDef hackathon fill:#1a1040,stroke:#8b5cf6,color:#ede9fe,stroke-width:1px;

    class VC_RAW,EL_RAW source;
    class HK_RAW hackathon;
    class VC_SEEDS,EL_SEEDS seed;
    class HK_SEEDS hackathon;
    class BUILDER,SIGNALS,MODE_ARTIFACT,VC_FINDINGS,EL_FINDINGS derived;
    class HK_BUILDER,HK_SIGNALS,HK_FINDINGS hackathon;
    class MODE_SELECT,RUBRIC,PROJECT_CTX,LOAD_BASE,RUBRIC_AST,MERGE,RUNTIME_SCHEMA,CTX_RULES,USER_PROMPT,LLM,NORMALIZE_RUBRIC,DELIVERY_OVERRIDE,COMPOSITE,CALIBRATE,RUBRIC_POLICY,UI_SCHEMA,RESULTS,QA_FROM_LLM,QA_FALLBACK runtime;
    class SYS_VC,BENCHMARK_VC,SP_VC,VC_GATES,SEC_VC source;
    class SYS_HK,BENCHMARK_HK,SP_HK,HK_GATES,SEC_HK hackathon;
    class LIMIT note;
    class RC_HEAD,RC_STRUCT,RC_CLARITY,RC_EVIDENCE,RC_MARKET,RC_DELIVERY,SYSTEM_COMPARE,RUBRIC_COMPARE note;
    class NORMALIZE_TX,STAGE_SELECT,DELIVERY_CALC,BEAT_DETECT,ANTI_DETECT,STAGE_EXPECT,KNOWLEDGE,SCORING_CTX runtime;
    class QA_AGENT,SECTION_BEATS,SECTION_PATTERNS,SECTION_SCORING runtime;
    class HARD_GATES,SYS_SELECT,SECTION_BEATS runtime;
```
