import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  MoreVertical, 
  Trash2, 
  User,
  X,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { PHASES } from '../data/mockData';

const ProjectTimeline = ({ tasks, setTasks }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [expandedPhase, setExpandedPhase] = useState(null); // for mobile accordion if needed

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    phase: 'Rough-in',
    startDate: '',
    endDate: '',
    assignee: '',
    notes: '',
    status: 'pending'
  });

  // --- Derived Data ---
  
  // Sort by date
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  
  // Filter
  const filteredTasks = sortedTasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'completed') return t.status === 'completed';
    if (filter === 'pending') return t.status === 'pending' || t.status === 'in-progress';
    return true;
  });

  // Group by Phase
  const groupedTasks = PHASES.reduce((acc, phase) => {
    const phaseTasks = filteredTasks.filter(t => t.phase === phase);
    if (phaseTasks.length > 0) {
      acc[phase] = phaseTasks;
    }
    return acc;
  }, {});

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const percentComplete = Math.round((completedTasks / totalTasks) * 100) || 0;
  
  const today = new Date();
  const delayedTasks = tasks.filter(t => {
    const end = new Date(t.endDate);
    return t.status !== 'completed' && end < today;
  }).length;

  // --- Handlers ---

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate) return;

    const newTask = {
      id: Date.now(),
      ...formData,
      // Basic date validation: if end date missing, assume 1 day duration
      endDate: formData.endDate || formData.startDate 
    };

    setTasks([...tasks, newTask]);
    setFormData({
      title: '', phase: 'Rough-in', startDate: '', endDate: '', assignee: '', notes: '', status: 'pending'
    });
    setIsAdding(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this task?')) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const toggleStatus = (id) => {
    setTasks(tasks.map(t => {
      if (t.id !== id) return t;
      const next = t.status === 'pending' ? 'in-progress' : t.status === 'in-progress' ? 'completed' : 'pending';
      return { ...t, status: next };
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delayed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Project Schedule</h1>
          <p className="text-slate-500">Manage phases, milestones, and contractors</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="bg-white border border-slate-200 rounded-lg p-1 flex text-sm font-medium">
              <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded ${filter === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>All</button>
              <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 rounded ${filter === 'pending' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Active</button>
              <button onClick={() => setFilter('completed')} className={`px-3 py-1.5 rounded ${filter === 'completed' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Done</button>
           </div>
           <Button variant="primary" onClick={() => setIsAdding(true)} icon={Plus}>Add Task</Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Overall Progress</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{percentComplete}%</span>
              <span className="text-xs text-slate-400">Completed</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-emerald-500">
           <div className="p-3 rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Tasks Done</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{completedTasks}</span>
              <span className="text-xs text-slate-400">of {totalTasks} tasks</span>
            </div>
          </div>
        </Card>

        <Card className={`p-4 flex items-center gap-4 border-l-4 ${delayedTasks > 0 ? 'border-l-red-500' : 'border-l-slate-300'}`}>
           <div className={`p-3 rounded-full ${delayedTasks > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Status</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{delayedTasks > 0 ? `${delayedTasks} Delayed` : 'On Track'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <Card className="p-6 border-blue-200 shadow-md bg-blue-50/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900">Add New Task</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Task Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  placeholder="e.g. Install Kitchen Island"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phase</label>
                    <select 
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.phase}
                      onChange={e => setFormData({...formData, phase: e.target.value})}
                    >
                      {PHASES.map(p => <option key={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
                   <input 
                      required
                      type="date" 
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date</label>
                   <input 
                      type="date" 
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.endDate}
                      onChange={e => setFormData({...formData, endDate: e.target.value})}
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assignee (Optional)</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      placeholder="e.g. Joe Plumber"
                      value={formData.assignee}
                      onChange={e => setFormData({...formData, assignee: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes (Optional)</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      placeholder="Additional details..."
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                 </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                 <Button variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
                 <Button variant="primary" type="submit">Add Task</Button>
              </div>
          </form>
        </Card>
      )}

      {/* Timeline List Grouped by Phase */}
      <div className="space-y-8">
        {Object.keys(groupedTasks).length === 0 && (
           <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
              <p className="text-slate-400">No tasks found matching this filter.</p>
           </div>
        )}

        {Object.entries(groupedTasks).map(([phase, tasks]) => (
          <div key={phase} className="relative">
            {/* Phase Header */}
            <div className="sticky top-0 bg-slate-50/95 backdrop-blur py-3 z-10 border-b border-slate-200 mb-4 flex items-center gap-3">
              <span className="px-3 py-1 rounded-md bg-slate-200 text-slate-700 text-sm font-bold uppercase tracking-wide">
                {phase}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {tasks.length} Tasks
              </span>
            </div>

            {/* Task List */}
            <div className="space-y-3 pl-4 border-l-2 border-slate-200 ml-4">
              {tasks.map((task) => {
                const isDelayed = task.status !== 'completed' && new Date(task.endDate) < today;
                const displayStatus = isDelayed ? 'delayed' : task.status;

                return (
                  <div key={task.id} className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative">
                    {/* Timeline Dot connector */}
                    <div className={`absolute -left-[25px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-slate-50 z-0 ${
                      task.status === 'completed' ? 'bg-emerald-500' : 
                      task.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-300'
                    }`}></div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Left: Date & Title */}
                      <div className="flex-1">
                         <div className="flex items-center gap-3 mb-1">
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusColor(displayStatus)}`}>
                             {displayStatus.replace('-', ' ')}
                           </span>
                           <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(task.startDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})} 
                              {task.startDate !== task.endDate && ` - ${new Date(task.endDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}`}
                           </span>
                         </div>
                         <h3 className={`font-bold text-lg ${task.status === 'completed' ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900'}`}>
                           {task.title}
                         </h3>
                         {task.notes && <p className="text-sm text-slate-500 mt-1">{task.notes}</p>}
                      </div>

                      {/* Right: Assignee & Actions */}
                      <div className="flex items-center gap-4">
                         {task.assignee && (
                           <div className="hidden md:flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                             <User size={14} /> {task.assignee}
                           </div>
                         )}
                         
                         <div className="flex items-center gap-2">
                           <button 
                              onClick={() => toggleStatus(task.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                task.status === 'completed' 
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                  : 'bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600'
                              }`}
                              title="Toggle Status"
                           >
                             <CheckCircle2 size={20} />
                           </button>
                           <button 
                              onClick={() => handleDelete(task.id)}
                              className="p-2 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="Delete"
                           >
                             <Trash2 size={20} />
                           </button>
                         </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default ProjectTimeline;