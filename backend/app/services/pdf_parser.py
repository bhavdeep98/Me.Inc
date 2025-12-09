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
        """Extract raw text from PDF file bytes with improved handling."""
        if PdfReader is None:
            raise ImportError("pypdf package is required. Run: pip install pypdf")
        
        reader = PdfReader(BytesIO(pdf_bytes))
        text_parts = []
        
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                # Clean up the text
                text = text.strip()
                # Add page separator for multi-page resumes
                if i > 0:
                    text_parts.append(f"\n--- Page {i + 1} ---\n")
                text_parts.append(text)
        
        full_text = "\n".join(text_parts)
        
        # Basic text cleanup
        # Remove excessive whitespace while preserving structure
        lines = full_text.split('\n')
        cleaned_lines = []
        for line in lines:
            # Preserve non-empty lines
            stripped = line.strip()
            if stripped:
                cleaned_lines.append(stripped)
            elif cleaned_lines and cleaned_lines[-1]:  # Add single blank line
                cleaned_lines.append('')
        
        return '\n'.join(cleaned_lines)
    
    def parse_resume_to_json(self, raw_text: str) -> dict:
        """
        Use OpenAI to convert unstructured resume text 
        into our structured JSON schema.
        """
        
        system_prompt = """You are an expert resume parser. Extract ALL information from the resume text into structured JSON.

CRITICAL: You must capture EVERY work experience, EVERY bullet point, EVERY skill mentioned. Do not summarize or skip anything.

Return ONLY valid JSON with this exact structure:

{
  "basics": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number or null",
    "location": "City, State/Country or null",
    "linkedin": "LinkedIn URL or null",
    "github": "GitHub URL or null",
    "website": "Personal website or null",
    "summary": "Professional summary - if not explicitly stated, create a 2-3 sentence summary based on the resume content"
  },
  "work_experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "dates": "Start Date - End Date (e.g., Jan 2020 - Present)",
      "location": "City, State or Remote",
      "accomplishments": [
        {
          "raw_text": "The exact bullet point text from the resume",
          "refined_components": {
            "action": "What was done",
            "impact": "Measurable result if mentioned, otherwise null"
          },
          "tags": ["relevant", "keywords", "technologies"]
        }
      ]
    }
  ],
  "education": [
    {
      "institution": "University/School Name",
      "degree": "Degree Type (BS, MS, PhD, etc.)",
      "field": "Field of Study/Major",
      "dates": "Graduation Year or Date Range",
      "gpa": "GPA if mentioned, otherwise null",
      "highlights": ["honors", "relevant coursework", "activities"]
    }
  ],
  "skills": {
    "languages": ["Programming languages"],
    "frameworks": ["Frameworks and libraries"],
    "tools": ["Tools, platforms, databases"],
    "cloud": ["Cloud services and infrastructure"],
    "other": ["Other skills, methodologies, soft skills"]
  },
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Date obtained or null"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "technologies": ["tech", "used"],
      "url": "Project URL if mentioned"
    }
  ],
  "meta": {
    "years_experience": 0,
    "core_archetype": "Individual Contributor or Technical Leader or Executive",
    "primary_domain": "e.g., Backend, Frontend, ML, DevOps, etc."
  }
}

RULES:
1. Extract EVERY bullet point from work experience - do not skip or combine them
2. Preserve the original text of accomplishments in raw_text
3. Calculate years_experience by summing up all work experience durations
4. For skills, categorize them appropriately - don't leave any out
5. If a section is not present in the resume, use empty array [] or null
6. For accomplishments tags, extract 2-4 relevant keywords/technologies mentioned
7. Be thorough - a complete resume might have 3-10+ bullet points per role"""

        user_prompt = f"""Parse this complete resume and extract ALL information into the JSON structure. 
Do not skip any work experience, bullet points, or skills.

---RESUME TEXT START---
{raw_text}
---RESUME TEXT END---

Return ONLY the complete JSON object with all resume content."""

        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=8192,  # Increased for longer resumes
            temperature=0.1,
            response_format={"type": "json_object"}  # Enforce JSON output
        )
        
        # Extract the JSON from the response
        response_text = response.choices[0].message.content.strip()
        
        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            # Return a minimal valid structure on parse failure
            return {
                "basics": {"name": "Parse Error", "summary": raw_text[:500]},
                "work_experience": [],
                "education": [],
                "skills": {},
                "projects": [],
                "certifications": [],
                "meta": {"years_experience": 0, "core_archetype": "Individual Contributor"},
                "_parse_error": str(e),
                "_raw_response": response_text[:2000]
            }
    
    def parse_pdf(self, pdf_bytes: bytes) -> dict:
        """Main entry point: PDF bytes -> Structured JSON"""
        raw_text = self.extract_text_from_pdf(pdf_bytes)
        
        if not raw_text.strip():
            raise ValueError("Could not extract any text from PDF. The PDF may be image-based or corrupted.")
        
        structured_data = self.parse_resume_to_json(raw_text)
        
        # Add the raw text for reference/debugging
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
