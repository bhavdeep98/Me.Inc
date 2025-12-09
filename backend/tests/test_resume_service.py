from app.services.resume_service import ResumeService
from app.models import ResumeProfile
import uuid

def test_create_resume_profile(db):
    service = ResumeService(db)
    profile = service.create_empty_profile("Test User")
    
    assert profile.profile_id is not None
    assert profile.profile_name == "Test User"
    assert "basics" in profile.content
    assert isinstance(profile.content["work_experience"], list)

def test_update_resume_section(db):
    service = ResumeService(db)
    profile = service.create_empty_profile("Updater Test")
    
    new_basics = {"name": "Updated Name", "email": "test@example.com"}
    updated_profile = service.update_profile_content(profile.profile_id, "basics", new_basics)
    
    assert updated_profile.content["basics"]["name"] == "Updated Name"
    
    # Verify persistence
    fetched = db.query(ResumeProfile).filter_by(profile_id=profile.profile_id).first()
    assert fetched.content["basics"]["email"] == "test@example.com"

def test_ingest_pdf_stub(db):
    service = ResumeService(db)
    profile = service.create_empty_profile("PDF Test")
    
    service.ingest_pdf_text(profile.profile_id, "Raw Resume Text Content")
    
    fetched = db.query(ResumeProfile).filter_by(profile_id=profile.profile_id).first()
    assert fetched.content["raw_ingest"] == "Raw Resume Text Content"
