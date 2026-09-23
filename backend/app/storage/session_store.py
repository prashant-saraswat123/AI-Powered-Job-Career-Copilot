"""In-memory session store for tracking interview states."""

import threading
from app.models.interview import InterviewSessionState


class InterviewSessionStore:
    """Thread-safe in-memory session repository for interview states."""

    def __init__(self) -> None:
        self._sessions: dict[str, InterviewSessionState] = {}
        self._lock = threading.Lock()

    def create(self, session: InterviewSessionState) -> InterviewSessionState:
        """Store a new interview session."""
        with self._lock:
            self._sessions[session.interview_id] = session
            return session

    def get(self, interview_id: str) -> InterviewSessionState | None:
        """Retrieve an interview session by ID."""
        with self._lock:
            return self._sessions.get(interview_id)

    def update(self, session: InterviewSessionState) -> InterviewSessionState:
        """Update an existing session state."""
        with self._lock:
            self._sessions[session.interview_id] = session
            return session

    def delete(self, interview_id: str) -> bool:
        """Remove a session from the store."""
        with self._lock:
            return self._sessions.pop(interview_id, None) is not None

    def clear(self) -> None:
        """Clear all sessions (useful for tests)."""
        with self._lock:
            self._sessions.clear()


# Global singleton instance for runtime dependency injection
session_store = InterviewSessionStore()
