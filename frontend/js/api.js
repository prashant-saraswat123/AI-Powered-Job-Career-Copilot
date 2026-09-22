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


async function healthCheck() {
    return request("/health");
}


/*
 * STEP 1
 * Resume + JD → Career Analysis
 */
// async function analyzeCandidate(resumeFile, jobDescription) {
//     if (!resumeFile) {
//         throw new Error("Please select a resume.");
//     }

//     if (!jobDescription || !jobDescription.trim()) {
//         throw new Error("Please enter a job description.");
//     }

//     const formData = new FormData();

//     formData.append("resume", resumeFile);
//     formData.append("job_description", jobDescription.trim());

//     return request("/api/analyze", {
//         method: "POST",
//         body: formData
//     });
// }

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


/*
 * STEP 2
 * Career Analysis → Personalized Roadmap
 *
 * Endpoint/schema may be adjusted once we bring
 * teammate 1's actual implementation into this repo.
 */
async function generateRoadmap(payload) {
    return request("/api/roadmap/generate", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}


/*
 * STEP 3
 * Career Analysis → Interview Questions
 */
async function generateInterviewQuestions(payload) {
    return request("/api/interview/questions", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}


/*
 * STEP 4
 * Interview answers → Evaluation
 */
async function evaluateInterview(payload) {
    return request("/api/interview/evaluate", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}


/*
 * Optional final interview report endpoint.
 */
async function getInterviewReport(sessionId) {
    return request(
        `/api/interview/session/${encodeURIComponent(sessionId)}/report`
    );
}


window.CareerForgeApi = {
    request,
    healthCheck,

    analyzeCandidate,
    generateRoadmap,

    generateInterviewQuestions,
    evaluateInterview,
    getInterviewReport
};