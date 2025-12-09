import dspy
from typing import List, Optional
import os
import ast

# 1. Define Signatures (The "Contract")

class CritiqueBulletPoint(dspy.Signature):
    """
    Analyze a resume bullet point using the STAR (Situation, Task, Action, Result) methodology.
    Identify missing components and vague language.
    """
    raw_text = dspy.InputField(desc="The user's original resume bullet point")
    domain = dspy.InputField(desc="The professional domain (e.g. 'Backend Engineering', 'Sales')")
    years_experience = dspy.InputField(desc="Years of experience of the candidate")
    
    missing_star_components = dspy.OutputField(desc="List of STAR components missing (e.g. ['Result', 'Action'])")
    weakness_explanation = dspy.OutputField(desc="Brief explanation of why the bullet point is weak")
    follow_up_question = dspy.OutputField(desc="A specific, probing question to get the missing details")


class RewriteBulletPoint(dspy.Signature):
    """
    Rewrite a resume bullet point to be high-impact, using strong action verbs and metrics.
    """
    original_text = dspy.InputField()
    context_answer = dspy.InputField(desc="User's answer to the follow-up question")
    domain = dspy.InputField()
    
    refined_bullet = dspy.OutputField(desc="The polished, high-impact bullet point")
    improvement_reason = dspy.OutputField(desc="Why this version is better")


# 2. Define the Module (The "Logic")

class GuideAgent(dspy.Module):
    def __init__(self):
        super().__init__()
        # In a real app, we'd add 'dspy.Retrieve(k=3)' here for RAG
        self.critique_prog = dspy.ChainOfThought(CritiqueBulletPoint)
        self.rewrite_prog = dspy.ChainOfThought(RewriteBulletPoint)
    
    def forward(self, task_type: str, **kwargs):
        if task_type == "critique":
            return self.critique_prog(
                raw_text=kwargs["raw_text"],
                domain=kwargs["domain"],
                years_experience=str(kwargs["years_experience"])
            )
        elif task_type == "rewrite":
            return self.rewrite_prog(
                original_text=kwargs["original_text"],
                context_answer=kwargs["context_answer"],
                domain=kwargs["domain"]
            )

# 3. Service Wrapper

class GuideService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found")
        
        # Configure DSPy to use GPT-4o
        lm = dspy.LM('openai/gpt-4o', api_key=api_key)
        dspy.settings.configure(lm=lm)
        
        self.agent = GuideAgent()
    
    def analyze_bullet(self, text: str, domain: str = "General", experience: int = 5) -> dict:
        """Analyze a bullet point and return critique."""
        pred = self.agent(
            task_type="critique", 
            raw_text=text, 
            domain=domain, 
            years_experience=experience
        )
        
        # DSPy may return missing_star_components as a string representation of a list
        # We need to convert it to an actual list
        missing = pred.missing_star_components
        if isinstance(missing, str):
            try:
                missing = ast.literal_eval(missing)
            except (ValueError, SyntaxError):
                # If parsing fails, wrap the string in a list
                missing = [missing] if missing else []
        
        # Ensure it's always a list
        if not isinstance(missing, list):
            missing = [missing] if missing else []
        
        return {
            "missing_components": missing,
            "critique": pred.weakness_explanation,
            "question": pred.follow_up_question
        }

    def refine_bullet(self, original: str, answer: str, domain: str = "General") -> dict:
        """Rewrite a bullet point based on user answers."""
        pred = self.agent(
            task_type="rewrite",
            original_text=original,
            context_answer=answer,
            domain=domain
        )
        
        return {
            "refined_text": pred.refined_bullet,
            "reasoning": pred.improvement_reason
        }

# Singleton
_guide_instance = None

def get_guide_service():
    global _guide_instance
    if _guide_instance is None:
        _guide_instance = GuideService()
    return _guide_instance
