'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

// Type definitions for our resume schema
interface Accomplishment {
  raw_text: string;
  refined_components?: {
    problem?: string;
    action?: string;
    impact?: string;
  };
  tags?: string[];
}

interface WorkExperience {
  company: string;
  role: string;
  dates?: string;
  location?: string;
  description?: string;
  accomplishments?: Accomplishment[];
}

interface Education {
  institution: string;
  degree: string;
  field?: string;
  dates?: string;
  gpa?: string;
  highlights?: string[];
}

interface ResumeData {
  basics: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    summary?: string;
  };
  work_experience: WorkExperience[];
  education?: Education[];
  skills?: {
    technical?: string[];
    languages?: string[];
    tools?: string[];
    frameworks?: string[];
    other?: string[];
  };
  meta?: {
    years_experience?: number;
    core_archetype?: string;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ResumeBuilder() {
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; content: string }[]>([
    { role: 'agent', content: "👋 Hello! I'm your Resume Interviewer.\n\nUpload your resume PDF and I'll analyze it with AI to extract and structure your experience. Let's build something great!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Resume State
  const [resumeData, setResumeData] = useState<ResumeData>({
    basics: {
      name: "Your Name",
      email: "email@example.com",
      summary: "Upload your resume to see it rendered here..."
    },
    work_experience: []
  });

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);

    // TODO: Connect to Interviewer LLM agent for conversational refinement
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: "I see. Tell me more about that experience.\n\n💡 *Tip: The conversational AI agent is coming in the next sprint. For now, upload a PDF to see the parsing in action!*" 
      }]);
    }, 800);

    setInput('');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: "⚠️ Please upload a PDF file. Other formats are not supported yet." 
      }]);
      return;
    }

    setIsLoading(true);
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: `📤 Uploading **${file.name}**...` 
    }]);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Call the backend API
      const response = await fetch(`${API_BASE}/api/resume/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Store profile ID for future operations
      setProfileId(data.profile_id);
      
      // Update resume state with parsed data
      setResumeData({
        basics: data.content.basics || { name: "Unknown", summary: "" },
        work_experience: data.content.work_experience || [],
        education: data.content.education || [],
        skills: data.content.skills || {},
        meta: data.content.meta || {}
      });

      // Success message with insights
      const yearsExp = data.content.meta?.years_experience || 0;
      const archetype = data.content.meta?.core_archetype || "professional";
      const expCount = data.content.work_experience?.length || 0;
      const skillCount = Object.values(data.content.skills || {}).flat().length;
      
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: `✅ **Resume parsed successfully!**

📊 **Analysis Summary:**
• **Name**: ${data.content.basics?.name || 'Not detected'}
• **Experience**: ~${yearsExp} years
• **Archetype**: ${archetype}
• **Positions Found**: ${expCount} roles
• **Skills Detected**: ${skillCount} skills

${expCount > 0 ? `\n🔍 I see you worked at **${data.content.work_experience[0]?.company}** as a **${data.content.work_experience[0]?.role}**.\n` : ''}
${yearsExp > 7 
  ? "Given your seniority, I'll focus on **strategic impact** and **leadership** aspects when we refine your bullets." 
  : yearsExp > 3 
    ? "At your level, we should emphasize **ownership** and **measurable impact** in your accomplishments."
    : "Let's highlight your **technical skills** and **concrete achievements** to stand out."}

👉 **Next step**: Review the preview on the right. What would you like to improve first?`
      }]);

      // Highlight the experience section briefly
      setActiveSection('experience');
      setTimeout(() => setActiveSection(null), 3000);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse resume';
      
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: `❌ **Error**: ${errorMessage}

**Troubleshooting:**
1. Make sure the backend is running:
   \`\`\`
   cd backend && uvicorn app.main:app --reload
   \`\`\`
2. Check your \`.env\` file has a valid \`ANTHROPIC_API_KEY\`
3. Ensure the PDF contains selectable text (not scanned images)

Need help? Check the terminal for detailed error logs.`
      }]);
    } finally {
      setIsLoading(false);
      // Reset the input so the same file can be uploaded again
      e.target.value = '';
    }
  };

  // Helper to render all skills as tags
  const renderSkills = () => {
    if (!resumeData.skills) return null;
    
    const allSkills = [
      ...(resumeData.skills.technical || []),
      ...(resumeData.skills.tools || []),
      ...(resumeData.skills.frameworks || []),
      ...(resumeData.skills.other || []),
    ].slice(0, 12); // Limit to 12 skills for visual cleanliness
    
    if (allSkills.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 mb-3 border-b-2 border-slate-200 pb-1">
          Skills
        </h2>
        <div className="flex flex-wrap gap-2">
          {allSkills.map((skill, i) => (
            <span 
              key={i} 
              className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded border border-slate-200"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 gap-4">
      {/* Left: Chat Interface */}
      <Card className="w-1/2 flex flex-col h-full shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center bg-white border-b px-6 py-4">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span>Resume Interviewer</span>
            {profileId && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full ml-2">
                ✓ Saved
              </span>
            )}
          </CardTitle>
          <div className="relative">
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              accept=".pdf"
              onChange={handleUpload}
              disabled={isLoading}
            />
            <Button 
              variant="outline" 
              size="sm" 
              disabled={isLoading}
              className={isLoading ? 'animate-pulse' : ''}
            >
              {isLoading ? '⏳ Parsing...' : '📄 Upload Resume'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden pt-4">
          <ScrollArea className="flex-1 pr-4">
            <div className="flex flex-col gap-4">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-4 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-slate-900 text-white rounded-br-md' 
                        : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-600 p-4 rounded-2xl rounded-bl-md shadow-sm border border-slate-100 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-sm">Analyzing your resume with AI...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-2 border-t">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about your resume or request improvements..."
              className="resize-none min-h-[60px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button 
              onClick={handleSend} 
              className="h-auto px-6"
              disabled={!input.trim()}
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Right: Live Preview (Visual Resume) */}
      <Card className="w-1/2 h-full flex flex-col bg-slate-50 shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center border-b bg-white">
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            Live Preview
          </CardTitle>
          {resumeData.meta?.years_experience !== undefined && (
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {resumeData.meta.years_experience}y exp · {resumeData.meta.core_archetype}
            </span>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto p-6 flex justify-center">
          {/* A4 Paper Simulation */}
          <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg p-8 md:p-12 text-sm text-slate-800 font-serif border border-slate-200">

            {/* Header */}
            <div className="border-b-2 border-slate-300 pb-4 mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                {resumeData.basics.name}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-slate-600 text-xs">
                {resumeData.basics.email && (
                  <span className="flex items-center gap-1">
                    <span>✉️</span> {resumeData.basics.email}
                  </span>
                )}
                {resumeData.basics.phone && (
                  <span className="flex items-center gap-1">
                    <span>📞</span> {resumeData.basics.phone}
                  </span>
                )}
                {resumeData.basics.location && (
                  <span className="flex items-center gap-1">
                    <span>📍</span> {resumeData.basics.location}
                  </span>
                )}
                {resumeData.basics.linkedin && (
                  <span className="flex items-center gap-1">
                    <span>🔗</span> LinkedIn
                  </span>
                )}
              </div>
              {resumeData.basics.summary && (
                <p className="mt-4 text-slate-700 leading-relaxed text-sm">
                  {resumeData.basics.summary}
                </p>
              )}
            </div>

            {/* Experience Section */}
            {resumeData.work_experience.length > 0 && (
              <div 
                className={`mb-6 transition-all duration-500 rounded-lg ${
                  activeSection === 'experience' 
                    ? 'ring-2 ring-amber-400 ring-offset-4 bg-amber-50/50 p-4 -m-4' 
                    : ''
                }`}
              >
                <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 mb-4 border-b-2 border-slate-200 pb-1">
                  Experience
                </h2>
                <div className="flex flex-col gap-5">
                  {resumeData.work_experience.map((exp, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-base text-slate-900">{exp.company}</h3>
                        <span className="text-slate-500 text-xs whitespace-nowrap ml-2">
                          {exp.dates || 'Present'}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-600 text-sm mb-2">
                        {exp.role}
                        {exp.location && <span className="font-normal text-slate-400"> · {exp.location}</span>}
                      </div>
                      {exp.accomplishments && exp.accomplishments.length > 0 && (
                        <ul className="list-disc list-outside ml-4 space-y-1.5">
                          {exp.accomplishments.map((acc, j) => (
                            <li key={j} className="text-slate-700 leading-relaxed text-sm pl-1">
                              {acc.raw_text}
                            </li>
                          ))}
                        </ul>
                      )}
                      {exp.description && !exp.accomplishments?.length && (
                        <p className="text-slate-700 text-sm">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Section */}
            {renderSkills()}

            {/* Education Section */}
            {resumeData.education && resumeData.education.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 mb-3 border-b-2 border-slate-200 pb-1">
                  Education
                </h2>
                <div className="space-y-3">
                  {resumeData.education.map((edu, i) => (
                    <div key={i} className="flex justify-between items-baseline">
                      <div>
                        <h3 className="font-bold text-slate-900">{edu.institution}</h3>
                        <div className="text-slate-600 text-sm">
                          {edu.degree}
                          {edu.field && ` in ${edu.field}`}
                          {edu.gpa && <span className="text-slate-400"> · GPA: {edu.gpa}</span>}
                        </div>
                      </div>
                      <span className="text-slate-500 text-xs whitespace-nowrap ml-2">
                        {edu.dates}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {resumeData.work_experience.length === 0 && !resumeData.education?.length && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <span className="text-4xl mb-4">📄</span>
                <p className="text-center">
                  Upload your resume PDF to see it<br />beautifully rendered here
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
