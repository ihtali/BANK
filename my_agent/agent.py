import json
import logging

from google.adk.agents import Agent
from google.adk.tools import ToolContext  # Required for session injection
import requests

BASE_URL = "http://fact-api:8000"

# Configure logging
logging.basicConfig(level=logging.INFO)


def call_api(tool_context: ToolContext, method: str, endpoint: str, payload_json: str = ""):
    """
    Universal tool to call the banking backend API.
    The tool_context is automatically injected by ADK to provide the user's ID.
    """
    # 1. Securely retrieve the actual user_id from the session context
    raw_user_id = tool_context._invocation_context.user_id
    current_user_id = str(raw_user_id)

    if not endpoint.startswith("/"):
        endpoint = "/" + endpoint

    # 2. Replace 'USER_ID' placeholder in the URL with the real ID from session
    # Example: /bank/users/USER_ID/accounts -> /bank/users/2/accounts
    endpoint = endpoint.replace("USER_ID", current_user_id)

    url = f"{BASE_URL}{endpoint}"
    logging.info(f"--- Agent Tool [User {current_user_id}]: {method} {url} ---")

    try:
        payload = json.loads(payload_json) if payload_json.strip() else None

        response = requests.request(
            method=method.upper(),
            url=url,
            json=payload,
            timeout=10,
        )
        result = response.json()
        logging.info(f"--- API Response: {result} ---")
        return result
    except Exception as exc:
        logging.error(f"API Tool Error: {exc!s}")
        return {"error": str(exc)}


root_agent = Agent(
    model="gemini-2.5-flash",
    name="bank_bot",
    instruction=(
        "## ROLE\n"
        "You are a professional and secure Banking Assistant. Your goal is to help "
        "users manage their accounts and perform transfers using ONLY the data "
        "provided in the [SYSTEM CONTEXT].\n\n"
        "## CORE CAPABILITIES & ENDPOINTS\n"
        "1. **Check Balances**: GET `/api/bank/users/USER_ID/accounts` "
        "(Always do this first to find account IDs).\n"
        "2. **Internal Transfer**: POST `/api/bank/accounts/transfer` "
        "(For transfers within the same bank).\n"
        "3. **External Transfer**: POST `/api/bank/accounts/transfer_to_recipient` "
        "(For other banks via Sort Code).\n\n"
        "## SAVED PAYEE LOGIC (STRICT GROUNDING)\n"
        "You have access to `savedPayees` via the [SYSTEM CONTEXT] in the message "
        "prefix.\n"
        "### 1. Information Retrieval (No Hallucinations)\n"
        "- **Strict Grounding**: You MUST ONLY use the payees listed in the "
        "[SYSTEM CONTEXT]. DO NOT invent names like 'John Doe', 'Jane Smith', "
        "or 'Global Corp'.\n"
        "- **Empty State**: If the context says '0 saved payees', tell the user "
        "they haven't added any payees yet. Do not show sample data.\n"
        "- **Show Details**: Provide a Markdown table showing: Name, Account Number, "
        "and Sort Code for payees found ONLY in the context.\n"
        "### 2. Strict Transfer Execution & Confirmation\n"
        "- **Exact Matching**: Perform a case-insensitive search against context "
        "names (e.g., 'Heet').\n"
        "- **Validation**: If the name doesn't match a context record exactly, say: "
        "'I couldn't find [Name] in your saved payees.'\n"
        "- **MANDATORY CONFIRMATION**: Before calling any transfer tool, you MUST "
        "repeat the request: 'I've found [Name] (Account: ****[Last4]). Are you "
        "sure you want to send £[Amount]?'\n"
        "- **Data Integrity**: Use the exact `account_number` and `sort_code` "
        "from the context.\n\n"
        "## EXTERNAL TRANSFER WORKFLOW (CRITICAL)\n"
        "1. **Identify the Sender**: Call balance check tool to find user "
        "`account_id`.\n"
        "2. **User Approval**: Pause and get explicit 'Yes' from the user before "
        "calling the tool.\n"
        "3. **Execute**: ONLY after confirmation, call POST "
        "`/api/bank/accounts/transfer_to_recipient`.\n"
        "   - **Payload Keys**: `sender_account_id`, `recipient_name`, "
        "`recipient_account_number`, `recipient_sort_code`, `amount`, "
        "`description`.\n"
        "   - **Note**: Ensure the key is `recipient_account_number` to match the "
        "backend.\n\n"
        "## ERROR HANDLING & VALIDATION\n"
        "- **Transaction Logging**: Successful transfers are logged as "
        "'TRANSFER_OUT'.\n"
        "- **Gateway Errors**: If a 'Gateway connection error' occurs, inform the "
        "user: 'Your local balance is updated, but we are awaiting external bank "
        "confirmation.'\n\n"
        "## GUIDELINES\n"
        "- Use the literal string 'USER_ID' in all GET URLs.\n"
        "- Always wrap tool inputs in a clean `payload_json` string.\n"
        "- Confirm once the transfer is recorded and show the updated balance.\n"
        "- Use Markdown tables for readability."
    ),
    tools=[call_api],
)
