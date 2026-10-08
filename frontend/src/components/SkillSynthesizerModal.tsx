import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Plus,
  Trash2,
  Play,
  Check,
  Code,
  BookOpen,
  X
} from 'lucide-react';

export interface UserSkill {
  id: string;
  name: string;
  triggerPhrase: string;
  description: string;
  systemPrompt: string;
  createdAt: string;
}

export const SkillSynthesizerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onApplySkill?: (skill: UserSkill) => void;
}> = ({ isOpen, onClose, onApplySkill }) => {
  const [skills, setSkills] = useState<UserSkill[]>(() => {
    try {
      const saved = localStorage.getItem('litbuddy_user_skills');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'skill-1',
        name: 'Literature Gap Auditor',
        triggerPhrase: 'audit literature gaps',
        description: 'Performs rigorous verification against peer-reviewed claims to identify experimental and data gaps.',
        systemPrompt: 'You are an aggressive literature review auditor. Analyze all grounded papers and pinpoint exactly what empirical evaluations, control groups, or baseline architectures are missing.',
        createdAt: 'Default'
      },
      {
        id: 'skill-2',
        name: 'Mathematical Formalizer',
        triggerPhrase: 'formalize model equations',
        description: 'Transforms prose descriptions of neural or statistical models into rigorous LaTeX equations and objective functions.',
        systemPrompt: 'You are a theoretical computer scientist. Convert the methodologies described in the papers into formal mathematical equations, probability models, or optimization objectives formatted with KaTeX.',
        createdAt: 'Default'
      }
    ];
  });

  const [newName, setNewName] = useState('');
  const [newTrigger, setNewTrigger] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('litbuddy_user_skills', JSON.stringify(skills));
    } catch {}
  }, [skills]);

  if (!isOpen) return null;

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrompt.trim()) return;

    const skill: UserSkill = {
      id: `skill-${Date.now()}`,
      name: newName.trim(),
      triggerPhrase: newTrigger.trim() || newName.toLowerCase().trim(),
      description: newDesc.trim() || 'Custom user research skill',
      systemPrompt: newPrompt.trim(),
      createdAt: new Date().toLocaleDateString()
    };

    setSkills([skill, ...skills]);
    setNewName('');
    setNewTrigger('');
    setNewDesc('');
    setNewPrompt('');
    setIsCreating(false);
  };

  const handleDeleteSkill = (id: string) => {
    setSkills(skills.filter(s => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl antigravity-glass p-6 text-zinc-200 border border-white/10 shadow-2xl relative max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <Sparkles className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100">AI Skills &amp; Autonomous Agents Hub</h3>
              <p className="text-[11px] text-zinc-400">Synthesize prompts into persistent workflows and reusable research agents</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {isCreating ? (
            <form onSubmit={handleCreateSkill} className="space-y-3 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <div className="font-semibold text-zinc-200 text-xs">Synthesize New AI Skill / Agent</div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Skill Name:</label>
                <input
                  type="text"
                  placeholder="e.g. SOTA Benchmark Extractor"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Trigger Phrase (Shortcut):</label>
                <input
                  type="text"
                  placeholder="e.g. extract sota benchmarks"
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Description:</label>
                <input
                  type="text"
                  placeholder="What does this workflow automate?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Agent System Prompt / Instructions:</label>
                <textarea
                  rows={4}
                  placeholder="Define exact extraction criteria, schema guidelines, or formatting rules..."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-hidden font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg font-semibold transition"
                >
                  Save Skill
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
                  Configured Research Skills ({skills.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg font-medium text-xs flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Synthesize New Skill</span>
                </button>
              </div>

              <div className="space-y-2">
                {skills.map((skill) => (
                  <div key={skill.id} className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-100 text-xs">{skill.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-zinc-400">
                          "{skill.triggerPhrase}"
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-400 leading-snug">{skill.description}</p>
                      <div className="mt-2 p-2 rounded bg-zinc-900/80 border border-zinc-850 font-mono text-[10px] text-zinc-500 line-clamp-2">
                        {skill.systemPrompt}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {onApplySkill && (
                        <button
                          type="button"
                          onClick={() => {
                            onApplySkill(skill);
                            onClose();
                          }}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition"
                          title="Execute Skill in Active Research Inquiry"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {skill.createdAt !== 'Default' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="p-1.5 hover:bg-red-950/50 text-zinc-500 hover:text-red-400 rounded-lg transition"
                          title="Delete Skill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
