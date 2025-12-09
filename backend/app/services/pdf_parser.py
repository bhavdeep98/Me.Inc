import os
import json
from typing import Optional
from io import BytesIO

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


class PDFParserService:
    """
    Agent A: "The Extractor"
    Converts raw PDF text -> Structured JSON using OpenAI
    """
    
    def __init__(self):
        if OpenAI is None:
            raise ImportError("openai package is required. Run: pip install openai")
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or api_key == "your-openai-api-key-here":
            raise ValueError("OPENAI_API_KEY environment variable must be set")
        
        self.client = OpenAI(api_key=api_key)
    
    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extract raw text from PDF file bytes."""
        if PdfReader is None:
            raise ImportError("pypdf package is required. Run: pip install pypdf")
        
        reader = PdfReader(BytesIO(pdf_bytes))
        text_parts = []
        
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        
        return "\n\n".join(text_parts)
    
    def parse_resume_to_json(self, raw_text: str) -> dict:
        """
        Use OpenAI to convert unstructured resume text 
        into our structured JSON schema.
        """
        
        system_prompt = """You are a professional resume parser. Your job is to extract information from resume text and structure it into a specific JSON format.

You MUST return ONLY valid JSON, no markdown, no explanation. The JSON must follow this exact schema:

{
  "basics": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number or null",
    "location": "City, State or null",
    "linkedin": "LinkedIn URL or null",
    "summary": "Professional summary paragraph"
  },
  "work_experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "dates": "Start - End",
      "location": "City, State or Remote",
      "description": "Brief role description",
      "accomplishments": [
        {
          "raw_text": "Original bullet point",
          "refined_components": {
            "problem": "What problem existed (or null)",
            "action": "What action was taken",
            "impact": "What was the measurable result (or null)"
          },
          "tags": ["relevant", "skill", "tags"]
        }
      ]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "dates": "Graduation Year or Date Range",
      "gpa": "GPA if mentioned or null",
      "highlights": ["honors", "activities", "etc"]
    }
  ],
  "skills": {
    "technical": ["skill1", "skill2"],
    "languages": ["English", "etc"],
    "tools": ["tool1", "tool2"],
    "frameworks": ["framework1"],
    "other": ["other skills"]
  },
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Date obtained or null"
    }
  ],
  "meta": {
    "years_experience": 0,
    "core_archetype": "Individual Contributor or Technical Leader or Executive"
  }
}

Rules:
1. If information is not present, use null for single values or empty arrays [] for lists
2. Estimate years_experience from work history dates
3. Choose core_archetype based on seniority: IC for <5y, Technical Leader for 5-12y, Executive for 12y+
4. Extract ALL accomplishments as bullet points, even if brief
5. For accomplishments, try to identify Problem/Action/Impact patterns, but don't force it
6. Tags should be 2-5 relevant keywords per accomplishment
7. If you cannot determine the summary, create one based on the overall resume content"""

        user_prompt = f"""Parse this resume text and return the structured JSON:

---RESUME TEXT START---
{raw_text}
---RESUME TEXT END---

Return ONLY the JSON object, nothing else."""

        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=4096,
            temperature=0.1  # Low temperature for consistent parsing
        )
        
        # Extract the JSON from the response
        response_text = response.choices[0].message.content.strip()
        
        # Clean up any potential markdown code blocks
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            # Remove first and last lines (```json and ```)
            if lines[-1].strip() == "```":
                lines = lines[1:-1]
            else:
                lines = lines[1:]
            response_text = "\n".join(lines)
        
        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            # Return a minimal valid structure on parse failure
            return {
                "basics": {"name": "Parse Error", "summary": raw_text[:500]},
                "work_experience": [],
                "education": [],
                "skills": {},
                "meta": {"years_experience": 0, "core_archetype": "Individual Contributor"},
                "_parse_error": str(e),
                "_raw_response": response_text[:1000]
            }
    
    def parse_pdf(self, pdf_bytes: bytes) -> dict:
        """Main entry point: PDF bytes -> Structured JSON"""
        raw_text = self.extract_text_from_pdf(pdf_bytes)
        
        if not raw_text.strip():
            raise ValueError("Could not extract any text from PDF. The PDF may be image-based or corrupted.")
        
        structured_data = self.parse_resume_to_json(raw_text)
        
        # Add the raw text for reference
        structured_data["_raw_text"] = raw_text
        
        return structured_data


# Lazy initialization to avoid import errors when dependencies aren't installed
_parser_instance: Optional[PDFParserService] = None

def get_pdf_parser() -> PDFParserService:
    """Get or create the PDF parser service instance."""
    global _parser_instance
    if _parser_instance is None:
        _parser_instance = PDFParserService()
    return _parser_instance
