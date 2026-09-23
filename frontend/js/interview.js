// ============================================================
// CareerForge - Interview Studio
// Recording -> WAV -> Transcription -> Evaluation -> Next Question
// ============================================================

let mediaRecorder = null;
let audioStream = null;
let audioChunks = [];
let audioBlob = null;
let interviewId = null;
let currentQuestionIndex = 0;
let currentQuestion = null;
let isSubmitting = false;


// ============================================================
// DOM
// ============================================================

const recordBtn = document.getElementById("record-btn");
const recordIcon = document.getElementById("record-icon");
const recordLabel = document.getElementById("record-label");

const pauseBtn = document.getElementById("btn-pause-recording");
const restartBtn = document.getElementById("btn-restart-recording");
const submitBtn = document.getElementById("submit-answer-btn");

const recordingStatus = document.getElementById("recording-status");
const recordingDescription = document.getElementById("recording-description");

const transcriptElement = document.getElementById("transcript-stream");

const questionText = document.getElementById("question-text");
const questionProgress = document.getElementById("question-progress");


// ============================================================
// SESSION
// ============================================================

function getSession() {
    if (
        window.CareerForgeSession &&
        typeof window.CareerForgeSession.getSession === "function"
    ) {
        return window.CareerForgeSession.getSession();
    }

    return null;
}


function saveSession(updates) {
    if (
        window.CareerForgeSession &&
        typeof window.CareerForgeSession.updateSession === "function"
    ) {
        window.CareerForgeSession.updateSession(updates);
    }
}


// ============================================================
// INITIALIZATION
// ============================================================

async function initializeInterview() {
    const session = getSession();

    if (!session) {
        console.error("No session found.");
        return;
    }

    const interview = session.interview || {};

    if (interview.sessionId) {
        try {
            const state = await loadInterviewState(interview.sessionId);

            // If the previous interview is already completed,
            // start a completely new interview.
            if (state?.status === "COMPLETED") {
                console.log(
                    "♻️ Previous interview is completed. Starting a new interview."
                );

                window.CareerForgeSession.resetInterview();

                await startInterview();
                return;
            }

            // Existing interview is still active.
            console.log(
                "▶️ Resuming active interview:",
                interview.sessionId
            );

        } catch (error) {
            console.warn(
                "Could not resume previous interview. Starting a new one.",
                error
            );

            window.CareerForgeSession.resetInterview();

            await startInterview();
        }

        return;
    }

    // No previous interview exists.
    await startInterview();
}

// ============================================================
// START INTERVIEW
// ============================================================

async function startInterview() {
    setStatus(
        "Starting interview...",
        "Preparing your first interview question."
    );

    try {
        const session = getSession();

        const analysis = session?.analysis;

        const candidateProfile = buildCandidateProfile(session, analysis);

        console.log("Starting interview with:", candidateProfile);

        const response =
            await window.CareerForgeApi.generateInterviewQuestions(
                candidateProfile
            );

        console.log("Interview start response:", response);

        interviewId = response.interview_id;

        saveInterviewSession(response);

        displayQuestion(response.first_question);

        setStatus(
            "Ready to record",
            "Click Start Recording when you are ready."
        );

    } catch (error) {
        console.error("Failed to start interview:", error);

        setStatus(
            "Interview could not start",
            error.message || "Please try again."
        );
    }
}


// ============================================================
// CANDIDATE PROFILE
// ============================================================

function buildCandidateProfile(session, analysis) {

    const candidate =
        analysis?.candidate_profile || {};

    const skills =
        Array.isArray(candidate.skills)
            ? candidate.skills.map((skill) => ({
                skill_id: normalizeSkillId(skill.name),
                skill_name: skill.name,
                proficiency_level: "intermediate"
            }))
            : [];

    const gaps =
        analysis?.skill_gaps?.skill_gaps || [];

    const knownSkillGaps =
        gaps
            .map((gap) => gap.skill)
            .filter(Boolean);

    return {
        candidate_id: "careerforge-candidate",
        name: candidate.name || "Candidate",
        target_role:
            session?.targetRole ||
            analysis?.job_profile?.title ||
            "Software Engineer",
        years_of_experience: 1,
        skills,
        known_skill_gaps: knownSkillGaps
    };
}


function normalizeSkillId(name) {
    return String(name || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
}


// ============================================================
// LOAD EXISTING INTERVIEW
// ============================================================

async function loadInterviewState() {

    const response =
        await fetch(
            `${window.CareerForgeApi.API_BASE_URL || "http://127.0.0.1:8000"}/api/v1/interviews/${interviewId}/state`
        );

    if (!response.ok) {
        throw new Error("Could not load interview state.");
    }

    const state = await response.json();

    console.log("Interview state:", state);

    if (state.turns?.length) {
        currentQuestionIndex = state.turns.length;
    }

    const lastTurn =
        state.turns?.[state.turns.length - 1];

    if (lastTurn?.question) {
        displayQuestion(lastTurn.question);
    }

    updateQuestionProgress();
    return state;
}


// ============================================================
// SAVE INTERVIEW SESSION
// ============================================================

function saveInterviewSession(response) {

    if (!window.CareerForgeSession) {
        return;
    }

    const session =
        getSession() || {};

    const interview =
        session.interview || {};

    interview.sessionId =
        response.interview_id;

    interview.questions =
        [response.first_question];

    interview.currentQuestionIndex = 0;

    interview.answers =
        [];

    interview.report =
        null;

    saveSession({
        interview
    });
}


// ============================================================
// QUESTION DISPLAY
// ============================================================

function displayQuestion(question) {

    if (!question) {
        return;
    }

    currentQuestion = question;

    if (questionText) {
        questionText.textContent =
            question.question_text || "";
    }

    updateQuestionProgress();

    console.log("Current question:", question);
}


function updateQuestionProgress() {

    if (!questionProgress) {
        return;
    }

    questionProgress.textContent =
        `Question ${currentQuestionIndex + 1}`;
}


// ============================================================
// RECORDING
// ============================================================

async function startRecording() {

    if (isSubmitting) {
        return;
    }

    try {

        audioStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        audioChunks = [];
        audioBlob = null;

        let options = {};

        if (
            MediaRecorder.isTypeSupported(
                "audio/webm;codecs=opus"
            )
        ) {
            options.mimeType =
                "audio/webm;codecs=opus";
        }

        mediaRecorder =
            new MediaRecorder(
                audioStream,
                options
            );

        mediaRecorder.ondataavailable =
            (event) => {

                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

        mediaRecorder.onstop =
            async () => {

                await finishRecording();
            };

        mediaRecorder.start();

        setRecordingUI(true);

        setStatus(
            "Recording",
            "Speak naturally. Click Stop Recording when finished."
        );

        console.log(
            "Recording started:",
            mediaRecorder.mimeType
        );

    } catch (error) {

        console.error(
            "Microphone error:",
            error
        );

        setStatus(
            "Microphone unavailable",
            "Please allow microphone access and try again."
        );

        alert(
            "Microphone access is required for the interview."
        );
    }
}


function stopRecording() {

    if (!mediaRecorder) {
        return;
    }

    if (
        mediaRecorder.state !== "inactive"
    ) {
        mediaRecorder.stop();
    }

    setRecordingUI(false);

    setStatus(
        "Processing recording...",
        "Preparing your audio."
    );
}


async function finishRecording() {

    try {

        const rawBlob =
            new Blob(
                audioChunks,
                {
                    type:
                        mediaRecorder.mimeType
                }
            );

        console.log(
            "Raw audio:",
            rawBlob.type,
            rawBlob.size
        );

        audioBlob =
            await convertToWav(rawBlob);

        console.log(
            "WAV ready:",
            audioBlob.type,
            audioBlob.size
        );

        setStatus(
            "Recording ready",
            "Your answer is ready to submit."
        );

        transcriptElement.textContent =
            "Recording captured. Click Submit Answer & Next.";

    } catch (error) {

        console.error(
            "Audio conversion failed:",
            error
        );

        setStatus(
            "Recording failed",
            "Could not process the audio. Please restart."
        );
    }

    stopMicrophone();
}


// ============================================================
// PAUSE
// ============================================================

function togglePause() {

    if (!mediaRecorder) {
        return;
    }

    if (
        mediaRecorder.state === "recording"
    ) {

        mediaRecorder.pause();

        pauseBtn.querySelector(
            ".material-symbols-outlined"
        ).textContent = "play_circle";

        pauseBtn.querySelector(
            "span:last-child"
        ).textContent = "Resume Recording";

        setStatus(
            "Recording paused",
            "Click Resume Recording to continue."
        );

    } else if (
        mediaRecorder.state === "paused"
    ) {

        mediaRecorder.resume();

        pauseBtn.querySelector(
            ".material-symbols-outlined"
        ).textContent = "pause_circle";

        pauseBtn.querySelector(
            "span:last-child"
        ).textContent = "Pause Recording";

        setStatus(
            "Recording",
            "Speak naturally."
        );
    }
}


// ============================================================
// RESTART
// ============================================================

function restartRecording() {

    if (
        mediaRecorder &&
        mediaRecorder.state !== "inactive"
    ) {
        mediaRecorder.stop();
    }

    stopMicrophone();

    audioChunks = [];
    audioBlob = null;
    mediaRecorder = null;

    setRecordingUI(false);

    setStatus(
        "Ready to record",
        "Click Start Recording when you are ready."
    );

    transcriptElement.textContent =
        "Your transcript will appear here after recording.";

    console.log("Answer restarted.");
}


// ============================================================
// SUBMIT ANSWER
// ============================================================

async function submitAnswer() {

    if (isSubmitting) {
        return;
    }

    if (!audioBlob) {

        alert(
            "Please record an answer before submitting."
        );

        return;
    }

    if (!interviewId) {

        alert(
            "Interview session is not ready."
        );

        return;
    }

    isSubmitting = true;

    submitBtn.disabled = true;

    setStatus(
        "Transcribing...",
        "Converting your answer to text."
    );

    transcriptElement.textContent =
        "Transcribing your response...";

    try {

        // ----------------------------------------------------
        // 1. SEND WAV TO SPEECH ENDPOINT
        // ----------------------------------------------------

        const formData =
            new FormData();

        formData.append(
            "audio",
            audioBlob,
            "answer.wav"
        );

        const baseUrl =
            window.CareerForgeApi.API_BASE_URL ||
            "http://127.0.0.1:8000";

        const transcriptionResponse =
            await fetch(
                `${baseUrl}/api/v1/interviews/transcribe`,
                {
                    method: "POST",
                    body: formData
                }
            );

        if (!transcriptionResponse.ok) {

            const errorText =
                await transcriptionResponse.text();

            throw new Error(
                `Transcription failed: ${errorText}`
            );
        }

        const transcription =
            await transcriptionResponse.json();

        const answerText =
            transcription.text || "";

        console.log(
            "Transcript:",
            answerText
        );

        if (!answerText.trim()) {
            throw new Error(
                "No speech was detected."
            );
        }

        transcriptElement.textContent =
            answerText;


        // ----------------------------------------------------
        // 2. SEND TRANSCRIPT TO INTERVIEW EVALUATION
        // ----------------------------------------------------

        setStatus(
            "Evaluating...",
            "Analyzing your response."
        );

        const result =
            await window.CareerForgeApi.evaluateInterview(
                interviewId,
                answerText
            );

        console.log(
            "Evaluation result:",
            result
        );


        // ----------------------------------------------------
        // 3. SAVE ANSWER LOCALLY
        // ----------------------------------------------------

        saveAnswer(
            answerText,
            result
        );


        // ----------------------------------------------------
        // 4. HANDLE NEXT QUESTION / COMPLETION
        // ----------------------------------------------------

        if (result.is_completed) {

            await finishInterview();

            return;
        }

        if (result.next_question) {

            currentQuestionIndex++;

            saveNextQuestion(
                result.next_question
            );

            displayQuestion(
                result.next_question
            );

            audioChunks = [];
            audioBlob = null;

            setStatus(
                "Ready to record",
                "New question. Click Start Recording."
            );

            transcriptElement.textContent =
                "Your next response will appear here.";

            setRecordingUI(false);

        } else {

            setStatus(
                "Answer evaluated",
                "No next question was returned."
            );
        }

    } catch (error) {

        console.error(
            "Answer submission failed:",
            error
        );

        setStatus(
            "Submission failed",
            error.message || "Please try again."
        );

        alert(
            error.message ||
            "Something went wrong while submitting your answer."
        );

    } finally {

        isSubmitting = false;

        submitBtn.disabled = false;
    }
}


// ============================================================
// SAVE ANSWER
// ============================================================

function saveAnswer(
    answerText,
    evaluation
) {

    const session =
        getSession();

    if (!session) {
        return;
    }

    const interview =
        session.interview || {};

    interview.answers =
        interview.answers || [];

    interview.answers.push({
        question:
            currentQuestion,
        answer:
            answerText,
        evaluation:
            evaluation
    });

    interview.currentQuestionIndex =
        currentQuestionIndex;

    saveSession({
        interview
    });
}


function saveNextQuestion(question) {

    const session =
        getSession();

    if (!session) {
        return;
    }

    const interview =
        session.interview || {};

    interview.questions =
        interview.questions || [];

    interview.questions.push(
        question
    );

    saveSession({
        interview
    });
}


// ============================================================
// END INTERVIEW
// ============================================================

async function finishInterview() {
    if (!interviewId) {
        alert("Interview session is missing.");
        return;
    }

    setStatus(
        "Finishing interview...",
        "Generating your interview report."
    );

    try {
        console.log("🏁 Ending interview:", interviewId);

        const result =
            await window.CareerForgeApi.endInterview(interviewId);

        console.log("📊 Interview report:", result);

        // Save report into session
        const session = getSession();

        if (session) {
            const interview = session.interview || {};

            interview.report = result;
            interview.sessionId = interviewId;

            saveSession({
                interview
            });
        }

        // Go to report page
        window.location.href = "interview-report.html";

    } catch (error) {
        console.error(
            "❌ Could not generate interview report:",
            error
        );

        setStatus(
            "Interview completed",
            "The report could not be generated."
        );

        alert(
            error.message ||
            "Interview completed, but the report could not be generated."
        );
    }
}


// ============================================================
// UI
// ============================================================

function setInitialUI() {

    if (submitBtn) {
        submitBtn.disabled = false;
    }

    if (pauseBtn) {
        pauseBtn.disabled = true;
    }

    setStatus(
        "Ready to record",
        "Click Start Recording when you are ready."
    );
}


function setRecordingUI(recording) {

    if (!recordBtn) {
        return;
    }

    if (recording) {

        recordIcon.textContent =
            "stop";

        recordLabel.textContent =
            "Stop Recording";

        recordBtn.classList.remove(
            "bg-secondary"
        );

        recordBtn.classList.add(
            "bg-error"
        );

        if (pauseBtn) {
            pauseBtn.disabled = false;
        }

    } else {

        recordIcon.textContent =
            "mic";

        recordLabel.textContent =
            "Start Recording";

        recordBtn.classList.remove(
            "bg-error"
        );

        recordBtn.classList.add(
            "bg-secondary"
        );

        if (pauseBtn) {
            pauseBtn.disabled = true;
        }
    }
}


function setStatus(
    status,
    description
) {

    if (recordingStatus) {
        recordingStatus.textContent =
            status;
    }

    if (recordingDescription) {
        recordingDescription.textContent =
            description;
    }
}


// ============================================================
// MICROPHONE CLEANUP
// ============================================================

function stopMicrophone() {

    if (!audioStream) {
        return;
    }

    audioStream
        .getTracks()
        .forEach(
            (track) => track.stop()
        );

    audioStream = null;
}


// ============================================================
// AUDIO -> WAV
// ============================================================

async function convertToWav(blob) {

    const arrayBuffer =
        await blob.arrayBuffer();

    const audioContext =
        new AudioContext();

    try {

        const audioBuffer =
            await audioContext.decodeAudioData(
                arrayBuffer
            );

        return encodeWav(
            audioBuffer
        );

    } finally {

        await audioContext.close();
    }
}


function encodeWav(audioBuffer) {

    const numberOfChannels =
        audioBuffer.numberOfChannels;

    const sampleRate =
        audioBuffer.sampleRate;

    const frameCount =
        audioBuffer.length;

    const buffer =
        new ArrayBuffer(
            44 +
            frameCount *
            numberOfChannels *
            2
        );

    const view =
        new DataView(buffer);

    writeString(
        view,
        0,
        "RIFF"
    );

    view.setUint32(
        4,
        36 +
        frameCount *
        numberOfChannels *
        2,
        true
    );

    writeString(
        view,
        8,
        "WAVE"
    );

    writeString(
        view,
        12,
        "fmt "
    );

    view.setUint32(
        16,
        16,
        true
    );

    view.setUint16(
        20,
        1,
        true
    );

    view.setUint16(
        22,
        numberOfChannels,
        true
    );

    view.setUint32(
        24,
        sampleRate,
        true
    );

    view.setUint32(
        28,
        sampleRate *
        numberOfChannels *
        2,
        true
    );

    view.setUint16(
        32,
        numberOfChannels * 2,
        true
    );

    view.setUint16(
        34,
        16,
        true
    );

    writeString(
        view,
        36,
        "data"
    );

    view.setUint32(
        40,
        frameCount *
        numberOfChannels *
        2,
        true
    );

    const channels = [];

    for (
        let channel = 0;
        channel < numberOfChannels;
        channel++
    ) {

        channels.push(
            audioBuffer.getChannelData(
                channel
            )
        );
    }

    let offset = 44;

    for (
        let i = 0;
        i < frameCount;
        i++
    ) {

        for (
            let channel = 0;
            channel < numberOfChannels;
            channel++
        ) {

            let sample =
                channels[channel][i];

            sample =
                Math.max(
                    -1,
                    Math.min(
                        1,
                        sample
                    )
                );

            const value =
                sample < 0
                    ? sample * 0x8000
                    : sample * 0x7fff;

            view.setInt16(
                offset,
                value,
                true
            );

            offset += 2;
        }
    }

    return new Blob(
        [buffer],
        {
            type: "audio/wav"
        }
    );
}


function writeString(
    view,
    offset,
    string
) {

    for (
        let i = 0;
        i < string.length;
        i++
    ) {

        view.setUint8(
            offset + i,
            string.charCodeAt(i)
        );
    }
}


// ============================================================
// EVENT LISTENERS
// ============================================================

if (recordBtn) {

    recordBtn.addEventListener(
        "click",
        () => {

            if (
                !mediaRecorder ||
                mediaRecorder.state === "inactive"
            ) {

                startRecording();

            } else {

                stopRecording();
            }
        }
    );
}


if (pauseBtn) {

    pauseBtn.addEventListener(
        "click",
        togglePause
    );
}


if (restartBtn) {

    restartBtn.addEventListener(
        "click",
        restartRecording
    );
}


if (submitBtn) {

    submitBtn.addEventListener(
        "click",
        submitAnswer
    );
}


// ============================================================
// LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeInterview
);