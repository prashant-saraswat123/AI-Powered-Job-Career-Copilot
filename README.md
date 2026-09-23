# CareerForge AI

CareerForge AI is a GenAI-powered career readiness and interview preparation platform.

The platform analyzes a candidate's resume against a specific job description, identifies explainable skill gaps, generates a personalized preparation roadmap, and provides an optional AI-powered interview experience with speech-based answers and interview evaluation.

---

## Features

### 1. Resume & Job Description Analysis

Users can upload their resume and provide a target job description.

The system:

- Extracts text from PDF and DOCX resumes
- Builds a structured candidate profile
- Builds a structured job profile
- Matches job requirements against candidate skills and experience
- Identifies evidence-based skill gaps
- Prioritizes important gaps
- Generates an overall career analysis

### 2. Personalized Skill Gap Analysis

CareerForge identifies areas where the candidate does not fully meet the requirements of the target role.

Each gap includes:

- Skill name
- Current proficiency
- Evidence from the candidate profile
- Recommended focus area
- Priority

This makes the analysis explainable rather than simply producing a generic score.

### 3. Personalized Career Roadmap

After reviewing the analysis, the user can choose:

**Build My Roadmap**

The system then generates a personalized preparation roadmap based on the identified skill gaps.

The roadmap contains:

- Preparation phases
- Milestones
- Skills to develop
- Recommended learning focus
- Progress tracking information

Roadmap generation is user-triggered and does not automatically run when the analysis page is loaded.

### 4. AI Interview Studio

Users can optionally take an AI-powered interview based on their target role and candidate profile.

The interview system:

- Generates role-specific interview questions
- Presents questions one at a time
- Records spoken answers
- Converts speech to text using Azure AI Speech
- Evaluates submitted answers
- Tracks interview progress
- Produces an interview report

### 5. Interview Evaluation

The interview evaluation provides feedback on:

- Technical knowledge
- Communication
- Strengths
- Growth areas
- Confirmed skill gaps
- Recommended focus areas

The final interview report summarizes the candidate's performance and can be used alongside the career roadmap.

---

## System Workflow

                    Resume + Job Description
                              |
                              v
                    Document Extraction
                              |
                              v
                  Candidate / Job Profiles
                              |
                              v
                    Requirement Matching
                              |
                              v
                       Skill Gaps
                              |
                              v
                    Career Analysis
                              |
                    +---------+---------+
                    |                   |
                    v                   v
              Build Roadmap       AI Interview
                    |                   |
                    v                   v
          Personalized Roadmap    Speech Transcription
                                        |
                                        v
                                Interview Evaluation
                                        |
                                        v
                                  Interview Report