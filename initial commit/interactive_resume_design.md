# Interactive Resume Builder Design

## Core Concept
"The Interview": Instead of filling forms, you upload your current resume. An AI Agent (The "Interviewer") parses it, identifies gaps/weaknesses based on your experience level, and *talks* to you to refine the content.

## User Experience (Chat Flow)

1.  **Ingest**: User uploads `old_resume.pdf` to the chat.
2.  **Analyze**: System parses text and maps it to our NoSQL Schema.
3.  **Critique & Probe**:
    *   *Agent*: "I see you listed 'Led migration to cloud'. Since you have 8 years of experience, I need more strategic context. Did you design the architecture? What was the cost impact? Let's rewrite this bullet."
    *   *User*: "Yes, I chose AWS and saved 20%."
    *   *Agent*: "Great. Updating your profile..."
4.  **Continuous Render & Highlight**:
    *   *Visuals*: The Right Panel ALWAYS shows the rendered resume (HTML/PDF equivalent).
    *   *Focus*: When the Agent asks about "TechCorp", the "TechCorp" section on the right highlights (glows/scrolls into view).
    *   *Examples*: The Agent can insert "Example Bullet Points" directly into the preview to show the user what "good" looks like.

## System Architecture

### 1. Data Store (NoSQL via Postgres JSONB)
We will use the `resume_versions` table, but specifically the `content` JSONB column as our flexible document store.

```json
// The "Master Profile" Structure
{
  "basics": { ... },
  "work_experience": [
    {
      "id": "exp_1",
      "company": "TechCorp",
      "roles": [
        {
          "title": "Senior Engineer",
          "accomplishments": [
            {
              "raw_text": "Migrated to cloud",
              "refined_components": {
                "problem": "Legacy on-prem costs high",
                "action": "Migrated to AWS",
                "impact": "20% savings"
              },
              "display_text": "Architected AWS migration reducing opex by 20%...",
              "tags": ["AWS", "Cost Optimization"]
            }
          ]
        }
      ]
    }
  ]
}
```

### 2. The Agentic Pipeline

#### Agent A: "The Extractor"
*   **Role**: Convert raw PDF text -> Structured JSON.
*   **Prompt**: "You are a data entry expert. Map this messy resume text into our Schema. If fields are missing, mark them as `null`."

#### Agent B: "The Interviewer" (Your "Experienced Feedback" Hook)
*   **Role**: The Coach.
*   **Logic**:
    *   If `years_exp < 3`: Ask about *skills* and *speed*.
    *   If `years_exp > 7`: Ask about *strategy* and *leadership*.
*   **Action**: It reads the JSON, finds weak `accomplishments`, and generates a question for the user.

#### Agent C: "The LaTex Specialist"
*   **Role**: The Typesetter.
*   **Prompt**: "You are a LaTeX expert. Take this JSON content and inject it into this Statement Template. Ensure perfect kerning and layout."
*   **Constraint**: It *only* writes code. It does not change content.

## Implementation Plan

### Frontend
*   **Stack**: Next.js + `shadcn/ui` (Chat Interface).
*   **Features**:
    *   Chat Window (Message stream).
    *   Split View: Chat on Left, Live PDF Preview on Right.

### Backend
*   **Endpoints**:
    *   `POST /upload`: Parse resume.
    *   `POST /chat`: Send user message + current JSON state -> Get Agent response + updated JSON.
    *   `POST /render`: JSON -> PDF URL.

## Learning & Visibility
*   The UI will show the "Agent's Thought Process" (e.g., "Analyzing experience level...", "Detecting weak verbs...").
*   We will log every JSON state change so you can time-travel/undo.
