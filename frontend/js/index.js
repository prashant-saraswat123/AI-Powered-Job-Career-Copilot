// frontend/js/index.js
// CareerForge AI — Index / Setup & Intake Page Controller

document.addEventListener('DOMContentLoaded', () => {
  const resumeFileInput = document.getElementById('resume-file-input');
  const replaceBtn = document.getElementById('replace-resume-btn');
  const deleteBtn = document.getElementById('delete-resume-btn');
  const dropZone = document.getElementById('resume-drop-zone');
  const activeFilename = document.getElementById('active-filename');
  const resumeDetails = document.getElementById('resume-details');
  const targetJd = document.getElementById('target-jd');
  const jdCount = document.getElementById('jd-count');
  const runBtn = document.getElementById('run-analysis-btn');
  const simulatorStatus = document.getElementById('simulator-status');
  const validationError = document.getElementById('intake-error-message');

  let currentResumeFile = null;

  // Update Character Counter
  if (targetJd && jdCount) {
    targetJd.addEventListener('input', () => {
      jdCount.innerText = targetJd.value.length.toLocaleString();
      validateInputs();
    });
  }

  // Trigger hidden file input
  if (replaceBtn && resumeFileInput) {
    replaceBtn.addEventListener('click', () => resumeFileInput.click());
  }

  if (dropZone && resumeFileInput) {
    dropZone.addEventListener('click', () => resumeFileInput.click());

    // Drag & drop support
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-primary', 'bg-surface-container-high');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-primary', 'bg-surface-container-high');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-primary', 'bg-surface-container-high');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  if (resumeFileInput) {
    resumeFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      currentResumeFile = null;
      if (resumeFileInput) resumeFileInput.value = '';
      if (activeFilename) activeFilename.innerText = 'No resume selected';
      if (resumeDetails) resumeDetails.innerHTML = '<span class="text-error">Required for analysis</span>';
      validateInputs();
    });
  }

  function handleFileSelect(file) {
    clearError();
    const validExtensions = ['.pdf', '.docx'];
    const ext = file.name.slice((file.name.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
    
    if (!validExtensions.includes('.' + ext)) {
      showError('Only PDF and DOCX files are supported.');
      return;
    }

    currentResumeFile = file;
    if (activeFilename) {
      activeFilename.innerText = file.name;
    }
    if (resumeDetails) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      resumeDetails.innerHTML = `<span>${sizeMb} MB</span> • <span class="text-secondary">${ext.toUpperCase()}</span> • <span class="text-secondary">Ready to analyze</span>`;
    }
    validateInputs();
  }

  function showError(msg) {
    if (validationError) {
      validationError.innerText = msg;
      validationError.classList.remove('hidden');
    } else {
      alert(msg);
    }
  }

  function clearError() {
    if (validationError) {
      validationError.innerText = '';
      validationError.classList.add('hidden');
    }
  }

  function validateInputs() {
    const hasJd = targetJd && targetJd.value.trim().length > 0;
    const hasResume = currentResumeFile !== null;
    
    if (!hasResume || !hasJd) {
      if (runBtn) {
        runBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
      return false;
    } else {
      if (runBtn && !runBtn.disabled) {
        runBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
      return true;
    }
  }

  // Handle Form Submission / Analyze Trigger
  if (runBtn) {
    runBtn.addEventListener('click', async () => {
      clearError();
      if (!currentResumeFile) {
        showError('Please select or upload a resume file (PDF or DOCX).');
        return;
      }

      const jdText = targetJd ? targetJd.value.trim() : '';
      if (!jdText) {
        showError('Please enter or paste the target job description text.');
        return;
      }

      // Enter Loading State
      runBtn.disabled = true;
      runBtn.classList.add('opacity-75', 'cursor-wait');
      const originalBtnContent = runBtn.innerHTML;
      runBtn.innerHTML = '<span class="material-symbols-outlined text-2xl animate-spin">refresh</span><span>Analyzing Career Fit...</span>';
      
      if (simulatorStatus) {
        simulatorStatus.innerText = 'EXTRACTING & MATCHING...';
        simulatorStatus.classList.add('animate-pulse');
      }

      try {
        const result = await window.CareerForgeApi.analyzeCandidate(currentResumeFile, jdText);
        
        // Save to sessionStorage for cross-page retrieval
        sessionStorage.setItem('careerforge_analysis_result', JSON.stringify({
          data: result,
          meta: {
            resume_filename: currentResumeFile.name,
            job_title: document.getElementById('target-title') ? document.getElementById('target-title').value : '',
            company: document.getElementById('target-company') ? document.getElementById('target-company').value : '',
            analyzed_at: new Date().toISOString()
          }
        }));

        if (simulatorStatus) {
          simulatorStatus.innerText = 'ANALYSIS COMPLETE';
          simulatorStatus.classList.remove('animate-pulse');
        }

        // Navigate to analysis page
        window.location.href = 'pages/analysis.html';

      } catch (err) {
        console.error('Analysis submission failed:', err);
        showError(`Analysis failed: ${err.message || 'Check that backend server is running.'}`);
        runBtn.disabled = false;
        runBtn.classList.remove('opacity-75', 'cursor-wait');
        runBtn.innerHTML = originalBtnContent;
        if (simulatorStatus) {
          simulatorStatus.innerText = 'FAILED';
          simulatorStatus.classList.remove('animate-pulse');
        }
      }
    });
  }

  // Initial validation check
  validateInputs();
});
