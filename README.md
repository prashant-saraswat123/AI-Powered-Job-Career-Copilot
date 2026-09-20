# CareerForge AI

CareerForge AI is a GenAI-powered career readiness and interview preparation platform.

The system analyzes a candidate's resume against a specific job description, identifies explainable skill gaps, creates a personalized preparation roadmap, and eventually conducts a speech-based interview to evaluate technical knowledge and communication.

## Current Development Status

The current backend contains the initial end-to-end career analysis pipeline.

### Completed

- FastAPI backend setup
- PDF and DOCX document text extraction
- Candidate profile schema
- Job profile schema
- Requirement matching
- Evidence-based skill gap detection
- Skill gap prioritization
- Mock AI service architecture
- Combined analysis service
- End-to-end `/api/analyze` endpoint
- Basic automated tests for matching and gap analysis

## Current Pipeline

```text
Resume + Job Description
          ↓
   Document Extraction
          ↓
   Candidate / Job Profiles
          ↓
   Requirement Matching
          ↓
      Skill Gaps
          ↓
   Analysis Result