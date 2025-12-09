'use client';

import { useState, useRef, useEffect } from 'react';
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

// Pending critique context for refinement
interface PendingCritique {
  expIndex: number;
  accIndex: number;
  originalText: string;
  question: string;
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
    { role: 'agent', content: "👋 Hello! I'm your Resume Coach powered by AI.\n\n**How to use:**\n1. 📄 Upload your resume PDF\n2. ✨ Click \"Critique\" on any bullet to get STAR analysis\n3. 💬 Answer my questions to improve your bullets\n4. ✏️ Click any text to edit directly\n\nLet's make your resume stand out!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [pendingCritique, setPendingCritique] = useState<PendingCritique | null>(null);
  const [activeBullet, setActiveBullet] = useState<{expIndex: number; accIndex: number} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  // Critique a bullet point using DSPy Agent
  const handleCritique = async (expIndex: number, accIndex: number, bulletText: string, company: string) => {
    setIsCritiquing(true);
    setActiveBullet({ expIndex, accIndex });
    
    const domain = resumeData.meta?.primary_domain || "General";
    const yearsExp = resumeData.meta?.years_experience || 5;

    setMessages(prev => [...prev, { 
      role: 'user', 
      content: `✨ **Critique this bullet** from ${company}:\n\n"${bulletText}"` 
    }]);

    try {
      const response = await fetch(`${API_BASE}/api/guide/critique`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullet_text: bulletText,
          domain: domain,
          years_experience: yearsExp
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || 'Critique failed');
      }

      const data = await response.json();
      
      // Store pending critique for refinement
      setPendingCritique({
        expIndex,
        accIndex,
        originalText: bulletText,
        question: data.question
      });

      // Format the critique response
      const missingComponents = Array.isArray(data.missing_components) 
        ? data.missing_components.join(', ') 
        : data.missing_components;

      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: `🔍 **STAR Analysis**

**Missing Components:** ${missingComponents || 'None identified'}

**Critique:** ${data.critique}

---

💭 **To improve this bullet, please answer:**

${data.question}

_Type your answer below and I'll rewrite the bullet for you._`
      }]);

    } catch (error) {
      console.error('Critique error:', error);
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: `❌ **Error**: ${error instanceof Error ? error.message : 'Failed to critique'}

**Troubleshooting:**
• Is the backend running? \`uvicorn app.main:app --reload\`
• Is \`dspy-ai\` installed? \`pip install dspy-ai\`
• Check your \`OPENAI_API_KEY\` in \`.env\``
      }]);
      setPendingCritique(null);
    } finally {
      setIsCritiquing(false);
    }
  };

  // Handle user's answer to refine the bullet
  const handleRefine = async (answer: string) => {
    if (!pendingCritique) return;

    setIsLoading(true);
    const domain = resumeData.meta?.primary_domain || "General";

    try {
      const response = await fetch(`${API_BASE}/api/guide/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_text: pendingCritique.originalText,
          context_answer: answer,
          domain: domain
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || 'Refine failed');
      }

      const data = await response.json();
      
      // Update the bullet in resume
      updateAccomplishment(
        pendingCritique.expIndex, 
        pendingCritique.accIndex, 
        data.refined_text
      );

      // Highlight the updated section
      setActiveSection('experience');
      setTimeout(() => setActiveSection(null), 3000);

      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: `✅ **Bullet Refined!**

**Before:**
"${pendingCritique.originalText}"

**After:**
"${data.refined_text}"

---

**Why it's better:** ${data.reasoning}

_The bullet has been updated in your resume. Click another bullet to continue improving!_`
      }]);

      setPendingCritique(null);
      setActiveBullet(null);

    } catch (error) {
      console.error('Refine error:', error);
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: `❌ **Error refining**: ${error instanceof Error ? error.message : 'Failed to refine'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    // If we have a pending critique, treat this as the answer
    if (pendingCritique) {
      await handleRefine(userMessage);
      return;
    }

    // Otherwise, provide helpful guidance
    setIsLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: `I understand! Here's how I can help:

🎯 **To improve a specific bullet:**
Click the "✨ Critique" button next to any bullet point in your resume preview.

✏️ **To edit directly:**
Click on any text in the resume to edit it inline.

📄 **To start fresh:**
Upload a new resume PDF using the button above.

What would you like to do?`
      }]);
      setIsLoading(false);
    }, 500);
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
    setPendingCritique(null);
    setActiveBullet(null);
    
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
      
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: `✅ **Resume parsed successfully!**

📊 **Profile:** ${data.content.basics?.name || 'Unknown'}
⏱️ **Experience:** ~${yearsExp} years (${archetype})${domain ? ` in ${domain}` : ''}
📝 **Found:** ${expCount} roles with **${bulletCount} bullet points**

---

🎯 **Next Step:** Click the **"✨ Critique"** button next to any bullet point to get AI-powered feedback using the STAR methodology.

I'll analyze what's missing and ask targeted questions to help you write stronger bullets!`
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
                  className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded border border-slate-200"
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
            <span>Resume Coach</span>
            {pendingCritique && (
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full ml-2 animate-pulse">
                Awaiting answer...
              </span>
            )}
            {profileId && !pendingCritique && (
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
              disabled={isLoading || isCritiquing}
            />
            <Button 
              variant="outline" 
              size="sm" 
              disabled={isLoading || isCritiquing}
              className={isLoading ? 'animate-pulse' : ''}
            >
              {isLoading ? '⏳ Processing...' : '📄 Upload PDF'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden pt-4">
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
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
              {(isLoading || isCritiquing) && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-600 p-4 rounded-2xl rounded-bl-md shadow-sm border border-slate-100 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-sm">{isCritiquing ? 'Analyzing with STAR methodology...' : 'Processing...'}</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-2 border-t">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={pendingCritique 
                ? "Type your answer to improve the bullet..." 
                : "Ask about your resume or click Critique on a bullet..."}
              className={`resize-none min-h-[60px] ${pendingCritique ? 'border-purple-300 focus:border-purple-500' : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button 
              onClick={handleSend} 
              className={`h-auto px-6 ${pendingCritique ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
              disabled={!input.trim() || isLoading || isCritiquing}
            >
              {pendingCritique ? 'Refine' : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Right: Live Editable Preview */}
      <Card className="w-3/5 h-full flex flex-col bg-slate-50 shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center border-b bg-white">
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            Resume Preview
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
                  <span className="flex items-center gap-1">🔗 LinkedIn</span>
                )}
                {resumeData.basics.github && (
                  <span className="flex items-center gap-1">💻 GitHub</span>
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
                        <ul className="space-y-2">
                          {exp.accomplishments.map((acc, j) => {
                            const isActive = activeBullet?.expIndex === i && activeBullet?.accIndex === j;
                            return (
                              <li 
                                key={j} 
                                className={`flex items-start gap-2 group/bullet p-2 -ml-2 rounded-lg transition-all ${
                                  isActive ? 'bg-purple-50 ring-2 ring-purple-300' : 'hover:bg-slate-50'
                                }`}
                              >
                                <span className="text-slate-400 mt-0.5">•</span>
                                <div className="flex-1 text-slate-700 leading-relaxed text-sm">
                                  <EditableField 
                                    value={acc.raw_text} 
                                    onSave={(v) => updateAccomplishment(i, j, v)}
                                    multiline
                                  />
                                </div>
                                <button
                                  onClick={() => handleCritique(i, j, acc.raw_text, exp.company)}
                                  disabled={isCritiquing || isLoading}
                                  className={`opacity-0 group-hover/bullet:opacity-100 transition-opacity shrink-0 px-2 py-1 text-xs rounded-full font-medium ${
                                    isActive 
                                      ? 'bg-purple-600 text-white opacity-100' 
                                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                  } disabled:opacity-50`}
                                  title="Get AI feedback on this bullet"
                                >
                                  ✨ Critique
                                </button>
                              </li>
                            );
                          })}
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
                <p className="text-center text-sm mt-2">
                  Then click <span className="text-purple-500 font-medium">✨ Critique</span> on any bullet<br />
                  to get AI-powered feedback!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
