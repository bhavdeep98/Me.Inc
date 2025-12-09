# Low-Level Design: Domain Expert Guide (DSPy)

## 1. Overview
This document details the architecture for **Agent B: "The Domain Expert Guide"**.
Instead of using static prompt engineering, we will use **DSPy (Declarative Self-Improving Language Programs)** to build an agent that *learns* to interview users effectively.

**Goal**: To guide users in rewriting their resume bullet points using the **STAR Methodology** (Situation, Task, Action, Result) and **Domain Specific Context**.

## 2. DSPy Architecture

### 2.1. Signatures (The "Types")
Signatures define *what* the LLM does, not *how* to do it.

#### `CritiqueBulletPoint`
*   **Purpose**: Analyze a user's raw input against the STAR framework.
*   **Inputs**:
    *   `raw_text` (str): The user's rough bullet point.
    *   `domain` (str): e.g., "Backend Engineering", "Sales".
    *   `years_experience` (int): Context for seniority expectations.
*   **Outputs**:
    *   `missing_star_components` (list[str]): e.g., ["Action", "Result"].
    *   `weakness_explanation` (str): "You mentioned a 20% gain but not *how* you achieved it."
    *   `follow_up_question` (str): "What specific AWS services did you use to optimize the cost?"

#### `RewriteBulletPoint`
*   **Purpose**: Generate the final, polished bullet point.
*   **Inputs**:
    *   `original_text` (str)
    *   `user_answers` (str): Additional context provided by user during chat.
    *   `domain_keywords` (list[str]): Retrieved relevant keywords (e.g., "Latency", "Throughput").
*   **Outputs**:
    *   `final_text` (str): The polished, resume-ready bullet point.
    *   `reasoning` (str): Why this version is better.

### 2.2. Modules (The "Logic")

We will use a `dspy.Module` to chain these steps together.

```python
class GuideAgent(dspy.Module):
    def __init__(self):
        super().__init__()
        self.retrieve = dspy.Retrieve(k=3) # RAG for "Good Problems" in the domain
        self.critique = dspy.ChainOfThought(CritiqueBulletPoint)
        self.rewrite = dspy.ChainOfThought(RewriteBulletPoint)

    def forward(self, raw_text, domain, years_exp):
        # Step 1: Logic Retrieval
        # Find "Good Problems" relevant to this domain to inform the critique
        # e.g. If domain="Backend", retrieve context about "Scaling", "Database Locking"
        domain_context = self.retrieve(domain)
        
        # Step 2: Critique
        critique_result = self.critique(
            raw_text=raw_text, 
            domain=domain, 
            years_experience=years_exp,
            context=domain_context
        )
        
        return critique_result
```

### 2.3. Optimization (The "Learning")
We will use the **BootstrapFewShot** optimizer.
1.  **Metric**: We define a function `assess_star_quality(prediction)` that checks if the output actually contains specific Action Verbs and Quantifiable Metrics.
2.  **Dataset**: We provide 5-10 "Golden Examples" of (Bad Input -> Perfect Critique).
3.  **Compile**: DSPy will run thousands of variations to find the perfect prompt that maximizes our `assess_star_quality` metric.

## 3. Integration Plan

### 3.1. New Service `guide_service.py`
This service will wrap the DSPy compiled program.

*   `initialize_agent()`: Loads the compiled DSPy JSON (the "weights" of the prompt).
*   `analyze_experience(text, context)`: Returns the critique and question.

### 3.2. Data Flow (Chat Loop)
1.  **User** sends message: "I worked on the search engine."
2.  **API** (`POST /api/chat`) calls `guide_service.analyze_experience()`.
3.  **GuideAgent**:
    *   Detects Domain: "Search / Information Retrieval".
    *   Retrieves Context: "Latency", "Relevance Ranking", "Indexing".
    *   Critiques: "Vague. Did you improve latency or relevance?"
    *   Returns: `follow_up_question`.
4.  **Frontend** displays the question.

## 4. Dependencies
*   `dspy-ai`
*   `chromadb` (for lightweight local RAG of "Good Domain Problems")
