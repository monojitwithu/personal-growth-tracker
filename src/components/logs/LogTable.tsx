import { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Pencil, 
  Calendar, 
  Clock, 
  GitCommitHorizontal, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../ui/Card';
import { ModeBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { DataManagement } from './DataManagement';
import { totalHours } from '../../lib/stats';
import { formatShortDate } from '../../lib/date';
import { FOCUS_MODES, LOG_STATUSES } from '../../lib/persistence';
import type { DailyLog, FocusMode, LogStatus } from '../../types';

export function LogTable() {
  const { state, updateLog, deleteLog, restoreLog } = useApp();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Edit log modal state
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return state.logs
      .filter((log) => {
        // Week filter
        if (selectedWeek !== 'all' && log.weekNumber !== Number(selectedWeek)) {
          return false;
        }
        // Mode filter
        if (selectedMode !== 'all' && log.mode !== selectedMode) {
          return false;
        }
        // Status filter
        if (selectedStatus !== 'all' && log.status !== selectedStatus) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            log.taskTitle.toLowerCase().includes(q) ||
            log.notesAndBlockers.toLowerCase().includes(q) ||
            log.outputArtifact.toLowerCase().includes(q) ||
            log.date.includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.logs, selectedWeek, selectedMode, selectedStatus, searchQuery]);

  const totalLoggedHours = useMemo(() => totalHours(filteredLogs), [filteredLogs]);

  // Handle Delete with Undo Toast
  const handleDelete = (log: DailyLog) => {
    const removed = deleteLog(log.id);
    if (removed) {
      toast({
        tone: 'info',
        title: 'Log Removed',
        description: `Deleted "${log.taskTitle}"`,
        action: {
          label: 'Undo',
          onClick: () => restoreLog(removed),
        },
      });
    }
  };

  // Handle Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    updateLog(editingLog.id, {
      taskTitle: editingLog.taskTitle,
      mode: editingLog.mode,
      date: editingLog.date,
      durationHours: Number(editingLog.durationHours),
      outputArtifact: editingLog.outputArtifact,
      notesAndBlockers: editingLog.notesAndBlockers,
      status: editingLog.status,
    });

    toast({
      tone: 'success',
      title: 'Log Updated',
      description: 'Your changes have been saved to local storage.',
    });
    setEditingLog(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* 1. Top Header Banner with Data Management */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass rounded-3xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-tech-500/15 text-tech-400 border border-tech-400/30">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Daily Practice Log History
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 pl-11">
            Complete audit trail of engineering deep-work sessions, artifacts, and problem-solving notes
          </p>
        </div>

        <DataManagement />
      </div>

      {/* 2. Filter & Search Controls */}
      <Card className="p-4 sm:p-5" glow="tech">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, commits, learnings..."
              className="field pl-9 text-xs"
              id="search-logs-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Week Filter */}
          <div>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="field text-xs cursor-pointer"
              aria-label="Filter by week"
            >
              <option value="all">All Weeks (1–10)</option>
              {state.weeks.map((w) => (
                <option key={w.weekNumber} value={w.weekNumber}>
                  Week {w.weekNumber}: {w.title.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          {/* Mode Filter */}
          <div>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="field text-xs cursor-pointer"
              aria-label="Filter by mode"
            >
              <option value="all">All Focus Modes</option>
              {FOCUS_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="field text-xs cursor-pointer"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              {LOG_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span>
              Showing <strong className="text-white font-mono">{filteredLogs.length}</strong> of{' '}
              <strong className="text-white font-mono">{state.logs.length}</strong> sessions
            </span>
            <span>•</span>
            <span>
              Total Filtered Time: <strong className="text-tech-400 font-mono">{totalLoggedHours} hrs</strong>
            </span>
          </div>

          {(searchQuery || selectedWeek !== 'all' || selectedMode !== 'all' || selectedStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedWeek('all');
                setSelectedMode('all');
                setSelectedStatus('all');
              }}
              className="text-xs text-slate-400 hover:text-white underline underline-offset-4"
            >
              Clear all filters
            </button>
          )}
        </div>
      </Card>

      {/* 3. Filterable Worksheet Table */}
      <Card className="overflow-hidden border-white/[0.08]">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs" aria-label="Historical daily logs table">
            <thead className="bg-ink-950/80 border-b border-white/[0.08] text-slate-400 uppercase font-mono tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Week</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-4 min-w-[220px]">Task Description</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-4 min-w-[180px]">Artifact / Git Commit</th>
                <th className="py-3 px-4 min-w-[240px]">Blockers &amp; Learnings</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No sessions match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: DailyLog) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Date */}
                    <td className="py-3 px-4 font-mono whitespace-nowrap text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatShortDate(log.date)}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 pl-5">{log.date.slice(0, 4)}</span>
                    </td>

                    {/* Week */}
                    <td className="py-3 px-3 font-mono whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 font-semibold border border-white/10">
                        W{log.weekNumber}
                      </span>
                    </td>

                    {/* Mode */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <ModeBadge mode={log.mode} compact />
                    </td>

                    {/* Task Title */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white leading-snug">{log.taskTitle}</div>
                      <span className="text-[10px] text-slate-500">
                        Status: <span className={log.status === 'Completed' ? 'text-growth-400' : 'text-tech-400'}>{log.status}</span>
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-3 font-mono font-semibold text-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-tech-300">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{log.durationHours}h</span>
                      </div>
                    </td>

                    {/* Artifact */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                      {log.outputArtifact ? (
                        <div className="flex items-center gap-1.5 bg-ink-950/50 px-2 py-1 rounded-lg border border-white/[0.06] max-w-[260px] truncate" title={log.outputArtifact}>
                          <GitCommitHorizontal className="w-3.5 h-3.5 text-tech-400 shrink-0" />
                          <span className="truncate">{log.outputArtifact}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Learnings & Blockers */}
                    <td className="py-3 px-4 text-slate-300 leading-relaxed">
                      <p className="line-clamp-2 text-xs" title={log.notesAndBlockers}>
                        {log.notesAndBlockers || <span className="text-slate-600">—</span>}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingLog(log)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                          title="Edit log entry"
                          aria-label={`Edit ${log.taskTitle}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(log)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete log entry"
                          aria-label={`Delete ${log.taskTitle}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Log Modal */}
      {editingLog && (
        <Modal
          open={Boolean(editingLog)}
          onClose={() => setEditingLog(null)}
          title="Edit Practice Session"
          description="Update details, artifact references, or duration for this session."
          size="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div>
              <label className="field-label">Task Title</label>
              <input
                type="text"
                value={editingLog.taskTitle}
                onChange={(e) => setEditingLog({ ...editingLog, taskTitle: e.target.value })}
                className="field text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Focus Mode</label>
                <select
                  value={editingLog.mode}
                  onChange={(e) => setEditingLog({ ...editingLog, mode: e.target.value as FocusMode })}
                  className="field text-xs"
                >
                  {FOCUS_MODES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Status</label>
                <select
                  value={editingLog.status}
                  onChange={(e) => setEditingLog({ ...editingLog, status: e.target.value as LogStatus })}
                  className="field text-xs"
                >
                  {LOG_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={editingLog.date}
                  onChange={(e) => setEditingLog({ ...editingLog, date: e.target.value })}
                  className="field text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="field-label">Duration (Hours)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  value={editingLog.durationHours}
                  onChange={(e) => setEditingLog({ ...editingLog, durationHours: Number(e.target.value) })}
                  className="field text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label">Artifact Link / Git Commit</label>
              <input
                type="text"
                value={editingLog.outputArtifact}
                onChange={(e) => setEditingLog({ ...editingLog, outputArtifact: e.target.value })}
                className="field text-xs font-mono"
                placeholder="PR #, commit SHA, or doc URL"
              />
            </div>

            <div>
              <label className="field-label">Learnings &amp; Blockers</label>
              <textarea
                rows={3}
                value={editingLog.notesAndBlockers}
                onChange={(e) => setEditingLog({ ...editingLog, notesAndBlockers: e.target.value })}
                className="field text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <Button variant="ghost" size="sm" onClick={() => setEditingLog(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
