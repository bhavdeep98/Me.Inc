# Job Agent System - Design Document

**Version:** 1.0  
**Date:** December 8, 2024  
**Purpose:** Strategy-agnostic orchestration platform for automated job hunting and networking

---

## 1. Executive Summary

### Core Philosophy: "The Flywheel"
This system creates a self-reinforcing loop where:
- **The Engine (Resume)**: Optimizes your value proposition
- **The Scout (Market Agent)**: Finds where to insert that value
- **The Network (Matchmaker)**: Connects you to the people who control the value

### Key Design Principles
1. **Strategy-Agnostic**: User selects entry point daily (resume-first, network-first, or market-first)
2. **Decision Transparency**: Every automated choice is visible, traceable, and auditable
3. **Incremental Problem-Solving**: Solve the most critical problem (finding a job) first, then expand
4. **Dual Purpose**: Product serves as both a functional tool and a portfolio piece

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────┐
│         Orchestration Service           │
│  (Strategy selector, workflow engine)   │
└──────────────┬──────────────────────────┘
               │
     ┌─────────┼─────────┬─────────┐
     ↓         ↓         ↓         ↓
┌─────────┐ ┌──────┐ ┌────────┐ ┌─────────┐
│ Resume  │ │Market│ │Network │ │Decision │
│ Service │ │Scout │ │Matcher │ │ Logger  │
│         │ │Service│ │Service │ │         │
└─────────┘ └──────┘ └────────┘ └─────────┘
     │         │         │            │
     └─────────┴─────────┴────────────┘
                    ↓
          ┌──────────────────┐
          │   Core Data API   │
          └──────────────────┘
```

### 2.2 Component Responsibilities

**Orchestration Service**
- Accept user strategy selection (resume/network/market-first)
- Execute workflow based on selected strategy
- Coordinate between services
- Track execution state

**Resume Service**
- Store resume templates and versions
- Generate tailored versions for specific opportunities
- Track performance metrics per version
- Manage skills and experience representation

**Market Scout Service**
- Scrape and discover job opportunities
- Calculate fit scores based on user profile
- Extract and normalize job requirements
- Monitor application deadlines

**Network Matcher Service**
- Build and maintain network graph
- Find connection paths to target companies
- Track relationship strength and contact history
- Suggest networking actions

**Decision Logger**
- Record every automated decision with full context
- Store reasoning and alternatives considered
- Enable user feedback and overrides
- Generate decision audit trails

---

## 3. Core Data Model

### 3.1 Jobs Table

```sql
CREATE TABLE jobs (
    job_id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    url TEXT,
    discovered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Scoring and Status
    fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
    status VARCHAR(50) CHECK (status IN ('discovered', 'analyzed', 'applied', 'responded', 'rejected', 'passed')),
    
    -- Requirements
    required_skills JSONB,
    nice_to_have_skills JSONB,
    
    -- Details
    salary_range JSONB, -- {min: 120000, max: 150000, currency: "USD"}
    location VARCHAR(255),
    remote_policy VARCHAR(50), -- remote, hybrid, onsite
    application_deadline DATE,
    
    -- Metadata
    raw_description TEXT,
    company_size VARCHAR(50),
    industry VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_fit_score ON jobs(fit_score DESC);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_discovered_date ON jobs(discovered_date DESC);
```

### 3.2 Network Table

```sql
CREATE TABLE network (
    person_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    current_title VARCHAR(255),
    current_company VARCHAR(255),
    
    -- Relationship Tracking
    relationship_strength INTEGER CHECK (relationship_strength >= 0 AND relationship_strength <= 100),
    last_contact_date DATE,
    contact_history JSONB, -- [{date, type, notes, outcome}]
    
    -- Network Mapping
    can_introduce_to JSONB, -- [person_ids]
    works_at_companies JSONB, -- [company names or ids]
    
    -- Source and Profile
    source VARCHAR(100), -- linkedin, mutual, event, referral
    linkedin_url TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Context
    notes TEXT,
    tags JSONB, -- ["recruiter", "hiring_manager", "peer"]
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_network_company ON network(current_company);
CREATE INDEX idx_network_relationship_strength ON network(relationship_strength DESC);
CREATE INDEX idx_network_last_contact ON network(last_contact_date DESC);
```

### 3.3 Resume Versions Table

```sql
CREATE TABLE resume_versions (
    version_id UUID PRIMARY KEY,
    version_name VARCHAR(255),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Content
    targeted_role_type VARCHAR(100), -- "ml_engineer", "backend_dev", "data_scientist"
    content JSONB, -- Structured resume data
    rendered_formats JSONB, -- {pdf_url, docx_url, html}
    
    -- Performance Tracking
    performance_metrics JSONB, -- {views, downloads, callbacks, interviews}
    tailored_for_job_ids JSONB, -- [job_ids this version was customized for]
    
    -- Optimization
    key_skills_emphasized JSONB,
    sections_modified JSONB, -- Which sections were changed from base
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resume_role_type ON resume_versions(targeted_role_type);
CREATE INDEX idx_resume_active ON resume_versions(is_active);
```

### 3.4 Decisions Table

```sql
CREATE TABLE decisions (
    decision_id UUID PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Agent Information
    agent VARCHAR(50) NOT NULL, -- resume, scout, matcher, orchestrator
    action_taken VARCHAR(255) NOT NULL,
    reasoning TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Context
    context JSONB NOT NULL, -- All data that informed this decision
    alternatives_considered JSONB, -- [{action, reason, score}]
    
    -- Outcome Tracking
    outcome VARCHAR(50), -- success, failure, pending, unknown
    outcome_details JSONB,
    user_override BOOLEAN DEFAULT false,
    user_feedback TEXT,
    
    -- References
    related_job_id UUID REFERENCES jobs(job_id),
    related_person_id UUID REFERENCES network(person_id),
    related_resume_version_id UUID REFERENCES resume_versions(version_id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_decisions_timestamp ON decisions(timestamp DESC);
CREATE INDEX idx_decisions_agent ON decisions(agent);
CREATE INDEX idx_decisions_confidence ON decisions(confidence_score DESC);
CREATE INDEX idx_decisions_outcome ON decisions(outcome);
```

### 3.5 Workflow Executions Table

```sql
CREATE TABLE workflow_executions (
    execution_id UUID PRIMARY KEY,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Strategy
    strategy_selected VARCHAR(50) NOT NULL, -- resume_first, network_first, market_first
    user_goal TEXT, -- User's stated objective for this execution
    
    -- Progress
    steps_completed JSONB, -- [{step, timestamp, status}]
    current_step VARCHAR(100),
    status VARCHAR(50), -- running, completed, failed, paused
    
    -- Results
    decisions_made JSONB, -- [decision_ids]
    time_elapsed INTEGER, -- seconds
    final_outcome VARCHAR(50), -- applied, networked, passed, error
    outcome_summary TEXT,
    
    -- Metrics
    jobs_discovered INTEGER DEFAULT 0,
    jobs_applied INTEGER DEFAULT 0,
    connections_made INTEGER DEFAULT 0,
    resumes_generated INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_started ON workflow_executions(started_at DESC);
CREATE INDEX idx_workflow_strategy ON workflow_executions(strategy_selected);
CREATE INDEX idx_workflow_status ON workflow_executions(status);
```

### 3.6 User Preferences Table

```sql
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY,
    
    -- Job Search Criteria
    target_roles JSONB, -- ["Senior ML Engineer", "Staff SWE"]
    min_salary INTEGER,
    max_salary INTEGER,
    preferred_locations JSONB,
    remote_preference VARCHAR(50), -- remote_only, hybrid, no_preference
    
    -- Skills and Experience
    core_skills JSONB,
    years_experience INTEGER,
    industries_of_interest JSONB,
    
    -- Preferences
    company_size_preference JSONB, -- ["startup", "mid", "enterprise"]
    deal_breakers JSONB, -- ["no_onsite", "no_travel", "no_contract"]
    
    -- Automation Settings
    auto_apply_enabled BOOLEAN DEFAULT false,
    auto_network_enabled BOOLEAN DEFAULT false,
    confidence_threshold DECIMAL(3,2) DEFAULT 0.80,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. MVP Development Phases

### Phase 1: Market Scout Service (Weeks 1-2)
**Goal:** Generate deal flow - discover and score job opportunities

**Deliverables:**
- Job scraping functionality (LinkedIn, Indeed, company sites)
- Fit scoring algorithm (skill matching, salary alignment)
- Jobs table populated with opportunities
- Basic API endpoints for job discovery

**Why First?** 
Empty pipeline = no decisions to make. Need opportunities before optimization.

**Success Metrics:**
- 50+ relevant jobs discovered per day
- Fit scores correlate with manual assessment
- API response time < 500ms

---

### Phase 2: Decision Logger + Dashboard (Weeks 2-3)
**Goal:** Visibility into automated decision-making

**Deliverables:**
- Decision logging service
- Visual decision tree viewer
- Simple dashboard showing: discovered jobs, decisions made, outcomes
- Decisions table fully implemented

**Why Second?** 
Need to see what's working before building more automation. Transparency is key.

**Success Metrics:**
- Every automated action logged with reasoning
- Decision tree visualization shows full context
- User can override any decision

---

### Phase 3: Resume Service (Weeks 3-4)
**Goal:** Generate tailored resumes for top opportunities

**Deliverables:**
- Resume template system
- Tailoring logic (emphasize relevant skills, adjust descriptions)
- Resume versions table
- Export to PDF/DOCX

**Why Third?** 
Now we have targets and can optimize toward them.

**Success Metrics:**
- Generate tailored resume in < 30 seconds
- User approves 70%+ of generated versions
- Track which versions perform best

---

### Phase 4: Network Matcher Service (Weeks 4-5)
**Goal:** Build network graph and find connection paths

**Deliverables:**
- Network graph construction
- Connection pathfinding (who can intro you to target company)
- Relationship strength scoring
- Networking action suggestions

**Why Last?** 
Most complex, but we've learned from earlier services.

**Success Metrics:**
- Build graph of 100+ connections
- Find connection paths to 50%+ of target companies
- Suggest actionable networking moves

---

## 5. Decision Traceability Pattern

Every service action creates a Decision record following this structure:

```json
{
  "decision_id": "dec_2024_001",
  "timestamp": "2024-12-08T10:30:00Z",
  "agent": "market_scout",
  "action_taken": "scored_job_high",
  "reasoning": "8/10 required skills match, salary above target, remote-friendly",
  "confidence_score": 0.85,
  
  "context": {
    "resume_skills": ["Python", "AWS", "ML", "Docker"],
    "job_requirements": ["Python", "AWS", "Docker", "K8s", "ML"],
    "user_preferences": {
      "min_salary": 120000,
      "remote": true,
      "target_roles": ["ML Engineer"]
    },
    "job_details": {
      "title": "Senior ML Engineer",
      "company": "TechCorp",
      "salary_range": {"min": 140000, "max": 180000}
    }
  },
  
  "alternatives_considered": [
    {
      "action": "skip_job",
      "reason": "low salary match",
      "score": 0.3
    },
    {
      "action": "score_medium",
      "reason": "good skills match but unclear remote policy",
      "score": 0.65
    }
  ],
  
  "outcome": null,  // Updated later
  "user_override": false,
  "user_feedback": null
}
```

### Benefits of This Pattern
- **Auditable**: Full decision history with reasoning
- **Improvable**: See what works, adjust algorithms
- **Transparent**: User understands why actions were taken
- **Educational**: Portfolio piece demonstrates AI reasoning

---

## 6. Strategy Execution Flows

### Strategy A: Market-First
```
1. Market Scout discovers opportunities
2. For each high-fit job:
   a. Resume Service generates tailored version
   b. Network Matcher finds connection path
   c. Decision: Apply directly or request intro?
3. Execute chosen action
4. Log outcome
```

### Strategy B: Network-First
```
1. User selects target companies/contacts
2. Network Matcher analyzes connection paths
3. Market Scout searches for openings at those companies
4. Resume Service prepares targeted versions
5. Orchestrator suggests networking approach
6. Execute and log
```

### Strategy C: Resume-First
```
1. Resume Service creates optimized general version
2. Market Scout finds jobs matching resume strengths
3. For top matches:
   a. Further tailor resume
   b. Check network for connections
4. Execute applications
5. Log results
```

---

## 7. Technology Stack Recommendations

### Backend
- **Framework**: FastAPI (Python)
  - Fast iteration
  - Excellent async support
  - Great for AI/ML integrations
  - Auto-generated API docs

### Database
- **Primary**: PostgreSQL
  - JSONB for flexible schemas
  - Full-text search for job descriptions
  - Graph capabilities for network analysis
  - Mature and reliable

### Task Queue
- **Queue**: Redis + Celery
  - Async agent work (scraping, analysis)
  - Scheduled jobs (daily scans)
  - Priority queue for urgent tasks

### Frontend
- **Framework**: React
- **UI Library**: shadcn/ui
  - Decision tree visualization
  - Job board interface
  - Network graph viewer
  - Resume editor

### Deployment
- **Platform**: Railway or Render
  - Quick to production
  - Easy PostgreSQL setup
  - CI/CD integration
  - Affordable for MVP

### Monitoring & Logging
- **Logs**: Structured logging to database
- **Metrics**: Track service performance
- **Alerts**: For failed scrapers or low job flow

---

## 8. Agent Autonomy Models

### Option A: Suggestion Mode (Recommended for MVP)
**Agents propose, you approve**

- **Pros**: Safe, user maintains control, good for testing
- **Cons**: Slower, requires more user interaction
- **Use Case**: Until system proves reliable

### Option B: Autopilot with Oversight
**Agents act, you can undo**

- **Pros**: Fast, minimal friction
- **Cons**: Risk of automated mistakes
- **Use Case**: After system confidence is established

### Option C: Hybrid with Thresholds (Target State)
**Auto-execute on high confidence, ask on uncertainty**

- **Pros**: Best of both worlds
- **Cons**: More complex decision logic
- **Use Case**: Production system after MVP validation

**Implementation:**
```python
if decision.confidence_score >= 0.90:
    execute_automatically()
elif decision.confidence_score >= 0.70:
    suggest_to_user()
else:
    log_and_skip()
```

---

## 9. Key Design Decisions

### 9.1 Why PostgreSQL over Graph Database?
- JSONB provides flexibility for evolving schemas
- Can model graphs sufficiently with recursive queries
- Simpler operations (one database vs. multiple)
- Lower operational overhead
- Can migrate to Neo4j later if network analysis becomes bottleneck

### 9.2 Why Services Architecture?
- Each agent can scale independently
- Easy to test components in isolation
- Can deploy services separately
- Clear responsibility boundaries
- Enables incremental development

### 9.3 Why Decision Logging is Central?
- Core differentiator for portfolio piece
- Enables continuous improvement
- Builds trust with users
- Creates audit trail for compliance
- Educational value for showcasing AI reasoning

---

## 10. Success Metrics

### Product Metrics
- Time to first job application: < 24 hours after setup
- Jobs discovered per day: 50+
- Application rate: 3-5 per week
- Network connections made: 2-3 per week
- Response rate to applications: Track baseline then improve

### Technical Metrics
- API response time: < 500ms (p95)
- Job scraper success rate: > 90%
- Decision confidence accuracy: Compare predictions to outcomes
- System uptime: > 99%

### Portfolio Metrics
- Decision transparency: 100% of actions logged
- Code quality: Automated tests for all services
- Documentation: Complete API docs + architecture diagrams
- Demo-ability: Can showcase live decision-making

---

## 11. Risk Mitigation

### Technical Risks
- **Job scraper blocking**: Rotate proxies, respect rate limits, use multiple sources
- **Data quality**: Validation layer, manual review of high-confidence decisions
- **API changes**: Abstract external APIs behind adapters

### Product Risks
- **Over-automation**: Start with suggestion mode
- **Privacy concerns**: Local-first data storage option
- **Legal compliance**: Review ToS of scraped sites

### Time Risks
- **Scope creep**: Stick to MVP phases rigidly
- **Perfect vs. done**: Ship working version of each phase
- **Infrastructure yak-shaving**: Use managed services

---

## 12. Future Enhancements (Post-MVP)

### Phase 5+
- Interview preparation agent
- Salary negotiation advisor
- Company culture analysis
- Application follow-up automation
- Email campaign management
- Calendar integration for networking
- Chrome extension for LinkedIn
- Mobile app for on-the-go decisions

### Advanced Features
- Multi-user support (team/cohort job hunting)
- Marketplace for resume templates
- Community network graph (anonymized)
- Machine learning for better fit scoring
- Natural language queries ("Find ML jobs at startups in NYC")

---

## 13. Next Steps

### Immediate Actions (This Week)
1. Set up PostgreSQL database
2. Implement core data models (Jobs, Decisions tables)
3. Create simple FastAPI skeleton
4. Build basic job scraper for one source
5. Implement fit scoring algorithm

### Documentation to Create
1. API specification (OpenAPI)
2. Database schema diagrams
3. Service interaction flows
4. Decision logic documentation
5. Development setup guide

### Decisions to Make
1. Which job boards to scrape first?
2. What's your fit scoring algorithm?
3. What autonomy mode for MVP?
4. Hosting platform choice?
5. Frontend framework commitment?

---

## 14. Appendix: Database Schema Relationships

```
user_preferences (1) ─────< influences >────── (∞) decisions
                                                      │
jobs (∞) ───< related_to >──── (∞) decisions         │
network (∞) ─< related_to >─── (∞) decisions         │
resume_versions (∞) ─< related_to >─ (∞) decisions   │
                                                      │
workflow_executions (1) ──< contains >──────────── (∞) decisions

jobs (∞) ───< tailored_for >───── (∞) resume_versions
network (∞) ───< works_at >───── (∞) jobs (companies)
```

---

## 15. Contact & Feedback

This is a living document. As you build and learn, update:
- Decisions made and rationale
- Blockers encountered and solutions
- Performance metrics and improvements
- Architecture changes and why

**Document Owner**: [Your Name]  
**Last Updated**: December 8, 2024  
**Version**: 1.0
