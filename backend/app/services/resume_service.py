from sqlalchemy.orm import Session
from app.models import ResumeProfile
import json
import uuid

class ResumeService:
    def __init__(self, db: Session):
        self.db = db

    def create_empty_profile(self, name: str) -> ResumeProfile:
        profile = ResumeProfile(
            profile_name=name,
            content={
                "basics": {},
                "work_experience": [],
                "education": [],
                "skills": {}
            }
        )
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def update_profile_content(self, profile_id: uuid.UUID, updates: dict):
        profile = self.db.query(ResumeProfile).filter(ResumeProfile.profile_id == profile_id).first()
        if not profile:
            raise ValueError("Profile not found")
        
        current_content = dict(profile.content) if profile.content else {}
        
        # Merge top-level keys
        for key, value in updates.items():
            current_content[key] = value
        
        profile.content = current_content
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def ingest_pdf_text(self, profile_id: uuid.UUID, raw_text: str):
        """
        Stub for LLM parsing logic.
        In real implementation, this sends text to Claude/OpenAI 
        and maps fields to our JSON schema.
        """
        # TODO: Call LLM here
        # For now, just store the raw text in a 'raw_ingest' field
        profile = self.db.query(ResumeProfile).filter(ResumeProfile.profile_id == profile_id).first()
        if not profile:
            raise ValueError("Profile not found")

        current_content = dict(profile.content) if profile.content else {}
        current_content["raw_ingest"] = raw_text
        
        profile.content = current_content
        self.db.commit()
        return profile
