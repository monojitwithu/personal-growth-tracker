import { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ExternalLink, 
  FolderGit2, 
  Globe, 
  Rocket, 
  Save 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/Progress';
import { useToast } from '../ui/Toast';
import type { CapstoneProject } from '../../types';

export function CapstoneSection() {
  const { state, toggleDeliverable, updateCapstoneLinks } = useApp();
  const { toast } = useToast();

  // Links editing state by capstone id
  const [editingLinks, setEditingLinks] = useState<{
    [id: string]: { repoUrl: string; liveUrl: string; isEditing: boolean };
  }>({});

  const startEditLinks = (cap: CapstoneProject) => {
    setEditingLinks((prev) => ({
      ...prev,
      [cap.id]: {
        repoUrl: cap.repoUrl ?? '',
        liveUrl: cap.liveUrl ?? '',
        isEditing: true,
      },
    }));
  };

  const saveLinks = (capId: string) => {
    const current = editingLinks[capId];
    if (!current) return;

    updateCapstoneLinks(capId, {
      repoUrl: current.repoUrl.trim() || undefined,
      liveUrl: current.liveUrl.trim() || undefined,
    });

    setEditingLinks((prev) => ({
      ...prev,
      [capId]: { ...current, isEditing: false },
    }));

    toast({
      tone: 'success',
      title: 'Links Updated',
      description: 'Repository and live deployment URLs have been saved.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-growth-500/15 text-growth-400 border border-growth-400/30">
            <Rocket className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Production Capstone Portfolio
            </h2>
            <p className="text-xs text-slate-400">
              Two end-to-end architectures demonstrating senior technical ownership &amp; high-scale viability
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {state.capstones.map((cap, idx) => {
          const completedCount = cap.deliverables.filter((d) => d.done).length;
          const totalCount = cap.deliverables.length;
          const percent = Math.round((completedCount / totalCount) * 100);
          const linkState = editingLinks[cap.id] ?? {
            repoUrl: cap.repoUrl ?? '',
            liveUrl: cap.liveUrl ?? '',
            isEditing: false,
          };

          return (
            <Card
              key={cap.id}
              className="p-6 flex flex-col justify-between border-white/10 hover:border-white/20 transition-all"
              glow={idx === 0 ? 'tech' : 'growth'}
            >
              <div className="space-y-4">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-tech-400 bg-tech-500/10 px-2.5 py-0.5 rounded-lg border border-tech-500/20">
                      CAPSTONE {idx + 1}
                    </span>
                    <Badge tone={percent === 100 ? 'emerald' : percent > 0 ? 'tech' : 'slate'} dot>
                      {percent === 100 ? 'Ready for Showcase' : `${percent}% Complete`}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-white leading-snug">
                    {cap.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {cap.description}
                  </p>
                </div>

                {/* Tech Stack Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {cap.stack.map((item, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[11px] font-mono text-slate-300 border border-white/10"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>Deliverables Acceptance</span>
                    <span className="font-bold text-white">{completedCount}/{totalCount} completed</span>
                  </div>
                  <ProgressBar value={completedCount / totalCount} label={`${cap.title} completion progress`} size="sm" />
                </div>

                {/* Deliverables Checklist */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                    Core Technical Deliverables
                  </span>
                  <div className="space-y-1.5">
                    {cap.deliverables.map((del) => (
                      <button
                        key={del.id}
                        type="button"
                        onClick={() => toggleDeliverable(cap.id, del.id)}
                        className={`w-full flex items-start text-left gap-2.5 p-2 rounded-xl border text-xs transition ${
                          del.done
                            ? 'bg-growth-500/[0.08] border-growth-400/30 text-slate-200'
                            : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/15'
                        }`}
                      >
                        {del.done ? (
                          <CheckCircle2 className="w-4 h-4 text-growth-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                        )}
                        <span className={del.done ? 'line-through text-slate-400' : 'text-slate-200'}>
                          {del.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Repo and Live URL inputs / links */}
              <div className="mt-6 pt-4 border-t border-white/[0.08] space-y-3">
                {linkState.isEditing ? (
                  <div className="space-y-2 bg-ink-950/70 p-3 rounded-xl border border-white/10">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">GitHub Repo URL</label>
                      <input
                        type="url"
                        value={linkState.repoUrl}
                        onChange={(e) =>
                          setEditingLinks((prev) => ({
                            ...prev,
                            [cap.id]: { ...linkState, repoUrl: e.target.value },
                          }))
                        }
                        placeholder="https://github.com/..."
                        className="field text-xs font-mono py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Live Demo / Spec URL</label>
                      <input
                        type="url"
                        value={linkState.liveUrl}
                        onChange={(e) =>
                          setEditingLinks((prev) => ({
                            ...prev,
                            [cap.id]: { ...linkState, liveUrl: e.target.value },
                          }))
                        }
                        placeholder="https://..."
                        className="field text-xs font-mono py-1.5"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditingLinks((prev) => ({
                            ...prev,
                            [cap.id]: { ...linkState, isEditing: false },
                          }))
                        }
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => saveLinks(cap.id)}
                        className="text-xs"
                        leftIcon={<Save className="w-3.5 h-3.5" />}
                      >
                        Save Links
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {cap.repoUrl ? (
                        <a
                          href={cap.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-tech-300 hover:text-white transition truncate font-mono"
                        >
                          <FolderGit2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">GitHub Repo</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-500 font-mono flex items-center gap-1">
                          <FolderGit2 className="w-3.5 h-3.5" /> No Repo Set
                        </span>
                      )}

                      <span>•</span>

                      {cap.liveUrl ? (
                        <a
                          href={cap.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-growth-300 hover:text-white transition truncate font-mono"
                        >
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Live Deployment</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-500 font-mono flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" /> No Live Demo Set
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => startEditLinks(cap)}
                      className="text-slate-400 hover:text-white text-xs underline underline-offset-4 shrink-0"
                    >
                      Edit Links
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
