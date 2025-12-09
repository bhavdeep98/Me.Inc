# Resume Engine Architecture

## Core Philosophy
The resume is not a static document; it is a **dynamic statement** composed of modular narrative blocks.

**Source of Truth**: JSON (Structured, Manipulatable)
**Output Format**: LaTeX (Professional, "Statement" Aesthetics)
**Logic**: Context-Aware Tailoring (JD + Founder + Company)

## 1. The Data Structure (JSON Schema)

We will use a "Atomic Accomplishment" structure. Instead of flat bullet points, we store the *components* of an accomplishment.

```json
{
  "meta": {
    "version_name": "Master Profile",
    "years_experience": 12,
    "core_archetype": "Technical Leader" // vs. "Individual Contributor"
  },
  "basics": { ... }, // Name, contact, etc.
  "experience_modules": [
    {
      "company": "TechCorp",
      "role": "Senior Engineer",
      "dates": "2020-Present",
      "context": "High-growth fintech startup, Series B to D",
      "accomplishments": [
        {
          "id": "acc_001",
          "tags": ["scaling", "backend", "leadership"],
          "components": {
            "problem": "Legacy monolith causing 40% downtime during peak.",
            "action": "Led migration to microservices using Go and Kubernetes.",
            "impact_metric": "99.99% uptime",
            "impact_business": "Supported 10x user growth ($50M revenue)."
          },
          // The LLM can re-assemble these components based on need
          "narrative_variations": {
            "technical_focus": "Architected Go microservices to solve scaling bottlenecks...",
            "business_focus": "Enabled $50M revenue growth by stabilizing core infrastructure...",
            "leadership_focus": "Led 5-person team through critical infrastructure migration..."
          }
        }
      ]
    }
  ],
  "skills_matrix": { ... }
}
```

## 2. The "Experienced Feedback" Logic

The prompt strategy changes based on `years_experience` to ensure the "Statement" hits the right level.

| Experience Level | Narrative Focus | Prompt Instruction |
|------------------|-----------------|--------------------|
| **Junior (0-3y)** | Skills & Execution | "Focus on *how* you did it. Highlight specific tools and speed of execution." |
| **Mid (3-7y)** | Ownership & Impact | "Focus on *what* you owned. Connect code to immediate business outcomes." |
| **Senior (7-12y)** | Architecture & Strategy | "Focus on *why* choices were made. Highlight system design, trade-offs, and team leverage." |
| **Exec (12y+)** | Vision & People | "Focus on *who* you led and P&L impact. Technical details are secondary to organizational change." |

## 3. The Tailoring Engine

The engine takes 4 inputs to produce the final PDF:

1.  **Master JSON** (The pool of all accomplishments)
2.  **Job Description** (The lock to be picked)
3.  **Company Profile** (The culture filter - e.g., "Moves fast" vs. "High compliance")
4.  **Founder/Hiring Mgr Profile** (The audience filter - e.g., "Technical founder" vs. "Sales founder")

### Workflow
1.  **Analyze Context**: LLM extracts "Key Themes" from JD + Company + Founder.
2.  **Select Modules**: LLM picks the top 5-7 `accomplishments` from Master JSON that match themes.
3.  **Rewrite/Refine**: LLM re-assembles the `components` (Problem/Action/Impact) into bullet points that mirror the *language* of the Company/Founder.
4.  **Render**: Python script injects selected content into a clean LaTeX template.
