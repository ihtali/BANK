import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
import httpx
from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route
import uvicorn

# --- CONFIGURATION LOADING ---
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

raw_registry = os.getenv("BANK_REGISTRY_JSON", "{}")
try:
    BANK_REGISTRY = json.loads(raw_registry)
    print(f"✅ Loaded Bank Registry from .env: {list(BANK_REGISTRY.keys())}")
except Exception as e:
    print(f"❌ Error parsing BANK_REGISTRY_JSON from .env: {e}")
    BANK_REGISTRY = {}

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ExternalBankGateway")

# Initialize FastMCP
mcp = FastMCP("UniversalBankGateway")


@mcp.tool()
async def execute_external_transfer(
    recipient_sort_code: str,
    recipient_account: str,
    amount: float,
    sender_account: str | None = None,
    recipient_name: str = "External User",
    reference: str = "Transfer",
    **kwargs,
) -> str:
    clean_sort = str(recipient_sort_code).replace("-", "").strip()
    config = BANK_REGISTRY.get(clean_sort)

    if not config:
        return f"❌ Error: Sort code {recipient_sort_code} is not registered in .env."

    # --- ACCOUNT MAPPING LOGIC ---
    if clean_sort == "111111":
        effective_sender = "12345001"
        logger.info(f"🔄 Mapping local sender {sender_account} -> UNK {effective_sender}")
    else:
        effective_sender = str(sender_account) if sender_account else "1"

    headers = {"x-logged-in-account": effective_sender}

    async with httpx.AsyncClient(verify=False) as client:
        try:
            base_url = config["base"].rstrip("/")

            if config["method"] == "POST_JSON":
                url = f"{base_url}/account/transfer"
                payload = {
                    "from_account_no": effective_sender,
                    "to_account_no": recipient_account,
                    "amount": amount,
                    "to_bank_code": config["bank_code"],
                    "to_sort_code": clean_sort,
                    "to_name": recipient_name,
                    "reference": reference,
                }
                response = await client.post(url, json=payload, headers=headers)

            else:
                url = f"{base_url}/deposit/"
                params = {
                    "account_number": str(recipient_account),
                    "amount": float(amount),
                    "from_account": effective_sender,
                }
                response = await client.post(url, params=params, headers=headers)

            if response.status_code < 300:
                return (
                    f"✅ Success! (Using account {effective_sender}) "
                    f"Transferred to {recipient_name}."
                )
            return f"❌ Bank rejected request ({response.status_code}): {response.text}"

        except Exception as e:
            return f"⚠️ Gateway connection error: {e!s}"


async def mcp_bridge(request: Request):
    try:
        raw_body = await request.json()
        logger.info(f"📥 Received Bridge Request: {raw_body}")

        # Determine Arguments
        if "params" in raw_body and "arguments" in raw_body["params"]:
            args = raw_body["params"]["arguments"]
        else:
            args = {
                "recipient_account": (
                    raw_body.get("recipient_account_number")
                    or raw_body.get("to_account_no")
                    or raw_body.get("recipient_account")
                ),
                "recipient_sort_code": (
                    raw_body.get("recipient_sort_code") or raw_body.get("to_sort_code")
                ),
                "amount": float(raw_body.get("amount", 0)),
                "sender_account": raw_body.get("sender_account")
                or raw_body.get("from_account_no")
                or "1",
                "recipient_name": (
                    raw_body.get("recipient_full_name")
                    or raw_body.get("to_name")
                    or "External User"
                ),
                "reference": raw_body.get("reference", "Web Transfer"),
            }

        # Execute
        result_text = await execute_external_transfer(**args)

        return JSONResponse(
            {
                "status": "success",
                "message": result_text,
                "data": {
                    "from_account_no": args.get("sender_account"),
                    "to_account_no": args.get("recipient_account"),
                    "amount": args.get("amount"),
                    "status": "success",
                },
            }
        )

    except Exception as e:
        logger.error(f"💥 Bridge Error: {e}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=400)


app = Starlette(routes=[Route("/", endpoint=mcp_bridge, methods=["POST"])])

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)

# import httpx
# import uvicorn
# import json
# from mcp.server.fastmcp import FastMCP
# from starlette.applications import Starlette
# from starlette.routing import Route
# from starlette.responses import JSONResponse
# from starlette.requests import Request

# # Initialize FastMCP
# mcp = FastMCP("UniversalBankGateway")

# # Registry using BASE URLs only
# BANK_REGISTRY = {
#     "111111": {
#         "base": "https://unk029.dev.openconsultinguk.com/api",
#         "method": "POST_JSON",
#         "bank_code": "unk029"
#     },
#     "600001": {
#         "base": "https://urr034.dev.openconsultinguk.com/api",
#         "method": "POST_QUERY",
#         "bank_code": "urr034"
#     }
# }

# @mcp.tool()
# async def execute_external_transfer(
#     recipient_sort_code: str,
#     recipient_account: str,
#     amount: float,
#     recipient_name: str = "External User",
#     reference: str = "Transfer",
#     **kwargs
# ) -> str:
#     """
#     Executes a transfer to an external bank.
#     Routes to the correct endpoint based on the bank's method.
#     """
#     clean_sort = str(recipient_sort_code).replace("-", "").strip()
#     config = BANK_REGISTRY.get(clean_sort)

#     if not config:
#         return f"❌ Error: Sort code {recipient_sort_code} is not registered."

#     headers = {"x-logged-in-account": "1"}

#     async with httpx.AsyncClient(verify=False) as client:
#         try:
#             # 1. Handle JSON-based Banks (like UNK)
#             if config["method"] == "POST_JSON":
#                 url = f"{config['base']}/account/cross-bank-transfer"
#                 payload = {
#                     "from_account_no": "1",
#                     "to_account_no": recipient_account,
#                     "amount": amount,
#                     "to_bank_code": config["bank_code"],
#                     "to_sort_code": clean_sort,
#                     "to_name": recipient_name,
#                     "reference": reference
#                 }
#                 response = await client.post(url, json=payload, headers=headers)

#             # 2. Handle Query-based Banks (like Purple Bank)
#             else:
#                 url = f"{config['base']}/deposit/"
#                 params = {
#                     "account_number": str(recipient_account),
#                     "amount": float(amount),
#                     "from_account": "1"
#                 }
#                 response = await client.post(url, params=params, headers=headers)

#             if response.status_code < 300:
#                 return f"✅ Success! Transferred to {recipient_name}."
#             return f"❌ Bank rejected request: {response.text}"

#         except Exception as e:
#             return f"⚠️ Gateway connection error: {str(e)}"

# async def mcp_bridge(request: Request):
#     """
#     Bridge to map Frontend (fact-api) fields and handle responses.
#     """
#     try:
#         raw_body = await request.json()

#         # Determine if it's an MCP Chatbot request or direct from Frontend
#         if "params" in raw_body and "arguments" in raw_body["params"]:
#             args = raw_body["params"]["arguments"]
#         else:
#             # Map Frontend UI fields to tool arguments
#             args = {
#                 "recipient_account": (
#                     raw_body.get("recipient_account_number") or
#                     raw_body.get("to_account_no") or
#                     raw_body.get("recipient_account")
#                 ),
#                 "recipient_sort_code": (
#                     raw_body.get("recipient_sort_code") or
#                     raw_body.get("to_sort_code")
#                 ),
#                 "amount": raw_body.get("amount"),
#                 "recipient_name": (
#                     raw_body.get("recipient_full_name") or
#                     raw_body.get("to_name") or
#                     "External User"
#                 ),
#                 "reference": raw_body.get("reference", "Web Transfer")
#             }
#             # Catch extra fields like 'sender_account'
#             args.update({k: v for k, v in raw_body.items() if k not in args})

#         # Execute the logic
#         result_text = await execute_external_transfer(**args)

#         # Standardized response for fact-api validation
#         return JSONResponse({
#             "status": "success",
#             "message": result_text,
#             "data": {
#                 "to_account_no": args.get("recipient_account"),
#                 "amount": args.get("amount"),
#                 "status": "success"
#             }
#         })

#     except Exception as e:
#         print(f"Bridge Error: {e}")
#         return JSONResponse({"status": "error", "message": str(e)}, status_code=400)

# # Starlette App to host the bridge on port 5001
# app = Starlette(routes=[Route("/", endpoint=mcp_bridge, methods=["POST"])])

# if __name__ == "__main__":
#     uvicorn.run(app, host="0.0.0.0", port=5001)
