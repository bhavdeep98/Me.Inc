# Me Inc. Operating System - Agile Framework for Job Agent System

**Version:** 1.0  
**Date:** December 8, 2024  
**Purpose:** Product management and execution framework for the Job Agent System  
**Companion Document:** `job-agent-system-design.md`

---

## Philosophy: Your Job Hunt is a Startup

This system treats your career transition as a **high-velocity product company**. You are the CEO, Product Manager, and Engineer of "Me Inc." The goal is to ship value fast while maintaining strategic clarity.

### Core Insight
Most job seekers optimize for "being busy." This system optimizes for **outcomes that compound**.

---

## 1. The Weekly Executive Summary

### Purpose
Prevent self-deception. Force honest assessment of progress vs. activity.

### Format (Generated Every Friday 5 PM or Sunday 9 AM)

```markdown
# Me Inc. Weekly Executive Summary
Week: [Week Number] | Date: [YYYY-MM-DD]

## Dashboard

| Metric | Status | Trend | Summary |
|--------|--------|-------|---------|
| Overall Health | 🟢 Green | ⬆️ | On track. Resume Engine MVP shipped. 3 warm leads. |
| Burn Rate | 🟡 Yellow | ➡️ | 6 weeks of runway left (financial/mental). |
| Velocity | 🟢 Green | ⬆️ | Completed 15 story points (vs 12 planned). |

## North Star Metrics (KPIs)

### Lagging Indicators (Outcomes)
- **Offers Received**: 0 → Target: 2+ by Week 8
- **Final Round Interviews**: 1 → Target: 5+ by Week 6
- **Callbacks/Responses**: 3 → Target: 10+ by Week 4

### Leading Indicators (Inputs)
- **Code Commits**: 47 commits this week (Green squares ✅)
- **Outreach Velocity**: 28 warm DMs sent (Target: 5/day = 35/week) ⚠️
- **Builder Velocity**: 2 features shipped (Resume Parser v1, Fit Scorer v1) ✅

## Power Law Analysis
- **100x Bet Status**: Co-Founder Matcher - 40% complete, confidence holding at 20%
- **10x Bet Status**: Resume Agent - Shipped MVP, 3 users testing
- **1x Activities**: Minimized to <10% of time

## Sprint Performance
- **Committed**: 12 story points
- **Completed**: 15 story points
- **Velocity**: +25% over plan 🎯

## Key Wins
1. Shipped Market Scout scraper - discovering 50+ jobs/day
2. First warm intro to YC founder via network graph
3. Resume Agent generated first tailored version in 28 seconds

## Blockers Resolved
1. ~~OpenAI API key delay~~ → Switched to Anthropic API
2. ~~Database schema confusion~~ → Reviewed design doc, clarified

## Active Blockers
- None (Clear runway)

## Next Week's Commitment
- Ship Decision Logger with visual trace viewer
- Apply to 10 Tier-1 companies using tailored resumes
- Test Co-Founder Matcher with 20 profiles
```

### Implementation in System
- Store in `workflow_executions` table with weekly aggregation
- Auto-generate from decision logs and metrics tables
- Display in dashboard UI

---

## 2. Power Law RICE Prioritization

### The Standard RICE Problem
Traditional RICE treats all "High Impact" tasks equally (1-5 scale). This misses **Power Law dynamics** where the right task is 100x more valuable than "good" tasks.

### The Exponential RICE Formula

$$\text{Score} = \frac{\text{Reach} \times \text{Impact} \times \text{Confidence}}{\text{Effort}}$$

### Power Law Scales

**Reach** (Logarithmic)
- 1: Just me
- 10: My team/immediate network
- 100: Company/organization scale
- 1,000: Market/industry scale
- 10,000+: World scale

**Impact** (Exponential)
- **1**: Incremental improvement (fix typo, minor optimization)
- **10**: Significant upgrade (get an interview, land meeting)
- **100**: Game changer (find co-founder, launch viral product, get funded)

**Confidence** (Probability of Success)
- 10%: Wild guess, high uncertainty moonshot
- 30%: Hypothesis with some data
- 50%: Educated bet
- 80%: Proven approach
- 100%: Guaranteed (rare)

**Effort** (Days of Focus)
- 1-2: Quick win
- 3-5: Week-long project
- 7-14: Multi-week effort
- 20+: Major undertaking

### Power Law Prioritization Example

| Task / Feature | Reach | Impact | Confidence | Effort | Score | Verdict |
|----------------|-------|--------|------------|--------|-------|---------|
| Co-Founder Vector Matcher | 1000 | 100 | 20% | 10 | 2,000 | #1 The Bet |
| Resume Optimizer Agent | 100 | 10 | 80% | 5 | 1,600 | #2 Cash Cow |
| Market Scout Scraper | 100 | 10 | 70% | 3 | 2,333 | #3 Quick Win |
| Network Graph Builder | 50 | 10 | 60% | 7 | 428 | #4 |
| LeetCode Grind | 1 | 1 | 100% | 14 | 7 | #5 The Chore |

### The Pre-Filter Question

Before calculating RICE, ask:

**"Does this task have a non-zero probability of generating 10x+ exponential returns?"**

- ✅ **Yes**: Calculate RICE → Prioritize
- ❌ **No**: Delegate, automate, or time-box to <10% of week

Examples:
- Build Resume Agent: ✅ (Scalable SaaS + Portfolio piece)
- Find Co-Founder: ✅ (Founding team = exponential)
- Manual job applications: ❌ (Linear 1:1 returns)
- Generic networking events: ❌ (Low signal/noise ratio)

### Implementation in Database

```sql
CREATE TABLE backlog_items (
    item_id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- RICE Components
    reach INTEGER,
    impact INTEGER, -- 1, 10, or 100
    confidence DECIMAL(3,2), -- 0.10 to 1.00
    effort INTEGER, -- days
    rice_score INTEGER GENERATED ALWAYS AS (
        (reach * impact * confidence) / NULLIF(effort, 0)
    ) STORED,
    
    -- Classification
    power_law_filter BOOLEAN, -- Passed 10x filter?
    category VARCHAR(50), -- moonshot, cash_cow, quick_win, chore
    
    -- Status
    status VARCHAR(50), -- backlog, sprint, in_progress, done, killed
    assigned_sprint INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backlog_rice_score ON backlog_items(rice_score DESC);
CREATE INDEX idx_backlog_status ON backlog_items(status);
```

---

## 3. Scrum Rituals (Weekly Sprint Cycle)

### Monday 8:00 AM - Sprint Planning

**Duration**: 1 hour  
**Purpose**: Select what to build this week

**Process**:
1. Review backlog sorted by RICE score
2. Check capacity (realistically 20-30 hours of deep work)
3. Select top 2-3 items that fit capacity
4. Move to "Sprint Backlog"
5. Write commitment statement

**Commitment Template**:
```
This week (Sprint [N]), I will ship:
1. [Feature/Task 1] - [Story Points]
2. [Feature/Task 2] - [Story Points]

Nothing else matters. These are the only priorities.
If I ship these, the sprint is a success.
```

**Example**:
```
This week (Sprint 2), I will ship:
1. Market Scout Scraper + Fit Scoring - 8 pts
2. Apply to 10 Tier-1 companies - 5 pts

Total: 13 story points
Success Criteria: 50+ jobs discovered, 10 applications sent with tailored resumes
```

### Daily 9:00 AM - Solo Standup

**Duration**: 5 minutes  
**Purpose**: Maintain momentum and identify blockers fast

**Three Questions** (Write in notebook or Linear):

1. **What did I ship yesterday?**
   - Example: "Fixed PDF parser bug, added skill extraction"

2. **What will I ship today?**
   - Example: "Connect scraper to OpenAI API, test on 10 job posts"

3. **What is blocking me?**
   - Example: "Waiting for API key" → Action: Get key NOW or use different provider

**Rules**:
- If blocked > 2 hours → Pivot or ask for help
- If no progress yesterday → Diagnose why (distraction? wrong task?)
- Focus on **shipping**, not "working on"

### Friday 5:00 PM - Sprint Review & Retrospective

**Duration**: 1 hour  
**Purpose**: Demo what you built + learn what to change

#### Part 1: Review (30 min)
- **Demo Day**: Actually run the thing you built
- **Did it work?** Test with real data
- **Meets definition of done?** 
- **Update story points**: Actual vs. estimated

#### Part 2: Retrospective (30 min)

**Format** (Start/Stop/Continue):

| Start | Stop | Continue |
|-------|------|----------|
| Cold DMs to founders - 50% response rate | Spending 3 hours on portfolio CSS | Waking at 7 AM to code |
| Using Linear for task tracking | Checking LinkedIn compulsively | Daily standups |
| Testing features before declaring done | Building without user feedback | Prioritizing by RICE |

**Key Questions**:
- What went better than expected?
- What took longer than expected? Why?
- What should I do differently next sprint?
- Is my velocity sustainable?

---

## 4. The Pareto Dynamic Alignment

### The 80/20 Execution Rule

**Principle**: 20% of your tasks generate 80% of your results.

**Weekly Implementation**:
1. Identify top 20% of backlog items (usually 1-2 items)
2. Allocate 80% of your energy to these items
3. Time-box remaining 80% of tasks to 20% of your time

**Daily Time Allocation**:
```
8 hours of focused work per day:
- 6.4 hours (80%) → Top 2 RICE items
- 1.6 hours (20%) → Email, admin, maintenance
```

### The Dynamic Re-evaluation

**Every Week**: Re-score your active bets based on new data

**Process**:
```python
# Pseudo-code for weekly review
for task in active_moonshots:
    new_confidence = evaluate_progress(task)
    if new_confidence < 0.05:  # Confidence collapsed
        task.status = 'killed'
        log_decision(f"Killed {task.title}: confidence dropped to {new_confidence}")
        pivot_to_next_best_option()
    elif new_confidence > initial_confidence * 2:  # Breakthrough
        increase_resource_allocation(task)
```

**Example**:
- **Week 1**: Co-Founder Matcher, Confidence = 20%
- **Week 2**: Found 0 matches, Confidence drops to 5%
- **Decision**: Kill project, pivot to Network Graph Builder
- **Week 3**: Network Graph reveals 3 warm intros to target companies
- **Week 4**: Confidence in Network approach jumps to 70%, double down

### The Kill Decision

**When to Kill a Project**:
- Confidence drops below 5%
- Better opportunity emerges (2x higher RICE score)
- Runway getting critical (burn rate exceeds plan)

**How to Kill**:
1. Log decision in `decisions` table with full reasoning
2. Extract learnings (what assumption was wrong?)
3. Archive code/docs (might be useful later)
4. Immediately pivot to next highest RICE item

---

## 5. The 2-Month Gantt Roadmap

### Sprint Planning Overview

```
Sprint 1 (Weeks 1-2): Infrastructure
├─ Resume Optimization Agent (DSPy/Claude)
├─ CRM Setup (Linear + Notion)
└─ Core database schema

Sprint 2 (Weeks 3-4): The Scout  
├─ Market Intelligence Agent (LangGraph)
├─ Job scraping + fit scoring
└─ Beta test with 10 founders

Sprint 3 (Weeks 5-6): The Network
├─ Co-Founder Vector Matcher (moonshot)
├─ Network graph builder
└─ First round interviews happening

Sprint 4 (Weeks 7-8): The Close
├─ Offer negotiation playbook
├─ System polish for portfolio
└─ Multiple offers → decision time
```

### Phase Classification by Power Law

**Phase 1: High Uncertainty / High Reward (Discovery)**
- Focus: Moonshots (100x potential)
- Projects: Co-Founder Matcher, Market Scout Agent
- Goal: Validate if these ideas have legs
- Metric: "Wow" moments (found hidden startup, perfect match)
- Time Allocation: 50% of effort

**Phase 2: High Confidence / High Impact (Scale)**
- Focus: Cash Cows (10x potential)
- Projects: Resume Agent, Network Graph
- Goal: Solve job hunt problem effectively
- Metric: Interview conversion rate
- Time Allocation: 40% of effort

**Phase 3: The Long Tail (Maintenance)**
- Focus: Necessary chores (1x)
- Projects: LeetCode, behavioral prep, admin
- Goal: Don't let basics slip
- Metric: Minimum viable competence
- Time Allocation: 10% of effort (strictly time-boxed)

---

## 6. Tech Stack for "Me Inc."

### Project Management: Linear

**Why Linear over Jira**:
- Faster, cleaner interface
- Popular in startups (shows you understand their tools)
- Keyboard shortcuts for velocity
- Beautiful design (matters for portfolio screenshots)

**Setup**:
```
Projects:
├─ Resume Engine
├─ Market Scout
├─ Network Matcher
└─ Operations (Admin/Outreach)

Labels:
├─ moonshot (100x)
├─ cash-cow (10x)  
├─ quick-win (1-3 days)
└─ chore (must-do)

Views:
├─ Backlog (sorted by RICE)
├─ Sprint (current 2-week focus)
├─ In Progress
└─ Done (demo-able work)
```

### Knowledge Base: Notion

**Structure**:
```
Me Inc. Workspace
├─ Executive Dashboard
│  ├─ Weekly Summary
│  ├─ North Star Metrics
│  └─ Burn Rate Tracker
├─ CRM (Job Applications)
│  ├─ Companies
│  ├─ Contacts
│  ├─ Applications (Kanban)
│  └─ Interview Prep
├─ Engineering
│  ├─ Architecture Decisions
│  ├─ API Docs
│  └─ Sprint Retrospectives
└─ Learning
   ├─ Interview Questions
   ├─ System Design
   └─ Behavioral Stories
```

### Code: GitHub

**Purpose**: Keep commit history green (shows consistency)

**Best Practices**:
- Commit daily (even small progress)
- Meaningful commit messages
- Use branches for features
- Write README as you build (documentation is half the demo)

**Example Repo Structure**:
```
me-inc-job-agent/
├─ README.md (Portfolio piece - tell the story)
├─ services/
│  ├─ resume/
│  ├─ scout/
│  ├─ network/
│  └─ orchestrator/
├─ db/
│  └─ migrations/
├─ docs/
│  ├─ architecture.md
│  └─ decisions/ (ADRs)
└─ tests/
```

---

## 7. Dashboard Implementation

### Core Views Needed

**1. Executive Dashboard**
- Current sprint progress
- North Star metrics (graph over time)
- Burn rate vs. runway
- Recent decisions with reasoning

**2. RICE Backlog View**
- All items sorted by score
- Filter by: moonshot/cash-cow/chore
- Quick edit for re-scoring
- Drag to sprint planning

**3. Decision Trace Viewer**
- Timeline of all automated decisions
- Drill down into reasoning
- Override/feedback interface
- Pattern analysis (what's working?)

**4. Network Graph Visualization**
- Nodes: People, Companies, Jobs
- Edges: Relationships, Applications
- Pathfinding: "How do I reach Company X?"

### Data Flow

```
Daily Activity (code, apply, network)
         ↓
Decision Logger records with context
         ↓
Aggregated into metrics tables
         ↓
Dashboard displays trends + insights
         ↓
Weekly Executive Summary generated
         ↓
Retrospective updates RICE scores
         ↓
Next sprint planned
```

---

## 8. Integration with Technical System

### How Agile Layer Maps to Tech Architecture

| Agile Component | Technical Implementation |
|-----------------|-------------------------|
| Backlog Items | `backlog_items` table with RICE scores |
| Sprint Planning | `workflow_executions` with selected tasks |
| Daily Standup | Daily log entries + blocker tracking |
| Sprint Review | Demo against `decisions` table outcomes |
| North Star Metrics | Aggregation queries on jobs/network/resume tables |
| Weekly Summary | Generated report from workflow + decision data |

### API Endpoints Needed

```python
# Sprint Management
POST   /api/sprints                    # Create new sprint
GET    /api/sprints/current            # Get active sprint
PUT    /api/sprints/{id}/complete      # Mark sprint done
GET    /api/sprints/{id}/velocity      # Get sprint metrics

# Backlog Management  
GET    /api/backlog                    # All items sorted by RICE
POST   /api/backlog                    # Add new item
PUT    /api/backlog/{id}/score         # Re-calculate RICE
DELETE /api/backlog/{id}               # Kill item

# Metrics
GET    /api/metrics/north-star         # KPI dashboard data
GET    /api/metrics/weekly-summary     # Executive summary
GET    /api/metrics/burn-rate          # Runway calculation

# Decisions
GET    /api/decisions                  # All decisions with filters
GET    /api/decisions/{id}/trace       # Full context for decision
POST   /api/decisions/{id}/feedback    # User override/feedback
```

---

## 9. Success Patterns

### The Mamba Mindset

**Characteristics of High Performers**:
1. **Ruthless Prioritization**: Say no to everything that isn't top RICE
2. **Bias for Shipping**: "Done" > "Perfect"
3. **Data-Driven Pivots**: Kill bad bets fast, double down on good ones
4. **Compound Leverage**: Build tools that automate your job hunt

### Red Flags (Anti-Patterns)

| Red Flag | What It Means | Fix |
|----------|---------------|-----|
| Backlog growing faster than completion | Analysis paralysis | Kill bottom 50% of backlog |
| Low commit activity | Not building | Block 4-hour deep work sessions |
| High "busy" feeling, low outcomes | Wrong priorities | Re-score with Power Law RICE |
| No interviews after 3 weeks | Not enough outreach | Increase outreach velocity target |
| Burnout symptoms | Unsustainable pace | Reduce sprint commitment 20% |

### The Compound Effect

**Week 1**: Ship Resume Agent → Generate 5 tailored resumes  
**Week 2**: Ship Market Scout → Discover 200 opportunities  
**Week 3**: Combine → Automatically match + tailor for top 20  
**Week 4**: Ship Network Matcher → Find warm intros for 10 of those 20  
**Week 5**: Result → 10 warm applications vs. 0 cold applications  
**Week 6**: Result → 5 first-round interviews  
**Week 7**: Result → 2 final rounds  
**Week 8**: Result → Multiple offers, negotiation position

**Total**: 8 weeks of compounding automation vs. 8 weeks of manual grind.

---

## 10. Weekly Checklist

### Monday (Sprint Start)
- [ ] Review last week's summary
- [ ] Re-score backlog with new learnings
- [ ] Select top 2-3 items for this sprint
- [ ] Write sprint commitment statement
- [ ] Update Linear sprint board

### Daily
- [ ] 9 AM standup (3 questions)
- [ ] 4-6 hours deep work on sprint items
- [ ] 1 hour outreach/networking
- [ ] Green square on GitHub
- [ ] Log any decisions made

### Friday (Sprint End)
- [ ] Demo what you built
- [ ] Test against real data
- [ ] Run retrospective (Start/Stop/Continue)
- [ ] Generate weekly executive summary
- [ ] Update metrics dashboard
- [ ] Plan celebration (momentum is psychological)

---

## 11. Sample Weekly Summary (Template)

```markdown
# Me Inc. Weekly Executive Summary
**Sprint 3 | Week of Dec 16-22, 2024**

## Status Dashboard

| Metric | Status | Trend | Detail |
|--------|--------|-------|--------|
| Overall Health | 🟢 Green | ⬆️ | Momentum building. Network matcher showing promise. |
| Financial Runway | 🟡 Yellow | ➡️ | 5 weeks left. Need interview pipeline. |
| Sprint Velocity | 🟢 Green | ⬆️ | 18 pts completed (vs 15 planned). |
| Mental Health | 🟢 Green | ⬆️ | Sustainable pace maintained. |

## North Star Metrics

### Lagging (Outcomes)
- Offers: 0 (Target: 2 by Week 8)
- Final Rounds: 0 (Target: 3 by Week 6) ⚠️  
- First Rounds: 2 (Target: 5 by Week 5) ✅
- Callbacks: 8 (up from 3) ✅

### Leading (Inputs)
- Code Commits: 52 (daily average: 7.4) ✅
- Outreach Velocity: 31 DMs (Target: 35) 🟡
- Features Shipped: 3 (Network Matcher MVP, Decision Logger, Auto-tailor) ✅

## Power Law Portfolio

| Category | Project | Status | Confidence | Next Action |
|----------|---------|--------|------------|-------------|
| Moonshot (100x) | Co-Founder Matcher | 60% | 25% ↑ | Test with 50 profiles next week |
| Cash Cow (10x) | Resume Agent | Shipped | 80% ↑ | Scale to 20 companies |
| Quick Win | Network Graph | Shipped | 70% | Find 5 warm intros |

## Key Wins This Week
1. ✅ Network Matcher found path to 3 target companies via 2nd-degree connections
2. ✅ Resume Agent used by 5 beta testers, 4/5 said "better than manual"
3. ✅ First warm intro led to informal coffee chat with hiring manager

## Lessons Learned
- **Insight**: Warm intros convert 10x better than cold applications
- **Action**: Prioritize network matcher over mass applications
- **Pivot**: Reduce target application volume from 20/week to 5/week (but all warm)

## Blockers
- None active. Clear runway for next sprint.

## Next Sprint Commitment (Week 4)
I will ship:
1. Co-Founder Matcher v1 with vector similarity - 10 pts
2. Execute 5 warm introductions - 5 pts  
3. Land 2 first-round interviews - External metric

**Total**: 15 story points  
**Success Criteria**: Warm intro → interview conversion rate >50%
```

---

## 12. Final Integration Checklist

### To Fully Implement This System

**Database Additions** (Beyond core schema):
- [ ] `backlog_items` table with RICE scoring
- [ ] `sprints` table for sprint tracking
- [ ] `daily_logs` table for standup notes
- [ ] `weekly_summaries` table for executive reports

**Dashboard Features**:
- [ ] Executive summary generator
- [ ] RICE score calculator and backlog sorter
- [ ] Sprint planning interface
- [ ] Velocity tracker (story points over time)
- [ ] North Star metrics charts
- [ ] Decision trace timeline

**Automation**:
- [ ] Daily standup reminder (email/slack)
- [ ] Friday sprint review trigger
- [ ] Auto-generate weekly summary from metrics
- [ ] Burn rate calculator and alerts
- [ ] RICE re-scoring suggestions based on new data

**Documentation**:
- [ ] Onboarding guide for "Me Inc."
- [ ] RICE scoring examples for your domain
- [ ] Retrospective templates
- [ ] Decision log best practices

---

## Document Changelog

**Version 1.0** (Dec 8, 2024)
- Initial framework document
- Integrated Power Law RICE prioritization
- Defined Scrum rituals for solo execution
- Created weekly summary template
- Mapped agile layer to technical architecture

---

**Next Update**: After Sprint 1 completion with real data and learnings.
