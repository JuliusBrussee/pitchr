# Final Year Project Presentation — Rubric Research

**Date:** 2026-03-10
**Sources:** 154 across 7 research domains
**Purpose:** Evidence base for `final_year` mode in `analysis-profiles.ts`

---

## Research Coverage

| Domain | Sources | Key institutions |
|--------|---------|-----------------|
| University FYP rubrics | 26 | NUS, NTU, Swarthmore, HKUST, Sussex, Edinburgh |
| Oral defense criteria | 24 | HKUST, NTU, NUS, Waterloo, Grad Coach |
| IEEE/ACM/showcase competitions | 30 | ACM SRC, Regeneron ISEF, ASEE Capstone, Georgia Tech VIP |
| Transcripts/examples | 23 | T4Tutorials, NairaProject, DEV Community, ECHER, SpeechesHQ |
| Academic literature (peer-reviewed) | 12 | AAC&U VALUE Rubric, Van Ginkel 2017, Jonsson & Svingby 2007, Nofal 2022 |
| Q&A patterns | 25 | HKUST, NTU, NUS, UCSC, Philippine/Malaysian FYP rubrics |
| Scoring calibration | 14 | Edinburgh, Sussex, TCD, Melbourne, UTM, iRubric, UIUC |

---

## Decisive Cross-Research Findings

### 1. Commercial viability is absent from every non-entrepreneurship rubric

ACM SRC, ISEF, IEEE CASS, IEEE R10, ASEE Capstone, Georgia Tech VIP, NUS, NTU, HKUST, Edinburgh, Sussex, Melbourne, UTM, UIUC ECE 445, Trinity College Dublin — none include revenue, TAM, or investor readiness.

The question "Who would use this?" or "How can this be applied?" is the academic framing of impact — it is about **societal/practical utility, not commercial viability**.

### 2. Critical self-evaluation is the primary first-class differentiator

Consistent finding across Edinburgh Informatics, Sussex, NUS, NTU, Melbourne, and peer-reviewed rubric literature:

- **<60%:** Limitations not discussed or only mentioned superficially
- **60–69%:** Limitations acknowledged, some analysis
- **70%+:** Limitations critically analysed with implications; this is an EXPLICIT "additional criterion" at Edinburgh Informatics
- **80%+:** Adds originality/independent thought beyond stated objectives

> "The most reliable first-class marker is critical self-evaluation. Its absence caps a score at Upper Second." — Agent 6 synthesis

### 3. Quantitative results with baselines are mandatory

NTU SCSE: *"Without quantifiable outcomes, your project is not an engineering project."*
Swarthmore: Describe the graph → explain the axes → summarize what it MEANS vs. baseline.
HKUST Final Report: Results quality = 60% of report score.

Penalise vague claims ("system performs well"); reward metric + baseline + interpretation.

### 4. Justification of decisions separates grades

| Grade | Behaviour |
|-------|-----------|
| 70%+ | Explicitly JUSTIFIES methodology choices ("I chose X instead of Y because Z") |
| 60–69% | Describes methodology choices but does not analyse trade-offs |
| 50–59% | Lists decisions without rationale |

### 5. Limitations discussion is uniformly positive

Every rubric and literature source treats limitations discussion with implications analysis as a positive signal. Examiners expect it; its absence is penalised above 60%. Students who volunteer well-framed limitations score higher, not lower.

### 6. Originality/independent contribution gates 80%+

Edinburgh Informatics explicitly lists "evidence of outstanding merit/originality" as the 80–100% criterion. Sussex: 80–89% = "Exceptional", requiring originality. This is a gating factor, not a baseline criterion.

### 7. Q&A failure is the most damaging single event

Q&A cannot be directly measured from a transcript, but **inability to explain the system** is the primary Q&A failure — and this IS visible in the presentation text. Penalise presentations that do not explain the system at a level where an examiner could probe.

### 8. Delivery is necessary but cannot substitute for content

Nofal et al. 2022, Schiekirka et al.: equal content/delivery weighting is a documented validity threat. Delivery items outnumber content items → delivery can mask poor content. Content mastery must carry higher weight.

HKUST Oral Presentation = Demo/Result (40%) + Delivery (40%) + Q&A (20%). The 40% for Demo/Result is a content proxy measured at delivery time.

---

## Grade Differentiation Framework

| Factor | <50% | 50–59% | 60–69% | 70%+ | 80%+ |
|--------|------|--------|--------|------|------|
| Objectives | Not achieved | Modest, achieved | Moderate, substantially achieved | Demanding, fully achieved | Ambitious, fully achieved |
| Quantitative results | Absent | Vague | Present, some baselines | Concrete with baselines | Comprehensive, rigorous |
| Critical self-evaluation | Absent | Superficial | Present but shallow | Thorough and objective | Deep, generative insights |
| Methodology justification | Not present | Listed | Described | Analysed | Justified with trade-off analysis |
| Limitations | Not discussed | Mentioned | Acknowledged | Analysed | Critically analysed with implications |
| Originality | None | Minimal | Limited | Demonstrated | Outstanding / publishable |
| Delivery | Poor | Adequate | Clear | Professional | Excellent, authoritative |

---

## Presentation Structure (Confirmed Across 15+ Sources)

1. Title + greeting + roadmap (30 sec)
2. Motivation / problem statement
3. Related work (1–2 slides max — "Others did X but not Y")
4. Methodology (overview then zoom into 1–2 key decisions, NOT a full walkthrough)
5. **Results** (most time; quantify; compare to baselines; explain what graphs MEAN)
6. **Contributions** (explicit delineation of personal contribution vs. team/supervisor/prior work)
7. **Limitations** (brief but mandatory; framed analytically, not defensively)
8. Future work + Conclusion (merged; do NOT end on future work alone)
9. Backup slides (for Q&A)

NUS-specific: 2-minute live demo FIRST, before slides.

---

## Time Allocation Norms

| Format | Total length | Results allocation |
|--------|-----------|--------------------|
| Short (NUS/Swarthmore) | 10–15 min | ~3.5 min |
| Medium (NTU/NUS) | 20–25 min | ~7 min |
| Our target | 240s (4 min) | ~90s |

At 4 minutes, results + methodology together should fill roughly 60–65% of the presentation.

---

## Rubric Update Recommendations

### Criteria that must NOT appear
- Market size / TAM
- Revenue model or monetisation
- Commercial viability / investor readiness
- User acquisition / traction / ARR

### Criteria requiring academic reframing vs. vc_pitch
| vc_pitch framing | final_year framing |
|-----------------|-------------------|
| "We're disrupting X" | "My approach achieves X% vs. Y baseline" |
| Minimize limitations | Limitations with implications = positive |
| Traction = customers | Traction = evaluation metrics, test outcomes |
| Innovation = market edge | Innovation = novelty vs. prior work |
| Impact = revenue potential | Impact = societal utility, engineering contribution |

### Recommended rubric criterion updates

**STRUCTURE:** Add mandatory contributions delineation; limitations section must appear.
**CLARITY & COMMUNICATION:** Add jargon handling; non-specialist accessibility; no reading from slides.
**EVIDENCE & METHODOLOGY:** Reward quantitative results with baselines; reward limitations with analysis; penalise vague unmeasurable objectives; penalise unsupported claims.
**IMPACT & RELEVANCE:** Rename description to include originality; reward novelty vs. prior work; ambition of objectives matters; explicitly exclude commercial penalties.
**DELIVERY:** Add no-slides-reading; explanation clarity (Q&A-readiness proxy); time compliance.

### Scoring guidance additions
- 80+ requires: originality/independent contribution + critical self-evaluation + rigorous results
- 70–79: All criteria met, demanding objectives fully achieved, limitations critically discussed
- 60–69: Competent across all criteria, some critical depth lacking, modest objectives
- Limitations discussion with analysis of implications RAISES scores, not lowers
- Vague objectives that are not measurable should be penalised under Evidence & Methodology

---

## Sources Summary by Agent

### Agent 1 — IEEE/ACM/Showcase (30 sources)
ACM SRC, Regeneron ISEF, IEEE CASS, IEEE R10, Enactus, FIRST FLL, Georgia Tech VIP, ASEE Capstone frameworks, university science fairs. Commercial viability absent from all except explicit entrepreneurship competitions (Ursinus BEAR, KC STEM PLTW investor track). ISEF weights Interview at 25pts (highest single criterion), then Execution/Data at 20pts.

### Agent 2 — Oral Defense Q&A Patterns (24 sources)
T4Tutorials, NairaProject, ResearchWap, DEV Community, HKUST Q&A archive, NTU Nachiket, NUS GitHub, Waterloo, Grad Coach, EloquentScience, Paperpile, ECHER. Universal question #1: summarise project in a few sentences. Top failure: fumbling the opening summary question. "I don't know, but I would think X because Y" is better than confabulation.

### Agent 3 — University FYP Rubrics (26 sources)
NUS (2 GitHub gists), NTU Nachiket, Swarthmore CS, HKUST, Sussex, LSEUPR, PMC research article, SpeechesHQ, Paperpile, Waterloo, CSUSM, UNC, Ref-n-Write, SlidesAI. Universal structure confirmed. Contributions slide is mandatory. Results gets the most time in every time allocation breakdown.

### Agent 4 — Academic Literature (12 sources)
AAC&U VALUE Rubric, Van Ginkel et al. 2017 (11 criteria), Schiekirka et al. PMC (25-item/100pt, ICC 0.98), Norback-Utschig Georgia Tech, Jonsson & Svingby 2007 (75 rubric studies), Nofal et al. 2022 PMC, Mullins & Kiley (804 theses), Lingard et al. Equal weighting of delivery and content is a documented validity threat. Task-specific rubrics require more arbitration than generic rubrics. Peer raters grade 0.4–0.5 points higher than educators.

### Agent 5 — University Oral Defense Structures (25 sources)
RCampus iRubric, Philippine HEI, USM Malaysia, UCSC, PMC medical capstone, Edinburgh, Sussex, NTU Physics, HKUST, Academia.edu FYP innovation rubric. HKUST Oral = Demo 40% + Delivery 40% + Q&A 20%. Edinburgh exceptional criteria (80%+): originality, publication-worthy material. Sussex bands: 80–89% Exceptional, 70–79% Very Good, 60–69% Good.

### Agent 6 — Scoring Calibration (14 sources)
Sussex, Edinburgh Informatics, Edinburgh SPS/LLC, HKUST, NUS, PMC, UCSC, Trinity College Dublin, Westminster. TCD: Technical 50%, Literature 15%, Testing/Evaluation 15%, Problem statement 10%, Report presentation 10%. Grade differentiator matrix fully documented. Critical self-evaluation = most reliable first-class marker.

### Agent 7 — Multi-University FYP Rubric Details (30 sources)
HKUST CSE full grading scheme, NUS Computing/CEG, NTU SCSE, Melbourne BMEN/ENGR, Edinburgh, Sussex, UTM, UIUC ECE 445 (515 pts), iRubric databases, UCSC, GWU, SEECS NUST, UCL, Imperial. UIUC: Demonstration = 150pts (29.1% of course). NTU 8-criteria rubric with weighted multipliers. 6 criteria present in nearly every rubric: Technical Substance, Delivery, Communication/Clarity, Q&A, Visual Materials, Time Management.

---

## Source Appendix — All URLs

**Session:** `e88724be-cc43-4132-9bde-95a91e245a59` (4.3 MB)
**Fetched (read):** 255 | **Seen in search results:** 1,509 | **Search queries issued:** 260

---

### A. University FYP Rubrics (91 fetched)

| Source | URL |
|--------|-----|
| University College Cork — FYP Marking Guidelines | http://www.cs.ucc.ie/~jdoherty/files/FYPGradingGuidelines.pdf |
| NTU EEE FYP Student Guidelines 2009 (ReadBag) | http://www.readbag.com/www3-ntu-sg-eee-fyp-ptfyp-student-guideline-pt-student2009 |
| Innovation-enhanced rubrics for FYP (GJEE journal) | http://www.wiete.com.au/journals/GJEE/Publish/vol16no3/05-Sharef-N.pdf |
| NUS CEG — FYP Assessment Page | https://ceg.nus.edu.sg/fyp/assessment/ |
| NUS CEG — FYP Evaluator Form (PDF) | https://ceg.nus.edu.sg/wp-content/uploads/sites/4/2024/11/CEG-FYP_CA_Evaluator_wef2410.pdf |
| HKUST CEI — Assessment Rubric for Presentations (PDF) | https://cei.hkust.edu.hk/sites/default/files/content/assessment_rubric_for_presentation.pdf |
| CodeMint — Best Questions to Expect at FYP Defense Panel | https://codemint.net/post/best-questions-to-expect-at-your-final-year-project-defense-panel |
| CodeMint (Medium) — FYP Defense Questions | https://codemintbox.medium.com/best-questions-to-expect-at-your-final-year-project-defense-panel-a6eed00e1412 |
| UIUC ECE 445 — Final Presentation Guidelines | https://courses.grainger.illinois.edu/ece445/guidelines/final-presentation.asp |
| HKUST CSE — Oral Presentation Tips | https://cse.hkust.edu.hk/ct/fyp/presentations/presentation_tips.html |
| HKUST CSE — Previous Q&A Questions | https://cse.hkust.edu.hk/ct/fyp/presentations/q_all.html |
| HKUST CSE — FYP/FYT Grading Scheme 2025–2026 | https://cse.hkust.edu.hk/ug/fyp/grading/ |
| UET Engineering FYP Guide — Mechanical (Pakistan) | https://eesr.uet.edu.pk/wp-content/uploads/2020/03/fyp_guide_bok_mech-ksk__version.1.0.pdf |
| EProjectTopics — Why Students Fail FYP | https://eprojecttopics.com/the-reasons-why-students-fail-their-final-year-project/ |
| Medium (Fatima Yousif) — FYP Guide | https://fatima-yousif.medium.com/a-final-year-projects-fyp-guide-adfbc4893d61 |
| ERIC — Factors Affecting Inter-rater Reliability | https://files.eric.ed.gov/fulltext/EJ1280726.pdf |
| ERIC — Research & Practice in Assessment (journal article) | https://files.eric.ed.gov/fulltext/EJ1462710.pdf |
| NUS Computing — FYP Presentation Tips (GitHub Gist, Wei Tsang Ooi) | https://gist.github.com/weitsang/7332463 |
| University of Melbourne — ENGR90037 Assessment | https://handbook.unimelb.edu.au/2022/subjects/engr90037/assessment |
| University of Melbourne — BMEN90018 Assessment | https://handbook.unimelb.edu.au/2024/subjects/bmen90018/assessment |
| University of Edinburgh — Informatics Common Marking Scheme | https://informatics.ed.ac.uk/taught-students/all-students/your-studies/common-marking-scheme |
| Imperial College London — FYP Report Structure | https://intranet.ee.ic.ac.uk/t.clarke/projects/general/FYPR-Structure.pdf |
| Royal Holloway — Dissertation Assessment and Grading (85+) | https://intranet.royalholloway.ac.uk/history/documents/pdf/dissertationassessmentandgrading.pdf |
| Royal Holloway — MSc Dissertation Marking Criteria | https://intranet.royalholloway.ac.uk/mathematics/informationforcurrentstudents/msc/dissertation-markingcriteria.aspx |
| Springer — Assessment and Feedback in Final-Year Engineering Project | https://link.springer.com/chapter/10.1007/978-981-10-0908-2_12 |
| Medium (Writing For Research) — Top 10 PhD Oral Exam Questions | https://medium.com/advice-and-help-in-authoring-a-phd-or-non-fiction/top-ten-questions-for-the-phd-oral-exam-c3687cc75962 |
| Appalachian State MPA — Capstone Presentation Guidelines | https://mpa.appstate.edu/sites/mpa.appstate.edu/files/oral_presentation_guide_0.pdf |
| myfirstthesis — FYP Assessment & Dates | https://myfirstthesis.c23434.net/assessment/ |
| myfirstthesis — FYP Presentation | https://myfirstthesis.c23434.net/seminar/ |
| NTU SCE — FYP Oral Advice (Nachiket blog) | https://nachiket.github.io/advice/fyp_oral.html |
| ASEE — Generating Start-up Relevance in Capstone Projects | https://peer.asee.org/generating-start-up-relevance-in-capstone-projects.pdf |
| NTU personal page (Schng) — Undergraduate Students | https://personal.ntu.edu.sg/aseschng/UndergraduateStudents.html |
| University of Manchester EEE — Marks Scale and Descriptors | https://personalpages.manchester.ac.uk/staff/fumie.costen/pastwork/DATA/markingscheme/EEEUGMarksScaleDescriptors.pdf |
| PMC — Learning Oral Presentation Skills: A Rhetorical Analysis | https://pmc.ncbi.nlm.nih.gov/articles/PMC1495213/ |
| PMC — Assessing Capstone Research: Generic vs Domain-Specific Rubrics (Nofal 2022) | https://pmc.ncbi.nlm.nih.gov/articles/PMC8883397/ |
| Blog — NTU SoH/LMS FYP Experience/Review | https://pressingrealities.wordpress.com/2023/03/10/my-final-year-project-fyp-experience-review-as-a-soh-lms-undergrad/ |
| Trinity College Dublin — CS FYP Report Marking Sheet Sample | https://projects.scss.tcd.ie/wp-content/uploads/sites/3/2020/09/FYP-Report-Marking-Sheet-Sample.pdf |
| Johns Hopkins Public Health — Designing an Effective Capstone Presentation | https://publichealth.jhu.edu/sites/default/files/2021-09/designing-and-writing-an-effective-presentation.pdf |
| Medium (Raheel Siddiqui) — Building and Presenting Your FYP | https://rawheel.medium.com/step-by-step-guide-to-building-and-presenting-your-final-year-project-c54fba7bd6f5 |
| NUST SEECS — FYP Portal | https://seecs.nust.edu.pk/fyp/ |
| NUST SEECS — FYP Guidelines (PDF) | https://seecs.nust.edu.pk/wp-content/uploads/2020/06/FYP_Guidelines_02_11_2017_v1.4.pdf |
| JARSSET — Enhancing Conclusion Sections in FYP Presentations | https://semarakilmu.com.my/journals/index.php/applied_sciences_eng_tech/article/view/3384 |
| Sharon Bowling e-portfolio — PowerPoint Script for Final Project | https://sites.google.com/site/sharonbowlingeportfolio/hre474---evaluating-learning-technology/module-8-executive-summary-and-reference-sections-course-wrap-up-final-presentations/power-point-presentation-script-for-final-project |
| Tagore Engineering College — Project Rubrics and Guidelines | https://tagore-engg.ac.in/academics/ug/cse/pdf/PROJECT-%20RUBRICS%20AND%20GUIDELINES.pdf |
| University of Western Australia — BESE FYP Marking Criteria | https://teaching.csse.uwa.edu.au/bese/se-finalyear-marking.pdf |
| FutureLearn — Sample Oral Presentation Marking Criteria | https://ugc.futurelearn.com/uploads/files/8c/27/8c270193-4990-48ba-aade-07033c83e25b/Sample_feedback_forms.pdf |
| Michigan State University — Oral Presentations (Undergraduate Research) | https://urca.msu.edu/orals |
| VirtualSpeech — Speech Transition Words and Phrases | https://virtualspeech.com/blog/speech-transitions-words-phrases |
| Academia.edu — Innovation-enhanced Rubrics for FYP | https://www.academia.edu/10153713/Innovation_enhanced_rubrics_assessment_for_final_year_projects |
| Academia.edu — Oral Presentations: Signalling and Transition Words | https://www.academia.edu/43214244/ORAL_PRESENTATIONS_SIGNALLING_AND_TRANSITION_WORDS |
| University of Bristol — Marking Criteria and Scales | https://www.bristol.ac.uk/academic-quality/assessment/regulations-and-code-of-practice-for-taught-programmes/marking-criteria/ |
| Boston University — Oral Presentation Script | https://www.bu.edu/teaching-writing/files/2020/02/Oral-Presentations-Script.pdf |
| Classgist — Prepare for Your Project Defense | https://www.classgist.com/blogs/66/prepare-for-your-project-defense-with-these-common-questions-and-answers.aspx |
| College Sidekick — HKUST ChBE FYP Poster Presentation Rubric | https://www.collegesidekick.com/study-docs/4705499 |
| NUS Computing — Before Starting FYP | https://www.comp.nus.edu.sg/programmes/ug/project/fyp/before/ |
| NUS Computing — FYP Presentation | https://www.comp.nus.edu.sg/programmes/ug/project/fyp/presentation/ |
| Swarthmore CS — Final Project Presentation Guide | https://www.cs.swarthmore.edu/~newhall/cs97/s00/OralReport.html |
| Cambridge CST — The Dissertation | https://www.cst.cam.ac.uk/teaching/part-ii/projects/dissertation |
| CUHK — Understanding Capstone: Final Year Learning Experience | https://www.cuhk.edu.hk/clear/tnl/Capstone_Presentation.pdf |
| HKU DASE — B.Eng. Final Year Project Handbook | https://www.dase.hku.hk/f/page/866/4667/FYP_Handbook.pdf |
| Eduansa — Delivering an Awesome FYP Presentation | https://www.eduansa.com/final-year-project-presentation-and-defense/ |
| Eastern Illinois University — Scoring Rubric for Oral Presentations (Example #1) | https://www.eiu.edu/hpl/docs/Presentation%20Rubric.pdf |
| University of Glasgow — Guide to Code of Assessment 2025-26 | https://www.gla.ac.uk/media/Media_124293_smxx.pdf |
| Imperial College — Undergraduate Project Supervision / Marking Protocol | https://www.imperial.ac.uk/media/imperial-college/faculty-of-natural-sciences/education/Good-Practice-Case-Study--Marking-Protocol.pdf |
| University of Liverpool — Code of Practice on Assessment Appendix A | https://www.liverpool.ac.uk/media/livacuk/tqsd/code-of-practice-on-assessment/appendix_A_2011-12_cop_assess.pdf |
| MagicSlides — What is a Capstone Presentation? | https://www.magicslides.app/blog/what-is-a-capstone-presentation |
| NTU School of Biological Sciences — Final Year Project | https://www.ntu.edu.sg/sbs/admissions/programmes/undergraduate/resources-for-students/final-year-project |
| NTU SPMS Physics — FYP (Undergraduates) | https://www.ntu.edu.sg/spms/about-us/physics/undergrad/fyp |
| Quia — Presentation Transition Words and Phrases | https://www.quia.com/files/quia/users/jaratermann/_Oral_Skills_1/WK_8_stuff/Presentation_transition_words_and_phrases.pdf |
| RCampus — iRubric TX4C478 (100 Point Oral Presentation) | https://www.rcampus.com/rubricshowc.cfm?code=TX4C478&sp=yes |
| ResearchGate — FYP Poster Presentation Rubric Diagram | https://www.researchgate.net/figure/The-rubric-for-final-year-projects-poster-presentation-assessment-at-the-Department-of_fig1_311266497 |
| ResearchGate — Guidelines for FYP Assessment in Engineering | https://www.researchgate.net/publication/224088849_Guidelines_for_the_final_year_project_assessment_in_engineering |
| ResearchGate — Assessment and Feedback in Final-Year Engineering Project | https://www.researchgate.net/publication/304620784_Assessment_and_Feedback_in_the_Final-Year_Engineering_Project |
| Scribd — Final Year Project Assessment Rubric | https://www.scribd.com/document/156087616/Final-Year-Project-Assessment-Rubric |
| Scribd — FYP Evaluation Rubrics | https://www.scribd.com/document/375977280/Rubrics |
| Scribd — FYP Presentation Rubric PDF | https://www.scribd.com/document/447112129/FYP-PRESENTATION-RUBRIC-pdf |
| SlidesAI — Final Year Presentation Tips | https://www.slidesai.io/blog/final-year-presentation-tips |
| SlideShare — Example Script for Presenter | https://www.slideshare.net/denade/example-script-for-presenter |
| SOAS University of London — Marking Criteria Policy | https://www.soas.ac.uk/sites/default/files/2022-07/marking-criteria-policy.pdf |
| Studocu (Brunel) — CS3072/CS3605 FYP Presentation Guidelines | https://www.studocu.com/en-gb/document/brunel-university-london/computer-science-project/cs3072-cs3605-task-4-brief-fyp-presentation/24369053 |
| Studocu (UET Lahore) — Project Presentation III Evaluation Rubrics | https://www.studocu.com/row/document/university-of-engineering-and-technology-lahore/final-year-project-layout/assessment-criteria-for-third-presentation/52083167 |
| University of Sussex EI — MSc ACS Marking Criteria | https://www.sussex.ac.uk/ei/internal/forstudents/informatics/masters/dissertations/markingcriteriamsc_acs |
| University of Sussex EI — FYP Information for Students | https://www.sussex.ac.uk/ei/internal/forstudents/informatics/undergraduate/finalyearprojects/informationforstudents |
| University of Sussex EI — FYP Project Presentation | https://www.sussex.ac.uk/ei/internal/forstudents/informatics/undergraduate/finalyearprojects/projectpresentation |
| University of Sussex EI — FYP Report Marking Criteria | https://www.sussex.ac.uk/ei/internal/forstudents/informatics/undergraduate/finalyearprojects/reportmarkingcriteria |
| Trinity College Dublin — Exam Grades and Marks Explained 2024 | https://www.tcd.ie/media/tcd/science/pdfs/Exam-grades-and-marks-explained-2024.pdf |
| Uniliterate — Presentation Marking Criteria | https://www.uniliterate.com/wp-content/uploads/DP_00.00_PresentationMarkingCriteria_Public.pdf |
| Victoria University — Rubrics for Block Model | https://www.vu.edu.au/sites/default/files/Rubrics_developed_VU_BM_Feb19.pdf |
| NTU SCSE — FYP Assessment Guide | https://www3.ntu.edu.sg/scse/fyp/UsefulInfo/AssessmentGuide.pdf |
| NTU SCSE — Examining Responsibilities | https://www3.ntu.edu.sg/scse/fyp/UsefulInfo/ExaminingResponsibilities.pdf |
| NTU SCSE — SC409 FYP Useful Information | https://www3.ntu.edu.sg/scse/fyp/UsefulInfo/UsefulInformation1.htm |

---

### B. Oral Defense Q&A Patterns (88 fetched)

| Source | URL |
|--------|-----|
| Illinois State University Physics/PTE — Oral Defense Rubric | http://www.phy.ilstu.edu/pte/302%20projects/oral_report.pdf |
| College Board AP Research — 2022 Presentation & Oral Defense Scoring Guidelines | https://apcentral.collegeboard.org/media/pdf/ap22-sg-research-presentation.pdf |
| College Board AP Research — 2023 Scoring Guidelines | https://apcentral.collegeboard.org/media/pdf/ap23-sg-research-oral-presentation.pdf |
| College Board AP Research — 2024 Scoring Guidelines | https://apcentral.collegeboard.org/media/pdf/ap24-sg-research-oral-defense.pdf |
| College Board AP Research — 2025 Scoring Guidelines | https://apcentral.collegeboard.org/media/pdf/ap25-sg-research-oral-presentation.pdf |
| Ask MetaFilter — Turns of phrase for thesis defense | https://ask.metafilter.com/262569/Turns-of-phrase-for-thesis-defense-Help |
| BeMo Academic Consulting — 40 Thesis Defense Questions | https://bemoacademicconsulting.com/blog/thesis-defense-questions |
| Alliant University CTE — Rubrics for Dissertations | https://cte.alliant.edu/resources-for-teaching/assessment/rubrics-for-dissertations/ |
| DEV Community — 30 Common Project Defense Questions | https://dev.to/project_championz_9d9586c/how-to-ace-the-30-most-common-project-defense-questions-10kg |
| Dhaka International University — Thesis Defense Rubric | https://diu.edu/forms/2256-Thesis-Defense-Rubric.pdf |
| ECHER — PhD Defense Questions (What? Why? How?) | https://echer.org/defense-questions/ |
| USM Engineering — FYP Rubrics Mechatronic 2020-2021 | https://ee.eng.usm.my/images/04_UNDERGRADUATE/05_Documents/06_FYP_Rubrics/FYP_Assessment_Rubrics_2020-2021.pdf |
| Eloquent Science — Top 40 PhD Viva/Defense Questions | https://eloquentscience.com/2024/06/top-40-potential-questions-to-be-asked-in-a-phd-viva-or-defense/ |
| Elysium Pro — FYP Viva Voce Tips | https://elysiumpro.in/final-year-project-viva-voce/ |
| University of Florida Entomology — Written Thesis and Oral Defense | https://entnemdept.ufl.edu/notes/pdf/Thesis_paper_and_oral_defense_10_18.pdf |
| Grad Coach — Preparing for a Viva Voce | https://gradcoach.com/dissertation-thesis-defence/ |
| University of Miami Public Health — MS Thesis & PhD Oral Defense Rubric | https://graduatestudies.publichealth.med.miami.edu/_assets/pdf/current-students-pdf/eph810-oral-defense-assessment-form_03-21-23.pdf |
| University of Maine Honors — Rubric for Thesis and Reading List Oral Defense | https://honors.umaine.edu/resource/oral-defense-rubric/ |
| Springer — Purpose-driven oral examination: insights from doctoral viva examiners | https://link.springer.com/article/10.1007/s44217-023-00083-6 |
| MuhaiminAbdullah — Most Commonly Asked Questions in Thesis Defense | https://muhaiminabdullah.com/blog/questions-thesis-defense |
| My Paper Writers — Capstone Defense Preparation Guide | https://mypaperwriters.net/blog/how-to-prepare-for-a-capstone-project-defense/ |
| NairaProject — 25 Most Common Project/Dissertation/Thesis Defense Questions | https://nairaproject.com/blog/25-common-project-defense-questions.html |
| University of Calgary CPSC — Nasty PhD Viva Questions | https://pages.cpsc.ucalgary.ca/~saul/wiki/uploads/Chapter1/NastyPhDQuestions.html |
| Paperpile — How to Prepare an Excellent Thesis Defense | https://paperpile.com/g/thesis-defense/ |
| PDFCoffee — Rubric Oral Viva 20180920 | https://pdfcoffee.com/3-rubric-oral-viva-20180920-pdf-free.html |
| PDFCoffee — Oral Defense Rubric | https://pdfcoffee.com/oral-defense-rubric-pdf-free.html |
| Purdue Polytechnic — Rubric for Evaluating MS Thesis and Defense | https://polytechnic.purdue.edu/sites/default/files/files/GEC%2009%20Thesis%20and%20Defense%20Form%20Polytechnic%20v3.pdf |
| SAS Port — Preparing for the Viva: Assessment Criteria | https://port.sas.ac.uk/mod/book/view.php?id=1554&chapterid=1573 |
| Programmer2Programmer — Project Viva Q&A for MCA/BCA/BSc IT | https://programmer2programmer.net/live_projects/viva/project_viva_question_answer.aspx |
| Project-house — Top 25 Thesis Defense Questions and Answers | https://project-house.net/thesis-defense-questions-and-answers/ |
| Quizlet — Capstone Research Oral Defense Questions | https://quizlet.com/394744791/capstone-research-oral-defense-questions-flash-cards/ |
| ResearchPages Nigeria — 21 Compulsory Project Defense Questions | https://researchpages.com.ng/project-defense-questions-and-their-answers/ |
| RunMyResearch — 31 Academic Research Project Defense Questions | https://runmyresearch.com/2018/01/09/top-31-academic-research-project-defense-questions-answer/ |
| UNESA — Formulaic Phrases for Thesis/Dissertation Defense | https://s2pendidikanbahasainggris.fbs.unesa.ac.id/post/formulaic-phrases-for-thesisdissertation-defense-in-english |
| College Board (2017) — AP Research Oral Defense Scoring Guidelines | https://secure-media.collegeboard.org/ap/pdf/ap17-sg-research-presentation.pdf |
| OSU SENR — Presentation and Oral Defense (Undergraduate Honors) | https://senr.osu.edu/undergraduate/honors/presentationdefense |
| SpeechesHQ — 15 Thesis Defense Introduction Sample Speeches | https://speecheshq.com/thesis-defense-introduction-sample-speeches/ |
| University of Manchester CS — Third Year Project Vivas Notes | https://staff.cs.manchester.ac.uk/~fumie/internal/EEEUGvivaguidance.pdf |
| T4Tutorials — Final Year Project Viva Important Questions | https://t4tutorials.com/final-year-project-viva-important-questions/ |
| UniMAP — MMJ40304 FYP II Viva Rubric | https://tweechoon.unimap.edu.my/images/Courses/MMJ40304_sem1_2223/Rubric_Viva_FYP2.pdf |
| Indeed UK — A Guide to Answering PhD Viva Questions | https://uk.indeed.com/career-advice/interviewing/phd-viva-questions |
| University of Waterloo — Successful Defence Tips | https://uwaterloo.ca/current-graduate-students/academics/thesis-and-defence/successful-defence-tips |
| Wonderslide — Guide to Effective Thesis Defense Presentations | https://wonderslide.com/blog/guide-to-creating-effective-presentations-for-thesis-defenses/ |
| Writelerco — 50 Common Thesis Defense Questions | https://writelerco.com/50-common-thesis-defense-questions-and-how-to-answer-them/ |
| Writelerco — Ultimate List of 50+ Research Defense Questions | https://writelerco.com/the-ultimate-list-of-50-possible-research-defense-questions/ |
| Writelerco — Top 20 Must Know Research Defense Questions | https://writelerco.com/top-20-must-know-research-defense-questions/ |
| Academia.edu — Rubrics-Based Evaluation for FYP in Computer Science | https://www.academia.edu/5922622/Rubrics_Based_Evaluation_For_Final_Year_Project_In_Computer_Science |
| Andrews University — Dissertation/Thesis Defense Evaluation Rubric | https://www.andrews.edu/grad/au-dissertation-defense-evaluation-rubric-current.pdf |
| ArtistsWithAVision — Top 20 Questions Frequently Asked at Thesis Defense | https://www.artistswithavision.com/top-20-questions-frequently-asked-during-thesis-defense/ |
| University of Bristol Deaf Studies — Dissertation Marking Scheme | https://www.bristol.ac.uk/Depts/DeafStudiesTeaching/dissert/Marking%20Scheme.htm |
| Clark Atlanta University — Rubric for Successful Doctoral Dissertation Oral Defense | https://www.cau.edu/wp-content/uploads/2024/01/Rubric-for-a-Successful-PhD-Dissertation-Oral-Defense.pdf |
| College Transitions — 25 Thesis/Dissertation Defense Questions | https://www.collegetransitions.com/blog/thesis-defense-questions/ |
| Cambridge CST — Marking Scheme and Classing Convention | https://www.cst.cam.ac.uk/teaching/exams/marking-and-classing |
| De La Salle University — ACM Thesis Evaluation Form | https://www.dlsu.edu.ph/wp-content/uploads/2018/06/acm-f029-thesis-evaluation-form.pdf |
| Imperial College London Computing — Fourth Year | https://www.imperial.ac.uk/computing/current-students/course-admin/noticeboards/fourth-year/ |
| King's College London — Marking Framework | https://www.kcl.ac.uk/assets/policyzone/assessment/college-marking-framework.pdf |
| UNSW Physics — How to Survive a Thesis Defence | https://www.phys.unsw.edu.au/~jw/viva.html |
| Quora — What questions would you ask as a thesis defense judge? | https://www.quora.com/As-a-judge-panel-of-an-upcoming-thesis-defense-what-question-s-would-you-ask-regardless-of-the-project-being-presented-Why |
| RCampus — iRubric FX62562 (Oral Thesis Defense) | https://www.rcampus.com/rubricshowc.cfm?code=FX62562&sp=yes |
| RCampus — iRubric QXAXC56 (Research Project Oral Defense) | https://www.rcampus.com/rubricshowc.cfm?code=QXAXC56&sp=true |
| RCampus — iRubric S8377C (Graduate Engineering Presentation) | https://www.rcampus.com/rubricshowc.cfm?code=S8377C&sp=yes |
| ResearchGate — Questions for Thesis Defense Proposal | https://www.researchgate.net/post/What_sort_of_questions_should_I_expect_during_defence_proposal |
| ResearchGate (Michael Garlan) — Pre-Oral Defense Rubric | https://www.researchgate.net/profile/Michael-Garlan/publication/379924281_Title_Rubric_for_Pre-Oral_Defense/links/6621d46639e7641c0bd7a308/Title-Rubric-for-Pre-Oral-Defense.pdf |
| ResearchGate — Purpose-driven oral examination (Springer) | https://www.researchgate.net/publication/376614326_Purpose-driven_oral_examination_insights_from_doctoral_viva_examiners |
| ResearchWap Nigeria — Most Project Defense Questions | https://www.researchwap.com/post/most-project-defense-questions-and-steps-to-defend-your-project-with-recordable-success |
| Royal Veterinary College — Masters Research Project Reflective Oral Exam Marking Scheme | https://www.rvc.ac.uk/Media/Default/About/Academic%20Quality,%20Regulations%20and%20Procedures/Examiners%20and%20Assessment/Marking%20Scheme%20for%20Masters%20Research%20Project%20Reflective%20Oral%20Examinations.pdf |
| Scribd — Rubric Oral Viva 20180920 | https://www.scribd.com/document/403895696/3-Rubric-Oral-Viva-20180920 |
| Scribd — Rubric Viva Form DBA | https://www.scribd.com/document/406981336/Rubric-Viva-Form-DBA |
| Scribd — Criteria for Final Oral Defense | https://www.scribd.com/document/418979647/Criteria-for-Final-Oral-Defense |
| Scribd — Project Presentation Rubric (15/12/9/6 scale) | https://www.scribd.com/document/455228044/Rubric-Presentation |
| Scribd — Oral Defense Rubric | https://www.scribd.com/document/520923034/ORAL-DEFENSE-RUBRIC |
| Scribd — Oral Defense Rating Sheet | https://www.scribd.com/document/523617431/Oral-Defense-Rating-Sheet |
| Scribd — FYP Assessment Rubrics 2020-2021 | https://www.scribd.com/document/630125872/FYP-Assessment-Rubrics-2020-2021 |
| ServiceScape — 17 Thesis Defense Questions and How to Answer Them | https://www.servicescape.com/blog/17-thesis-defense-questions-and-how-to-answer-them |
| St. Louis University — PhD Dissertation Oral Defense Rubric | https://www.slu.edu/arts-and-sciences/theological-studies/student-resources/-pdf/dissertation-oral-defense-rubric-phd.pdf |
| SMU Psychology — Evaluation Rubric for M.A. Thesis/Ph.D. Dissertation Defense | https://www.smu.edu/-/media/Site/Dedman/Academics/Departments/Psychology/Graduate-Program/6_Evaluation_Scoring_Rubric_Thesis_Dissertation_Defense-v2.pdf |
| University of South Alabama — CIS 599/799 Thesis/Dissertation Defense Form | https://www.southalabama.edu/colleges/soc/resources/thesis-and-dissertation-defense-rubric.pdf |
| Studocu (Naples High School) — 2024 AP Research Oral Defense Judges Form | https://www.studocu.com/en-us/document/naples-high-school/ap-research/2024-ap-research-presentation-and-oral-defense-judges-form/84139041 |
| Studocu (UNC Charlotte) — AP Research Presentation & Oral Defense Rubric | https://www.studocu.com/en-us/document/university-of-north-carolina-at-charlotte/undergraduate-research/copy-of-ap-research-presentation-and-oral-defense-rubric/22485070 |
| Studocu (Iloilo PHINMA) — Common IT Capstone Defense Questions | https://www.studocu.com/ph/document/university-of-iloilo-phinma/bs-information-technology/commonly-asked-questions-during-an-it-capstone-project-final-defense/117837484 |
| Southern University — Dissertation/Thesis Oral Defense Questions | https://www.subr.edu/assets/subr/GradSchool/OralDefenseQuestions20130218.pdf |
| Taylor & Francis — What Examiners Do: What Thesis Students Should Know | https://www.tandfonline.com/doi/full/10.1080/02602938.2013.859230 |
| The Savvy Scientist — Common PhD Viva Questions | https://www.thesavvyscientist.com/common-phd-exam-questions/ |
| UCL — Student Assessment Criteria for Taught Programmes | https://www.ucl.ac.uk/teaching-learning/sites/teaching-learning/files/migrated-files/UCL_Assessment_Criteria_Guide.pdf |
| UET Mardan — FYP Manual 2024 | https://www.uetmardan.edu.pk/uetm/assets/files/downloads/fyp-manual-11.2024.pdf |
| University of North Florida Biology — Oral Thesis Defense Scoring Rubric | https://www.unf.edu/coas/biology/_files/Certified.Oral-Thesis-Defense-Scoring-Rubric.docx |
| University of New Orleans — Evaluation Rubric (Proposal & Defense) | https://www.uno.edu/media/10781/download |
| NTU SCSE — Instructions to FYP Oral Examination Candidates | https://www3.ntu.edu.sg/scse/fyp/UsefulInfo/Attending%20FYP%20Oral%20Examination.pdf |

---

### C. IEEE / ACM / Showcase Competitions (3 fetched from competition category)

| Source | URL |
|--------|-----|
| BYU Engineering Technology — Capstone Presentations Wiki | https://capstone.groups.et.byu.net/wikis/doku.php?id=project-wiki:assignments:all_year:presentations |
| HKUST CSE — FYP Oral Presentations and FYT Oral Defenses | https://cse.hkust.edu.hk/ct/fyp/presentations/ |
| NUS CS — FYP Final Presentation Tips (GitHub Gist, knmnyn) | https://gist.github.com/knmnyn/7f13300428a034d8fa96b82855243120 |

---

### D. Academic Literature — Peer-Reviewed (14 fetched)

| Source | URL |
|--------|-----|
| Springer ETRD — Rubric formats for formative assessment of oral presentation skills | https://link.springer.com/article/10.1007/s11423-021-10030-7 |
| Wiley Journal of Dental Education — Rubric for peer evaluation of oral presentations | https://onlinelibrary.wiley.com/doi/full/10.1002/jdd.13831 |
| ResearchGate — Oral Communication Skills in Higher Education: Performance-Based Evaluation Rubric | https://www.researchgate.net/publication/225406352_Oral_Communication_Skills_in_Higher_Education_Using_a_Performance-Based_Evaluation_Rubric_to_Assess_Communication_Skills |
| ResearchGate — Analysis and validation of a rubric to assess oral presentation skills (Van Ginkel 2017) | https://www.researchgate.net/publication/272180685_Analysis_and_validation_of_a_rubric_to_assess_oral_presentation_skills_in_university_contexts |
| ResearchGate — Building a presentation scoring system for engineers (Norback-Utschig) | https://www.researchgate.net/publication/290058318_Insights_into_the_process_of_building_a_presentation_scoring_system_for_engineers |
| ResearchGate — Rubrics for oral presentations in aerospace engineering education | https://www.researchgate.net/publication/299853234_Use_of_scoring_rubrics_for_evaluating_oral_presentations_in_aerospace_engineering_education |
| ResearchGate — Assessing Oral Presentation Performance: Designing a Rubric (Schiekirka) | https://www.researchgate.net/publication/316732566_Assessing_Oral_Presentation_Performance_Designing_a_Rubric_and_Testing_its_Validity_with_an_Expert_Group |
| ResearchGate — Assessment Tools and Rubrics for Capstone Projects in OBE (Nofal 2022) | https://www.researchgate.net/publication/342225863_Assessment_Tools_and_Rubrics_for_Evaluating_the_Capstone_Projects_in_Outcome_Based_Education |
| ResearchGate — Presentation Content Structuredness: How does It Affect the Audience? | https://www.researchgate.net/publication/358568472_Presentation_Content_Structuredness_How_does_It_Affect_the_Audience |
| ResearchGate — Evaluating oral presentations in engineering classes | https://www.researchgate.net/publication/3678991_Evaluating_oral_presentations_in_engineering_classes |
| ScienceDirect — Developing a Scoring Rubric for Resident Research Presentations (Schiekirka) | https://www.sciencedirect.com/science/article/abs/pii/S0022480407002120 |
| ScienceDirect Procedia CS — Assessment Tools and Rubrics for Capstone Projects in OBE | https://www.sciencedirect.com/science/article/pii/S1877050920313703 |
| Taylor & Francis — Interventions and facilitators of oral assessment in higher education: systematic review | https://www.tandfonline.com/doi/full/10.1080/02602938.2025.2504621 |
| Taylor & Francis — Oral Exams: A More Meaningful Assessment of Students' Understanding | https://www.tandfonline.com/doi/full/10.1080/26939169.2021.1914527 |

---

### E. Scoring Calibration / Grade Descriptors (49 fetched)

| Source | URL |
|--------|-----|
| UCL CS — Marking Criteria and Grade Descriptors (Fail–2:2) | http://www.cs.ucl.ac.uk/fileadmin/UCL-CS/students/documents/COMPS_ENG_Grade_Descriptor_1819.pdf |
| Cal State Fresno — Oral Presentation Scoring Guide | https://academics.fresnostate.edu/oie/documents/assesments/OralRubric.pdf |
| UNC Assessment — Oral Communication VALUE Rubric (AAC&U) | https://assessment.unc.edu/wp-content/uploads/sites/1284/2022/08/AACU_OC_ValueRubric.pdf |
| Barnard (MIT rubric) — Scoring Rubrics for Professional Presentations | https://barnard.edu/sites/default/files/inline-files/MIT_rubric-oral-presentation.pdf |
| BYU ET — Capstone Grading Wiki | https://capstone.groups.et.byu.net/wikis/doku.php?id=project-wiki:syllabus:grading |
| NC State CBE (Dr. Lisa Bullard) — Grading Rubric for Midsemester Presentation | https://cbe.ncsu.edu/bullard/senior-design/grading-rubric/ |
| UIUC ECE 445 — Presentation Evaluation Sheet | https://courses.grainger.illinois.edu/ece445/documents/grading_rubrics/PRES_evalsheet.pdf |
| UIUC ECE 445 — Full Grading Scheme | https://courses.grainger.illinois.edu/ece445/grading-scheme.asp |
| UC Santa Cruz CSP — Capstone Oral Presentation Rubric | https://csp.ucsc.edu/capstone-presentation-rubric-form/ |
| Alliant University CTE — Rubrics for Oral Presentations | https://cte.alliant.edu/resources-for-teaching/assessment/rubrics-for-oral-presentations/ |
| Oregon State University CTL — Oral Presentation Rubric | https://ctl.oregonstate.edu/sites/ctl.oregonstate.edu/files/individual_oral_presentation_rubric.pdf |
| SERC/Cloudfront — Rubric for Evaluating Senior Capstone Projects | https://d32ogoqmya1dw8.cloudfront.net/files/departments/program_assessment/rubric_evaluating_capstone_exp.doc |
| EcologyLab — CPSC 482 Capstone Final Presentation Rubric | https://ecologylab.net/courses/capstone/deliverables/capstone482FinalPresentationRubric1-2.pdf |
| ANU School of Engineering — Capstone Project Assessment Guide | https://eng.anu.edu.au/engage/capstone-design-project/information-students/assessment-guide-capstone-project |
| University of Kentucky Engineering — PhD Annual Review Rubrics | https://engr.uky.edu/sites/default/files/PhDAnnualReviewCheckList_Rubrics_V1.1_MOD.pdf |
| GWU CS SD 2023-24 — Capstone Presentations | https://gw-cs-sd-23-24.github.io/lectures/presentations.html |
| University of Exeter Humanities — Degree & Assessment Classification | https://intranet.exeter.ac.uk/humanities/studying/subjecthandbooks/drama/degreeassessmentclassification/ |
| University of Edinburgh LLC — English & Scottish Literature Grade Descriptors | https://llc.ed.ac.uk/english-literature/undergraduate/current/academic-matters/grade-descriptors |
| University of Edinburgh LLC — A3 (70–79) Grade Descriptor | https://llc.ed.ac.uk/english-literature/undergraduate/current/academic-matters/grade-descriptors/a3-70-79 |
| University of Cincinnati Medicine — Capstone and Thesis Evaluation Rubric | https://med.uc.edu/docs/default-source/default-document-library/capstone-or-thesis-evaluation-rubric.pdf?sfvrsn=97b8f169_0 |
| UNC OIRA — AAC&U Oral Communication VALUE Rubric | https://oira.unc.edu/wp-content/uploads/sites/297/2017/07/AACU_OC_ValueRubric.pdf |
| Queen's University OJS — CEEA 2012 Engineering Education Proceedings | https://ojs.library.queensu.ca/index.php/PCEEA/article/download/4619/4609 |
| University of Edinburgh Informatics — Open Course: DISS Project Assessment | https://opencourse.inf.ed.ac.uk/diss/project-assessment |
| ASEE — Successful Use of Rubrics to Assess Capstone Projects (AC-2010-359) | https://peer.asee.org/ac-2010-359-successful-use-of-rubrics-to-assess-student-performance-in-capstone-projects.pdf |
| ASEE — Examples of Rubrics for ABET Student Outcomes in Capstone | https://peer.asee.org/examples-of-rubrics-used-to-assess-abet-student-outcomes-in-a-capstone-course.pdf |
| ASEE — Improving Graduate Student Oral Presentations Through Peer Review | https://peer.asee.org/improving-graduate-student-oral-presentations-through-peer-review.pdf |
| ASEE — Rubric Development and Inter-rater Reliability (Jonsson & Svingby) | https://peer.asee.org/rubric-development-and-inter-rater-reliability-issues-in-assessing-learning-outcomes.pdf |
| ASEE — Using Rubrics for Assessment of Senior Design Projects | https://peer.asee.org/using-rubrics-for-the-assessment-of-senior-design-projects.pdf |
| PMC NCBI — Rubric for peer evaluation of oral presentations | https://pmc.ncbi.nlm.nih.gov/articles/PMC12372569/ |
| PMC NCBI — A Standardized Rubric to Evaluate Student Presentations (Schiekirka) | https://pmc.ncbi.nlm.nih.gov/articles/PMC2996761/ |
| Wageningen University — Assessing Oral Presentation Performance | https://research.wur.nl/en/publications/assessing-oral-presentation-performance-designing-a-rubric-and-te |
| Brunel University — Undergraduate Grade Descriptors | https://students.brunel.ac.uk/documents/Policies/Undergraduate-Grade-Descriptors.pdf |
| Ohio State University CSE — Rubric for Assessment of Oral Communication Skills | https://web.cse.ohio-state.edu/~soundarajan.1/abet/DIRASSMNT/byronsOralTeamPresRubric.html |
| AAC&U — VALUE Rubrics: Oral Communication | https://www.aacu.org/value/rubrics/value-rubrics-oral-communication |
| CSUN MSE — Oral Presentations Scoring Rubric | https://www.csun.edu/~bavarian/Courses/MSE%20227/Rubrics/Oral_Presentation.pdf |
| De Montfort University — Generic Undergraduate Mark Descriptors | https://www.dmu.ac.uk/documents/about-dmu-documents/quality-management-and-policy/academic-quality/learning-teaching-assessment/ug-mark-descriptors.pdf |
| Durham University — Common Awards Assessment Guidelines: Oral Presentations | https://www.durham.ac.uk/media/durham-university/departments-/common-awards/documents/assessment-documents/guidance-documents/Assessment-Guidelines_Oral-Presentations.pdf |
| Keele University — Generic Assessment Criteria Levels 3–6 | https://www.keele.ac.uk/media/keeleuniversity/policyzone20/studentandacademicservices/Generic%20Assessment%20Criteria%20-%20Levels%203-6%20-%20June%202023.pdf |
| Morris College — Capstone Grading and Presentation Rubric | https://www.morris.edu/Content/Uploads/Morris%20College/files/Capstone%20Grading%20and%20Presentation%20Rubric.pdf |
| University of Nottingham — Sociology & Social Policy Marking Criteria | https://www.nottingham.ac.uk/qualitymanual/2-documents/markingcriteriaexamples.pdf |
| RCampus — iRubric C6X945 (Capstone Project) | https://www.rcampus.com/rubricshowc.cfm?code=C6X945&sp=yes |
| Scribd — Thesis Defense Rubric PDF (Clark Atlanta) | https://www.scribd.com/document/667872036/2256-Thesis-Defense-Rubric |
| Sheffield Hallam University — University Grade Descriptor 2023-24 | https://www.shu.ac.uk/-/media/home/myhallam/university-life/rules-and-regs/study/grades-and-marks/university_grade_descriptors-23-24.pdf |
| University of Edinburgh SPS — Marking Descriptors | https://www.sps.ed.ac.uk/students/undergraduate/your-studies/assessment-regulations/marking-descriptors |
| University of Strathclyde — Guidance on Marking Assessments in UG and PGT | https://www.strath.ac.uk/media/ps/cs/gmap/academicaffairs/policies/Guidance_on_Marking_Assessments_in_UG_and_PGT_Courses.pdf |
| UCL Institute of Archaeology — IoA Marking Criteria and Rubrics | https://www.ucl.ac.uk/social-historical-sciences/sites/social_historical_sciences/files/ioa_guidance_on_marking_criteria_and_rubrics_for_ug_and_pgt_students.pdf |
| University of Wollongong — Understanding Marking Rubrics | https://www.uow.edu.au/student/support-services/academic-skills/online-resources/assessments/rubrics/ |
| University of Westminster — Grade Descriptors | https://www.westminster.ac.uk/sites/default/public-files/general-documents/Grading-Descriptors-May-2022.pdf |
| University of Essex — Undergraduate Marking Criteria | https://www1.essex.ac.uk/government/documents/current/Marking_Criteria_UG.pdf |

---

### F. General / Academic Presentation Guidance (10 fetched)

| Source | URL |
|--------|-----|
| Learna AI — Essential Academic Phrases for Research Papers and Presentations | https://ailearna.com/blog/essential-academic-phrases-for-research-papers-and-presentations |
| LSE Undergraduate Political Review — Conference Presentation Guide | https://blogs.lse.ac.uk/lseupr/2022/02/27/lseupr-conference-presentation-guide/ |
| Dartmouth Geisel School of Medicine — How to Create a Research Presentation | https://geiselmed.dartmouth.edu/nhinbre/wp-content/uploads/sites/57/2021/05/HowtoCreateaResearchPresentation_000-1.pdf |
| UNC Office for Undergraduate Research — Preparing Effective Presentations | https://our.unc.edu/share/present/preparing-effective-presentations/ |
| PMC — "Two Minutes More!" Preparing Slides for Conference Research Presentations | https://pmc.ncbi.nlm.nih.gov/articles/PMC9896115/ |
| West Virginia University — Creating an Effective Research Presentation | https://undergraduateresearch.wvu.edu/files/d/69ff131c-177e-4d8f-9059-d401e0b0a902/symp-presentation-prep-2020-v2.pdf |
| Academia.edu — Sample Presentation Script | https://www.academia.edu/25566647/Sample_presentation_script |
| CSUSM Communication & Media Studies — Preparing for an Academic Presentation | https://www.csusm.edu/communication/undergraduate-scholars-research/preparing_presentation.html |
| Ref-N-Write — Academic Phrases for Writing Results & Discussion Sections | https://www.ref-n-write.com/blog/results-and-discussion-academic-phrases/ |
| University of Sheffield — Marking Criteria Study Skills | https://www.sheffield.ac.uk/study-skills/assessment/literacy/marking-criteria |
