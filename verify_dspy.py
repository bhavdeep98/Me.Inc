import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from dotenv import load_dotenv
load_dotenv('backend/.env')

try:
    from app.services.guide_service import get_guide_service
    print("Import successful")
    
    # Check if API key is present before instantiating (to avoid crash)
    if os.getenv("OPENAI_API_KEY"):
        service = get_guide_service()
        print("Service instantiated")
    else:
        print("Skipping instantiation: No API Key")
        
except ImportError as e:
    print(f"ImportError: {e}")
except Exception as e:
    print(f"Error: {e}")
