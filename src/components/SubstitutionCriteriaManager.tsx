import React, { useState, useEffect } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Settings, 
  HelpCircle, 
  Save, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Grid,
  Info
} from 'lucide-react';
import { SubstitutionCriterion, SubstitutionSettings, SubstitutionRulesConfig, ERPDataState } from '../types';

interface SubstitutionCriteriaManagerProps {
  onRulesChanged?: () => void;
  onUpdateState?: (newState: ERPDataState) => void;
}

export default function SubstitutionCriteriaManager({ onRulesChanged, onUpdateState }: SubstitutionCriteriaManagerProps) {
  const [criteria, setCriteria] = useState<SubstitutionCriterion[]>([]);
  const [settings, setSettings] = useState<SubstitutionSettings | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch rules from server
  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/substitutes/rules');
      const data: SubstitutionRulesConfig = await res.json();
      // Sort criteria by priority initially
      const sortedCriteria = [...data.criteria].sort((a, b) => a.priority - b.priority);
      setCriteria(sortedCriteria);
      setSettings(data.settings);
    } catch (err) {
      console.error("Failed to load substitution rules", err);
      setMessage({ type: 'error', text: 'Failed to load configuration. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Save rules
  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      setMessage(null);
      
      const response = await fetch('/api/substitutes/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria, settings }),
      });
      
      if (!response.ok) throw new Error('Save failed');
      const data = await response.json();
      
      setMessage({ 
        type: 'success', 
        text: 'Substitution configuration saved and applied to the automated assignment engine.' 
      });
      if (onRulesChanged) onRulesChanged();
      if (onUpdateState) onUpdateState(data.state);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save configuration. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Reset rules
  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all substitution criteria to school defaults?')) return;
    try {
      setSaving(true);
      setMessage(null);
      
      const response = await fetch('/api/substitutes/rules/reset', { method: 'POST' });
      if (!response.ok) throw new Error('Reset failed');
      
      const data = await response.json();
      setMessage({ type: 'success', text: 'Reset successfully completed. Defaults restored.' });
      
      // Update local state with default rules returned
      const dataRules: SubstitutionRulesConfig = data.state.substitutionRules;
      const sortedCriteria = [...dataRules.criteria].sort((a, b) => a.priority - b.priority);
      setCriteria(sortedCriteria);
      setSettings(dataRules.settings);
      
      if (onRulesChanged) onRulesChanged();
      if (onUpdateState) onUpdateState(data.state);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to reset rules. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null) return;
    const list = [...criteria];
    const [draggedItem] = list.splice(draggedIndex, 1);
    list.splice(index, 0, draggedItem);

    // Reassign sequence priorities 1..N based on new indexes
    const updated = list.map((item, idx) => ({
      ...item,
      priority: idx + 1
    }));

    setCriteria(updated);
    setDraggedIndex(null);
  };

  // Click-to-Move helpers
  const moveUp = (index: number) => {
    if (index === 0) return;
    const list = [...criteria];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;

    const updated = list.map((item, idx) => ({
      ...item,
      priority: idx + 1
    }));
    setCriteria(updated);
  };

  const moveDown = (index: number) => {
    if (index === criteria.length - 1) return;
    const list = [...criteria];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;

    const updated = list.map((item, idx) => ({
      ...item,
      priority: idx + 1
    }));
    setCriteria(updated);
  };

  // Toggle toggle
  const toggleCriterion = (id: string) => {
    const updated = criteria.map(item => {
      if (item.id === id) {
        return { ...item, enabled: !item.enabled };
      }
      return item;
    });
    setCriteria(updated);
  };

  // Priority change directly via input field
  const handlePriorityInput = (id: string, value: number) => {
    if (isNaN(value) || value < 1 || value > criteria.length) return;
    
    // Find item
    const targetIdx = criteria.findIndex(item => item.id === id);
    if (targetIdx === -1) return;
    
    const list = [...criteria];
    const [item] = list.splice(targetIdx, 1);
    
    // Insert at new priority position (0-indexed value - 1)
    list.splice(value - 1, 0, item);
    
    const updated = list.map((c, idx) => ({
      ...c,
      priority: idx + 1
    }));
    setCriteria(updated);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-sm">Loading substitution config...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and explanation banner */}
      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-950 text-sm">Configurable Dynamic Substitution Priorities</h4>
          <p className="text-xs text-amber-900 leading-relaxed mt-1">
            Reorder criteria by dragging the grab handle (<Grid className="inline w-3 h-3 text-amber-500" />), typing a priority rank, or clicking the arrows. 
            The AI engine resolves substitutions sequentially by checking enabled criteria from rank 1 downward, establishing true mathematical optimization.
          </p>
        </div>
      </div>

      {/* Message feedback */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Criteria sorting */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-base flex items-center gap-2">
              <span>Priority Rules</span>
              <span className="text-xs font-normal text-gray-500">({criteria.filter(c => c.enabled).length} Enabled)</span>
            </h3>
          </div>

          <div className="space-y-2">
            {criteria.map((criterion, index) => {
              const isFirst = index === 0;
              const isLast = index === criteria.length - 1;

              return (
                <div
                  key={criterion.id}
                  id={`criterion-card-${criterion.id}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(index)}
                  className={`flex items-start gap-3 p-3 bg-white border rounded-xl transition-all ${
                    draggedIndex === index ? 'opacity-40 border-amber-300 bg-amber-50/20' : 'hover:border-gray-300'
                  } ${
                    criterion.enabled ? 'border-gray-200' : 'border-gray-100 bg-gray-50/50 opacity-70'
                  }`}
                >
                  {/* Drag Handle */}
                  <div 
                    className="cursor-grab hover:text-gray-600 text-gray-400 p-1 shrink-0 select-none"
                    title="Drag and Drop to Reorder"
                  >
                    <Grid className="w-4 h-4" />
                  </div>

                  {/* Priority Indicator */}
                  <div className="flex flex-col items-center shrink-0">
                    <input
                      id={`criterion-input-${criterion.id}`}
                      type="number"
                      min="1"
                      max={criteria.length}
                      value={criterion.priority}
                      onChange={(e) => handlePriorityInput(criterion.id, parseInt(e.target.value, 10))}
                      className="w-8 h-7 text-center text-xs font-semibold bg-gray-50 hover:bg-gray-100 focus:bg-white text-gray-700 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Description Info */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-xs ${criterion.enabled ? 'text-gray-800' : 'text-gray-500'}`}>
                        {criterion.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {criterion.explanation}
                    </p>
                  </div>

                  {/* Move Arrows (Fallback for touch screens or explicit click navigation) */}
                  <div className="flex items-center gap-0.5 self-center">
                    <button
                      id={`criterion-up-btn-${criterion.id}`}
                      onClick={() => moveUp(index)}
                      disabled={isFirst}
                      className="p-1 hover:bg-gray-100 text-gray-500 disabled:opacity-20 disabled:hover:bg-transparent rounded-md transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`criterion-down-btn-${criterion.id}`}
                      onClick={() => moveDown(index)}
                      disabled={isLast}
                      className="p-1 hover:bg-gray-100 text-gray-500 disabled:opacity-20 disabled:hover:bg-transparent rounded-md transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Enable / Disable Toggle Switch */}
                  <div className="flex items-center self-center pl-1">
                    <button
                      id={`criterion-toggle-${criterion.id}`}
                      onClick={() => toggleCriterion(criterion.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500 focus:ring-offset-2 ${
                        criterion.enabled ? 'bg-amber-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          criterion.enabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Global Threshold Parameters */}
        {settings && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-800 text-base flex items-center gap-2">
              <Settings className="w-4.5 h-4.5 text-gray-500" />
              <span>Conflict-Free Thresholds</span>
            </h3>

            <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm">
              {/* Max daily substitutes */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Max Substitutes per Teacher / Day
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="settings-max-daily-subs"
                    type="number"
                    min="1"
                    max="5"
                    value={settings.maxDailySubs}
                    onChange={(e) => setSettings({ ...settings, maxDailySubs: parseInt(e.target.value, 10) || 1 })}
                    className="w-full text-xs p-2 border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none rounded-lg bg-gray-50"
                  />
                </div>
                <span className="text-[10px] text-gray-400">Restricts daily overload.</span>
              </div>

              {/* Max weekly substitutes */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Max Substitutes per Teacher / Week
                </label>
                <input
                  id="settings-max-weekly-subs"
                  type="number"
                  min="1"
                  max="15"
                  value={settings.maxWeeklySubs}
                  onChange={(e) => setSettings({ ...settings, maxWeeklySubs: parseInt(e.target.value, 10) || 1 })}
                  className="w-full text-xs p-2 border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none rounded-lg bg-gray-50"
                />
                <span className="text-[10px] text-gray-400">Guarantees weekly duty balance.</span>
              </div>

              {/* Max consecutive teaching periods */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Max Consecutive Periods Allowed
                </label>
                <input
                  id="settings-max-consecutive-periods"
                  type="number"
                  min="1"
                  max="6"
                  value={settings.maxConsecutivePeriods}
                  onChange={(e) => setSettings({ ...settings, maxConsecutivePeriods: parseInt(e.target.value, 10) || 1 })}
                  className="w-full text-xs p-2 border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none rounded-lg bg-gray-50"
                />
                <span className="text-[10px] text-gray-400">Avoids continuous hours fatigue.</span>
              </div>

              <div className="h-px bg-gray-100 my-2" />

              {/* Subject qualification filter */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-gray-700">Subject Match Mandatory</span>
                  <span className="text-[10px] text-gray-400 block max-w-[150px]">Filters strictly by certified qualification.</span>
                </div>
                <button
                  id="settings-toggle-subject-mandatory"
                  onClick={() => setSettings({ ...settings, subjectQualificationMandatory: !settings.subjectQualificationMandatory })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    settings.subjectQualificationMandatory ? 'bg-amber-500' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    settings.subjectQualificationMandatory ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Same class experience filter */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-gray-700">Class Experience Mandatory</span>
                  <span className="text-[10px] text-gray-400 block max-w-[150px]">Requires teacher to already know the section.</span>
                </div>
                <button
                  id="settings-toggle-class-experience"
                  onClick={() => setSettings({ ...settings, sameClassExperienceMandatory: !settings.sameClassExperienceMandatory })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    settings.sameClassExperienceMandatory ? 'bg-amber-500' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    settings.sameClassExperienceMandatory ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Allow outside primary subject */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-gray-700">Allow Outside Primary Subject</span>
                  <span className="text-[10px] text-gray-400 block max-w-[150px]">Allows generalist cover if free.</span>
                </div>
                <button
                  id="settings-toggle-allow-outside-subject"
                  onClick={() => setSettings({ ...settings, allowOutsidePrimarySubject: !settings.allowOutsidePrimarySubject })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    settings.allowOutsidePrimarySubject ? 'bg-amber-500' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    settings.allowOutsidePrimarySubject ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              <h4 className="font-semibold text-gray-700 text-xs">Save Configuration</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Changes take effect instantly. Unlocked assignments will be re-analyzed by the engine.
              </p>
              
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  id="rules-reset-button"
                  onClick={handleReset}
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 text-xs font-semibold rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>

                <button
                  id="rules-save-button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Apply Rules'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
