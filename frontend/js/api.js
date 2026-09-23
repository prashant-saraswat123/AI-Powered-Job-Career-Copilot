const API_BASE_URL =
    window.CareerForgeConfig?.API_BASE_URL ||
    "http://localhost:8000";


async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
        ...options,
        headers: {
            ...(options.body instanceof FormData
                ? {}
                : { "Content-Type": "application/json" }),
            ...(options.headers || {})
        }
    };

    try {
        console.log("🌐 FETCH START");
        console.log("🌐 URL:", url);
        console.log("🌐 CONFIG:", config);

        const response = await fetch(url, config);

        console.log("🌐 FETCH RESPONSE RECEIVED:", response.status);

        let data = null;

        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            const message =
                typeof data === "object"
                    ? data.detail || data.message
                    : data;

            throw new Error(
                message || `Request failed with status ${response.status}`
            );
        }

        return data;

    } catch (error) {
        console.error(`API error: ${endpoint}`, error);
        throw error;
    }
}


/* ============================================================
   HEALTH
   ============================================================ */

async function healthCheck() {
    return request("/health");
}


/* ============================================================
   STEP 1
   Resume + JD → Career Analysis
   ============================================================ */

async function analyzeCandidate(resumeFile, jobDescription) {
    console.log("🟢 analyzeCandidate ENTERED");
    console.log("📄 resumeFile:", resumeFile);
    console.log("📝 jobDescription:", jobDescription);

    if (!(resumeFile instanceof File)) {
        throw new Error("Resume is not a valid File object.");
    }

    if (!jobDescription || !jobDescription.trim()) {
        throw new Error("Job description is empty.");
    }

    const formData = new FormData();

    formData.append("resume", resumeFile, resumeFile.name);
    formData.append("job_description", jobDescription.trim());

    console.log("📦 FormData created");

    for (const [key, value] of formData.entries()) {
        console.log(
            "📦 FormData:",
            key,
            value instanceof File
                ? `FILE: ${value.name}`
                : value
        );
    }

    return request("/api/analyze", {
        method: "POST",
        body: formData
    });
}


/* ============================================================
   STEP 2
   Career Analysis → Personalized Roadmap
   ============================================================ */

async function generateRoadmap(payload) {
    return request("/api/roadmap/generate", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

async function generateRoadmapFromGaps(payload) {
    if (!payload) {
        throw new Error("Roadmap payload is missing.");
    }

    if (!payload.gaps || !payload.gaps.length) {
        throw new Error("No skill gaps were provided.");
    }

    return request("/api/roadmap/generate", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}


/* ============================================================
   STEP 3
   Start Interview
   ============================================================ */

/*
 * Backend endpoint:
 *
 * POST /api/v1/interviews/start
 *
 * Body:
 * {
 *   candidate_id,
 *   name,
 *   target_role,
 *   years_of_experience,
 *   skills: [],
 *   known_skill_gaps: []
 * }
 */

async function generateInterviewQuestions(candidateProfile) {
    console.log("🎤 Starting interview...");
    console.log("🎤 Candidate profile:", candidateProfile);

    return request("/api/v1/interviews/start", {
        method: "POST",
        body: JSON.stringify(candidateProfile)
    });
}


/* ============================================================
   STEP 4
   Interview Answer → Evaluation
   ============================================================ */

/*
 * Backend endpoint:
 *
 * POST /api/v1/interviews/{interview_id}/answer
 *
 * Body:
 * {
 *   "answer_text": "..."
 * }
 */

async function evaluateInterview(interviewId, answerText) {
    console.log("🧠 Evaluating interview answer...");
    console.log("🧠 Interview ID:", interviewId);
    console.log("🧠 Answer:", answerText);

    if (!interviewId) {
        throw new Error("Interview ID is missing.");
    }

    if (!answerText || !answerText.trim()) {
        throw new Error("Answer text is empty.");
    }

    return request(
        `/api/v1/interviews/${encodeURIComponent(interviewId)}/answer`,
        {
            method: "POST",
            body: JSON.stringify({
                answer_text: answerText.trim()
            })
        }
    );
}


/* ============================================================
   STEP 5
   Get Interview State
   ============================================================ */

/*
 * Backend endpoint:
 *
 * GET /api/v1/interviews/{interview_id}/state
 */

async function getInterviewState(interviewId) {
    console.log("📋 Loading interview state...");
    console.log("📋 Interview ID:", interviewId);

    if (!interviewId) {
        throw new Error("Interview ID is missing.");
    }

    return request(
        `/api/v1/interviews/${encodeURIComponent(interviewId)}/state`,
        {
            method: "GET"
        }
    );
}


/* ============================================================
   STEP 6
   End Interview / Generate Report
   ============================================================ */

/*
 * Backend endpoint:
 *
 * POST /api/v1/interviews/{interview_id}/end
 *
 * This generates and returns the final interview report.
 */

async function endInterview(interviewId) {
    console.log("🏁 Ending interview...");
    console.log("🏁 Interview ID:", interviewId);

    if (!interviewId) {
        throw new Error("Interview ID is missing.");
    }

    return request(
        `/api/v1/interviews/${encodeURIComponent(interviewId)}/end`,
        {
            method: "POST"
        }
    );
}


/* ============================================================
   STEP 7
   Audio → Speech Transcription
   ============================================================ */

/*
 * Backend endpoint:
 *
 * POST /api/v1/interviews/transcribe
 *
 * Expects multipart/form-data:
 * audio = WAV file
 */

async function transcribeInterviewAudio(audioBlob) {
    console.log("🎙️ Transcribing interview audio...");

    if (!audioBlob) {
        throw new Error("Audio recording is missing.");
    }

    const formData = new FormData();

    formData.append(
        "audio",
        audioBlob,
        "answer.wav"
    );

    return request("/api/v1/interviews/transcribe", {
        method: "POST",
        body: formData
    });
}


/* ============================================================
   EXPORT API
   ============================================================ */

window.CareerForgeApi = {
    API_BASE_URL,

    request,
    healthCheck,

    analyzeCandidate,
    generateRoadmap,
    generateRoadmapFromGaps,

    generateInterviewQuestions,
    evaluateInterview,
    getInterviewState,
    endInterview,
    transcribeInterviewAudio
};