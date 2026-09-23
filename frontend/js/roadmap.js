document.addEventListener("DOMContentLoaded", () => {
    loadRoadmap();
});


/* =========================================================
   STATE
   ========================================================= */

let currentRoadmap = null;
let activeMilestoneId = null;


/* =========================================================
   LOAD ROADMAP
   ========================================================= */

function loadRoadmap() {

    const sessionApi =
        window.CareerForgeSession;

    if (!sessionApi) {
        console.error(
            "CareerForgeSession is not available."
        );

        showRoadmapError(
            "Session manager could not be loaded."
        );

        return;
    }


    const roadmap =
        sessionApi.getRoadmap();


    if (!roadmap) {

        console.error(
            "No roadmap found in session."
        );

        showRoadmapError(
            "No roadmap has been generated yet. Please return to the analysis page and build your roadmap."
        );

        return;
    }


    console.log(
        "🗺️ Loaded roadmap from session:",
        roadmap
    );


    currentRoadmap = roadmap;


    renderRoadmap(
        roadmap
    );


    setupRoadmapInteractions(
        roadmap
    );
}


/* =========================================================
   MAIN RENDER
   ========================================================= */

function renderRoadmap(roadmap) {

    if (
        !roadmap ||
        !roadmap.meta ||
        !Array.isArray(roadmap.phases)
    ) {

        console.error(
            "Invalid roadmap structure:",
            roadmap
        );

        showRoadmapError(
            "The generated roadmap data is invalid."
        );

        return;
    }


    renderMeta(
        roadmap
    );


    renderFilters(
        roadmap
    );


    renderPhases(
        roadmap
    );
}


/* =========================================================
   META
   ========================================================= */

function renderMeta(roadmap) {

    const meta =
        roadmap.meta;


    const title =
        document.getElementById(
            "roadmap-title"
        );

    if (title) {

        title.textContent =
            `Personalized Action Roadmap: ${meta.role_title}`;
    }


    const tagline =
        document.getElementById(
            "roadmap-tagline"
        );

    if (tagline) {

        tagline.textContent =
            meta.tagline ||
            `A personalized development roadmap for ${meta.role_title}.`;
    }


    const targetContext =
        document.getElementById(
            "roadmap-target-context"
        );

    if (targetContext) {

        targetContext.textContent =
            `Target: ${meta.role_title}`;
    }


    const sprint =
        document.getElementById(
            "roadmap-sprint-weeks"
        );

    if (sprint) {

        sprint.textContent =
            `${meta.sprint_weeks} Weeks`;
    }


    const milestoneCount =
        document.getElementById(
            "roadmap-milestone-count"
        );

    if (milestoneCount) {

        milestoneCount.textContent =
            `${meta.total_milestones} Structured Milestones`;
    }


    const artifactCount =
        document.getElementById(
            "roadmap-artifact-count"
        );

    if (artifactCount) {

        artifactCount.textContent =
            `${meta.projected_artifacts} Artifacts`;
    }


    const gapCount =
        document.getElementById(
            "roadmap-gap-count"
        );

    if (gapCount) {

        gapCount.textContent =
            meta.gap_categories?.length ||
            0;
    }
}


/* =========================================================
   FILTERS
   ========================================================= */

function renderFilters(roadmap) {

    const container =
        document.getElementById(
            "roadmap-filter-buttons"
        );

    if (!container) {
        return;
    }


    const categories =
        new Set();


    roadmap.phases.forEach(
        phase => {

            if (phase.category) {
                categories.add(
                    phase.category
                );
            }

            (phase.milestones || []).forEach(
                milestone => {

                    (milestone.tags || []).forEach(
                        tag => categories.add(tag)
                    );
                }
            );
        }
    );


    container.innerHTML = `
        <button
            class="filter-btn active px-space-sm py-space-2xs rounded-full bg-primary-container text-on-primary-container font-label-code text-label-code font-bold whitespace-nowrap transition-all"
            data-filter="all"
            type="button"
        >
            All
        </button>
    `;


    [...categories].forEach(
        category => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "filter-btn px-space-sm py-space-2xs rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface-variant font-label-code text-label-code whitespace-nowrap transition-all";


            button.dataset.filter =
                category;


            button.textContent =
                formatCategory(
                    category
                );


            container.appendChild(
                button
            );
        }
    );
}


/* =========================================================
   PHASES
   ========================================================= */

function renderPhases(roadmap) {

    const container =
        document.getElementById(
            "roadmap-phases"
        );


    if (!container) {

        console.error(
            "roadmap-phases container not found."
        );

        return;
    }


    container.innerHTML =
        "";


    roadmap.phases.forEach(
        phase => {

            container.appendChild(
                createPhaseElement(
                    phase
                )
            );
        }
    );
}


/* =========================================================
   PHASE ELEMENT
   ========================================================= */

function createPhaseElement(
    phase
) {

    const phaseElement =
        document.createElement(
            "section"
        );


    phaseElement.className =
        "phase-group flex flex-col gap-space-md";


    phaseElement.dataset.category =
        phase.category ||
        "all";


    const milestones =
        Array.isArray(
            phase.milestones
        )
            ? phase.milestones
            : [];


    phaseElement.innerHTML = `

        <div
            class="flex items-center justify-between pb-space-2xs"
        >

            <div
                class="flex items-center gap-space-xs"
            >

                <span
                    class="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-container-high text-primary font-label-code text-label-code font-bold"
                >
                    ${escapeHtml(
                        phase.week_label
                    )}
                </span>


                <div>

                    <h2
                        class="font-title-md text-title-md text-on-surface font-bold tracking-tight"
                    >
                        Phase ${escapeHtml(
                            phase.phase_number
                        )}: ${escapeHtml(
                            phase.title
                        )}
                    </h2>


                    <p
                        class="font-body-sm text-body-sm text-on-surface-variant"
                    >
                        ${escapeHtml(
                            phase.focus
                        )}
                    </p>

                </div>

            </div>


            <span
                class="px-space-xs py-space-2xs rounded-full bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge font-bold uppercase"
            >
                ${Number(
                    phase.completion_pct || 0
                )}% Complete
            </span>

        </div>


        <div
            class="phase-milestones flex flex-col gap-space-md"
        >

            ${milestones
                .map(
                    milestone =>
                        createMilestoneHTML(
                            milestone
                        )
                )
                .join("")}

        </div>
    `;


    return phaseElement;
}


/* =========================================================
   MILESTONE HTML
   ========================================================= */

function createMilestoneHTML(
    milestone
) {

    const status =
        milestone.status ||
        "queued";


    const statusInfo =
        getStatusInfo(
            status
        );


    return `

        <div
            class="milestone-card group relative p-space-md rounded-xl bg-surface-container hover:bg-surface-container-high transition-all cursor-pointer shadow-md"
            data-milestone="${escapeHtml(
                milestone.id
            )}"
            data-tags="${escapeHtml(
                (milestone.tags || []).join(" ")
            )}"
        >

            <div
                class="flex items-start justify-between gap-space-sm"
            >

                <div
                    class="flex items-start gap-space-sm"
                >

                    <div
                        class="mt-1 w-5 h-5 rounded-md ${statusInfo.iconBg} ${statusInfo.iconText} flex items-center justify-center shrink-0"
                    >

                        <span
                            class="material-symbols-outlined text-sm"
                        >
                            ${statusInfo.icon}
                        </span>

                    </div>


                    <div
                        class="flex flex-col gap-space-2xs"
                    >

                        <div
                            class="flex items-center gap-space-xs flex-wrap"
                        >

                            <span
                                class="font-label-code text-label-code ${statusInfo.labelColor} font-bold"
                            >
                                ${escapeHtml(
                                    milestone.code
                                )}
                            </span>


                            <span
                                class="w-1 h-1 rounded-full bg-outline-variant"
                            ></span>


                            <span
                                class="px-space-2xs py-0.5 rounded ${statusInfo.badgeClass} font-label-badge text-label-badge uppercase font-semibold"
                            >
                                ${escapeHtml(
                                    formatStatus(
                                        status
                                    )
                                )}
                            </span>


                            <span
                                class="text-on-surface-variant font-label-code text-label-code"
                            >
                                Est.
                                ${escapeHtml(
                                    milestone.effort_hours
                                )}
                                hrs
                            </span>

                        </div>


                        <h3
                            class="font-headline-sm text-headline-sm text-on-surface font-semibold"
                        >
                            ${escapeHtml(
                                milestone.title
                            )}
                        </h3>


                        <p
                            class="font-body-md text-body-md text-on-surface-variant"
                        >
                            ${escapeHtml(
                                milestone.description
                            )}
                        </p>


                        <div
                            class="flex items-center gap-space-sm pt-space-xs flex-wrap"
                        >

                            <span
                                class="inline-flex items-center gap-1 font-body-sm text-body-sm text-primary font-medium"
                            >

                                <span
                                    class="material-symbols-outlined text-sm"
                                >
                                    inventory_2
                                </span>

                                ${escapeHtml(
                                    milestone.artifact_text
                                )}

                            </span>


                            <button
                                class="open-drawer-btn text-primary hover:text-primary-fixed font-body-sm text-body-sm font-semibold inline-flex items-center gap-1"
                                data-target="${escapeHtml(
                                    milestone.id
                                )}"
                                type="button"
                            >

                                View Details

                                <span
                                    class="material-symbols-outlined text-xs"
                                >
                                    arrow_forward
                                </span>

                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    `;
}


/* =========================================================
   DRAWER
   ========================================================= */

function updateDrawer(
    milestone
) {

    if (!milestone) {
        return;
    }


    activeMilestoneId =
        milestone.id;


    setText(
        "detailCode",
        milestone.code
    );


    setText(
        "detailTitle",
        milestone.title
    );


    setText(
        "detailEffort",
        `Est. ${milestone.effort_hours} hours`
    );


    setText(
        "detailGapText",
        milestone.gap_text
    );


    setText(
        "detailWhyText",
        milestone.why_text
    );


    setText(
        "detailArtifactText",
        milestone.artifact_text
    );


    const statusBadge =
        document.getElementById(
            "detailStatusBadge"
        );


    if (statusBadge) {

        statusBadge.textContent =
            formatStatus(
                milestone.status
            );

        statusBadge.className =
            `px-space-xs py-space-2xs rounded-full font-label-badge text-label-badge font-bold uppercase ${
                getStatusInfo(
                    milestone.status
                ).badgeClass
            }`;
    }


    const doneButton =
        document.getElementById(
            "toggleDoneBtn"
        );


    const doneLabel =
        document.getElementById(
            "markDoneLabel"
        );


    if (doneButton && doneLabel) {

        doneButton.disabled =
            false;


        doneLabel.textContent =
            milestone.is_done
                ? "Mark as Not Completed"
                : "Mark Milestone as Completed";
    }


    highlightActiveMilestone(
        milestone.id
    );
}


/* =========================================================
   ACTIVE MILESTONE
   ========================================================= */

function highlightActiveMilestone(
    milestoneId
) {

    document
        .querySelectorAll(
            ".milestone-card"
        )
        .forEach(
            card => {

                if (
                    card.dataset.milestone ===
                    milestoneId
                ) {

                    card.classList.add(
                        "ring-2",
                        "ring-primary",
                        "bg-surface-container-high"
                    );

                } else {

                    card.classList.remove(
                        "ring-2",
                        "ring-primary",
                        "bg-surface-container-high"
                    );
                }
            }
        );
}


/* =========================================================
   INTERACTIONS
   ========================================================= */

function setupRoadmapInteractions(
    roadmap
) {

    document
        .querySelectorAll(
            ".milestone-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const milestone =
                            findMilestone(
                                card.dataset.milestone
                            );


                        if (milestone) {

                            updateDrawer(
                                milestone
                            );
                        }
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".open-drawer-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        const milestone =
                            findMilestone(
                                button.dataset.target
                            );


                        if (milestone) {

                            updateDrawer(
                                milestone
                            );
                        }
                    }
                );
            }
        );


    setupCompletionButton();


    setupFilters();


    setupRegenerateButton();


    setupExportButton();
}


/* =========================================================
   FIND MILESTONE
   ========================================================= */

function findMilestone(
    milestoneId
) {

    if (!currentRoadmap) {
        return null;
    }


    for (
        const phase
        of currentRoadmap.phases
    ) {

        const milestone =
            (
                phase.milestones ||
                []
            ).find(
                item =>
                    item.id ===
                    milestoneId
            );


        if (milestone) {
            return milestone;
        }
    }


    return null;
}


/* =========================================================
   COMPLETION
   ========================================================= */

function setupCompletionButton() {

    const button =
        document.getElementById(
            "toggleDoneBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            const milestone =
                findMilestone(
                    activeMilestoneId
                );


            if (!milestone) {
                return;
            }


            milestone.is_done =
                !milestone.is_done;


            updateDrawer(
                milestone
            );


            /*
             * Save the updated roadmap
             * back into the session.
             *
             * Backend milestone persistence
             * can be added later.
             */

            window.CareerForgeSession
                .setRoadmap(
                    currentRoadmap
                );


            updateMilestoneCard(
                milestone
            );
        }
    );
}


/* =========================================================
   UPDATE MILESTONE CARD
   ========================================================= */

function updateMilestoneCard(
    milestone
) {

    const card =
        document.querySelector(
            `[data-milestone="${CSS.escape(
                milestone.id
            )}"]`
        );


    if (!card) {
        return;
    }


    const statusInfo =
        getStatusInfo(
            milestone.is_done
                ? "completed"
                : milestone.status
        );


    const icon =
        card.querySelector(
            ".material-symbols-outlined"
        );


    if (icon) {

        icon.textContent =
            statusInfo.icon;
    }
}


/* =========================================================
   FILTERS
   ========================================================= */

function setupFilters() {

    const buttons =
        document.querySelectorAll(
            ".filter-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    buttons.forEach(
                        item => {

                            item.classList.remove(
                                "bg-primary-container",
                                "text-on-primary-container"
                            );

                            item.classList.add(
                                "bg-surface-container-high",
                                "text-on-surface-variant"
                            );
                        }
                    );


                    button.classList.remove(
                        "bg-surface-container-high",
                        "text-on-surface-variant"
                    );


                    button.classList.add(
                        "bg-primary-container",
                        "text-on-primary-container"
                    );


                    const filter =
                        button.dataset.filter;


                    document
                        .querySelectorAll(
                            ".phase-group"
                        )
                        .forEach(
                            phase => {

                                const phaseCategory =
                                    phase.dataset.category ||
                                    "";


                                const cards =
                                    phase.querySelectorAll(
                                        ".milestone-card"
                                    );


                                let visibleCards =
                                    0;


                                cards.forEach(
                                    card => {

                                        const tags =
                                            card.dataset.tags ||
                                            "";


                                        const visible =
                                            filter === "all" ||
                                            phaseCategory === filter ||
                                            tags
                                                .split(" ")
                                                .includes(
                                                    filter
                                                );


                                        card.style.display =
                                            visible
                                                ? ""
                                                : "none";


                                        if (visible) {
                                            visibleCards++;
                                        }
                                    }
                                );


                                phase.style.display =
                                    visibleCards > 0
                                        ? ""
                                        : "none";
                            }
                        );
                }
            );
        }
    );
}


/* =========================================================
   REGENERATE
   ========================================================= */

function setupRegenerateButton() {

    const button =
        document.getElementById(
            "regenBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            /*
             * Regeneration endpoint is not
             * integrated yet.
             *
             * For now provide feedback instead
             * of making an unsupported API call.
             */

            alert(
                "Roadmap regeneration will be connected in the next integration step."
            );
        }
    );
}


/* =========================================================
   EXPORT
   ========================================================= */

function setupExportButton() {

    const button =
        document.getElementById(
            "exportBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            const original =
                button.innerHTML;


            button.innerHTML = `
                <span class="material-symbols-outlined text-base text-secondary">
                    check
                </span>

                <span>
                    Roadmap Ready
                </span>
            `;


            setTimeout(
                () => {

                    button.innerHTML =
                        original;

                },
                1800
            );
        }
    );
}


/* =========================================================
   STATUS
   ========================================================= */

function getStatusInfo(
    status
) {

    switch (
        status
    ) {

        case "completed":

            return {
                icon: "check",
                iconBg: "bg-secondary",
                iconText: "text-on-secondary",
                labelColor: "text-secondary",
                badgeClass:
                    "bg-secondary/20 text-secondary"
            };


        case "in_progress":

            return {
                icon: "schedule",
                iconBg: "bg-tertiary/20",
                iconText: "text-tertiary",
                labelColor: "text-tertiary",
                badgeClass:
                    "bg-tertiary/15 text-tertiary"
            };


        case "ready":

            return {
                icon: "play_arrow",
                iconBg:
                    "bg-surface-container-highest",
                iconText: "text-primary",
                labelColor: "text-primary",
                badgeClass:
                    "bg-surface-container-lowest text-primary"
            };


        case "locked":

            return {
                icon: "lock",
                iconBg:
                    "bg-surface-container-highest",
                iconText:
                    "text-on-surface-variant",
                labelColor: "text-outline",
                badgeClass:
                    "bg-surface-container-lowest text-on-surface-variant"
            };


        case "queued":

        default:

            return {
                icon: "schedule",
                iconBg:
                    "bg-surface-container-highest",
                iconText:
                    "text-on-surface-variant",
                labelColor:
                    "text-on-surface-variant",
                badgeClass:
                    "bg-surface-container-lowest text-on-surface-variant"
            };
    }
}


/* =========================================================
   HELPERS
   ========================================================= */

function formatStatus(
    status
) {

    return String(
        status || ""
    )
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );
}


function formatCategory(
    category
) {

    return String(
        category || ""
    )
        .replace(
            /[-_]/g,
            " "
        )
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.textContent =
        value === undefined ||
        value === null
            ? ""
            : String(value);
}


function escapeHtml(
    value
) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";
    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   ERROR STATE
   ========================================================= */

function showRoadmapError(
    message
) {

    const container =
        document.getElementById(
            "roadmap-phases"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div
            class="p-space-xl rounded-xl bg-surface-container-low border border-outline-variant/30 text-center"
        >

            <span
                class="material-symbols-outlined text-4xl text-tertiary"
            >
                warning
            </span>


            <p
                class="font-body-md text-body-md text-on-surface-variant mt-space-sm"
            >
                ${escapeHtml(
                    message
                )}
            </p>


            <a
                href="analysis.html"
                class="inline-flex items-center gap-space-xs px-space-md py-space-sm mt-space-md rounded-lg bg-primary text-on-primary font-semibold"
            >
                Return to Analysis
            </a>

        </div>
    `;
}