document.addEventListener("DOMContentLoaded", () => {

  const targetTitle = document.getElementById("target-title");
  const targetCompany = document.getElementById("target-company");
  const targetIndustry = document.getElementById("target-industry");
  const targetJd = document.getElementById("target-jd");
  const targetContext =
    document.getElementById("target-context");

  const resumeSize =
    document.getElementById("resume-size");

  const resumeInput = document.getElementById("resume-file");
  const runAnalysisButton =
    document.getElementById("run-analysis-btn");

  const filenameDisplay =
    document.getElementById("active-filename");

  const jdCount =
    document.getElementById("jd-count");

  const status =
    document.getElementById("simulator-status");

  const stage3Description =
    document.getElementById("stage-3-desc");

  const stage3Bar =
    document.getElementById("stage-3-bar");

  const stage4 =
    document.getElementById("stage-4");

  updateTargetContext();
  /*
   * --------------------------------
   * JD character counter
   * --------------------------------
   */

  function updateJdCounter() {
    if (!targetJd || !jdCount) return;

    jdCount.textContent =
      targetJd.value.length.toLocaleString();
  }


  targetJd?.addEventListener(
    "input",
    updateJdCounter
  );


  /*
   * --------------------------------
   * Resume selection
   * --------------------------------
   */

  resumeInput?.addEventListener("change", () => {

    const file = resumeInput.files?.[0];

    if (!file) return;

    if (filenameDisplay) {
      filenameDisplay.textContent = file.name;
    }
    if (resumeSize) {

      const sizeInMB =
        file.size / (1024 * 1024);

      resumeSize.textContent =
        `${sizeInMB.toFixed(2)} MB`;
    }

    /*
     * Keep the selected file available
     * during this page session.
     *
     * We deliberately do NOT try to put
     * File objects into sessionStorage.
     */
    window.CareerForgeCurrentResume = file;
  });


  /*
   * --------------------------------
   * Validation
   * --------------------------------
   */

  function validateInput() {

    const errors = [];

    const resumeFile =
      window.CareerForgeCurrentResume ||
      resumeInput?.files?.[0];

    if (!resumeFile) {
      errors.push("Please upload your resume.");
    }

    if (!targetTitle?.value.trim()) {
      errors.push("Please enter your target job title.");
    }

    if (!targetJd?.value.trim()) {
      errors.push("Please provide the job description.");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }


  /*
   * --------------------------------
   * UI state
   * --------------------------------
   */

  function setAnalysisLoading() {

    runAnalysisButton.disabled = true;

    runAnalysisButton.classList.add(
      "opacity-75",
      "cursor-not-allowed"
    );

    runAnalysisButton.innerHTML = `
            <span class="material-symbols-outlined text-2xl animate-spin">
                sync
            </span>
            <span>Analyzing...</span>
        `;

    if (status) {
      status.textContent =
        "ANALYZING CAREER FIT...";
    }

    if (stage3Description) {
      stage3Description.textContent =
        "Cross-referencing candidate evidence...";
    }

    if (stage3Bar) {
      stage3Bar.style.width = "35%";
    }
  }


  function setAnalysisError(message) {

    runAnalysisButton.disabled = false;

    runAnalysisButton.classList.remove(
      "opacity-75",
      "cursor-not-allowed"
    );

    runAnalysisButton.innerHTML = `
            <span class="material-symbols-outlined text-2xl">
                refresh
            </span>
            <span>Try Analysis Again</span>
        `;

    if (status) {
      status.textContent =
        "ANALYSIS FAILED";
    }

    if (stage3Description) {
      stage3Description.textContent =
        message;
    }

    if (stage3Bar) {
      stage3Bar.style.width = "0%";
    }
  }


  function setAnalysisSuccess() {

    if (status) {
      status.textContent =
        "ANALYSIS COMPLETE";
    }

    if (stage3Description) {
      stage3Description.textContent =
        "Evidence synthesis complete.";
    }

    if (stage3Bar) {
      stage3Bar.style.width = "100%";
    }

    if (stage4) {
      stage4.classList.remove(
        "opacity-60",
        "bg-surface-container-lowest"
      );

      stage4.classList.add(
        "bg-surface-container-high"
      );
    }
  }





  /*
   * --------------------------------
   * Connect button
   * --------------------------------
   */

  const runAnalysisBtn = document.getElementById("run-analysis-btn");

  if (runAnalysisBtn) {
    runAnalysisBtn.addEventListener("click", async (event) => {
      console.log("🔥 START ANALYSIS CLICKED");
      event.preventDefault();
      console.log("✅ preventDefault completed");
      const resumeFile =
        window.CareerForgeCurrentResume ||
        document.getElementById("resume-file")?.files?.[0];
      console.log("📄 RESUME FILE:", resumeFile);
      console.log("📄 RESUME TYPE:", resumeFile?.constructor?.name);
      console.log("📄 RESUME NAME:", resumeFile?.name);

      const targetRole =
        document.getElementById("target-title")?.value.trim() || "";

      const company =
        document.getElementById("target-company")?.value.trim() || "";

      const jobDescription =
        document.getElementById("target-jd")?.value.trim() || "";

      console.log("🎯 Role:", targetRole);
      console.log("🏢 Company:", company);
      console.log("📝 JD length:", jobDescription.length);

      console.log("💾 Session object:", window.CareerForgeSession);
      console.log("🌐 API object:", window.CareerForgeApi);
      // -----------------------------
      // Basic validation
      // -----------------------------

      if (!resumeFile) {
        alert("Please select a resume first.");
        return;
      }

      if (!jobDescription) {
        alert("Please enter a job description.");
        return;
      }

      // -----------------------------
      // Loading state
      // -----------------------------

      const originalText = runAnalysisBtn.textContent;

      runAnalysisBtn.disabled = true;
      runAnalysisBtn.textContent = "Analyzing...";

      console.log("🚀 ABOUT TO CALL ANALYSIS API");
      try {

        // -----------------------------
        // Call backend
        // -----------------------------


                    const result =
                        await window.CareerForgeApi.analyzeCandidate(
                            resumeFile,
                            jobDescription
                        );
                      console.log("✅ ANALYSIS API RETURNED");
        console.log("📦 API RESULT:", result);

                    console.log("Analysis API response:", result);
        // -----------------------------
        // Save everything into session
        // -----------------------------

        window.CareerForgeSession.updateSession({
          targetRole: targetRole,
          company: company,
          jobDescription: jobDescription,
          resumeName: resumeFile.name,
          analysis: result
        });

        // Verify what was saved
        console.log(
          "CareerForge session:",
          window.CareerForgeSession.getSession()
        );

        // -----------------------------
        // Go to analysis page
        // -----------------------------

        window.location.href = "pages/analysis.html";

      } catch (error) {

        console.error("Analysis failed:", error);

        alert(
          `Analysis failed: ${error.message || "Unknown error"}`
        );

        // Restore button
        runAnalysisBtn.disabled = false;
        runAnalysisBtn.textContent = originalText;
      }
    });
  }

  const replaceResumeButton =
    document.getElementById("replace-resume-btn");

  const deleteResumeButton =
    document.getElementById("delete-resume-btn");

  replaceResumeButton?.addEventListener("click", () => {
    resumeInput?.click();
  });


  deleteResumeButton?.addEventListener("click", () => {

    if (!resumeInput) return;

    resumeInput.value = "";

    window.CareerForgeCurrentResume = null;

    if (filenameDisplay) {
      filenameDisplay.textContent =
        "No resume selected";
    }
    if (resumeSize) {
      resumeSize.textContent =
        "No file selected";
    }
  });


  function updateTargetContext() {

    if (!targetContext) return;

    const role =
      targetTitle?.value.trim() || "";

    const company =
      targetCompany?.value.trim() || "";

    if (!role && !company) {
      targetContext.textContent =
        "Target: No target selected";
      return;
    }

    if (role && company) {
      targetContext.textContent =
        `Target: ${role} @ ${company}`;
      return;
    }

    targetContext.textContent =
      `Target: ${role || company}`;
  }
  targetTitle?.addEventListener(
    "input",
    updateTargetContext
  );

  targetCompany?.addEventListener(
    "input",
    updateTargetContext
  );


  /*
   * Initial state
   */
  updateJdCounter();

});