# Update Log

## What I did

- Separated the project into the correct boundary: your module handles Resume + JD analysis and skill-gap detection, while her module handles learning-plan generation from those skill gaps.
- Built the FastAPI roadmap API at POST /api/roadmap with a clean input/output contract using skillGaps JSON.
- Implemented the roadmap service that converts each gap into a learning plan with topics, resources, and practice tasks.
- Created the React roadmap page that posts to the backend and renders the roadmap cards in the UI.
- Verified the backend route works with live JSON requests and confirmed the frontend builds successfully.
- Kept the work focused only on the her-side roadmap module, without expanding into resume/JD analysis.

## What is still pending

- Connect real Member 1 skillGaps data to the roadmap endpoint.
- Replace hardcoded roadmap content with a proper resources.json or database-driven source.
- Add Foundry personalization later for customized learning paths.
- Add RAG / Azure AI Search later if extra time remains.
- Keep the analysis side and roadmap side clearly separated as designed.

## What is fake / dummy right now

- The skillGaps payload used in the frontend is dummy data, not real candidate analysis output.
- The learning topics, resource links, and practice tasks are currently hardcoded in the roadmap service.
- The current roadmap is a working MVP, not a production-grade personalized learning engine.
- The app is ready for real data integration, but it is not yet connected to actual Resume + JD analysis output.

## Current status

- The her-side roadmap feature is working end-to-end for the MVP contract.
- The flow is valid and functional with dummy inputs.
- Real input integration is the next step, and advanced intelligence should come after that.
