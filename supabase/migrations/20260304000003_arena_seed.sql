-- Arena seed data
-- Inserts scenarios and weekly challenges for all three difficulty tiers.
-- Run this against your Supabase project to get the Arena working immediately.

/* ====================================================================
   SCENARIOS — Starter (elevator pitches, 60s)
   ==================================================================== */

INSERT INTO scenarios (id, title, one_liner, industry, stage, difficulty, brief, pitch_type, time_limit_sec, read_time_sec, challenge_eligible, source, status)
VALUES

-- ─── STARTER 1 ───
(
  '11111111-1111-1111-1111-111111111101',
  'ShiftSync — Smart Shift Scheduling',
  'AI-powered shift scheduling that cuts manager time by 70%.',
  'HR Tech',
  'seed',
  'starter',
  '{
    "companyName": "ShiftSync",
    "oneLiner": "AI-powered shift scheduling that cuts manager time by 70%.",
    "industry": "HR Tech",
    "stage": "seed",
    "team": "2 ex-Homebase engineers + 1 ops hire. Founded 2024.",
    "metrics": {
      "revenue": "$18k MRR",
      "users": "120 SMBs",
      "growthRate": "15% MoM"
    },
    "market": {
      "tam": "$12B",
      "sam": "$2.1B",
      "som": "$180M"
    },
    "ask": {
      "amount": "$1.2M",
      "useOfFunds": "mid-market expansion + payroll integrations"
    },
    "differentiator": "Auto-generates conflict-free schedules from staff availability and local labor rules — no manual input required.",
    "weakness": "Crowded market; incumbents like Homebase and When I Work have strong distribution."
  }',
  'elevator',
  60,
  45,
  true,
  'synthetic',
  'approved'
),

-- ─── STARTER 2 ───
(
  '11111111-1111-1111-1111-111111111104',
  'Replate — Zero-Waste Restaurant Intelligence',
  'Replate predicts daily food demand for restaurants, cutting waste by 40% and saving $2,800/month per location.',
  'FoodTech',
  'pre_seed',
  'starter',
  '{
    "companyName": "Replate",
    "oneLiner": "Predicts daily food demand for restaurants, cutting waste by 40% and saving $2,800/month per location.",
    "industry": "FoodTech",
    "stage": "pre_seed",
    "team": "Ex-DoorDash data scientist + restaurant-operator-turned-founder. 3-person team. Founded 2025.",
    "metrics": {
      "revenue": "$6k MRR",
      "users": "34 restaurants on pilot",
      "growthRate": "22% MoM"
    },
    "market": {
      "tam": "$8.4B (restaurant analytics)",
      "sam": "$1.4B",
      "som": "$85M"
    },
    "ask": {
      "amount": "$750K",
      "useOfFunds": "POS integrations + hire 2 engineers"
    },
    "differentiator": "Plugs into any POS system and learns ordering patterns within 14 days — no hardware required.",
    "weakness": "Restaurants are notoriously hard to sell to; long sales cycles with high churn risk."
  }',
  'elevator',
  60,
  45,
  true,
  'synthetic',
  'approved'
),

-- ─── STARTER 3 ───
(
  '11111111-1111-1111-1111-111111111105',
  'Toolpath — AI-Powered CNC Programming',
  'Toolpath uses AI to auto-generate CNC machine code from CAD files, cutting programming time from hours to minutes.',
  'Manufacturing',
  'seed',
  'starter',
  '{
    "companyName": "Toolpath",
    "oneLiner": "AI auto-generates CNC machine code from CAD files, cutting programming time from hours to minutes.",
    "industry": "Manufacturing",
    "stage": "seed",
    "team": "Former Autodesk engineer + 4th-gen machinist. 4-person team. Founded 2024.",
    "metrics": {
      "revenue": "$28k MRR",
      "users": "45 machine shops",
      "growthRate": "18% MoM"
    },
    "market": {
      "tam": "$14B (CAM software)",
      "sam": "$3.2B",
      "som": "$220M"
    },
    "ask": {
      "amount": "$2M",
      "useOfFunds": "5-axis support + sales team of 3"
    },
    "differentiator": "Generative AI trained on 2M real G-code programs; handles 3-axis parts end-to-end without human editing.",
    "weakness": "Machinists are skeptical of AI-generated toolpaths; trust and safety validation is a major adoption barrier."
  }',
  'elevator',
  60,
  45,
  true,
  'synthetic',
  'approved'
),

-- ─── STARTER 4 ───
(
  '11111111-1111-1111-1111-111111111106',
  'PetRx — Veterinary Telehealth for Pet Parents',
  'PetRx connects pet owners with licensed vets in under 5 minutes for $29/visit — no appointment needed.',
  'HealthTech',
  'seed',
  'starter',
  '{
    "companyName": "PetRx",
    "oneLiner": "Connects pet owners with licensed vets in under 5 minutes for $29/visit — no appointment needed.",
    "industry": "HealthTech / Pet Care",
    "stage": "seed",
    "team": "Ex-Teladoc product lead + licensed veterinarian. 5-person team. Founded 2025.",
    "metrics": {
      "revenue": "$42k MRR",
      "users": "3,200 monthly active users",
      "growthRate": "25% MoM"
    },
    "market": {
      "tam": "$7.2B (US pet healthcare)",
      "sam": "$1.8B",
      "som": "$150M"
    },
    "ask": {
      "amount": "$1.5M",
      "useOfFunds": "Vet network expansion to 50 states + pharmacy partnerships"
    },
    "differentiator": "Median time-to-vet of 4.2 minutes with 98% satisfaction; built-in Rx fulfillment via partner pharmacies.",
    "weakness": "Regulatory patchwork — telehealth vet rules differ by state; 12 states still require in-person exams for prescriptions."
  }',
  'elevator',
  60,
  45,
  true,
  'synthetic',
  'approved'
),

-- ─── STARTER 5 ───
(
  '11111111-1111-1111-1111-111111111107',
  'Stackpay — Instant Contractor Payments',
  'Stackpay lets companies pay international contractors in 60 seconds with zero FX markup.',
  'Fintech',
  'seed',
  'starter',
  '{
    "companyName": "Stackpay",
    "oneLiner": "Pay international contractors in 60 seconds with zero FX markup.",
    "industry": "Fintech",
    "stage": "seed",
    "team": "Ex-Wise engineer + ex-Deel ops lead. 6-person team. Founded 2024.",
    "metrics": {
      "revenue": "$55k MRR",
      "users": "180 companies, 4,200 contractors",
      "growthRate": "20% MoM"
    },
    "market": {
      "tam": "$18B (cross-border payroll)",
      "sam": "$4.5B",
      "som": "$300M"
    },
    "ask": {
      "amount": "$2.5M",
      "useOfFunds": "Compliance licenses in 12 new markets + banking partnerships"
    },
    "differentiator": "Uses stablecoin rails for settlement, passing 100% of FX savings to customers — 3–5% cheaper than Deel or Remote.",
    "weakness": "Stablecoin regulatory uncertainty; some enterprise buyers are wary of crypto-adjacent infrastructure."
  }',
  'elevator',
  60,
  45,
  true,
  'synthetic',
  'approved'
),

-- ─── STARTER 6 ───
(
  '11111111-1111-1111-1111-111111111108',
  'Canopy — AI Study Planner for College Students',
  'Canopy creates personalized study schedules from syllabi and past grades, improving GPA by 0.4 points on average.',
  'EdTech',
  'pre_seed',
  'starter',
  '{
    "companyName": "Canopy",
    "oneLiner": "Creates personalized study schedules from syllabi and past grades, improving GPA by 0.4 points on average.",
    "industry": "EdTech",
    "stage": "pre_seed",
    "team": "2 Stanford CS undergrads. Launched from dorm room, 2025.",
    "metrics": {
      "revenue": "$4k MRR",
      "users": "8,500 students at 22 universities",
      "growthRate": "40% MoM"
    },
    "market": {
      "tam": "$6.3B (student productivity tools)",
      "sam": "$1.2B",
      "som": "$60M"
    },
    "ask": {
      "amount": "$500K",
      "useOfFunds": "LMS integrations (Canvas, Blackboard) + campus ambassador program"
    },
    "differentiator": "Ingests syllabus PDFs automatically and adapts study plans weekly based on actual performance — no manual setup.",
    "weakness": "Student willingness to pay is low; monetization likely depends on institutional sales or freemium conversion."
  }',
  'elevator',
  60,
  45,
  true,
  'synthetic',
  'approved'
),

/* ====================================================================
   SCENARIOS — Pro (VC pitches, 120s)
   ==================================================================== */

-- ─── PRO 1 ───
(
  '11111111-1111-1111-1111-111111111102',
  'AeroCarb — Direct Air Capture at Scale',
  'Modular DAC units that capture CO₂ at $180/ton — 5× cheaper than incumbent tech.',
  'CleanTech',
  'series_a',
  'pro',
  '{
    "companyName": "AeroCarb",
    "oneLiner": "Modular DAC units that capture CO₂ at $180/ton — 5× cheaper than incumbent tech.",
    "industry": "CleanTech",
    "stage": "series_a",
    "team": "2 MIT material scientists + ex-Climeworks COO. Founded 2023.",
    "metrics": {
      "revenue": "$4.2M offtake ARR",
      "users": "3 units deployed",
      "growthRate": "Path to $60/ton at 1 GW"
    },
    "market": {
      "tam": "$1.2T (carbon removal by 2050)",
      "sam": "$80B",
      "som": "$4B"
    },
    "ask": {
      "amount": "$18M",
      "useOfFunds": "50-unit pilot and manufacturing scale"
    },
    "differentiator": "Proprietary sorbent chemistry cuts capture cost to $180/ton today vs. $600–1,000/ton for incumbents.",
    "weakness": "High energy intensity per ton; dependent on cheap renewable electricity near deployment sites."
  }',
  'vc_pitch',
  120,
  60,
  true,
  'synthetic',
  'approved'
),

-- ─── PRO 2 ───
(
  '11111111-1111-1111-1111-111111111109',
  'Voxel Health — AI Radiology Co-Pilot',
  'Voxel detects 14 critical conditions on chest X-rays in under 10 seconds with radiologist-level accuracy.',
  'HealthTech',
  'series_a',
  'pro',
  '{
    "companyName": "Voxel Health",
    "oneLiner": "Detects 14 critical conditions on chest X-rays in under 10 seconds with radiologist-level accuracy.",
    "industry": "HealthTech",
    "stage": "series_a",
    "team": "Former Google Health research lead + chief of radiology at UCSF. 22-person team. Founded 2023.",
    "metrics": {
      "revenue": "$3.8M ARR",
      "users": "47 hospitals live",
      "growthRate": "12% MoM"
    },
    "market": {
      "tam": "$45B (medical imaging AI)",
      "sam": "$8B",
      "som": "$900M"
    },
    "ask": {
      "amount": "$22M",
      "useOfFunds": "FDA 510(k) for 6 new modalities + international expansion"
    },
    "differentiator": "Multi-finding detection in a single scan — competitors do one condition at a time. 97.3% sensitivity validated across 1.2M images.",
    "weakness": "FDA clearance timelines are unpredictable; each new modality requires a separate regulatory submission."
  }',
  'vc_pitch',
  120,
  60,
  true,
  'synthetic',
  'approved'
),

-- ─── PRO 3 ───
(
  '11111111-1111-1111-1111-111111111110',
  'Terravolt — Grid-Scale Battery Recycling',
  'Terravolt recovers 95% of lithium, cobalt, and nickel from dead EV batteries at half the cost of mining virgin materials.',
  'CleanTech',
  'series_a',
  'pro',
  '{
    "companyName": "Terravolt",
    "oneLiner": "Recovers 95% of lithium, cobalt, and nickel from dead EV batteries at half the cost of mining virgin materials.",
    "industry": "CleanTech / Battery Recycling",
    "stage": "series_a",
    "team": "Ex-Redwood Materials process engineer + ex-Tesla battery pack designer. 16-person team. Founded 2023.",
    "metrics": {
      "revenue": "$6.1M ARR",
      "users": "4 OEM contracts (2 signed LOIs)",
      "growthRate": "3× year-over-year"
    },
    "market": {
      "tam": "$25B (battery recycling by 2035)",
      "sam": "$5.5B",
      "som": "$800M"
    },
    "ask": {
      "amount": "$30M",
      "useOfFunds": "Second processing facility in Nevada + R&D on sodium-ion recycling"
    },
    "differentiator": "Hydrometallurgical process works on all cathode chemistries (NMC, LFP, NCA) — competitors are chemistry-specific.",
    "weakness": "Capital-intensive buildout; each new facility is $15M+ and takes 18 months to reach full throughput."
  }',
  'vc_pitch',
  120,
  60,
  true,
  'synthetic',
  'approved'
),

-- ─── PRO 4 ───
(
  '11111111-1111-1111-1111-111111111111',
  'Quorum — Real-Time Board Intelligence',
  'Quorum gives corporate boards a live dashboard of governance risk, compliance gaps, and ESG exposure — replacing static PDF board packs.',
  'Enterprise SaaS',
  'seed',
  'pro',
  '{
    "companyName": "Quorum",
    "oneLiner": "Live governance dashboard for corporate boards — replaces static PDF board packs with real-time risk intelligence.",
    "industry": "Enterprise SaaS / GovTech",
    "stage": "seed",
    "team": "Ex-Diligent VP Product + former SEC enforcement attorney. 8-person team. Founded 2024.",
    "metrics": {
      "revenue": "$1.1M ARR",
      "users": "18 boards (avg. deal size $62K)",
      "growthRate": "15% MoM"
    },
    "market": {
      "tam": "$9.4B (board management software)",
      "sam": "$2.8B",
      "som": "$350M"
    },
    "ask": {
      "amount": "$8M",
      "useOfFunds": "SOC 2 Type II + enterprise sales team + EU expansion"
    },
    "differentiator": "Pulls live data from SEC, ESG, and internal systems into a single pane — boards see risk changes in real time, not quarterly.",
    "weakness": "Boards are ultra-conservative buyers; sales cycles average 6–9 months and require CISO sign-off."
  }',
  'vc_pitch',
  120,
  60,
  true,
  'synthetic',
  'approved'
),

-- ─── PRO 5 ───
(
  '11111111-1111-1111-1111-111111111112',
  'Freightmind — AI Freight Brokerage',
  'Freightmind matches shippers with carriers in seconds using AI, cutting empty miles by 30% and broker margins by half.',
  'Logistics',
  'series_a',
  'pro',
  '{
    "companyName": "Freightmind",
    "oneLiner": "AI-powered freight brokerage that matches shippers with carriers in seconds, cutting empty miles by 30%.",
    "industry": "Logistics",
    "stage": "series_a",
    "team": "Ex-Convoy head of marketplace + ex-Uber Freight ML lead. 28-person team. Founded 2023.",
    "metrics": {
      "revenue": "$14M gross revenue ($2.8M net revenue)",
      "users": "420 shippers, 6,100 carriers",
      "growthRate": "110% YoY net revenue"
    },
    "market": {
      "tam": "$800B (US freight)",
      "sam": "$120B (brokered freight)",
      "som": "$5B"
    },
    "ask": {
      "amount": "$25M",
      "useOfFunds": "Automated dispatch platform + Southeast US carrier expansion"
    },
    "differentiator": "Real-time pricing engine updates every 15 minutes using GPS, weather, and demand signals — 8% more accurate than legacy brokers.",
    "weakness": "Razor-thin margins typical of freight brokerage; take rate is 20% vs. 40% for traditional brokers. Must rely on volume."
  }',
  'vc_pitch',
  120,
  60,
  true,
  'synthetic',
  'approved'
),

-- ─── PRO 6 ───
(
  '11111111-1111-1111-1111-111111111113',
  'Crestline — Wealth Management for Millennials',
  'Crestline offers tax-optimized portfolio management for $100K–$2M portfolios at 0.25% — half the cost of traditional advisors.',
  'Fintech',
  'series_a',
  'pro',
  '{
    "companyName": "Crestline",
    "oneLiner": "Tax-optimized portfolio management for $100K–$2M portfolios at 0.25% AUM — half the cost of traditional advisors.",
    "industry": "Fintech / Wealth Management",
    "stage": "series_a",
    "team": "Ex-Wealthfront portfolio strategist + ex-Goldman Sachs quant. 14-person team. Founded 2024.",
    "metrics": {
      "revenue": "$2.4M ARR",
      "users": "$340M AUM across 1,800 clients",
      "growthRate": "18% MoM AUM growth"
    },
    "market": {
      "tam": "$40B (US wealth management fees)",
      "sam": "$12B (mass affluent segment)",
      "som": "$1.2B"
    },
    "ask": {
      "amount": "$15M",
      "useOfFunds": "Direct indexing engine + RIA licenses in 12 states"
    },
    "differentiator": "AI tax-loss harvesting runs intraday, not daily — captures 40% more tax alpha than competitors like Betterment or Wealthfront.",
    "weakness": "Wealth management is a trust-driven sale; brand-new entrants struggle against incumbents with decades of track record."
  }',
  'vc_pitch',
  120,
  60,
  true,
  'synthetic',
  'approved'
),

/* ====================================================================
   SCENARIOS — Expert (VC pitches, 180s)
   ==================================================================== */

-- ─── EXPERT 1 ───
(
  '11111111-1111-1111-1111-111111111103',
  'Axon Logistics — Autonomous Supply Chain OS',
  'An AI operating system that predicts supply disruptions 6 weeks out with 94% accuracy.',
  'Supply Chain',
  'series_a',
  'expert',
  '{
    "companyName": "Axon Logistics",
    "oneLiner": "An AI operating system that predicts supply disruptions 6 weeks out with 94% accuracy.",
    "industry": "Supply Chain",
    "stage": "series_a",
    "team": "Ex-Google DeepMind lead + ex-Amazon Supply Chain VP. 18-person team. Founded 2022.",
    "metrics": {
      "revenue": "$9.2M ARR",
      "users": "11 Fortune 500 customers",
      "growthRate": "140% NRR"
    },
    "market": {
      "tam": "$31B (supply chain software)",
      "sam": "$6B",
      "som": "$600M"
    },
    "ask": {
      "amount": "$55M",
      "useOfFunds": "APAC expansion and autonomous execution layer"
    },
    "differentiator": "Multi-modal AI fuses satellite imagery, AIS shipping data, weather, and news for 6-week disruption forecasts — no competitor has this data breadth.",
    "weakness": "APAC data availability is thinner; model accuracy may drop in early deployments outside North America and Europe."
  }',
  'vc_pitch',
  180,
  90,
  true,
  'synthetic',
  'approved'
),

-- ─── EXPERT 2 ───
(
  '11111111-1111-1111-1111-111111111114',
  'Synthara — Foundation Models for Drug Discovery',
  'Synthara designs novel small-molecule drug candidates in silico, cutting preclinical timelines from 4 years to 9 months.',
  'Biotech',
  'series_b',
  'expert',
  '{
    "companyName": "Synthara",
    "oneLiner": "Designs novel small-molecule drug candidates in silico, cutting preclinical timelines from 4 years to 9 months.",
    "industry": "Biotech / AI Drug Discovery",
    "stage": "series_b",
    "team": "Former head of Insilico Medicine + Nobel-adjacent computational chemist from ETH Zurich. 45-person team. Founded 2022.",
    "metrics": {
      "revenue": "$18M ARR (pharma partnerships)",
      "users": "6 top-20 pharma partners, 2 internal programs in IND-enabling studies",
      "growthRate": "3 new pharma deals/quarter"
    },
    "market": {
      "tam": "$70B (preclinical drug development)",
      "sam": "$12B",
      "som": "$2B"
    },
    "ask": {
      "amount": "$80M",
      "useOfFunds": "2 internal programs through Phase I + wet lab expansion in Boston"
    },
    "differentiator": "Proprietary 400B-parameter chemistry model trained on 2.1B compounds; generates synthesizable molecules with predicted ADMET properties, not just binding affinity.",
    "weakness": "AI-designed molecules still fail in vivo at ~70% rate; the model accelerates but doesn''t eliminate clinical risk. Pharma partners may build in-house."
  }',
  'vc_pitch',
  180,
  90,
  true,
  'synthetic',
  'approved'
),

-- ─── EXPERT 3 ───
(
  '11111111-1111-1111-1111-111111111115',
  'Orbital Materials — AI-Designed Industrial Materials',
  'Orbital uses generative AI to design new alloys and composites, delivering materials with 2× strength-to-weight in 8 weeks vs. 18 months.',
  'Deep Tech / Materials Science',
  'series_a',
  'expert',
  '{
    "companyName": "Orbital Materials",
    "oneLiner": "Generative AI designs new alloys and composites — 2× strength-to-weight ratio in 8 weeks vs. 18 months of traditional R&D.",
    "industry": "Deep Tech / Materials Science",
    "stage": "series_a",
    "team": "Ex-DeepMind AlphaFold researcher + MIT materials science professor. 20-person team. Founded 2023.",
    "metrics": {
      "revenue": "$5.4M ARR",
      "users": "8 aerospace and defense contracts",
      "growthRate": "180% YoY"
    },
    "market": {
      "tam": "$52B (advanced materials)",
      "sam": "$8B",
      "som": "$1.2B"
    },
    "ask": {
      "amount": "$40M",
      "useOfFunds": "Automated synthesis lab + FAA certification for 3 aerospace alloys"
    },
    "differentiator": "AI model predicts material properties from atomic structure; automated lab synthesizes and validates within 8 weeks — 10× faster than traditional trial-and-error.",
    "weakness": "Certification timelines in aerospace (FAA) and defense (ITAR) are multi-year; revenue from these sectors will lag significantly behind R&D spend."
  }',
  'vc_pitch',
  180,
  90,
  true,
  'synthetic',
  'approved'
),

-- ─── EXPERT 4 ───
(
  '11111111-1111-1111-1111-111111111116',
  'Lattice Robotics — Humanoid Robots for Warehouses',
  'Lattice builds humanoid robots that pick, pack, and palletize in existing warehouses with zero infrastructure changes.',
  'Robotics',
  'series_b',
  'expert',
  '{
    "companyName": "Lattice Robotics",
    "oneLiner": "Humanoid robots that pick, pack, and palletize in existing warehouses — zero infrastructure changes required.",
    "industry": "Robotics / Logistics",
    "stage": "series_b",
    "team": "Ex-Boston Dynamics locomotion lead + ex-Amazon Robotics principal engineer. 60-person team. Founded 2022.",
    "metrics": {
      "revenue": "$12M ARR (RaaS model)",
      "users": "22 warehouses, 140 deployed units",
      "growthRate": "4× YoY unit deployments"
    },
    "market": {
      "tam": "$65B (warehouse automation)",
      "sam": "$18B",
      "som": "$3B"
    },
    "ask": {
      "amount": "$120M",
      "useOfFunds": "Scale to 1,000 units + open European manufacturing"
    },
    "differentiator": "Retrofits into any warehouse without racking or conveyor changes; learns new SKU handling in under 4 hours via imitation learning.",
    "weakness": "Hardware margins are thin (~30%); unit economics only work at 500+ deployed units. Manufacturing scale-up risk is high."
  }',
  'vc_pitch',
  180,
  90,
  true,
  'synthetic',
  'approved'
),

-- ─── EXPERT 5 ───
(
  '11111111-1111-1111-1111-111111111117',
  'NeuralPay — Fraud Detection That Learns in Real Time',
  'NeuralPay stops payment fraud 200ms before authorization with a self-learning model that adapts to new attack patterns in minutes, not months.',
  'Fintech / Cybersecurity',
  'series_b',
  'expert',
  '{
    "companyName": "NeuralPay",
    "oneLiner": "Stops payment fraud 200ms before authorization with a self-learning model that adapts to new attack patterns in minutes, not months.",
    "industry": "Fintech / Cybersecurity",
    "stage": "series_b",
    "team": "Ex-Stripe head of risk + ex-Palantir ML architect. 38-person team. Founded 2022.",
    "metrics": {
      "revenue": "$22M ARR",
      "users": "9 payment processors, $180B transaction volume monitored",
      "growthRate": "150% NRR, 95% gross margin"
    },
    "market": {
      "tam": "$38B (fraud prevention)",
      "sam": "$9B",
      "som": "$1.5B"
    },
    "ask": {
      "amount": "$65M",
      "useOfFunds": "Real-time graph network expansion + acquiring a compliance-as-a-service startup"
    },
    "differentiator": "Online learning updates fraud models every 90 seconds using transaction graph signals — incumbents like Featurespace retrain weekly.",
    "weakness": "False positive rate of 0.8% is industry-competitive but costs merchants ~$2M/year in declined legitimate transactions at current volume."
  }',
  'vc_pitch',
  180,
  90,
  true,
  'synthetic',
  'approved'
),

-- ─── EXPERT 6 ───
(
  '11111111-1111-1111-1111-111111111118',
  'Aether Space — Satellite Constellation for Global IoT',
  'Aether deploys 200 low-orbit nanosats providing sub-second IoT connectivity anywhere on Earth for $0.01/message.',
  'Space Tech / IoT',
  'series_b',
  'expert',
  '{
    "companyName": "Aether Space",
    "oneLiner": "200 low-orbit nanosats providing sub-second IoT connectivity anywhere on Earth for $0.01 per message.",
    "industry": "Space Tech / IoT",
    "stage": "series_b",
    "team": "Ex-SpaceX constellation architect + ex-Swarm Technologies CTO. 52-person team. Founded 2021.",
    "metrics": {
      "revenue": "$8.5M ARR",
      "users": "24 enterprise customers (agriculture, shipping, mining)",
      "growthRate": "200% YoY"
    },
    "market": {
      "tam": "$75B (satellite IoT by 2035)",
      "sam": "$12B",
      "som": "$2B"
    },
    "ask": {
      "amount": "$150M",
      "useOfFunds": "Launch remaining 140 sats (3 Falcon 9 rideshares) + ground station build-out"
    },
    "differentiator": "Proprietary inter-satellite mesh links eliminate ground station dependency — data routes through the constellation itself for sub-second latency anywhere.",
    "weakness": "Massive capex upfront; break-even requires 180+ operational sats. Launch delays or failures could push profitability out by 2+ years."
  }',
  'vc_pitch',
  180,
  90,
  true,
  'synthetic',
  'approved'
)

ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  title = EXCLUDED.title,
  one_liner = EXCLUDED.one_liner,
  industry = EXCLUDED.industry,
  stage = EXCLUDED.stage,
  difficulty = EXCLUDED.difficulty,
  brief = EXCLUDED.brief,
  pitch_type = EXCLUDED.pitch_type,
  time_limit_sec = EXCLUDED.time_limit_sec,
  read_time_sec = EXCLUDED.read_time_sec;

/* ====================================================================
   CHALLENGES
   Week 10 2026 = 2026-03-02 → 2026-03-08  (ACTIVE — current week)
   Week 11 2026 = 2026-03-09 → 2026-03-15  (upcoming)
   Week 12 2026 = 2026-03-16 → 2026-03-22  (upcoming)
   ==================================================================== */

INSERT INTO challenges (scenario_id, week_number, year, title, description, challenge_type, bonus_criteria, starts_at, ends_at, status, participant_count)
VALUES

-- Week 10 — ACTIVE
(
  '11111111-1111-1111-1111-111111111101',
  10,
  2026,
  'Week 10 Challenge: The 60-Second Hire',
  'You have one minute to convince an angel investor to schedule a follow-up call. Clear problem, crisp solution, proof it works — go.',
  'elevator',
  '{"keyword_bonus": {"keywords": ["schedule", "manager", "shift", "MRR", "traction"], "points_per_keyword": 2, "max_points": 10}, "time_bonus": {"under_sec": 58, "points": 5}}',
  '2026-03-02T00:00:00.000Z',
  '2026-03-08T23:59:59.999Z',
  'active',
  0
),

-- Week 11 — upcoming
(
  '11111111-1111-1111-1111-111111111102',
  11,
  2026,
  'Week 11 Challenge: Carbon at Scale',
  'Make the case for AeroCarb to a climate VC in two minutes. Cost curves, corporate buyers, and a credible path to gigaton scale.',
  'vc_pitch',
  '{"keyword_bonus": {"keywords": ["cost per ton", "offtake", "sorbent", "gigaton", "Series A"], "points_per_keyword": 2, "max_points": 10}, "time_bonus": {"under_sec": 115, "points": 5}}',
  '2026-03-09T00:00:00.000Z',
  '2026-03-15T23:59:59.999Z',
  'upcoming',
  0
),

-- Week 12 — upcoming
(
  '11111111-1111-1111-1111-111111111103',
  12,
  2026,
  'Week 12 Challenge: The Supply Chain OS',
  'Three minutes, a Series B audience, and a $55M ask. Show you understand the enterprise buyer, the technical moat, and the APAC opportunity.',
  'vc_pitch',
  '{"keyword_bonus": {"keywords": ["disruption", "NRR", "Fortune 500", "autonomous", "APAC"], "points_per_keyword": 2, "max_points": 10}, "time_bonus": {"under_sec": 170, "points": 5}}',
  '2026-03-16T00:00:00.000Z',
  '2026-03-22T23:59:59.999Z',
  'upcoming',
  0
)

ON CONFLICT (week_number, year) DO NOTHING;
