(function () {
    "use strict";

    console.log("📊 CareerForge Interview Report loaded.");

    // =========================================================
    // SESSION / REPORT
    // =========================================================

    function getReport() {
        if (!window.CareerForgeSession) {
            console.error("❌ CareerForgeSession is not available.");
            return null;
        }

        const session = window.CareerForgeSession.getSession();

        return session?.interview?.report || null;
    }

    const report = getReport();

    if (!report) {
        showMissingReport();
        return;
    }

    console.log("📊 Interview report:", report);


    // =========================================================
    // HELPERS
    // =========================================================

    function escapeHTML(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function formatDate(value) {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    }


    function formatScore(value) {
        const score = Number(value);

        if (Number.isNaN(score)) {
            return "—";
        }

        return score.toFixed(1);
    }


    function calculateOverallScore() {
        const technical = Number(report.overall_technical_score);
        const communication = Number(report.overall_communication_score);

        if (
            Number.isNaN(technical) ||
            Number.isNaN(communication)
        ) {
            return null;
        }

        return ((technical + communication) / 2) * 10;
    }


    function formatProficiency(level) {
        if (!level) {
            return "Not specified";
        }

        return String(level)
            .replace(/_/g, " ")
            .replace(/\b\w/g, char => char.toUpperCase());
    }


    function showToast(message, icon = "check_circle") {
        const toast = document.getElementById("toast");
        const toastMessage = document.getElementById("toast-msg");
        const toastIcon = document.getElementById("toast-icon");

        if (!toast) {
            return;
        }

        if (toastMessage) {
            toastMessage.textContent = message;
        }

        if (toastIcon) {
            toastIcon.textContent = icon;
        }

        toast.classList.remove("hidden");
        toast.classList.remove("translate-y-2");

        setTimeout(() => {
            toast.classList.add("translate-y-2");

            setTimeout(() => {
                toast.classList.add("hidden");
            }, 300);
        }, 2500);
    }


    // =========================================================
    // HEADER
    // =========================================================

    function renderHeader() {

        const headerTarget = document.querySelector(
            "header .hidden.xl\\:flex"
        );

        if (headerTarget) {
            headerTarget.innerHTML = `
                <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span class="font-label-code text-label-code text-on-surface uppercase tracking-wider font-semibold">
                    Target: ${escapeHTML(report.target_role || "Target Role")}
                </span>
            `;
        }


        // Candidate name
        const candidateNameElements = document.querySelectorAll(
            "header .hidden.sm\\:flex span:first-child"
        );

        candidateNameElements.forEach(element => {
            element.textContent =
                report.candidate_name || "Candidate";
        });


        // Session ID
        const sessionIdElement = findTextElement("SESSION ID #CC-8492");

        if (sessionIdElement) {
            sessionIdElement.textContent =
                `SESSION ID #${report.interview_id || "—"}`;
        }


        // Header report title
        const title = document.querySelector(
            "main h1"
        );

        if (title) {
            title.textContent =
                `Interview Performance Report: ${report.target_role || "Interview"}`;
        }


        // Completed date
        const completionContainer = findTextElement("Completed Today");

        if (completionContainer) {
            const parent = completionContainer.closest("span");

            if (parent) {
                parent.innerHTML = `
                    <span class="material-symbols-outlined text-base text-secondary">
                        check_circle
                    </span>
                    Completed ${escapeHTML(formatDate(report.completed_at))}
                `;
            }
        }


        // Question count
        const questionElement =
            findTextElement("5 / 5 Questions Evaluated");

        if (questionElement) {
            const parent = questionElement.closest("span");

            if (parent) {
                parent.innerHTML = `
                    <span class="material-symbols-outlined text-base">
                        fact_check
                    </span>
                    ${escapeHTML(String(report.total_questions_answered || 0))}
                    Questions Evaluated
                `;
            }
        }
    }


    function findTextElement(text) {
        const elements = document.querySelectorAll("span");

        for (const element of elements) {
            if (element.textContent.trim() === text) {
                return element;
            }
        }

        return null;
    }


    // =========================================================
    // TOP READINESS / GAP INDICATOR
    // =========================================================

    function renderTopStats() {

        const gaps = Array.isArray(report.confirmed_skill_gaps)
            ? report.confirmed_skill_gaps.length
            : 0;

        const overallScore = calculateOverallScore();

        const statsContainer =
            document.querySelector(
                "header .hidden.lg\\:flex"
            );

        if (!statsContainer) {
            return;
        }

        statsContainer.innerHTML = `
            <div class="flex items-center gap-space-xs px-space-sm py-space-2xs rounded-full bg-surface-container-low">
                <span class="font-label-code text-label-code text-secondary font-bold">
                    ${overallScore !== null ? Math.round(overallScore) : "—"}% INTERVIEW SCORE
                </span>
                <span class="text-outline-variant">•</span>
                <span class="font-label-code text-label-code text-tertiary font-bold">
                    ${gaps} GAPS
                </span>
            </div>

            <button
                class="flex items-center gap-space-2xs px-space-sm py-space-2xs rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm transition-colors"
                type="button"
                id="copilot-prompt-btn">

                <span class="material-symbols-outlined text-base">
                    bolt
                </span>

                <span>Copilot Prompt</span>
            </button>
        `;

        document
            .getElementById("copilot-prompt-btn")
            ?.addEventListener("click", () => {
                showToast(
                    "Use the confirmed gaps below to guide your next preparation steps."
                );
            });
    }


    // =========================================================
    // REPORT HEADER
    // =========================================================

    function renderReportHeader() {

        const headerSection =
            document.querySelector("main section");

        if (!headerSection) {
            return;
        }

        const badges =
            headerSection.querySelectorAll(
                "span.font-label-code"
            );

        badges.forEach(element => {
            if (
                element.textContent.includes("SESSION ID")
            ) {
                element.textContent =
                    `SESSION ID #${report.interview_id || "—"}`;
            }
        });

        const heading =
            headerSection.querySelector("h1");

        if (heading) {
            heading.textContent =
                `Interview Performance Report: ${report.target_role || "Interview"}`;
        }

        const metadata =
            headerSection.querySelector(
                ".flex.flex-wrap.items-center.gap-x-space-md"
            );

        if (metadata) {

            metadata.innerHTML = `
                <span class="flex items-center gap-space-2xs text-on-surface">
                    <span class="material-symbols-outlined text-base text-secondary">
                        check_circle
                    </span>
                    Completed ${escapeHTML(formatDate(report.completed_at))}
                </span>

                <span>•</span>

                <span class="flex items-center gap-space-2xs">
                    <span class="material-symbols-outlined text-base">
                        fact_check
                    </span>
                    ${escapeHTML(String(report.total_questions_answered || 0))}
                    Questions Evaluated
                </span>

                <span>•</span>

                <span class="flex items-center gap-space-2xs">
                    <span class="material-symbols-outlined text-base">
                        assessment
                    </span>
                    Technical ${escapeHTML(formatScore(report.overall_technical_score))}/10
                </span>

                <span>•</span>

                <span class="font-label-code text-label-code text-primary bg-primary/10 px-space-xs py-0.5 rounded">
                    Communication ${escapeHTML(formatScore(report.overall_communication_score))}/10
                </span>
            `;
        }
    }


    // =========================================================
    // OVERALL SCORE
    // =========================================================

    function renderOverallScore() {
    const overallScore = calculateOverallScore();

    const scoreCard =
        document.querySelector(
            "main section:nth-of-type(2) > div:first-child"
        );

    if (!scoreCard) {
        return;
    }

    // ---------------------------------------------------------
    // Main score
    // ---------------------------------------------------------

    const scoreNumber =
        scoreCard.querySelector(".font-display-hero");

    if (scoreNumber) {
        scoreNumber.textContent =
            overallScore !== null
                ? Math.round(overallScore)
                : "—";
    }


    // ---------------------------------------------------------
    // Circular gauge percentage
    // ---------------------------------------------------------

    const scorePercent =
        scoreCard.querySelector(
            "svg .text-secondary"
        )?.nextElementSibling;

    /*
     * Safer fallback:
     * Find the absolute percentage span directly.
     */
    const gaugePercent =
        scoreCard.querySelector(
            "div.relative.w-20.h-20 span.absolute"
        );

    if (gaugePercent) {
        gaugePercent.textContent =
            overallScore !== null
                ? `${Math.round(overallScore)}%`
                : "—";
    }


    // ---------------------------------------------------------
    // Circular gauge
    // ---------------------------------------------------------

    const radial =
        scoreCard.querySelector(
            "path.text-secondary"
        );

    if (radial && overallScore !== null) {
        radial.setAttribute(
            "stroke-dasharray",
            `${overallScore}, 100`
        );
    }


    // ---------------------------------------------------------
    // Tier text
    // ---------------------------------------------------------

    const tier =
        scoreCard.querySelector(
            ".font-title-md"
        );

    if (tier) {
        tier.textContent =
            "Interview Performance";
    }


    // ---------------------------------------------------------
    // Tier badge
    // ---------------------------------------------------------

    const tierRow =
        scoreCard.querySelector(
            ".my-space-md"
        );

    if (tierRow) {

        const tierBadge =
            tierRow.querySelector(
                ".font-label-code.text-tertiary"
            );

        if (tierBadge) {
            tierBadge.textContent =
                `${report.total_questions_answered || 0} questions evaluated`;
        }
    }


    // ---------------------------------------------------------
    // Technical / Communication information
    // ---------------------------------------------------------
    // IMPORTANT:
    // Target the bottom performance row, NOT the circular gauge.
    // ---------------------------------------------------------

    const performanceRow =
        scoreCard.querySelector(
            ".my-space-md + .flex.flex-col"
        );

    if (performanceRow) {

        const improvement =
            performanceRow.querySelector(
                ".text-secondary.font-label-code"
            );

        if (improvement) {
            improvement.innerHTML = `
                <span class="material-symbols-outlined text-sm">
                    assessment
                </span>

                <span>
                    Technical ${escapeHTML(
                        formatScore(
                            report.overall_technical_score
                        )
                    )}/10
                    ·
                    Communication ${escapeHTML(
                        formatScore(
                            report.overall_communication_score
                        )
                    )}/10
                </span>
            `;
        }

        const paragraphs =
            performanceRow.querySelectorAll("p");

        paragraphs.forEach(paragraph => {
            paragraph.textContent =
                "This score is derived from the technical and communication evaluations returned by the interview evaluator.";
        });
    }
}


    // =========================================================
    // EXECUTIVE SUMMARY
    // =========================================================

    function renderExecutiveSummary() {

        const summarySection =
            document.querySelector(
                "main section:nth-of-type(2) > div:nth-child(2)"
            );

        if (!summarySection) {
            return;
        }

        const heading =
            summarySection.querySelector("h3");

        if (heading) {
            heading.textContent =
                report.executive_summary ||
                "No executive summary was generated.";
        }


        const paragraphs =
            summarySection.querySelectorAll("p");

        paragraphs.forEach((paragraph, index) => {

            if (index === 0) {
                paragraph.textContent =
                    "AI-generated synthesis based on the completed interview.";
            }
        });


        const rubric =
            summarySection.querySelector(
                ".font-label-code.text-on-surface-variant"
            );

        if (rubric) {
            rubric.innerHTML = `
                <span class="material-symbols-outlined text-sm text-primary">
                    auto_awesome
                </span>
                Interview Evaluation
            `;
        }


        // Remove fake quick-stat cards
        const stats =
            summarySection.querySelector(
                ".grid.grid-cols-3"
            );

        if (stats) {

            const strengths =
                Array.isArray(report.strengths)
                    ? report.strengths
                    : [];

            const gaps =
                Array.isArray(report.confirmed_skill_gaps)
                    ? report.confirmed_skill_gaps
                    : [];

            stats.innerHTML = `
                <div class="flex flex-col">
                    <span class="font-label-badge text-label-badge text-on-surface-variant uppercase">
                        Technical
                    </span>

                    <span class="font-title-md text-title-md text-secondary font-bold">
                        ${escapeHTML(formatScore(report.overall_technical_score))}/10
                    </span>

                    <span class="font-label-code text-label-code text-on-surface-variant">
                        Evaluated
                    </span>
                </div>

                <div class="flex flex-col">
                    <span class="font-label-badge text-label-badge text-on-surface-variant uppercase">
                        Communication
                    </span>

                    <span class="font-title-md text-title-md text-primary font-bold">
                        ${escapeHTML(formatScore(report.overall_communication_score))}/10
                    </span>

                    <span class="font-label-code text-label-code text-on-surface-variant">
                        Evaluated
                    </span>
                </div>

                <div class="flex flex-col">
                    <span class="font-label-badge text-label-badge text-on-surface-variant uppercase">
                        Confirmed Gaps
                    </span>

                    <span class="font-title-md text-title-md text-tertiary font-bold">
                        ${gaps.length}
                    </span>

                    <span class="font-label-code text-label-code text-on-surface-variant">
                        ${strengths.length} strengths
                    </span>
                </div>
            `;
        }
    }


    // =========================================================
    // DOMAIN COMPETENCY SECTION
    // =========================================================

    function renderCompetencySection() {

        const sections =
            document.querySelectorAll("main section");

        let competencySection = null;

        sections.forEach(section => {
            if (
                section.textContent.includes(
                    "Domain Competency Rubric"
                )
            ) {
                competencySection = section;
            }
        });

        if (!competencySection) {
            return;
        }

        const description =
            competencySection.querySelector("p");

        if (description) {
            description.textContent =
                "The current interview report provides aggregate technical and communication scores rather than domain-specific competency scores.";
        }


        const weightedScore =
            competencySection.querySelector(
                ".font-label-code.text-on-surface-variant"
            );

        if (weightedScore) {
            const overallScore = calculateOverallScore();

            weightedScore.textContent =
                overallScore !== null
                    ? `Overall Score: ${Math.round(overallScore)} / 100`
                    : "Overall Score: —";
        }


        const cards =
            competencySection.querySelector(
                ".grid.grid-cols-1.md\\:grid-cols-2"
            );

        if (!cards) {
            return;
        }

        cards.innerHTML = `
            <div class="md:col-span-2 p-space-lg rounded-xl bg-surface-container/70">

                <div class="grid grid-cols-1 md:grid-cols-2 gap-space-lg">

                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-title-md text-title-md text-on-surface font-semibold">
                                Technical Performance
                            </span>

                            <span class="font-label-code text-label-code text-secondary font-bold">
                                ${escapeHTML(formatScore(report.overall_technical_score))}/10
                            </span>
                        </div>

                        <div class="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                            <div
                                class="bg-secondary h-full rounded-full"
                                style="width:${Math.max(
                                    0,
                                    Math.min(
                                        Number(report.overall_technical_score) * 10,
                                        100
                                    )
                                )}%">
                            </div>
                        </div>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-title-md text-title-md text-on-surface font-semibold">
                                Communication Performance
                            </span>

                            <span class="font-label-code text-label-code text-primary font-bold">
                                ${escapeHTML(formatScore(report.overall_communication_score))}/10
                            </span>
                        </div>

                        <div class="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                            <div
                                class="bg-primary h-full rounded-full"
                                style="width:${Math.max(
                                    0,
                                    Math.min(
                                        Number(report.overall_communication_score) * 10,
                                        100
                                    )
                                )}%">
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        `;
    }


    // =========================================================
    // STRENGTHS / GROWTH AREAS
    // =========================================================

    function renderStrengthsAndGrowth() {

        const sections =
            document.querySelectorAll("main section");

        let targetSection = null;

        sections.forEach(section => {
            if (
                section.textContent.includes(
                    "What You Executed Well"
                )
            ) {
                targetSection = section;
            }
        });

        if (!targetSection) {
            return;
        }

        const columns =
            targetSection.children;

        if (!columns || columns.length < 2) {
            return;
        }

        const strengthsColumn = columns[0];
        const growthColumn = columns[1];


        // -----------------------------
        // Strengths
        // -----------------------------

        const strengths =
            Array.isArray(report.strengths)
                ? report.strengths
                : [];

        const strengthsContainer =
            strengthsColumn.querySelector(
                ".flex.flex-col.gap-space-md:last-child"
            );

        if (strengthsContainer) {

            strengthsContainer.innerHTML =
                strengths.length
                    ? strengths.map((strength, index) => `
                        <div class="p-space-md rounded-lg bg-surface-container flex items-start gap-space-sm">

                            <div class="w-7 h-7 rounded-full bg-secondary/15 flex items-center justify-center text-secondary shrink-0">
                                <span class="material-symbols-outlined text-base">
                                    check
                                </span>
                            </div>

                            <div>
                                <p class="font-body-sm text-body-sm text-on-surface leading-relaxed">
                                    ${escapeHTML(strength)}
                                </p>
                            </div>

                        </div>
                    `).join("")
                    : `
                        <div class="p-space-md rounded-lg bg-surface-container">
                            <p class="font-body-sm text-body-sm text-on-surface-variant">
                                No strengths were recorded.
                            </p>
                        </div>
                    `;
        }


        // -----------------------------
        // Growth Areas
        // -----------------------------

        const growthAreas =
            Array.isArray(report.growth_areas)
                ? report.growth_areas
                : [];

        const growthContainer =
            growthColumn.querySelector(
                ".flex.flex-col.gap-space-md:last-child"
            );

        if (growthContainer) {

            growthContainer.innerHTML =
                growthAreas.length
                    ? growthAreas.map(area => `
                        <div class="p-space-md rounded-lg bg-surface-container flex items-start gap-space-sm">

                            <div class="w-7 h-7 rounded-full bg-tertiary/15 flex items-center justify-center text-tertiary shrink-0">
                                <span class="material-symbols-outlined text-base">
                                    priority_high
                                </span>
                            </div>

                            <div>
                                <p class="font-body-sm text-body-sm text-on-surface leading-relaxed">
                                    ${escapeHTML(area)}
                                </p>
                            </div>

                        </div>
                    `).join("")
                    : `
                        <div class="p-space-md rounded-lg bg-surface-container">
                            <p class="font-body-sm text-body-sm text-on-surface-variant">
                                No development areas were recorded.
                            </p>
                        </div>
                    `;
        }
    }


    // =========================================================
    // CONFIRMED SKILL GAPS / CAREER BRIDGE
    // =========================================================

    function renderCareerBridge() {

        const sections =
            document.querySelectorAll("main section");

        let bridge = null;

        sections.forEach(section => {
            if (
                section.textContent.includes(
                    "Career Analysis & Target Role Gap Connections"
                )
            ) {
                bridge = section;
            }
        });

        if (!bridge) {
            return;
        }

        const gaps =
            Array.isArray(report.confirmed_skill_gaps)
                ? report.confirmed_skill_gaps
                : [];


        const paragraph =
            bridge.querySelector("p");

        if (paragraph) {
            paragraph.textContent =
                "The following skill gaps were confirmed during the interview and can be used as inputs for your career development roadmap.";
        }


        const grid =
            bridge.querySelector(
                ".grid.grid-cols-1.md\\:grid-cols-2"
            );

        if (!grid) {
            return;
        }


        if (gaps.length === 0) {

            grid.innerHTML = `
                <div class="md:col-span-2 p-space-xl rounded-xl bg-surface-container-low">

                    <div class="flex items-center gap-space-sm">

                        <div class="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
                            <span class="material-symbols-outlined">
                                check_circle
                            </span>
                        </div>

                        <div>
                            <h3 class="font-title-md text-title-md text-on-surface font-bold">
                                No confirmed skill gaps
                            </h3>

                            <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">
                                The interview did not confirm additional skill gaps.
                            </p>
                        </div>

                    </div>

                </div>
            `;

            return;
        }


        grid.innerHTML = gaps.map((gap, index) => {

            const skillName =
                gap.skill_name ||
                gap.skill_id ||
                "Unknown Skill";

            return `
                <div class="p-space-lg rounded-xl bg-surface-container-low flex flex-col gap-space-md shadow-md">

                    <div class="flex items-center justify-between gap-space-sm">

                        <span class="px-space-xs py-0.5 rounded font-label-badge text-label-badge uppercase bg-tertiary/20 text-tertiary font-bold">
                            Confirmed Gap #${index + 1}
                        </span>

                        <span class="font-label-code text-label-code text-on-surface-variant">
                            ${escapeHTML(formatProficiency(gap.proficiency_level))}
                        </span>

                    </div>


                    <div>
                        <h3 class="font-title-md text-title-md text-on-surface font-bold">
                            ${escapeHTML(skillName)}
                        </h3>

                        <p class="font-label-code text-label-code text-on-surface-variant mt-1">
                            ${escapeHTML(gap.skill_id || "")}
                        </p>
                    </div>


                    <div>

                        <span class="font-label-badge text-label-badge text-on-surface-variant uppercase">
                            Interview Evidence
                        </span>

                        <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mt-2">
                            ${escapeHTML(
                                gap.evidence ||
                                "No evidence summary provided."
                            )}
                        </p>

                    </div>


                    <div class="p-space-sm rounded-lg bg-surface-container-highest/60">

                        <span class="font-label-badge text-label-badge text-primary uppercase">
                            Recommended Focus
                        </span>

                        <p class="font-body-sm text-body-sm text-on-surface font-medium mt-2">
                            ${escapeHTML(
                                gap.recommended_focus ||
                                "No recommendation provided."
                            )}
                        </p>

                    </div>

                </div>
            `;

        }).join("");
    }


    // =========================================================
    // QUESTION-BY-QUESTION SECTION
    // =========================================================

    function renderQuestionSection() {

        const sections =
            document.querySelectorAll("main section");

        let questionSection = null;

        sections.forEach(section => {
            if (
                section.textContent.includes(
                    "Detailed Question-by-Question Evaluation"
                )
            ) {
                questionSection = section;
            }
        });

        if (!questionSection) {
            return;
        }


        const description =
            questionSection.querySelector("p");

        if (description) {
            description.textContent =
                "Detailed question transcripts and turn-level evaluations are not included in the current report response.";
        }


        const toggle =
            document.getElementById(
                "toggle-all-questions"
            );

        if (toggle) {
            toggle.style.display = "none";
        }


        const container =
            document.getElementById(
                "questions-container"
            );

        if (!container) {
            return;
        }


        container.innerHTML = `
            <div class="p-space-lg rounded-xl bg-surface-container">

                <div class="flex items-start gap-space-sm">

                    <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span class="material-symbols-outlined">
                            info
                        </span>
                    </div>

                    <div>

                        <h3 class="font-title-md text-title-md text-on-surface font-semibold">
                            Detailed turn data is not available
                        </h3>

                        <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mt-1">
                            The current InterviewReport response contains
                            aggregate scores, strengths, growth areas, and
                            confirmed skill gaps. Individual questions,
                            transcripts, audio replay data, and turn-level
                            evaluations are not included in the report payload.
                        </p>

                    </div>

                </div>

            </div>
        `;
    }


    // =========================================================
    // NEXT STEPS
    // =========================================================

    function renderNextSteps() {

        const sections =
            document.querySelectorAll("main section");

        let nextSteps = null;

        sections.forEach(section => {
            if (
                section.textContent.includes(
                    "Turn This Interview Into Career Trajectory Momentum"
                )
            ) {
                nextSteps = section;
            }
        });

        if (!nextSteps) {
            return;
        }


        const gaps =
            Array.isArray(report.confirmed_skill_gaps)
                ? report.confirmed_skill_gaps
                : [];


        const paragraph =
            nextSteps.querySelector("p");

        if (paragraph) {
            paragraph.textContent =
                gaps.length
                    ? `Your interview confirmed ${gaps.length} skill gap${gaps.length === 1 ? "" : "s"}. Use the recommended focus areas to guide your next preparation steps.`
                    : "Your interview did not confirm additional skill gaps. Review your strengths and growth areas to decide what to practice next.";
        }


        const updateButton =
            document.getElementById(
                "launchpad-update-btn"
            );

        if (updateButton) {

            updateButton.innerHTML = `
                <span class="material-symbols-outlined text-xl">
                    map
                </span>

                <span>
                    ${gaps.length
                        ? "Continue to Roadmap"
                        : "Open Career Roadmap"
                    }
                </span>
            `;

            updateButton.onclick = () => {
                window.location.href =
                    "roadmap.html";
            };
        }


        const retakeButton =
            nextSteps.querySelector(
                "button:last-child"
            );

        if (retakeButton) {

            retakeButton.innerHTML = `
                <span class="material-symbols-outlined text-xl text-tertiary">
                    replay
                </span>

                <span>
                    Practice Again
                </span>
            `;

            retakeButton.onclick = () => {
                window.location.href =
                    "interview.html";
            };
        }
    }


    // =========================================================
    // TOP ACTIONS
    // =========================================================

    function setupTopActions() {

        const syncButton =
            document.getElementById(
                "top-sync-btn"
            );

        if (syncButton) {

            syncButton.innerHTML = `
                <span class="material-symbols-outlined text-lg">
                    map
                </span>

                <span>
                    View Roadmap
                </span>
            `;

            syncButton.onclick = () => {
                window.location.href =
                    "roadmap.html";
            };
        }


        const practiceButtons =
            document.querySelectorAll(
                "button"
            );

        practiceButtons.forEach(button => {

            if (
                button.textContent
                    .trim()
                    .includes("Practice Again")
            ) {
                button.onclick = () => {
                    window.location.href =
                        "interview.html";
                };
            }

        });
    }


    // =========================================================
    // MAIN INITIALIZATION
    // =========================================================

    function initialize() {

        renderHeader();
        renderTopStats();
        renderReportHeader();
        renderOverallScore();
        renderExecutiveSummary();
        renderCompetencySection();
        renderStrengthsAndGrowth();
        renderCareerBridge();
        renderQuestionSection();
        renderNextSteps();
        setupTopActions();

        console.log(
            "✅ Interview report successfully rendered."
        );
    }


    // =========================================================
    // MISSING REPORT
    // =========================================================

    function showMissingReport() {

        document.body.innerHTML = `
            <div class="min-h-screen bg-[#0f131d] flex items-center justify-center px-6">

                <div class="max-w-md w-full rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">

                    <div class="mx-auto w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-300">
                        <span class="material-symbols-outlined text-2xl">
                            description
                        </span>
                    </div>

                    <h1 class="mt-5 text-xl font-semibold text-white">
                        Interview report not found
                    </h1>

                    <p class="mt-3 text-sm leading-6 text-slate-400">
                        No completed interview report is available in the
                        current CareerForge session.
                    </p>

                    <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">

                        <button
                            id="report-back-btn"
                            class="px-5 py-3 rounded-xl border border-white/10 text-sm font-medium text-slate-200 hover:bg-white/5">
                            Go Back
                        </button>

                        <button
                            id="report-start-btn"
                            class="px-5 py-3 rounded-xl bg-white text-slate-950 text-sm font-semibold hover:bg-slate-200">
                            Start Interview
                        </button>

                    </div>

                </div>

            </div>
        `;

        document
            .getElementById("report-back-btn")
            ?.addEventListener(
                "click",
                () => window.history.back()
            );

        document
            .getElementById("report-start-btn")
            ?.addEventListener(
                "click",
                () => {
                    window.location.href =
                        "interview.html";
                }
            );
    }


    // =========================================================
    // START
    // =========================================================

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();

    }

})();