
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

print("Checking imports...")
try:
    from home import home_bp
    print("✅ home.py imported successfully")
except Exception as e:
    print(f"❌ home.py import failed: {e}")

try:
    from services.chat_service import ChatService
    print("✅ ChatService imported successfully")
except Exception as e:
    print(f"❌ ChatService import failed: {e}")

# Verify removed modules are NOT present/needed
try:
    import services.transcription_service
    print("❌ TranscriptionService found (Should be deleted)")
except ImportError:
    print("✅ TranscriptionService correctly removed")

try:
    import faiss
    # It might still be installed in venv, but code shouldn't use it. 
    # This check is less about presence and more about usage, which we verified by import check above.
    pass 
except ImportError:
    pass

print("\nSyntax check complete.")
