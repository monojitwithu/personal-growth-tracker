import { useRef, useState } from 'react';
import { Download, Upload, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { createBackup, parseBackup } from '../../lib/persistence';
import type { AppState } from '../../types';

export function DataManagement() {
  const { state, importState, resetToSeed } = useApp();
  const { toast } = useToast();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [importCandidate, setImportCandidate] = useState<AppState | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Export JSON handler
  const handleExport = () => {
    const backup = createBackup(state);
    const dateStr = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fullstack-ascent-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      tone: 'success',
      title: 'Backup Exported',
      description: `Downloaded backup with ${state.logs.length} logged sessions.`,
    });
  };

  // 2. Import file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') return;

      const result = parseBackup(text);
      if (!result.ok) {
        toast({
          tone: 'error',
          title: 'Import Failed',
          description: result.error,
        });
        return;
      }

      setImportCandidate(result.value);
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!importCandidate) return;
    importState(importCandidate, importMode);
    toast({
      tone: 'success',
      title: 'Data Imported',
      description: `Successfully ${importMode === 'merge' ? 'merged' : 'restored'} state (${importCandidate.logs.length} logs).`,
    });
    setImportCandidate(null);
  };

  const handleConfirmReset = () => {
    resetToSeed();
    setIsResetModalOpen(false);
    toast({
      tone: 'info',
      title: 'Reset to Initial Seed Data',
      description: 'Curriculum, capstones, and sample logs have been restored.',
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
        id="backup-file-input"
      />

      <Button
        variant="secondary"
        size="sm"
        onClick={handleExport}
        leftIcon={<Download className="w-3.5 h-3.5" />}
        className="text-xs"
        id="export-json-button"
      >
        Export JSON
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        leftIcon={<Upload className="w-3.5 h-3.5" />}
        className="text-xs"
        id="import-json-button"
      >
        Import JSON
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsResetModalOpen(true)}
        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        className="text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-500/10"
        id="reset-seed-button"
      >
        Reset to Seed
      </Button>

      {/* Confirmation Modal for Reset */}
      <Modal
        open={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset to Initial Seed Data?"
        tone="danger"
        description="This will clear your local sessions and restore the initial pre-populated curriculum and seed state."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsResetModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmReset}>
              Yes, Reset Everything
            </Button>
          </>
        }
      >
        <div className="text-xs text-slate-300 space-y-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
          <div className="flex items-center gap-2 text-rose-300 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Warning: Irreversible Action</span>
          </div>
          <p>
            You currently have <strong>{state.logs.length} logged sessions</strong>. 
            If you wish to keep them, please click "Export JSON" first before resetting.
          </p>
        </div>
      </Modal>

      {/* Confirmation Modal for Import */}
      {importCandidate && (
        <Modal
          open={Boolean(importCandidate)}
          onClose={() => setImportCandidate(null)}
          title="Import Backup Data"
          description={`Valid backup detected containing ${importCandidate.logs.length} logs and ${importCandidate.weeks.length} weeks.`}
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setImportCandidate(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmImport}>
                Proceed with Import
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="bg-ink-950/60 border border-white/10 rounded-xl p-3 text-xs space-y-2">
              <div className="flex items-center gap-2 text-tech-300 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Backup Validated Successfully</span>
              </div>
              <p className="text-slate-400">
                Choose how you want to apply this backup to your current cockpit state:
              </p>
            </div>

            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  importMode === 'merge'
                    ? 'bg-tech-500/15 border-tech-400/50 text-white'
                    : 'bg-white/[0.02] border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-semibold">Merge with Current Data (Recommended)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Preserves your existing logs and incorporates missing sessions, highest competency ratings, and completed deliverables.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  importMode === 'replace'
                    ? 'bg-warn-500/15 border-warn-400/50 text-white'
                    : 'bg-white/[0.02] border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-semibold">Replace Entire State</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Overwrites all current logs and progress with the contents of the uploaded JSON file.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
