
document.addEventListener("DOMContentLoaded", () => {
    const sessionApi = window.CareerForgeSession;

    if (!sessionApi) {
        console.error("CareerForgeSession is not available.");
        showEmptyState("Session manager could not be loaded.");
        return;
    }

    const session = sessionApi.getSession();
    const analysis = session?.analysis;

    if (!analysis) {
        showEmptyState(
            "No active analysis session. Run an analysis from the setup page first."
        );
        return;
    }

    initializeAnalysisPage(session, analysis);
});


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initializeAnalysisPage(session, analysis) {
    const candidate = analysis.candidate_profile || {};
    const job = analysis.job_profile || {};

    const requirements = Array.isArray(analysis.requirement_analysis)
        ? analysis.requirement_analysis
        : [];

    const skillGaps = Array.isArray(analysis.skill_gaps?.skill_gaps)
        ? analysis.skill_gaps.skill_gaps
        : [];

    hideEmptyState();
    showAnalysisContent();

    updatePageContext(session, candidate, job);

    renderRequirementSummary(requirements, skillGaps);
    renderStrengths(requirements);
    renderRequirementGaps(requirements);
    renderSkillGaps(skillGaps);

    renderCandidateSkills(candidate.skills);
    renderCandidateExperience(candidate.experience);
    renderCandidateProjects(candidate.projects);

    renderGapDrawer(skillGaps, requirements);

    setupNavigation();
}


/* =========================================================
   PAGE CONTEXT
   ========================================================= */

function updatePageContext(session, candidate, job) {
    const targetRole =
        session?.targetRole ||
        job.title ||
        "Target Role";

    const company =
        session?.company ||
        "";

    const resumeName =
        session?.resumeName ||
        "Resume";

    setText(
        "analysis-resume-name",
        resumeName
    );

    setText(
        "analysis-jd-context",
        job.title || "Target Job Description"
    );

    setText(
        "analysis-target-role",
        targetRole
    );

    setText(
        "analysis-target-company",
        company ? `@ ${company}` : ""
    );

    setText(
        "analysis-target-context",
        buildTargetContext(targetRole, company)
    );

    // Update the global/header target badge if it exists.
    setText(
        "target-context",
        buildTargetContext(targetRole, company)
    );
}


function buildTargetContext(role, company) {
    if (company) {
        return `Target: ${role} @ ${company}`;
    }

    return `Target: ${role}`;
}


/* =========================================================
   REQUIREMENT SUMMARY
   ========================================================= */

function renderRequirementSummary(requirements, skillGaps) {
    const total = requirements.length;

    const strongMatches = requirements.filter(
        item => item.status === "strong_match"
    ).length;

    const partialMatches = requirements.filter(
        item => item.status === "partial_match"
    ).length;

    const gaps = requirements.filter(
        item => item.status === "gap"
    ).length;

    const requiredRequirements = requirements.filter(
        item => item.requirement_type === "required"
    ).length;

    const preferredRequirements = requirements.filter(
        item => item.requirement_type === "preferred"
    ).length;

    const highPriority = requirements.filter(
        item => item.priority === "high"
    ).length;

    const mediumPriority = requirements.filter(
        item => item.priority === "medium"
    ).length;

    const lowPriority = requirements.filter(
        item => item.priority === "low"
    ).length;
    setText(
    "analysis-skill-gap-count",
    skillGaps.length
);


    /*
     * These are counts derived directly from the API contract.
     *
     * We intentionally DO NOT calculate or display an
     * "overall match percentage" because the backend contract
     * explicitly says there is no arbitrary overall score.
     */

    setText(
        "analysis-total-requirements",
        total
    );

    setText(
        "analysis-strong-matches",
        strongMatches
    );

    setText(
        "analysis-partial-matches",
        partialMatches
    );

    setText(
        "analysis-requirement-gaps",
        gaps
    );

    setText(
        "analysis-required-count",
        requiredRequirements
    );

    setText(
        "analysis-preferred-count",
        preferredRequirements
    );

    setText(
        "analysis-high-priority-count",
        highPriority
    );

    setText(
        "analysis-medium-priority-count",
        mediumPriority
    );

    setText(
        "analysis-low-priority-count",
        lowPriority
    );


    /*
     * Existing badges from analysis.html.
     */

    setText(
        "analysis-gaps-count-badge",
        `${gaps} ${gaps === 1 ? "GAP" : "GAPS"}`
    );

    setText(
        "analysis-strengths-count-badge",
        `${strongMatches} ${strongMatches === 1 ? "STRENGTH" : "STRENGTHS"}`
    );
}


/* =========================================================
   STRONG MATCHES
   ========================================================= */

function renderStrengths(requirements) {
    const container =
        document.getElementById("analysis-strengths-list");

    if (!container) {
        return;
    }

    const strengths = requirements.filter(
        item => item.status === "strong_match"
    );

    container.innerHTML = "";

    if (strengths.length === 0) {
        container.innerHTML = `
            <div class="text-sm text-slate-400">
                No strong matches were identified.
            </div>
        `;

        return;
    }

    strengths.forEach(item => {
        const card = document.createElement("div");

        card.className =
            "p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5";

        const evidence =
            Array.isArray(item.evidence) && item.evidence.length
                ? item.evidence.join(" ")
                : "No evidence provided.";

        card.innerHTML = `
            <div class="flex items-start justify-between gap-4">

                <div>
                    <h4 class="font-semibold text-white">
                        ${escapeHtml(item.requirement)}
                    </h4>

                    ${
                        item.requirement_type
                            ? `
                                <div class="text-xs text-slate-500 mt-1 uppercase">
                                    ${escapeHtml(item.requirement_type)}
                                </div>
                            `
                            : ""
                    }
                </div>

                <span class="shrink-0 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Strong Match
                </span>

            </div>

            ${
                item.reason
                    ? `
                        <p class="text-sm text-slate-400 mt-3">
                            ${escapeHtml(item.reason)}
                        </p>
                    `
                    : ""
            }

            <div class="mt-3 text-sm text-slate-300">
                <span class="text-slate-500">Evidence:</span>
                ${escapeHtml(evidence)}
            </div>
        `;

        container.appendChild(card);
    });
}


/* =========================================================
   REQUIREMENT GAPS
   ========================================================= */

function renderRequirementGaps(requirements) {
    const container =
        document.getElementById("analysis-gaps-list");

    if (!container) {
        return;
    }

    const gaps = requirements.filter(
        item => item.status === "gap"
    );

    /*
     * The backend's requirement_analysis is the authoritative
     * requirement-vs-candidate analysis.
     */

    if (gaps.length === 0) {
        container.innerHTML = `
            <div class="text-sm text-slate-400">
                No requirement gaps were identified.
            </div>
        `;

        return;
    }

    container.innerHTML = "";

    gaps.forEach(item => {
        const card = document.createElement("div");

        card.className =
            "p-4 rounded-xl border border-red-500/20 bg-red-500/5";

        const priorityClass =
            item.priority === "high"
                ? "text-red-400"
                : item.priority === "medium"
                    ? "text-amber-400"
                    : "text-slate-400";

        const evidence =
            Array.isArray(item.evidence) && item.evidence.length
                ? item.evidence.join(" ")
                : "No supporting candidate evidence was identified.";

        card.innerHTML = `
            <div class="flex items-start justify-between gap-4">

                <div>
                    <h4 class="font-semibold text-white">
                        ${escapeHtml(item.requirement)}
                    </h4>

                    <div class="flex gap-2 mt-2">

                        ${
                            item.requirement_type
                                ? `
                                    <span class="text-xs text-slate-500 uppercase">
                                        ${escapeHtml(item.requirement_type)}
                                    </span>
                                `
                                : ""
                        }

                        <span class="text-xs uppercase font-semibold ${priorityClass}">
                            ${escapeHtml(item.priority || "low")} priority
                        </span>

                    </div>
                </div>

                <span class="shrink-0 text-xs font-semibold uppercase tracking-wider text-red-400">
                    Gap
                </span>

            </div>

            ${
                item.reason
                    ? `
                        <p class="text-sm text-slate-400 mt-3">
                            ${escapeHtml(item.reason)}
                        </p>
                    `
                    : ""
            }

            <div class="mt-3 text-sm text-slate-300">
                <span class="text-slate-500">Evidence:</span>
                ${escapeHtml(evidence)}
            </div>

            ${
                item.required_level
                    ? `
                        <div class="mt-3 text-sm text-slate-400">
                            Required level:
                            <span class="text-slate-200">
                                ${escapeHtml(item.required_level)}
                            </span>
                        </div>
                    `
                    : ""
            }
        `;

        container.appendChild(card);
    });
}


/* =========================================================
   SKILL GAPS
   ========================================================= */

function renderSkillGaps(skillGaps) {
    /*
     * This is the dedicated skill gap collection that will later
     * feed the roadmap module.
     *
     * If analysis.html has a dedicated container for skill gaps,
     * render them there.
     */

    const container =
        document.getElementById("analysis-skill-gaps-list");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (skillGaps.length === 0) {
        container.innerHTML = `
            <div class="text-sm text-slate-400">
                No skill gaps were identified.
            </div>
        `;

        return;
    }

    skillGaps.forEach(gap => {
        const card = document.createElement("div");

        card.className =
            "p-4 rounded-xl border border-white/10 bg-white/5";

        const priorityClass =
            gap.priority === "high"
                ? "text-red-400"
                : gap.priority === "medium"
                    ? "text-amber-400"
                    : "text-slate-400";

        card.innerHTML = `
            <div class="flex items-start justify-between gap-4">

                <div>
                    <h4 class="font-semibold text-white">
                        ${escapeHtml(gap.skill)}
                    </h4>

                    ${
                        gap.reason
                            ? `
                                <p class="text-sm text-slate-400 mt-2">
                                    ${escapeHtml(gap.reason)}
                                </p>
                            `
                            : ""
                    }
                </div>

                <span class="shrink-0 text-xs uppercase font-semibold ${priorityClass}">
                    ${escapeHtml(gap.priority || "low")}
                </span>

            </div>

            ${
                gap.required_level
                    ? `
                        <div class="text-sm text-slate-400 mt-3">
                            Required level:
                            <span class="text-slate-200">
                                ${escapeHtml(gap.required_level)}
                            </span>
                        </div>
                    `
                    : ""
            }
        `;

        container.appendChild(card);
    });
}


/* =========================================================
   CANDIDATE SKILLS
   ========================================================= */

function renderCandidateSkills(skills) {
    const container =
        document.getElementById("analysis-candidate-skills");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!Array.isArray(skills) || skills.length === 0) {
        container.innerHTML = `
            <div class="text-sm text-slate-400">
                No candidate skills were extracted.
            </div>
        `;

        return;
    }

    skills.forEach(skill => {
        const element = document.createElement("div");

        element.className =
            "rounded-lg border border-white/10 bg-white/5 px-3 py-2";

        element.innerHTML = `
            <div class="font-medium text-white">
                ${escapeHtml(skill.name)}
            </div>

            ${
                skill.category
                    ? `
                        <div class="text-xs text-slate-500 mt-1">
                            ${escapeHtml(skill.category)}
                        </div>
                    `
                    : ""
            }
        `;

        container.appendChild(element);
    });
}


/* =========================================================
   CANDIDATE EXPERIENCE
   ========================================================= */

function renderCandidateExperience(experience) {
    const container =
        document.getElementById("analysis-candidate-experience");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!Array.isArray(experience) || experience.length === 0) {
        container.innerHTML = `
            <div class="text-sm text-slate-400">
                No experience entries were extracted.
            </div>
        `;

        return;
    }

    experience.forEach(item => {
        const element = document.createElement("div");

        element.className =
            "p-4 rounded-xl border border-white/10 bg-white/5";

        element.innerHTML = `
            <h4 class="font-semibold text-white">
                ${escapeHtml(item.role)}
            </h4>

            <div class="text-sm text-slate-400 mt-1">
                ${escapeHtml(item.company)}
            </div>

            ${
                item.description
                    ? `
                        <p class="text-sm text-slate-300 mt-3">
                            ${escapeHtml(item.description)}
                        </p>
                    `
                    : ""
            }

            ${
                Array.isArray(item.skills) && item.skills.length
                    ? `
                        <div class="text-xs text-slate-400 mt-3">
                            Skills:
                            ${escapeHtml(item.skills.join(", "))}
                        </div>
                    `
                    : ""
            }

            ${
                Array.isArray(item.evidence) && item.evidence.length
                    ? `
                        <div class="text-xs text-slate-500 mt-3">
                            Evidence:
                            ${escapeHtml(item.evidence.join(" "))}
                        </div>
                    `
                    : ""
            }
        `;

        container.appendChild(element);
    });
}


/* =========================================================
   CANDIDATE PROJECTS
   ========================================================= */

function renderCandidateProjects(projects) {
    const container =
        document.getElementById("analysis-candidate-projects");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!Array.isArray(projects) || projects.length === 0) {
        container.innerHTML = `
            <div class="text-sm text-slate-400">
                No projects were extracted.
            </div>
        `;

        return;
    }

    projects.forEach(project => {
        const element = document.createElement("div");

        element.className =
            "p-4 rounded-xl border border-white/10 bg-white/5";

        element.innerHTML = `
            <h4 class="font-semibold text-white">
                ${escapeHtml(project.name)}
            </h4>

            ${
                project.description
                    ? `
                        <p class="text-sm text-slate-300 mt-2">
                            ${escapeHtml(project.description)}
                        </p>
                    `
                    : ""
            }

            ${
                Array.isArray(project.skills) && project.skills.length
                    ? `
                        <div class="text-xs text-slate-400 mt-3">
                            Skills:
                            ${escapeHtml(project.skills.join(", "))}
                        </div>
                    `
                    : ""
            }

            ${
                Array.isArray(project.evidence) && project.evidence.length
                    ? `
                        <div class="text-xs text-slate-500 mt-3">
                            Evidence:
                            ${escapeHtml(project.evidence.join(" "))}
                        </div>
                    `
                    : ""
            }
        `;

        container.appendChild(element);
    });
}


/* =========================================================
   GAP DRAWER
   ========================================================= */

function renderGapDrawer(skillGaps, requirements) {
    const drawer =
        document.getElementById("gap-drawer");

    if (!drawer) {
        return;
    }

    /*
     * The old HTML contained hardcoded demo/Stripe gap content.
     * We now replace that with real API data.
     */

    if (skillGaps.length === 0) {
        drawer.innerHTML = `
            <div class="p-6 text-sm text-slate-400">
                No skill gaps are available for deeper analysis.
            </div>
        `;

        return;
    }

    const gap = skillGaps[0];

    /*
     * Try to find the requirement associated with this skill.
     * This is only used to enrich the drawer.
     */

    const relatedRequirement =
        requirements.find(requirement => {
            const requirementText =
                String(requirement.requirement || "").toLowerCase();

            const skillText =
                String(gap.skill || "").toLowerCase();

            return (
                requirementText.includes(skillText) ||
                skillText.includes(requirementText)
            );
        });

    drawer.innerHTML = `
        <div class="p-6">

            <div class="flex items-start justify-between gap-4">

                <div>
                    <div class="text-xs uppercase tracking-widest text-slate-500">
                        Gap Analysis
                    </div>

                    <h3 class="text-xl font-semibold text-white mt-2">
                        ${escapeHtml(gap.skill)}
                    </h3>
                </div>

                <span class="text-xs font-semibold uppercase tracking-wider">
                    ${escapeHtml(gap.priority || "low")} priority
                </span>

            </div>


            ${
                gap.required_level
                    ? `
                        <div class="mt-6">
                            <div class="text-xs uppercase tracking-widest text-slate-500">
                                Required Level
                            </div>

                            <div class="text-sm text-slate-200 mt-2">
                                ${escapeHtml(gap.required_level)}
                            </div>
                        </div>
                    `
                    : ""
            }


            ${
                gap.reason
                    ? `
                        <div class="mt-6">
                            <div class="text-xs uppercase tracking-widest text-slate-500">
                                Why This Is a Gap
                            </div>

                            <p class="text-sm text-slate-300 mt-2 leading-relaxed">
                                ${escapeHtml(gap.reason)}
                            </p>
                        </div>
                    `
                    : ""
            }


            ${
                relatedRequirement
                    ? `
                        <div class="mt-6">

                            <div class="text-xs uppercase tracking-widest text-slate-500">
                                Related Requirement
                            </div>

                            <p class="text-sm text-slate-300 mt-2">
                                ${escapeHtml(
                                    relatedRequirement.requirement
                                )}
                            </p>

                            ${
                                relatedRequirement.reason
                                    ? `
                                        <p class="text-sm text-slate-400 mt-2">
                                            ${escapeHtml(
                                                relatedRequirement.reason
                                            )}
                                        </p>
                                    `
                                    : ""
                            }

                        </div>
                    `
                    : ""
            }

        </div>
    `;
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    /*
     * Build My Roadmap
     *
     * This is the ONLY place where the roadmap generation
     * flow should be triggered from the analysis page.
     */
    const buildRoadmapButton =
        document.getElementById("build-roadmap-btn");

    if (buildRoadmapButton) {
        buildRoadmapButton.addEventListener(
            "click",
            buildRoadmap
        );
    }


    /*
     * Interview navigation
     */
    const interviewButtons =
        document.querySelectorAll(
            '[data-action="interview"], #open-interview-btn'
        );

    interviewButtons.forEach(button => {
        button.addEventListener("click", () => {
            window.location.href = "interview.html";
        });
    });
}

async function buildRoadmap() {
    try {
        console.log(
            "🗺️ User clicked Build My Roadmap"
        );

        const button =
            document.getElementById(
                "build-roadmap-btn"
            );

        if (button) {
            button.disabled = true;
            button.textContent =
                "Building Roadmap...";
        }

        const payload =
            buildRoadmapPayload();

        console.log(
            "🗺️ Roadmap payload:",
            payload
        );

        const roadmap =
            await window.CareerForgeApi
                .generateRoadmapFromGaps(
                    payload
                );

        console.log(
            "🗺️ Roadmap generated:",
            roadmap
        );

        window.CareerForgeSession
            .setRoadmap(roadmap);

        window.location.href =
            "roadmap.html";

    } catch (error) {
        console.error(
            "❌ Roadmap generation failed:",
            error
        );

        const button =
            document.getElementById(
                "build-roadmap-btn"
            );

        if (button) {
            button.disabled = false;
            button.textContent =
                "Build My Roadmap";
        }

        alert(
            error.message ||
            "Could not generate your roadmap."
        );
    }
}

function buildRoadmapPayload() {
    const session =
        window.CareerForgeSession.getSession();

    if (!session) {
        throw new Error("CareerForge session is missing.");
    }

    const analysis = session.analysis;

    if (!analysis) {
        throw new Error(
            "Analysis data is missing. Please run the analysis first."
        );
    }

    const rawGaps =
        analysis.skill_gaps?.skill_gaps || [];

    if (!rawGaps.length) {
        throw new Error(
            "No skill gaps were identified, so a roadmap cannot be generated."
        );
    }

    const gaps = rawGaps.map((gap, index) => {
        const skill =
            gap.skill ||
            `Skill ${index + 1}`;

        const gapId =
            skill
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "") ||
            `gap-${index + 1}`;

        return {
            gap_id: gapId,

            title: skill,

            category: "skill",

            priority:
                gap.priority || "medium",

            reason:
                gap.reason ||
                "Skill requires further development.",

            required_level:
                gap.required_level || null
        };
    });

    return {
        candidate_name:
            analysis.candidate_profile?.name || null,

        target_role:
            session.targetRole ||
            analysis.job_profile?.title ||
            "Target Role",

        target_company:
            session.company || null,

        weekly_hours_available: 10,

        sprint_weeks: 4,

        gaps
    };
}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function showEmptyState(message) {
    const emptyState =
        document.getElementById("analysis-empty-state");

    const content =
        document.getElementById("analysis-content-container");

    if (emptyState) {
        emptyState.classList.remove("hidden");

        const messageElement =
            emptyState.querySelector("[data-empty-message]");

        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    if (content) {
        content.classList.add("hidden");
    }
}


function hideEmptyState() {
    const emptyState =
        document.getElementById("analysis-empty-state");

    if (emptyState) {
        emptyState.classList.add("hidden");
    }
}


function showAnalysisContent() {
    const content =
        document.getElementById("analysis-content-container");

    if (content) {
        content.classList.remove("hidden");
    }
}


/* =========================================================
   DOM HELPERS
   ========================================================= */

function setText(id, value) {
    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent =
        value === undefined || value === null
            ? ""
            : String(value);
}


/*
 * API data is rendered into HTML in several places.
 * Escape it before inserting it into innerHTML.
 */

function escapeHtml(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
