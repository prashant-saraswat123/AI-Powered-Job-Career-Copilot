(function () {
    "use strict";

    const STORAGE_KEY = "careerforge_session";

    const DEFAULT_SESSION = {
        targetRole: "",
        company: "",
        jobDescription: "",
        resumeName: "",

        analysis: null,
        roadmap: null,

        interview: {
            sessionId: null,
            questions: [],
            currentQuestionIndex: 0,
            answers: [],
            report: null
        }
    };


    // ============================================================
    // INTERNAL SESSION FUNCTIONS
    // ============================================================

    function getSession() {
        try {
            const stored =
                sessionStorage.getItem(STORAGE_KEY);

            if (!stored) {
                return structuredClone(DEFAULT_SESSION);
            }

            const parsed =
                JSON.parse(stored);

            return {
                ...structuredClone(DEFAULT_SESSION),
                ...parsed,

                // Make sure interview always has the expected shape
                interview: {
                    ...structuredClone(
                        DEFAULT_SESSION.interview
                    ),
                    ...(parsed.interview || {})
                }
            };

        } catch (error) {

            console.error(
                "Failed to read CareerForge session:",
                error
            );

            return structuredClone(
                DEFAULT_SESSION
            );
        }
    }


    function saveSession(session) {
        try {

            sessionStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(session)
            );

        } catch (error) {

            console.error(
                "Failed to save CareerForge session:",
                error
            );
        }
    }


    function updateSession(updates) {

        const current =
            getSession();

        const updated = {
            ...current,
            ...updates
        };

        saveSession(updated);

        return updated;
    }


    function clearSession() {

        sessionStorage.removeItem(
            STORAGE_KEY
        );
    }


    // ============================================================
    // ANALYSIS
    // ============================================================

    function setAnalysis(analysis) {

        const session =
            getSession();

        session.analysis =
            analysis;

        saveSession(session);

        return session;
    }


    function getAnalysis() {

        return getSession().analysis;
    }


    // ============================================================
    // ROADMAP
    // ============================================================

    function setRoadmap(roadmap) {

        const session =
            getSession();

        session.roadmap =
            roadmap;

        saveSession(session);

        return session;
    }


    function getRoadmap() {

        return getSession().roadmap;
    }


    // ============================================================
    // INTERVIEW
    // ============================================================

    function setInterviewQuestions(
        questions,
        sessionId = null
    ) {

        const session =
            getSession();

        session.interview.questions =
            questions || [];

        session.interview.sessionId =
            sessionId;

        session.interview.currentQuestionIndex =
            0;

        session.interview.answers =
            [];

        session.interview.report =
            null;

        saveSession(session);

        return session;
    }


    function saveInterviewAnswer(answer) {

        const session =
            getSession();

        session.interview.answers =
            session.interview.answers || [];

        session.interview.answers.push(
            answer
        );

        saveSession(session);

        return session;
    }


    function setInterviewReport(report) {

        const session =
            getSession();

        session.interview.report =
            report;

        saveSession(session);

        return session;
    }


    function getInterview() {

        return getSession().interview;
    }

    function resetInterview() {
    const session = getSession();

    session.interview = {
        sessionId: null,
        questions: [],
        currentQuestionIndex: 0,
        answers: [],
        report: null
    };

    saveSession(session);

    return session;
}


    // ============================================================
    // PUBLIC API
    // ============================================================

    window.CareerForgeSession = {

        getSession,
        saveSession,
        updateSession,
        clearSession,

        setAnalysis,
        getAnalysis,

        setRoadmap,
        getRoadmap,

        setInterviewQuestions,
        saveInterviewAnswer,
        setInterviewReport,
        getInterview,
        resetInterview
    };

    


    console.log(
        "CareerForge session initialized.",
        window.CareerForgeSession
    );

})();