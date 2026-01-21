from fastapi import FastAPI

from api.routes import router

app = FastAPI(
    title="SecureBank API",
    version="1.0.0",
    docs_url="/docs",
    root_path="/api",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Add this line to use the imported router:
app.include_router(router)

# # The router already contains the necessary service calls,
# # so we don't need to import service functions here.
# app.include_router(router)

# from fastapi import FastAPI

# from api.routes import router

# # from uia037.services.account_service import check_balance, get_user_accounts
# # from uia037.services.auth_service import login_user, register_user
# # from uia037.services.transaction_service import (
# #     deposit,
# #     transfer_money,
# #     transfer_to_external_system,
# #     transfer_to_recipient,
# #     withdraw,
# # )

# app = FastAPI(
#     title="SecureBank API",
#     version="1.0.0",
#     docs_url="/docs",
#     root_path="/api",
#     redoc_url="/redoc",
#     openapi_url="/openapi.json",
# )

# app.include_router(router)
