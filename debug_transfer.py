# import asyncio
# import json

# import httpx

# # Minimal Registry for the UNK test
# BANK_REGISTRY = {
#     "111111": {
#         "base": "https://unk029.dev.openconsultinguk.com/api",
#         "method": "POST_JSON",
#         "bank_code": "unk029",
#     }
# }


# async def test_unk_mapping(input_sender, recipient_acc):
#     sort_code = "111111"
#     config = BANK_REGISTRY[sort_code]

#     # --- LOGIC: Only map for UNK (111111) ---
#     # We take your local account and swap it for the one UNK understands
#     effective_sender = "12345001"

#     print(f"🚀 [DEBUG] Local Account: {input_sender}")
#     print(f"🔄 [DEBUG] Mapping to UNK Account: {effective_sender}")

#     url = f"{config['base'].rstrip('/')}/account/transfer"
#     headers = {"x-logged-in-account": effective_sender, "Content-Type": "application/json"}

#     payload = {
#         "from_account_no": effective_sender,
#         "to_account_no": recipient_acc,
#         "amount": 1.00,
#         "to_bank_code": config["bank_code"],
#         "to_sort_code": sort_code,
#         "to_name": "Internal Test",
#         "reference": "Mapping Test",
#     }

#     async with httpx.AsyncClient(verify=False) as client:
#         try:
#             print(f"📡 Sending POST to: {url}")
#             response = await client.post(url, json=payload, headers=headers)

#             print(f"📊 Status Code: {response.status_code}")
#             print(f"📄 Response Body: {response.text}")

#             if response.status_code == 200:
#                 print("✅ TEST PASSED: Mapping worked and UNK accepted the transfer!")
#             else:
#                 print("❌ TEST FAILED: See response error above.")

#         except Exception as e:
#             print(f"⚠️ Connection Error: {e}")


# if __name__ == "__main__":
#     # Simulate sending from your local account '87654321'
#     asyncio.run(test_unk_mapping("87654321", "12345002"))
# import httpx
# import asyncio
# import json

# async def test_purple_bank():
#     # Based on the 422 error, it needs /api/deposit/ with 'account_number' in the query
#     url = "https://urr034.dev.openconsultinguk.com/api/deposit/"

#     # Exact field names required by urr034
#     params = {
#         "account_number": "12345601",
#         "amount": 1.0,
#         "from_account": "1"
#     }

#     headers = {"x-logged-in-account": "1"}

#     print(f"🚀 Final Attempt: Purple Bank (urr034) using 'account_number'...")
#     async with httpx.AsyncClient(verify=False) as client:
#         # We use params= to put them in the URL, POST to satisfy the method
#         response = await client.post(url, params=params, headers=headers)

#         print(f"📡 Status Code: {response.status_code}")
#         print(f"📥 Response: {response.text}")

#         if response.status_code < 300:
#             print("\n🎯 BULLSEYE! We found the correct format.")
#         else:
#             print("\n❌ Still rejected. Checking for other missing fields...")
#             if response.status_code == 422:
#                 print(json.dumps(response.json(), indent=2))

# asyncio.run(test_purple_bank())
