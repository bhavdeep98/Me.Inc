-- Core Tables for Job Agent System (Verification)
-- See job-agent-system-design.md for full documentation

CREATE TABLE jobs (
    job_id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    url TEXT,
    discovered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
    status VARCHAR(50) CHECK (status IN ('discovered', 'analyzed', 'applied', 'responded', 'rejected', 'passed')),
    required_skills JSONB,
    nice_to_have_skills JSONB,
    salary_range JSONB,
    location VARCHAR(255),
    remote_policy VARCHAR(50),
    application_deadline DATE,
    raw_description TEXT,
    company_size VARCHAR(50),
    industry VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE network (
    person_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    current_title VARCHAR(255),
    current_company VARCHAR(255),
    relationship_strength INTEGER CHECK (relationship_strength >= 0 AND relationship_strength <= 100),
    last_contact_date DATE,
    contact_history JSONB,
    can_introduce_to JSONB,
    works_at_companies JSONB,
    source VARCHAR(100),
    linkedin_url TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    notes TEXT,
    tags JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE resume_versions (
    version_id UUID PRIMARY KEY,
    version_name VARCHAR(255),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    targeted_role_type VARCHAR(100),
    content JSONB,
    rendered_formats JSONB,
    performance_metrics JSONB,
    tailored_for_job_ids JSONB,
    key_skills_emphasized JSONB,
    sections_modified JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE decisions (
    decision_id UUID PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    agent VARCHAR(50) NOT NULL,
    action_taken VARCHAR(255) NOT NULL,
    reasoning TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    context JSONB NOT NULL,
    alternatives_considered JSONB,
    outcome VARCHAR(50),
    outcome_details JSONB,
    user_override BOOLEAN DEFAULT false,
    user_feedback TEXT,
    related_job_id UUID REFERENCES jobs(job_id),
    related_person_id UUID REFERENCES network(person_id),
    related_resume_version_id UUID REFERENCES resume_versions(version_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow_executions (
    execution_id UUID PRIMARY KEY,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    strategy_selected VARCHAR(50) NOT NULL,
    user_goal TEXT,
    steps_completed JSONB,
    current_step VARCHAR(100),
    status VARCHAR(50),
    decisions_made JSONB,
    time_elapsed INTEGER,
    final_outcome VARCHAR(50),
    outcome_summary TEXT,
    jobs_discovered INTEGER DEFAULT 0,
    jobs_applied INTEGER DEFAULT 0,
    connections_made INTEGER DEFAULT 0,
    resumes_generated INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY,
    target_roles JSONB,
    min_salary INTEGER,
    max_salary INTEGER,
    preferred_locations JSONB,
    remote_preference VARCHAR(50),
    core_skills JSONB,
    years_experience INTEGER,
    industries_of_interest JSONB,
    company_size_preference JSONB,
    deal_breakers JSONB,
    auto_apply_enabled BOOLEAN DEFAULT false,
    auto_network_enabled BOOLEAN DEFAULT false,
    confidence_threshold DECIMAL(3,2) DEFAULT 0.80,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
