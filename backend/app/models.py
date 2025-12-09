from sqlalchemy import Column, Integer, String, Boolean, DateTime, CheckConstraint, ForeignKey, JSON, Text, DECIMAL, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    url = Column(Text)
    discovered_date = Column(DateTime, server_default=func.now())
    
    # Scoring and Status
    fit_score = Column(Integer)
    status = Column(String(50))
    
    # Requirements
    required_skills = Column(JSON)
    nice_to_have_skills = Column(JSON)
    
    # Details
    salary_range = Column(JSON)
    location = Column(String(255))
    remote_policy = Column(String(50))
    application_deadline = Column(Date)
    
    # Metadata
    raw_description = Column(Text)
    company_size = Column(String(50))
    industry = Column(String(100))
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint('fit_score >= 0 AND fit_score <= 100', name='check_fit_score'),
        CheckConstraint("status IN ('discovered', 'analyzed', 'applied', 'responded', 'rejected', 'passed')", name='check_status'),
    )

class Network(Base):
    __tablename__ = "network"

    person_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    current_title = Column(String(255))
    current_company = Column(String(255))
    
    # Relationship Tracking
    relationship_strength = Column(Integer)
    last_contact_date = Column(Date)
    contact_history = Column(JSON)
    
    # Network Mapping
    can_introduce_to = Column(JSON)
    works_at_companies = Column(JSON)
    
    # Source and Profile
    source = Column(String(100))
    linkedin_url = Column(Text)
    email = Column(String(255))
    phone = Column(String(50))
    
    # Context
    notes = Column(Text)
    tags = Column(JSON)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint('relationship_strength >= 0 AND relationship_strength <= 100', name='check_rel_strength'),
    )

class ResumeProfile(Base):
    __tablename__ = "resume_profiles"

    profile_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_name = Column(String(255))
    
    # The Core NoSQL Document
    # Structure: { "basics": {}, "work_experience": [], "skills": [], "education": [] }
    content = Column(JSON, default={})
    
    # Metadata
    owner_id = Column(UUID(as_uuid=True)) # Link to User if needed later
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Decision(Base):
    __tablename__ = "decisions"

    decision_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime, server_default=func.now())
    
    # Agent Information
    agent = Column(String(50), nullable=False)
    action_taken = Column(String(255), nullable=False)
    reasoning = Column(Text, nullable=False)
    confidence_score = Column(DECIMAL(3, 2))
    
    # Context
    context = Column(JSON, nullable=False)
    alternatives_considered = Column(JSON)
    
    # Outcome Tracking
    outcome = Column(String(50))
    outcome_details = Column(JSON)
    user_override = Column(Boolean, default=False)
    user_feedback = Column(Text)
    
    # References
    related_job_id = Column(UUID(as_uuid=True), ForeignKey('jobs.job_id'), nullable=True)
    related_person_id = Column(UUID(as_uuid=True), ForeignKey('network.person_id'), nullable=True)
    related_resume_profile_id = Column(UUID(as_uuid=True), ForeignKey('resume_profiles.profile_id'), nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        CheckConstraint('confidence_score >= 0 AND confidence_score <= 1', name='check_confidence'),
    )

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    execution_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    started_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime)
    
    # Strategy
    strategy_selected = Column(String(50), nullable=False)
    user_goal = Column(Text)
    
    # Progress
    steps_completed = Column(JSON)
    current_step = Column(String(100))
    status = Column(String(50))
    
    # Results
    decisions_made = Column(JSON)
    time_elapsed = Column(Integer)
    final_outcome = Column(String(50))
    outcome_summary = Column(Text)
    
    # Metrics
    jobs_discovered = Column(Integer, default=0)
    jobs_applied = Column(Integer, default=0)
    connections_made = Column(Integer, default=0)
    resumes_generated = Column(Integer, default=0)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class UserPreference(Base):
    __tablename__ = "user_preferences"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Job Search Criteria
    target_roles = Column(JSON)
    min_salary = Column(Integer)
    max_salary = Column(Integer)
    preferred_locations = Column(JSON)
    remote_preference = Column(String(50))
    
    # Skills and Experience
    core_skills = Column(JSON)
    years_experience = Column(Integer)
    industries_of_interest = Column(JSON)
    
    # Preferences
    company_size_preference = Column(JSON)
    deal_breakers = Column(JSON)
    
    # Automation Settings
    auto_apply_enabled = Column(Boolean, default=False)
    auto_network_enabled = Column(Boolean, default=False)
    confidence_threshold = Column(DECIMAL(3, 2), default=0.80)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
