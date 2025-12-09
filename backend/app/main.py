from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid

from app.database import engine, Base, get_db
from app.models import ResumeProfile
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Create tables if they don't exist (basic auto-migration for now)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Me Inc. Job Agent", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",  # New Port
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Response Models
class ResumeResponse(BaseModel):
    profile_id: str
    profile_name: Optional[str]
    content: dict
    
    class Config:
        from_attributes = True


class ResumeListItem(BaseModel):
    profile_id: str
    profile_name: Optional[str]
    created_at: Optional[str]


# Health & Root Endpoints
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "me-inc-job-agent"}


@app.get("/")
def read_root():
    return {"message": "Welcome to Me Inc. Job Agent System"}


# Resume Endpoints
@app.post("/api/resume/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a PDF resume, parse it with LLM, and store in database.
    Returns the structured resume data.
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400, 
            detail="Only PDF files are supported"
        )
    
    # Read file contents
    try:
        pdf_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read file: {str(e)}"
        )
    
    # Import parser here to avoid issues if dependencies aren't installed
    try:
        from app.services.pdf_parser import get_pdf_parser
        pdf_parser = get_pdf_parser()
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF parser dependencies not installed: {str(e)}"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)  # API key not set
        )
    
    # Parse PDF with LLM (synchronous call)
    try:
        parsed_content = pdf_parser.parse_pdf(pdf_bytes)
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Could not parse PDF: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing resume: {str(e)}"
        )
    
    # Extract name for profile naming
    profile_name = parsed_content.get("basics", {}).get("name", "Unnamed Profile")
    
    # Save to database
    profile = ResumeProfile(
        profile_name=profile_name,
        content=parsed_content
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return ResumeResponse(
        profile_id=str(profile.profile_id),
        profile_name=profile.profile_name,
        content=profile.content
    )


class ResumeUpdateRequest(BaseModel):
    content: dict

@app.patch("/api/resume/{profile_id}", response_model=ResumeResponse)
def update_resume(
    profile_id: str, 
    update: ResumeUpdateRequest, 
    db: Session = Depends(get_db)
):
    """
    Update specific sections of the resume content.
    Expects a dictionary of top-level keys to update (e.g. {"basics": {...}}).
    """
    try:
        profile_uuid = uuid.UUID(profile_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid profile ID format")
        
    from app.services.resume_service import ResumeService
    service = ResumeService(db)
    
    try:
        updated_profile = service.update_profile_content(
            profile_id=profile_uuid,
            updates=update.content
        )
        return ResumeResponse(
            profile_id=str(updated_profile.profile_id),
            profile_name=updated_profile.profile_name,
            content=updated_profile.content
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/resume/{profile_id}", response_model=ResumeResponse)
def get_resume(profile_id: str, db: Session = Depends(get_db)):
    """Retrieve a resume profile by ID."""
    try:
        profile_uuid = uuid.UUID(profile_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid profile ID format")
    
    profile = db.query(ResumeProfile).filter(
        ResumeProfile.profile_id == profile_uuid
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return ResumeResponse(
        profile_id=str(profile.profile_id),
        profile_name=profile.profile_name,
        content=profile.content
    )


@app.get("/api/resumes", response_model=list[ResumeListItem])
def list_resumes(db: Session = Depends(get_db)):
    """List all resume profiles."""
    profiles = db.query(ResumeProfile).filter(
        ResumeProfile.is_active == True
    ).all()
    
    return [
        ResumeListItem(
            profile_id=str(p.profile_id),
            profile_name=p.profile_name,
            created_at=p.created_at.isoformat() if p.created_at else None
        )
        for p in profiles
    ]


@app.delete("/api/resume/{profile_id}")
def delete_resume(profile_id: str, db: Session = Depends(get_db)):
    """Soft delete a resume profile."""
    try:
        profile_uuid = uuid.UUID(profile_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid profile ID format")
    
    profile = db.query(ResumeProfile).filter(
        ResumeProfile.profile_id == profile_uuid
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile.is_active = False
    db.commit()
    
    return {"message": "Profile deleted", "profile_id": profile_id}


# Guide Agent Endpoints

class CritiqueRequest(BaseModel):
    bullet_text: str
    domain: str = "General"
    years_experience: int = 5

class CritiqueResponse(BaseModel):
    missing_components: list[str]
    critique: str
    question: str

class RefineRequest(BaseModel):
    original_text: str
    context_answer: str
    domain: str = "General"

class RefineResponse(BaseModel):
    refined_text: str
    reasoning: str

@app.post("/api/guide/critique", response_model=CritiqueResponse)
def critique_bullet(req: CritiqueRequest):
    """
    Agent B (DSPy): Analyze a single bullet point using STAR methodology.
    """
    try:
        from app.services.guide_service import get_guide_service
        guide_service = get_guide_service()
        
        result = guide_service.analyze_bullet(
            text=req.bullet_text,
            domain=req.domain,
            experience=req.years_experience
        )
        return result
    except ImportError:
        raise HTTPException(status_code=500, detail="dspy-ai not installed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/guide/refine", response_model=RefineResponse)
def refine_bullet(req: RefineRequest):
    """
    Agent B (DSPy): Rewrite a bullet point based on user answers.
    """
    try:
        from app.services.guide_service import get_guide_service
        guide_service = get_guide_service()
        
        result = guide_service.refine_bullet(
            original=req.original_text,
            answer=req.context_answer,
            domain=req.domain
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
