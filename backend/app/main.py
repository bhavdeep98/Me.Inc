from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid

from app.database import engine, Base, get_db
from app.models import ResumeProfile

# Create tables if they don't exist (basic auto-migration for now)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Me Inc. Job Agent", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://127.0.0.1:3000",
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
    
    # Parse PDF with LLM
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
