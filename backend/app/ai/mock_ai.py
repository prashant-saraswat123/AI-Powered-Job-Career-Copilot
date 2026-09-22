from app.ai.base import AIService
from app.schemas.analysis import (
    CandidateProfile,
    JobProfile,
    Skill,
    Project,
    JobRequirement,
)


class MockAIService(AIService):

    async def analyze_resume(self, text: str) -> CandidateProfile:
        return CandidateProfile(
            name="Test Candidate",

            skills=[
                Skill(
                    name="Python",
                    category="programming",
                    evidence=["Python listed in programming skills"]
                ),
                Skill(
                    name="Machine Learning",
                    category="AI/ML",
                    evidence=["Machine Learning listed in skills"]
                ),
                Skill(
                    name="FastAPI",
                    category="backend",
                    evidence=["FastAPI used in backend development"]
                ),
            ],

            projects=[
                Project(
                    name="AI Diagnostic System",
                    description="LLM-based multi-agent system",
                    skills=["Python", "LLM Systems", "LangChain"],
                    evidence=[
                        "Built an LLM-based multi-agent system",
                        "Implemented a multi-step processing pipeline"
                    ]
                )
            ],

            education=[
                "B.E. Computer Science and Engineering"
            ],

            certifications=[
                "Microsoft Azure AI-900"
            ]
        )

    async def analyze_job(self, text: str) -> JobProfile:
        return JobProfile(
            title="AI/ML Engineer",

            requirements=[
                JobRequirement(
                    name="Python",
                    category="programming",
                    required=True,
                    description="Strong Python programming experience"
                ),
                JobRequirement(
                    name="FastAPI",
                    category="backend",
                    required=True,
                    description="Experience building APIs with FastAPI"
                ),
                JobRequirement(
                    name="Docker",
                    category="devops",
                    required=True,
                    description="Experience with containerization"
                ),
                JobRequirement(
                    name="AWS",
                    category="cloud",
                    required=False,
                    description="Experience with AWS cloud services"
                )
            ],

            responsibilities=[
                "Build AI/ML applications",
                "Develop backend APIs",
                "Work with cloud technologies"
            ],

            experience_requirements=[
                "Experience building AI/ML applications"
            ],

            education_requirements=[
                "Bachelor's degree in Computer Science or related field"
            ]
        )