import contextlib
import logging

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from google.adk.runners import InMemoryRunner
from google.genai import types

# Import your agent and input model
from my_agent.agent import root_agent
from my_agent.models import AgentInput

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# 1. Standardize the app name
APP_NAME = "banking_app"
agent_runner = InMemoryRunner(agent=root_agent, app_name=APP_NAME)


@app.post("/chat")
async def chat_with_agent(agent_input: AgentInput):
    # Ensure user_id is a string for ADK consistency
    user_id = str(agent_input.user_id)
    session_id = f"session_{user_id}"

    logger.info(f"--- Chat Request: User {user_id} ---")

    try:
        # 2. CREATE/GET SESSION: This links the user_id to the session in memory.
        # Use suppress to handle cases where the session already exists (Fixes SIM105)
        with contextlib.suppress(Exception):
            await agent_runner.session_service.create_session(
                user_id=user_id, session_id=session_id, app_name=APP_NAME
            )

        # 3. RUN AGENT: Explicitly pass user_id and session_id
        user_message = types.Content(role="user", parts=[types.Part(text=agent_input.text)])

        full_response = ""
        async for event in agent_runner.run_async(
            user_id=user_id,  # CRITICAL: Maps to tool_context
            session_id=session_id,  # CRITICAL: Maps to conversation history
            new_message=user_message,
        ):
            # ADK 2.x+ uses event.content.parts for Gemini responses
            if hasattr(event, "content") and event.content:
                for part in event.content.parts:
                    if hasattr(part, "text") and part.text:
                        full_response += part.text

        return {"reply": full_response.strip() or "I've processed your request."}

    except Exception as e:
        logger.error(f"Chat Error: {e!s}")
        # Check for Quota exhaustion (common in free tier)
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            return JSONResponse(
                status_code=429,
                content={"error": "The AI is currently busy. Please wait 1 minute."},
            )
        return JSONResponse(status_code=500, content={"error": "Internal server error."})


# import logging
# from google.adk.runners import InMemoryRunner
# from google.genai import types
# from my_agent.agent import root_agent
# from my_agent.models import AgentInput

# app = FastAPI()
# logging.basicConfig(level=logging.INFO)

# # 1. INITIALIZE ONCE: The app_name MUST match for the session to be found later.
# APP_NAME = "banking_chatbot"
# agent_runner = InMemoryRunner(agent=root_agent, app_name=APP_NAME)

# @app.post("/chat")
# async def chat_with_agent(agent_input: AgentInput):
#     # Use consistent IDs
#     user_id = "default-user"
#     session_id = "default-session"
#     full_response = ""

#     try:
#         user_message = types.Content(
#             role="user",
#             parts=[types.Part(text=agent_input.text)]
#         )

#         # 2. RUN DIRECTLY: InMemoryRunner is designed to handle
#         # session creation internally if it doesn't exist.
#         async for event in agent_runner.run_async(
#             user_id=user_id,
#             session_id=session_id,
#             new_message=user_message
#         ):
#             if hasattr(event, 'content') and event.content:
#                 for part in event.content.parts:
#                     if hasattr(part, 'text') and part.text:
#                         full_response += part.text

#         return {"reply": full_response.strip() or "I'm here to help."}

#     except Exception as e:
#         # 3. DIAGNOSTIC: If it fails, we catch the exact error message
#         logging.error(f"Runner Error: {str(e)}")

#         # If the runner still fails, we check the session service directly as a fallback
#         if "Session not found" in str(e):
#              logging.info("Attempting explicit session initialization...")
#              try:
#                  await agent_runner.session_service.create_session(
#                      app_name=APP_NAME,
#                      user_id=user_id,
#                      session_id=session_id
#                  )
#                  # Note: In a production loop, you'd retry run_async here
#              except Exception as session_e:
#                  logging.error(f"Fallback Creation Failed: {session_e}")

#         return JSONResponse(status_code=500, content={"error": str(e)})
# =================================================================
# 4. OPTIONAL: ADK WORKBENCH ROUTES
# If you still want the Google Dev UI to work on /dev-ui
# =================================================================
# from google.adk.cli.fast_api import get_fast_api_app
# (This part is omitted to prioritize your React Frontend's stability)
# from fastapi import FastAPI
# from pydantic import BaseModel
# from google.adk.cli.fast_api import get_fast_api_app
# from agent import root_agent  # Import the agent we defined above

# # =================================================================
# # 1. ADK Workbench Integration
# # This creates the specialized streaming routes for the Dev UI
# # =================================================================
# app = get_fast_api_app(root_agent, root_path="/chat-api")

# # =========================
# # 2. Custom Standard Routes
# # =========================
# class ChatRequest(BaseModel):
#     message: str

# @app.get("/health")
# async def health():
#     return {"status": "online", "agent": "banking_agent"}

# @app.post("/chat")
# async def chat_with_agent(request: ChatRequest):
#     """Simple non-streaming endpoint for custom frontends."""
#     try:
#         # Run the agent logic
#         response = root_agent.start(request.message)
#         reply_text = getattr(response, 'text', str(response))
#         return {"reply": reply_text}
#     except Exception as e:
#         return {"error": str(e)}
