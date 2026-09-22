// frontend/js/analysis.js
// CareerForge AI — Analysis Page Controller

document.addEventListener('DOMContentLoaded', () => {
  const rawSession = sessionStorage.getItem('careerforge_analysis_result');
  const emptyState = document.getElementById('analysis-empty-state');
  const contentContainer = document.getElementById('analysis-content-container');

  if (!rawSession) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (contentContainer) contentContainer.classList.add('hidden');
    return;
  }

  let sessionObj;
  try {
    sessionObj = JSON.parse(rawSession);
  } catch (e) {
    console.error('Failed to parse analysis result from sessionStorage:', e);
    if (emptyState) emptyState.classList.remove('hidden');
    if (contentContainer) contentContainer.classList.add('hidden');
    return;
  }

  const result = sessionObj.data;
  const meta = sessionObj.meta || {};

  if (!result || !result.candidate_profile) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (contentContainer) contentContainer.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (contentContainer) contentContainer.classList.remove('hidden');

  renderAnalysis(result, meta);
});

function renderAnalysis(result, meta) {
  const candidate = result.candidate_profile || {};
  const job = result.job_profile || {};
  const reqMatches = result.requirement_analysis || [];
  const skillGaps = (result.skill_gaps && result.skill_gaps.skill_gaps) ? result.skill_gaps.skill_gaps : [];

  // 1. Top Briefing Header
  const targetTitleEl = document.getElementById('briefing-target-title');
  const targetCompanyEl = document.getElementById('briefing-target-company');
  const resumeFilenameEl = document.getElementById('briefing-resume-filename');
  const jdReferenceEl = document.getElementById('briefing-jd-reference');
  const candidateNameEl = document.getElementById('header-candidate-name');

  if (targetTitleEl) {
    targetTitleEl.innerText = job.title || meta.job_title || 'Target Role Profile';
  }
  if (targetCompanyEl) {
    targetCompanyEl.innerText = meta.company ? `@ ${meta.company}` : '';
  }
  if (resumeFilenameEl) {
    resumeFilenameEl.innerText = meta.resume_filename || (candidate.name ? `${candidate.name}_Resume.pdf` : 'Uploaded_Resume.pdf');
  }
  if (jdReferenceEl) {
    jdReferenceEl.innerText = job.title ? `Job: ${job.title}` : (meta.job_title ? `Target: ${meta.job_title}` : 'Target Job Description');
  }
  if (candidateNameEl && candidate.name) {
    candidateNameEl.innerText = candidate.name;
  }

  // 2. Metrics Summary - Strictly Real Data Only
  // Strengths = strong_match, Gaps = gap + partial_match
  const strongMatches = reqMatches.filter(m => m.status === 'strong_match');
  const actualGaps = reqMatches.filter(m => m.status === 'gap' || m.status === 'partial_match');

  const metricCompetenciesEl = document.getElementById('metric-competencies-count');
  const metricCompetenciesTotalEl = document.getElementById('metric-competencies-total');
  const metricGapsEl = document.getElementById('metric-gaps-count');

  if (metricCompetenciesEl) {
    metricCompetenciesEl.innerText = strongMatches.length.toString();
  }
  if (metricCompetenciesTotalEl) {
    metricCompetenciesTotalEl.innerText = `/ ${reqMatches.length}`;
  }
  if (metricGapsEl) {
    metricGapsEl.innerText = (actualGaps.length || skillGaps.length).toString();
  }

  // 3. Render Priority Gaps List
  const gapsContainer = document.getElementById('analysis-gaps-list');
  const gapsCountBadge = document.getElementById('analysis-gaps-count-badge');

  if (gapsCountBadge) {
    const totalGapsCount = actualGaps.length || skillGaps.length;
    gapsCountBadge.innerText = `${totalGapsCount} Identified Gaps`;
  }

  if (gapsContainer) {
    gapsContainer.innerHTML = '';
    
    if (actualGaps.length === 0 && skillGaps.length === 0) {
      gapsContainer.innerHTML = '<div class="p-space-md text-on-surface-variant font-body-sm">No skill gaps identified for this role benchmark.</div>';
    } else {
      // Prioritize requirement_analysis matches that are gaps
      actualGaps.forEach((gapItem, index) => {
        const priority = gapItem.priority || 'medium';
        const badgeColor = priority === 'high' ? 'bg-error-container text-error' : 'bg-tertiary-container/30 text-tertiary';
        
        const card = document.createElement('div');
        card.className = 'rounded-lg bg-surface-container-low p-space-md flex flex-col gap-space-sm shadow-sm transition-all hover:bg-surface-container-high';
        card.innerHTML = `
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-space-xs">
            <div class="flex items-center gap-space-xs">
              <span class="px-space-xs py-space-2xs rounded ${badgeColor} font-label-code text-label-code font-bold uppercase">
                ${priority} Priority
              </span>
              <span class="font-label-code text-label-code text-on-surface-variant font-medium">Requirement #${index + 1}</span>
            </div>
            <span class="font-label-badge text-label-badge text-outline uppercase font-semibold">${gapItem.requirement_type || 'Required'}</span>
          </div>
          <div>
            <h4 class="font-title-md text-title-md font-bold text-on-surface text-lg">
              ${escapeHtml(gapItem.requirement)}
            </h4>
            <p class="font-body-md text-body-md text-on-surface-variant mt-1">
              ${escapeHtml(gapItem.reason || 'No specific explanation provided by analyzer.')}
            </p>
          </div>
          ${gapItem.evidence && gapItem.evidence.length > 0 ? `
            <div class="p-space-sm rounded bg-surface-container-lowest flex flex-col gap-space-xs font-body-sm text-body-sm">
              <div class="flex items-start gap-2">
                <span class="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">history_edu</span>
                <span class="text-on-surface-variant"><strong class="text-on-surface">Relevant Evidence:</strong> ${escapeHtml(gapItem.evidence.join('; '))}</span>
              </div>
            </div>
          ` : ''}
        `;
        gapsContainer.appendChild(card);
      });
    }
  }

  // 4. Render Evidenced Strengths List
  const strengthsContainer = document.getElementById('analysis-strengths-list');
  const strengthsCountBadge = document.getElementById('analysis-strengths-count-badge');

  if (strengthsCountBadge) {
    strengthsCountBadge.innerText = `${strongMatches.length} Verified Matches`;
  }

  if (strengthsContainer) {
    strengthsContainer.innerHTML = '';

    if (strongMatches.length === 0) {
      strengthsContainer.innerHTML = '<div class="p-space-md text-on-surface-variant font-body-sm col-span-2">No direct strong matches evidenced in resume text.</div>';
    } else {
      strongMatches.forEach((match) => {
        const card = document.createElement('div');
        card.className = 'p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-2xs hover:bg-surface-container-high transition-colors';
        card.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="font-body-md text-body-md font-bold text-on-surface">${escapeHtml(match.requirement)}</span>
            <span class="material-symbols-outlined text-secondary text-base">check_circle</span>
          </div>
          <p class="font-body-sm text-body-sm text-on-surface-variant">
            ${escapeHtml(match.reason || 'Requirement verified against candidate profile.')}
          </p>
          ${match.evidence && match.evidence.length > 0 ? `
            <span class="font-label-code text-label-code text-secondary">Evidence: ${escapeHtml(match.evidence[0])}</span>
          ` : ''}
        `;
        strengthsContainer.appendChild(card);
      });
    }
  }

  // 5. Render Candidate Extracted Profile Details in Right Column
  const candidateSkillsContainer = document.getElementById('analysis-candidate-skills');
  if (candidateSkillsContainer && candidate.skills) {
    candidateSkillsContainer.innerHTML = '';
    candidate.skills.forEach(sk => {
      const pill = document.createElement('span');
      pill.className = 'px-space-xs py-space-2xs rounded bg-surface-container-highest text-on-surface font-label-code text-label-code';
      pill.innerText = typeof sk === 'string' ? sk : sk.name;
      candidateSkillsContainer.appendChild(pill);
    });
  }

  // 6. Render Extracted Projects & Experience
  const candidateProjectsContainer = document.getElementById('analysis-candidate-projects');
  if (candidateProjectsContainer && candidate.projects) {
    candidateProjectsContainer.innerHTML = '';
    candidate.projects.forEach(p => {
      const projDiv = document.createElement('div');
      projDiv.className = 'p-space-xs rounded bg-surface-container-low flex flex-col gap-1';
      projDiv.innerHTML = `
        <span class="font-semibold text-on-surface font-body-sm">${escapeHtml(p.name)}</span>
        <span class="text-on-surface-variant text-body-sm">${escapeHtml(p.description || '')}</span>
      `;
      candidateProjectsContainer.appendChild(projDiv);
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
