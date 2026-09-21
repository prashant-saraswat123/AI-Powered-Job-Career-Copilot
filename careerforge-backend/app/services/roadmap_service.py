from app.schemas.analysis import LearningRoadmap, LearningResource, RoadmapItem, SkillGapResult
from app.schemas.roadmap import RoadmapItem as SimpleRoadmapItem
from app.schemas.roadmap import RoadmapResponse, RoadmapResource, SkillGapPayload


RESOURCE_CATALOG = {
    "docker": [
        LearningResource(
            title="Docker Getting Started",
            url="https://docs.docker.com/get-started/",
            type="guide",
            description="Official Docker beginner tutorial for containers and images.",
        ),
        LearningResource(
            title="Docker for Beginners",
            url="https://docker-curriculum.com/",
            type="course",
            description="Hands-on Docker learning path for practical container workflows.",
        ),
    ],
    "fastapi": [
        LearningResource(
            title="FastAPI Tutorial",
            url="https://fastapi.tiangolo.com/tutorial/",
            type="tutorial",
            description="Official FastAPI tutorial covering routing, validation, and APIs.",
        ),
        LearningResource(
            title="Building APIs with FastAPI",
            url="https://www.youtube.com/results?search_query=fastapi+tutorial",
            type="video",
            description="Video-based walkthrough for building and testing FastAPI apps.",
        ),
    ],
    "python": [
        LearningResource(
            title="Python for Everybody",
            url="https://www.py4e.com/",
            type="course",
            description="Beginner-friendly Python foundation for programming concepts.",
        ),
    ],
    "aws": [
        LearningResource(
            title="AWS Cloud Practitioner Essentials",
            url="https://explore.skillbuilder.aws/learn/public/learning_plan/view/82/aws-cloud-practitioner-essentials",
            type="course",
            description="Cloud learning path for AWS fundamentals and services.",
        ),
    ],
}


def _default_resources(skill_name: str) -> list[LearningResource]:
    key = skill_name.strip().lower()
    if key in RESOURCE_CATALOG:
        return RESOURCE_CATALOG[key]
    return [
        LearningResource(
            title=f"{skill_name} fundamentals",
            url=f"https://www.google.com/search?q={skill_name.replace(' ', '+')}+learning",
            type="search",
            description=f"Search for structured learning resources for {skill_name}.",
        )
    ]


def _build_learning_sequence(skill_name: str) -> list[str]:
    name = skill_name.lower()
    if name == "docker":
        return [
            "Understand container basics and why Docker is used.",
            "Learn Docker images, containers, volumes, and networking.",
            "Practice Dockerfile creation and container orchestration basics.",
            "Deploy a sample app with Docker Compose.",
        ]
    if name == "fastapi":
        return [
            "Review REST API fundamentals and HTTP methods.",
            "Build simple routes and request/response models.",
            "Add validation, dependency injection, and error handling.",
            "Test APIs with Swagger docs and real sample endpoints.",
        ]
    return [
        f"Learn core concepts of {skill_name}.",
        f"Apply {skill_name} in a small project.",
        f"Review best practices and build a working sample.",
    ]


def _build_practice_tasks(skill_name: str) -> list[str]:
    name = skill_name.lower()
    if name == "docker":
        return [
            "Containerize a small Python app with a Dockerfile.",
            "Run the app locally using Docker commands and verify the output.",
            "Build a Compose setup with app and database services.",
        ]
    if name == "fastapi":
        return [
            "Create a CRUD API for a sample dataset.",
            "Add request validation and route-level error handling.",
            "Document the API with Swagger and test the endpoints using Postman.",
        ]
    return [
        f"Create a small hands-on exercise demonstrating {skill_name}.",
        f"Document the workflow and explain the trade-offs for {skill_name}.",
        f"Refine the implementation and validate the output with a real example.",
    ]


def generate_learning_roadmap(skill_gaps: SkillGapResult) -> LearningRoadmap:
    roadmap_items: list[RoadmapItem] = []

    for gap in skill_gaps.skill_gaps:
        roadmap_items.append(
            RoadmapItem(
                skill=gap.skill,
                priority=gap.priority,
                required_level=gap.required_level,
                reason=gap.reason,
                learning_sequence=_build_learning_sequence(gap.skill),
                resources=_default_resources(gap.skill),
                practice_tasks=_build_practice_tasks(gap.skill),
            )
        )

    return LearningRoadmap(roadmap=roadmap_items)


def _build_topics(skill_name: str) -> list[str]:
    name = skill_name.lower()
    if name == "docker":
        return ["Containers", "Images", "Dockerfile", "Docker Compose"]
    if name == "aws":
        return ["Core services", "IAM", "Storage", "Deployment basics"]
    if name == "fastapi":
        return ["Routing", "Validation", "Dependencies", "API testing"]
    return [f"Core {skill_name} concepts", f"Hands-on practice", f"Workflow best practices"]


def _build_simple_resources(skill_name: str) -> list[RoadmapResource]:
    key = skill_name.strip().lower()
    if key == "docker":
        return [
            RoadmapResource(
                title="Docker Getting Started",
                url="https://docs.docker.com/get-started/",
            )
        ]
    if key == "aws":
        return [
            RoadmapResource(
                title="AWS Cloud Practitioner Essentials",
                url="https://explore.skillbuilder.aws/learn/public/learning_plan/view/82/aws-cloud-practitioner-essentials",
            )
        ]
    if key == "fastapi":
        return [
            RoadmapResource(
                title="FastAPI Tutorial",
                url="https://fastapi.tiangolo.com/tutorial/",
            )
        ]
    return [
        RoadmapResource(
            title=f"{skill_name} fundamentals",
            url=f"https://www.google.com/search?q={skill_name.replace(' ', '+')}+learning",
        )
    ]


def _build_simple_practice(skill_name: str) -> list[str]:
    name = skill_name.lower()
    if name == "docker":
        return ["Containerize a FastAPI application", "Build a Docker Compose setup with app + database"]
    if name == "aws":
        return ["Create a basic EC2 or S3 walkthrough", "Document infrastructure decisions and costs"]
    if name == "fastapi":
        return ["Build a CRUD API", "Add validation and Swagger-based testing"]
    return [f"Create a small project demonstrating {skill_name}", f"Review and document the solution with a short write-up"]


def generate_skill_gap_roadmap(payload: SkillGapPayload) -> RoadmapResponse:
    roadmap_items: list[SimpleRoadmapItem] = []

    for gap in payload.skillGaps:
        roadmap_items.append(
            SimpleRoadmapItem(
                skill=gap.skill,
                priority=gap.priority,
                requiredLevel=gap.requiredLevel,
                topics=_build_topics(gap.skill),
                resources=_build_simple_resources(gap.skill),
                practice=_build_simple_practice(gap.skill),
            )
        )

    return RoadmapResponse(roadmap=roadmap_items)
