import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Target, 
  ListChecks, 
  Flame, 
  Brain, 
  NotebookPen, 
  Trash2, 
  Calendar, 
  Check, 
  Circle, 
  CheckCircle2, 
  Plus, 
  Award,
  Sparkles,
  Search,
  X
} from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { Textarea, Select } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/StateDisplay';
import './PersonalDev.css';

const TABS = [
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'habits', label: 'Habits', icon: Flame },
  { id: 'skills', label: 'Skills', icon: Brain },
  { id: 'journal', label: 'Journal', icon: NotebookPen },
];

function PersonalDevPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'goals';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [skills, setSkills] = useState([]);
  const [journal, setJournal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Sync tab with URL param
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['goals', 'tasks', 'habits', 'skills', 'journal'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    setSearchTerm('');
  };

  const fetchData = useCallback(async (tab) => {
    setLoading(true);
    try {
      switch (tab) {
        case 'goals': {
          const res = await api.goals.list();
          setGoals(res.data || []);
          break;
        }
        case 'tasks': {
          const res = await api.tasks.list();
          setTasks(res.data || []);
          break;
        }
        case 'habits': {
          const res = await api.habits.list();
          setHabits(res.data || []);
          break;
        }
        case 'skills': {
          const res = await api.skills.list();
          setSkills(res.data || []);
          break;
        }
        case 'journal': {
          const res = await api.journal.list();
          setJournal(res.data || []);
          break;
        }
      }
    } catch (err) {
      console.error('Failed to fetch data for tab:', tab, err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  const handleCreate = async (item) => {
    try {
      if (activeTab === 'goals') {
        const res = await api.goals.create(item);
        setGoals(prev => [res.data, ...prev]);
      }
      if (activeTab === 'tasks') {
        const res = await api.tasks.create(item);
        setTasks(prev => [res.data, ...prev]);
      }
      if (activeTab === 'habits') {
        const res = await api.habits.create(item);
        setHabits(prev => [res.data, ...prev]);
      }
      if (activeTab === 'skills') {
        const res = await api.skills.create(item);
        setSkills(prev => [res.data, ...prev]);
      }
      if (activeTab === 'journal') {
        const res = await api.journal.create(item);
        setJournal(prev => [res.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Create failed:', err);
    }
  };

  return (
    <div className="page editorial-pd">
      <div className="container">
        {/* Page Header */}
        <div className="pd-header">
          <div>
            <span className="editorial-eyebrow">Personal Development Suite</span>
            <h1 className="page__title">Cultivate Your Growth</h1>
            <p className="page__subtitle">Architect your goals, habits, skills, and daily reflections</p>
          </div>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New {activeTab === 'skills' ? 'Skill' : activeTab === 'journal' ? 'Entry' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="pd-tabs" role="tablist">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`pd-tab ${activeTab === tab.id ? 'pd-tab--active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <Icon size={16} strokeWidth={1.8} className="pd-tab__icon" />
                <span className="pd-tab__label">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toolbar for search/filter */}
        {activeTab !== 'journal' && (
          <div className="pd-toolbar">
            <div className="pd-toolbar__search">
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="sm"
                icon={<Search size={15} />}
                suffix={searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--color-text-tertiary)' }}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              />
            </div>
            {(activeTab === 'goals' || activeTab === 'tasks') && (
              <div className="pd-toolbar__filters">
                <Select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Priorities' },
                    { value: 'HIGH', label: 'High Priority' },
                    { value: 'MEDIUM', label: 'Medium Priority' },
                    { value: 'LOW', label: 'Low Priority' }
                  ]}
                  placeholder=""
                />
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'oldest', label: 'Oldest First' },
                    { value: 'priority', label: 'Priority' }
                  ]}
                  placeholder=""
                />
              </div>
            )}
          </div>
        )}

        {/* Tab Content Panel */}
        <div className="pd-content" role="tabpanel">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {activeTab === 'goals' && (
                <GoalsPanel goals={goals} setGoals={setGoals} search={searchTerm} filter={filterPriority} />
              )}
              {activeTab === 'tasks' && (
                <TasksPanel tasks={tasks} setTasks={setTasks} search={searchTerm} filter={filterPriority} />
              )}
              {activeTab === 'habits' && (
                <HabitsPanel habits={habits} setHabits={setHabits} search={searchTerm} />
              )}
              {activeTab === 'skills' && (
                <SkillsPanel skills={skills} setSkills={setSkills} search={searchTerm} />
              )}
              {activeTab === 'journal' && (
                <JournalPanel journal={journal} setJournal={setJournal} onCreate={handleCreate} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`New ${activeTab === 'skills' ? 'Skill' : activeTab === 'journal' ? 'Journal Entry' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}`}
        size="md"
      >
        <CreateForm type={activeTab} onSubmit={handleCreate} />
      </Modal>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   1. GOALS PANEL: Editorial list with progress bars & milestones
   ════════════════════════════════════════════════════════════ */
function GoalsPanel({ goals, setGoals, search, filter }) {
  const filtered = goals
    .filter(g => g.title.toLowerCase().includes(search.toLowerCase()))
    .filter(g => filter === 'all' || g.priority === filter);

  const handleDelete = async (id) => {
    try {
      await api.goals.delete(id);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleUpdateProgress = async (id, progress) => {
    try {
      const res = await api.goals.update(id, { progress });
      setGoals(prev => prev.map(g => g.id === id ? res.data : g));
    } catch (err) { console.error(err); }
  };

  if (!filtered.length) {
    return <EmptyState icon={Target} title="No goals found" description="Set your first milestone goal to begin tracking progress." />;
  }

  return (
    <div className="pd-goals-stack">
      {filtered.map(goal => (
        <div key={goal.id} className="pd-goal-strip">
          <div className="pd-goal-strip__header">
            <div className="pd-goal-strip__title-wrap">
              <span className={`pd-goal-priority-tag pd-goal-priority-tag--${goal.priority?.toLowerCase()}`}>
                {goal.priority}
              </span>
              <h3 className="pd-goal-strip__title">{goal.title}</h3>
            </div>
            <div className="pd-goal-strip__actions">
              <Badge variant={goal.status === 'COMPLETED' ? 'success' : 'default'} size="sm">
                {goal.status}
              </Badge>
              <button className="pd-icon-btn" onClick={() => handleDelete(goal.id)} aria-label="Delete goal">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {goal.description && <p className="pd-goal-strip__desc">{goal.description}</p>}

          <div className="pd-goal-strip__progress-area">
            <div className="pd-goal-strip__progress-bar">
              <div className="pd-goal-strip__progress-fill" style={{ width: `${goal.progress}%` }} />
            </div>
            <span className="pd-goal-strip__pct">{goal.progress}%</span>
          </div>

          <div className="pd-goal-strip__footer">
            <div className="pd-goal-slider-wrap">
              <span className="pd-goal-slider-label">Adjust Progress:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={goal.progress}
                onChange={(e) => handleUpdateProgress(goal.id, parseInt(e.target.value))}
                className="pd-range-slider"
              />
            </div>
            {goal.deadline && (
              <span className="pd-goal-deadline">
                <Calendar size={13} strokeWidth={1.8} style={{ marginRight: 4 }} />
                Target: {new Date(goal.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   2. TASKS PANEL: Compact list with date grouping & checkboxes
   ════════════════════════════════════════════════════════════ */
function TasksPanel({ tasks, setTasks, search, filter }) {
  const handleToggle = async (id) => {
    try {
      const res = await api.tasks.toggle(id);
      setTasks(prev => prev.map(t => t.id === id ? res.data : t));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await api.tasks.delete(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) { console.error(err); }
  };

  const filtered = tasks
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    .filter(t => filter === 'all' || t.priority === filter);

  if (!filtered.length) {
    return <EmptyState icon={ListChecks} title="No tasks found" description="Add tasks to stay focused and organized daily." />;
  }

  const pending = filtered.filter(t => t.status === 'PENDING');
  const completed = filtered.filter(t => t.status === 'COMPLETED');

  return (
    <div className="pd-tasks-container">
      {pending.length > 0 && (
        <div className="pd-task-group">
          <h3 className="pd-task-group__heading">Pending Agenda ({pending.length})</h3>
          <div className="pd-task-list">
            {pending.map(task => (
              <div key={task.id} className="pd-task-row">
                <button
                  className="pd-task-checkbox"
                  onClick={() => handleToggle(task.id)}
                  aria-label="Mark task completed"
                />
                <div className="pd-task-row__body">
                  <span className="pd-task-row__title">{task.title}</span>
                  <div className="pd-task-row__tags">
                    <Badge variant={task.priority === 'HIGH' ? 'error' : task.priority === 'MEDIUM' ? 'warning' : 'info'} size="sm">
                      {task.priority}
                    </Badge>
                    {task.category && <span className="pd-category-chip">{task.category}</span>}
                    {task.dueDate && (
                      <span className="pd-task-due-text">
                        <Calendar size={12} strokeWidth={1.8} style={{ marginRight: 3 }} />
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button className="pd-icon-btn" onClick={() => handleDelete(task.id)} aria-label="Delete task">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div className="pd-task-group">
          <h3 className="pd-task-group__heading pd-task-group__heading--done">Completed ({completed.length})</h3>
          <div className="pd-task-list">
            {completed.map(task => (
              <div key={task.id} className="pd-task-row pd-task-row--done">
                <button
                  className="pd-task-checkbox pd-task-checkbox--checked"
                  onClick={() => handleToggle(task.id)}
                  aria-label="Unmark task"
                >
                  <Check size={12} strokeWidth={3} />
                </button>
                <div className="pd-task-row__body">
                  <span className="pd-task-row__title">{task.title}</span>
                </div>
                <button className="pd-icon-btn" onClick={() => handleDelete(task.id)} aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   3. HABITS PANEL: Tracker with streak visualization
   ════════════════════════════════════════════════════════════ */
function HabitsPanel({ habits, setHabits, search }) {
  const handleComplete = async (id) => {
    try {
      const res = await api.habits.complete(id);
      setHabits(prev => prev.map(h => h.id === id ? res.data : h));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await api.habits.delete(id);
      setHabits(prev => prev.filter(h => h.id !== id));
    } catch (err) { console.error(err); }
  };

  const filtered = habits.filter(h => h.title.toLowerCase().includes(search.toLowerCase()));

  if (!filtered.length) {
    return <EmptyState icon={Flame} title="No habits tracked" description="Build high-leverage habits and watch your streaks grow." />;
  }

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="pd-habits-board">
      {filtered.map(habit => (
        <div key={habit.id} className="pd-habit-card">
          <div className="pd-habit-card__top">
            <div>
              <span className="pd-habit-freq">{habit.frequency}</span>
              <h3 className="pd-habit-title">{habit.title}</h3>
            </div>
            <button className="pd-icon-btn" onClick={() => handleDelete(habit.id)} aria-label="Delete habit">
              <Trash2 size={15} />
            </button>
          </div>

          <div className="pd-habit-days-row">
            {daysOfWeek.map((day, i) => {
              const isToday = i === 6;
              const isDone = isToday ? habit.completedToday : i < 5;
              return (
                <div key={i} className="pd-habit-day-col">
                  <span className="pd-habit-day-label">{day}</span>
                  <span className={`pd-habit-day-dot ${isDone ? 'pd-habit-day-dot--done' : ''}`} />
                </div>
              );
            })}
          </div>

          <div className="pd-habit-card__footer">
            <div className="pd-habit-streak-display">
              <span className="pd-habit-streak-num">
                <Flame size={14} strokeWidth={2} /> {habit.currentStreak}
              </span>
              <span className="pd-habit-streak-lbl">Day Streak (Best: {habit.bestStreak}d)</span>
            </div>
            <button
              className={`pd-habit-check-btn ${habit.completedToday ? 'pd-habit-check-btn--done' : ''}`}
              onClick={() => handleComplete(habit.id)}
            >
              {habit.completedToday ? (
                <>
                  <Check size={14} strokeWidth={2.5} /> Done Today
                </>
              ) : (
                'Mark Done'
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   4. SKILLS PANEL: Progress bars, levels, milestones
   ════════════════════════════════════════════════════════════ */
function SkillsPanel({ skills, setSkills, search }) {
  const handleToggleMilestone = async (skillId, milestoneId) => {
    try {
      const res = await api.skills.toggleMilestone(skillId, milestoneId);
      setSkills(prev => prev.map(s => s.id === skillId ? res.data : s));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await api.skills.delete(id);
      setSkills(prev => prev.filter(s => s !== id));
    } catch (err) { console.error(err); }
  };

  const filtered = skills.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  if (!filtered.length) {
    return <EmptyState icon={Brain} title="No skills registered" description="Add skills and break them down into milestone achievements." />;
  }

  return (
    <div className="pd-skills-grid">
      {filtered.map(skill => (
        <div key={skill.id} className="pd-skill-card">
          <div className="pd-skill-card__header">
            <div>
              {skill.category && <span className="pd-category-chip">{skill.category}</span>}
              <h3 className="pd-skill-title">{skill.title}</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Badge variant="primary" size="sm">{skill.level}</Badge>
              <button className="pd-icon-btn" onClick={() => handleDelete(skill.id)} aria-label="Delete">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          <div className="pd-skill-progress-bar">
            <div className="pd-skill-progress-fill" style={{ width: `${skill.progress}%` }} />
          </div>
          <span className="pd-skill-pct-label">{skill.progress}% Mastery</span>

          {skill.milestones?.length > 0 && (
            <div className="pd-milestones-tray">
              <span className="pd-milestones-tray-lbl">Milestones:</span>
              <div className="pd-milestones-chips">
                {skill.milestones.map(m => (
                  <button
                    key={m.id}
                    className={`pd-milestone-pill ${m.achieved ? 'pd-milestone-pill--achieved' : ''}`}
                    onClick={() => handleToggleMilestone(skill.id, m.id)}
                  >
                    {m.achieved ? <Check size={11} strokeWidth={2.5} /> : <Circle size={10} />}
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   5. JOURNAL PANEL: Sidebar entry list + Clean writing area
   ════════════════════════════════════════════════════════════ */
function JournalPanel({ journal, setJournal, onCreate }) {
  const [selectedEntry, setSelectedEntry] = useState(journal[0] || null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftMood, setDraftMood] = useState('Reflective');
  const [isWriting, setIsWriting] = useState(false);

  useEffect(() => {
    if (journal.length > 0 && !selectedEntry && !isWriting) {
      setSelectedEntry(journal[0]);
    }
  }, [journal, selectedEntry, isWriting]);

  const handleDelete = async (id) => {
    try {
      await api.journal.delete(id);
      const remaining = journal.filter(j => j.id !== id);
      setJournal(remaining);
      setSelectedEntry(remaining[0] || null);
    } catch (err) { console.error(err); }
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!draftTitle.trim()) return;
    try {
      const res = await api.journal.create({
        title: draftTitle,
        content: draftContent,
        mood: draftMood,
      });
      setJournal(prev => [res.data, ...prev]);
      setSelectedEntry(res.data);
      setDraftTitle('');
      setDraftContent('');
      setIsWriting(false);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="pd-journal-workspace">
      {/* Sidebar List */}
      <div className="pd-journal-sidebar">
        <div className="pd-journal-sidebar__header">
          <span className="pd-journal-sidebar__title">Entries ({journal.length})</span>
          <Button variant="secondary" size="sm" onClick={() => { setIsWriting(true); setSelectedEntry(null); }}>
            <Plus size={14} /> Write
          </Button>
        </div>

        <div className="pd-journal-sidebar__list">
          {journal.map(entry => (
            <button
              key={entry.id}
              className={`pd-journal-item-btn ${selectedEntry?.id === entry.id && !isWriting ? 'pd-journal-item-btn--active' : ''}`}
              onClick={() => { setSelectedEntry(entry); setIsWriting(false); }}
            >
              <div className="pd-journal-item-btn__top">
                <span className="pd-journal-item-btn__mood">{entry.mood || 'Reflection'}</span>
                <span className="pd-journal-item-btn__date">{new Date(entry.createdAt).toLocaleDateString()}</span>
              </div>
              <span className="pd-journal-item-btn__title">{entry.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pd-journal-editor-area">
        {isWriting ? (
          <form onSubmit={handleSaveDraft} className="pd-journal-form">
            <div className="pd-journal-form__top">
              <Select
                value={draftMood}
                onChange={e => setDraftMood(e.target.value)}
                options={[
                  { value: 'Grateful', label: 'Grateful' },
                  { value: 'Motivated', label: 'Motivated' },
                  { value: 'Creative', label: 'Creative' },
                  { value: 'Calm', label: 'Calm' },
                  { value: 'Reflective', label: 'Reflective' }
                ]}
                placeholder=""
              />
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsWriting(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm">Publish Reflection</Button>
              </div>
            </div>
            <Input
              placeholder="Title of reflection..."
              value={draftTitle}
              onChange={e => setDraftTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Write your thoughts, daily wins, or outfit experiments..."
              value={draftContent}
              onChange={e => setDraftContent(e.target.value)}
              rows={12}
            />
          </form>
        ) : selectedEntry ? (
          <div className="pd-journal-reader">
            <div className="pd-journal-reader__header">
              <div>
                <span className="pd-journal-reader__date">
                  {selectedEntry.mood && <span className="pd-journal-mood-pill">{selectedEntry.mood}</span>}
                  {new Date(selectedEntry.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <h2 className="pd-journal-reader__title">{selectedEntry.title}</h2>
              </div>
              <button className="pd-icon-btn" onClick={() => handleDelete(selectedEntry.id)} aria-label="Delete entry">
                <Trash2 size={15} />
              </button>
            </div>
            <div className="pd-journal-reader__content">
              {selectedEntry.content}
            </div>
          </div>
        ) : (
          <div className="pd-journal-empty">
            <p>Select an entry from the left or click "+ Write" to start reflecting.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CREATE MODAL FORM HELPER
   ════════════════════════════════════════════════════════════ */
function CreateForm({ type, onSubmit }) {
  const [form, setForm] = useState({});
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <form onSubmit={handleSubmit} className="auth-card__form">
      <Input label="Title" name="title" required placeholder={`Enter ${type} title`} onChange={handleChange} />
      {(type === 'goals' || type === 'journal') && (
        <Textarea label="Description / Content" name={type === 'journal' ? 'content' : 'description'} placeholder="Provide details..." onChange={handleChange} />
      )}
      {type === 'goals' && <Input label="Deadline" name="deadline" type="date" onChange={handleChange} />}
      {(type === 'goals' || type === 'tasks') && (
        <Select label="Priority" name="priority" options={[{value:'HIGH',label:'High'},{value:'MEDIUM',label:'Medium'},{value:'LOW',label:'Low'}]} onChange={handleChange} />
      )}
      {type === 'tasks' && (
        <>
          <Input label="Due Date" name="dueDate" type="date" onChange={handleChange} />
          <Input label="Category" name="category" placeholder="e.g. Fitness, Style, Learning" onChange={handleChange} />
        </>
      )}
      {type === 'habits' && (
        <Select label="Frequency" name="frequency" options={[{value:'Daily',label:'Daily'},{value:'Weekly',label:'Weekly'},{value:'Monthly',label:'Monthly'}]} onChange={handleChange} />
      )}
      {type === 'skills' && (
        <Input label="Category" name="category" placeholder="e.g. Fashion Curation, Public Speaking" onChange={handleChange} />
      )}
      {type === 'journal' && (
        <Select label="Mood" name="mood" options={[{value:'Grateful',label:'Grateful'},{value:'Motivated',label:'Motivated'},{value:'Creative',label:'Creative'},{value:'Calm',label:'Calm'},{value:'Reflective',label:'Reflective'}]} onChange={handleChange} />
      )}
      <Button type="submit" variant="primary" fullWidth>Create {type.slice(0, -1)}</Button>
    </form>
  );
}

export default PersonalDevPage;
