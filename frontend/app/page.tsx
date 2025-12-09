'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

// Type definitions for our resume schema
interface Accomplishment {
  raw_text: string;
  refined_components?: {
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

interface Project {
  name: string;
  description?: string;
  technologies?: string[];
  url?: string;
}

interface ResumeData {
  basics: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    summary?: string;
  };
  work_experience: WorkExperience[];
  education?: Education[];
  skills?: {
    languages?: string[];
    frameworks?: string[];
    tools?: string[];
    cloud?: string[];
    other?: string[];
  };
  projects?: Project[];
  meta?: {
    years_experience?: number;
    core_archetype?: string;
    primary_domain?: string;
  };
}

// Editable field component
interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  className?: string;
}

function EditableField({ value, onSave, multiline = false, className = '' }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  const handleClick = () => {
    setIsEditing(true);
    setEditValue(value);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`w-full p-1 border border-blue-400 rounded bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${className}`}
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`w-full p-1 border border-blue-400 rounded bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          />
        )}
      </div>
    );
  }

  return (
    <span
      onClick={handleClick}
      className={`cursor-pointer hover:bg-amber-100 hover:outline hover:outline-2 hover:outline-amber-400 rounded px-0.5 transition-all ${className}`}
      title="Click to edit"
    >
      {value || <span className="text-gray-400 italic">Click to add</span>}
    </span>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ResumeBuilder() {
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; content: string }[]>([
    { role: 'agent', content: "👋 Hello! I'm your Resume Interviewer.\n\nUpload your resume PDF and I'll parse it completely. Then click on any text in the preview to edit it directly!" }
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
      summary: "Upload your resume to see it rendered here. Click any text to edit!"
    },
    work_experience: []
  });

  // Update helpers
  const updateBasics = (field: keyof ResumeData['basics'], value: string) => {
    setResumeData(prev => ({
      ...prev,
      basics: { ...prev.basics, [field]: value }
    }));
  };

  const updateWorkExperience = (expIndex: number, field: keyof WorkExperience, value: string) => {
    setResumeData(prev => ({
      ...prev,
      work_experience: prev.work_experience.map((exp, i) => 
        i === expIndex ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const updateAccomplishment = (expIndex: number, accIndex: number, value: string) => {
    setResumeData(prev => ({
      ...prev,
      work_experience: prev.work_experience.map((exp, i) => 
        i === expIndex ? {
          ...exp,
          accomplishments: exp.accomplishments?.map((acc, j) =>
            j === accIndex ? { ...acc, raw_text: value } : acc
          )
        } : exp
      )
    }));
  };

  const updateEducation = (eduIndex: number, field: keyof Education, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education?.map((edu, i) =>
        i === eduIndex ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: "I understand! Click directly on the resume preview to edit any section. The changes will be reflected in real-time.\n\n💡 *Tip: The conversational refinement agent is coming soon!*" 
      }]);
    }, 800);

    setInput('');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: "⚠️ Please upload a PDF file." 
      }]);
      return;
    }

    setIsLoading(true);
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: `📤 Uploading **${file.name}**...` 
    }]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/resume/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      setProfileId(data.profile_id);
      
      // Update resume state with all parsed data
      setResumeData({
        basics: data.content.basics || { name: "Unknown", summary: "" },
        work_experience: data.content.work_experience || [],
        education: data.content.education || [],
        skills: data.content.skills || {},
        projects: data.content.projects || [],
        meta: data.content.meta || {}
      });

      // Build detailed success message
      const yearsExp = data.content.meta?.years_experience || 0;
      const archetype = data.content.meta?.core_archetype || "professional";
      const domain = data.content.meta?.primary_domain || "";
      const expCount = data.content.work_experience?.length || 0;
      const bulletCount = data.content.work_experience?.reduce((acc: number, exp: WorkExperience) => 
        acc + (exp.accomplishments?.length || 0), 0) || 0;
      const skillCount = Object.values(data.content.skills || {}).flat().length;
      const eduCount = data.content.education?.length || 0;
      const projectCount = data.content.projects?.length || 0;
      
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: `✅ **Resume parsed successfully!**

📊 **Complete Analysis:**
• **Name**: ${data.content.basics?.name || 'Not detected'}
• **Experience**: ~${yearsExp} years (${archetype})${domain ? ` - ${domain}` : ''}
• **Positions**: ${expCount} roles with ${bulletCount} accomplishments
• **Skills**: ${skillCount} skills detected
• **Education**: ${eduCount} entries
${projectCount > 0 ? `• **Projects**: ${projectCount} projects\n` : ''}
✏️ **Click on any text in the preview to edit it directly!**

The resume is now fully editable. What would you like to improve?`
      }]);

      setActiveSection('experience');
      setTimeout(() => setActiveSection(null), 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: `❌ **Error**: ${error instanceof Error ? error.message : 'Failed to parse resume'}

**Troubleshooting:**
1. Backend running? \`cd backend && uvicorn app.main:app --reload\`
2. API key set? Check \`backend/.env\` has valid \`OPENAI_API_KEY\`
3. PDF has text? (Not scanned/image-based)`
      }]);
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  // Render all skills
  const renderSkills = () => {
    if (!resumeData.skills) return null;
    
    const skillCategories = [
      { key: 'languages', label: 'Languages', items: resumeData.skills.languages },
      { key: 'frameworks', label: 'Frameworks', items: resumeData.skills.frameworks },
      { key: 'tools', label: 'Tools', items: resumeData.skills.tools },
      { key: 'cloud', label: 'Cloud', items: resumeData.skills.cloud },
      { key: 'other', label: 'Other', items: resumeData.skills.other },
    ].filter(cat => cat.items && cat.items.length > 0);
    
    if (skillCategories.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 mb-3 border-b-2 border-slate-200 pb-1">
          Skills
        </h2>
        <div className="space-y-2">
          {skillCategories.map(cat => (
            <div key={cat.key} className="flex flex-wrap gap-1 items-center">
              <span className="text-xs font-semibold text-slate-500 w-20">{cat.label}:</span>
              {cat.items?.map((skill, i) => (
                <span 
                  key={i} 
                  className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded border border-slate-200 hover:bg-amber-100 hover:border-amber-300 cursor-pointer transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 gap-4">
      {/* Left: Chat Interface */}
      <Card className="w-2/5 flex flex-col h-full shadow-xl">
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
              {isLoading ? '⏳ Parsing...' : '📄 Upload PDF'}
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
                    className={`max-w-[90%] p-4 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed ${
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
                    <span className="text-sm">Parsing your complete resume...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-2 border-t">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your resume or request changes..."
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

      {/* Right: Live Editable Preview */}
      <Card className="w-3/5 h-full flex flex-col bg-slate-50 shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center border-b bg-white">
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            Live Preview
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              ✏️ Click to edit
            </span>
          </CardTitle>
          {resumeData.meta?.years_experience !== undefined && (
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {resumeData.meta.years_experience}y · {resumeData.meta.core_archetype}
              {resumeData.meta.primary_domain && ` · ${resumeData.meta.primary_domain}`}
            </span>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto p-6">
          {/* Resume Document */}
          <div className="bg-white max-w-[800px] mx-auto shadow-lg p-8 text-sm text-slate-800 font-serif border border-slate-200 min-h-full">

            {/* Header */}
            <div className="border-b-2 border-slate-300 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                <EditableField 
                  value={resumeData.basics.name} 
                  onSave={(v) => updateBasics('name', v)}
                  className="text-2xl font-bold"
                />
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-slate-600 text-xs">
                {resumeData.basics.email && (
                  <span className="flex items-center gap-1">
                    ✉️ <EditableField value={resumeData.basics.email} onSave={(v) => updateBasics('email', v)} />
                  </span>
                )}
                {resumeData.basics.phone && (
                  <span className="flex items-center gap-1">
                    📞 <EditableField value={resumeData.basics.phone} onSave={(v) => updateBasics('phone', v)} />
                  </span>
                )}
                {resumeData.basics.location && (
                  <span className="flex items-center gap-1">
                    📍 <EditableField value={resumeData.basics.location} onSave={(v) => updateBasics('location', v)} />
                  </span>
                )}
                {resumeData.basics.linkedin && (
                  <span className="flex items-center gap-1">
                    🔗 LinkedIn
                  </span>
                )}
                {resumeData.basics.github && (
                  <span className="flex items-center gap-1">
                    💻 GitHub
                  </span>
                )}
              </div>
              {resumeData.basics.summary && (
                <p className="mt-4 text-slate-700 leading-relaxed text-sm">
                  <EditableField 
                    value={resumeData.basics.summary} 
                    onSave={(v) => updateBasics('summary', v)}
                    multiline
                  />
                </p>
              )}
            </div>

            {/* Experience Section */}
            {resumeData.work_experience.length > 0 && (
              <div 
                className={`mb-6 transition-all duration-500 rounded-lg ${
                  activeSection === 'experience' 
                    ? 'ring-2 ring-amber-400 ring-offset-4 bg-amber-50/30 p-4 -mx-4' 
                    : ''
                }`}
              >
                <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 mb-4 border-b-2 border-slate-200 pb-1">
                  Experience
                </h2>
                <div className="space-y-5">
                  {resumeData.work_experience.map((exp, i) => (
                    <div key={i} className="group">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-base text-slate-900">
                          <EditableField 
                            value={exp.company} 
                            onSave={(v) => updateWorkExperience(i, 'company', v)}
                            className="font-bold"
                          />
                        </h3>
                        <span className="text-slate-500 text-xs whitespace-nowrap ml-2">
                          <EditableField 
                            value={exp.dates || ''} 
                            onSave={(v) => updateWorkExperience(i, 'dates', v)}
                          />
                        </span>
                      </div>
                      <div className="font-semibold text-slate-600 text-sm mb-2">
                        <EditableField 
                          value={exp.role} 
                          onSave={(v) => updateWorkExperience(i, 'role', v)}
                        />
                        {exp.location && (
                          <span className="font-normal text-slate-400">
                            {' · '}
                            <EditableField 
                              value={exp.location} 
                              onSave={(v) => updateWorkExperience(i, 'location', v)}
                            />
                          </span>
                        )}
                      </div>
                      {exp.accomplishments && exp.accomplishments.length > 0 && (
                        <ul className="list-disc list-outside ml-4 space-y-1.5">
                          {exp.accomplishments.map((acc, j) => (
                            <li key={j} className="text-slate-700 leading-relaxed text-sm pl-1">
                              <EditableField 
                                value={acc.raw_text} 
                                onSave={(v) => updateAccomplishment(i, j, v)}
                                multiline
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Section */}
            {renderSkills()}

            {/* Projects Section */}
            {resumeData.projects && resumeData.projects.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 mb-3 border-b-2 border-slate-200 pb-1">
                  Projects
                </h2>
                <div className="space-y-3">
                  {resumeData.projects.map((project, i) => (
                    <div key={i}>
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-bold text-slate-900">{project.name}</h3>
                        {project.technologies && (
                          <span className="text-xs text-slate-500">
                            ({project.technologies.join(', ')})
                          </span>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-slate-700 text-sm">{project.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                        <h3 className="font-bold text-slate-900">
                          <EditableField 
                            value={edu.institution} 
                            onSave={(v) => updateEducation(i, 'institution', v)}
                          />
                        </h3>
                        <div className="text-slate-600 text-sm">
                          <EditableField 
                            value={edu.degree} 
                            onSave={(v) => updateEducation(i, 'degree', v)}
                          />
                          {edu.field && (
                            <>
                              {' in '}
                              <EditableField 
                                value={edu.field} 
                                onSave={(v) => updateEducation(i, 'field', v)}
                              />
                            </>
                          )}
                          {edu.gpa && <span className="text-slate-400"> · GPA: {edu.gpa}</span>}
                        </div>
                      </div>
                      <span className="text-slate-500 text-xs whitespace-nowrap ml-2">
                        <EditableField 
                          value={edu.dates || ''} 
                          onSave={(v) => updateEducation(i, 'dates', v)}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {resumeData.work_experience.length === 0 && !resumeData.education?.length && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <span className="text-5xl mb-4">📄</span>
                <p className="text-center text-lg">
                  Upload your resume PDF to see it<br />beautifully rendered and editable
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
