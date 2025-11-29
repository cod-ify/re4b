import React, { useState } from 'react';
import { 
  Calendar, CheckCircle2, Clock, AlertCircle, Plus, 
  Trash2, User, X, Edit2, Circle, Search, LayoutGrid, List,
  MapPin, ChevronDown, ChevronUp
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Input, Select, TextArea, DatePicker } from '../components/FormElements';
import { PHASES } from '../data/mockData';

// --- Task Card Component (Extracted) ---
const TaskCard = ({ task, toggleStatus, openEditModal, viewMode }) => {
  const [isExpanded, setIsExpanded] = useState(viewMode === 'list'); // Default open in list, closed in board
  const isOverdue = task.status !== 'completed' && new Date(task.endDate) < new Date();
  
  return (
    <div className={`group bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all relative hover:shadow-md ${task.status === 'completed' ? 'border-slate-200 dark:border-slate-800 opacity-60' : 'border-slate-200 dark:border-slate-800 shadow-sm'}`}>
      
      {/* Kanban overdue strip */}
      {viewMode === 'board' && isOverdue && <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-t-xl"></div>}

      {/* Header Row: Checkbox, Title, Actions */}
      <div className="flex gap-3 items-start">
         <button 
           onClick={(e) => { e.stopPropagation(); toggleStatus(task); }}
           className={`mt-0.5 flex-shrink-0 transition-colors ${task.status === 'completed' ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-500'}`}
         >
           {task.status === 'completed' ? <CheckCircle2 size={22} /> : <Circle size={22} />}
         </button>
         
         <div className="flex-1 min-w-0">
           {/* Title & Edit */}
           <div className="flex justify-between items-start">
              <h3 className={`font-bold text-sm truncate pr-2 ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                {task.title}
              </h3>
              
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                  className="text-slate-300 hover:text-blue-600 transition-colors p-1"
                  title="Edit Task"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                  className="text-slate-300 hover:text-slate-600 transition-colors p-1"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
           </div>
           
           {/* Date (Always Visible) */}
           <div className="flex items-center gap-1.5 mt-1 text-xs">
              <Clock size={12} className={isOverdue ? 'text-red-500' : 'text-blue-500'} />
              <span className={`font-medium ${isOverdue ? 'text-red-600 font-bold' : 'text-blue-600'}`}>
                {new Date(task.startDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                {task.startDate !== task.endDate && ` - ${new Date(task.endDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}`}
              </span>
              {isOverdue && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Overdue</span>}
           </div>

           {/* Collapsible Details */}
           {isExpanded && (
             <div className="mt-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
               <div className="h-px w-full bg-slate-100 dark:bg-slate-800"></div>
               
               <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                 {task.room && (
                   <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                     <MapPin size={10} /> {task.room}
                   </span>
                 )}
                 {task.assignee && (
                   <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                     <User size={10} /> {task.assignee}
                   </span>
                 )}
               </div>
               
               {task.notes && (
                 <p className="text-xs text-slate-500 italic bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg border border-amber-100 dark:border-amber-800/30">
                   {task.notes}
                 </p>
               )}
             </div>
           )}
         </div>
      </div>
    </div>
  );
};

const ProjectTimeline = ({ tasks, setTasks, currencySymbol }) => {
  // --- State ---
  const [filter, setFilter] = useState('all'); 
  const [viewMode, setViewMode] = useState('list'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  // Form State
  const initialFormState = {
    title: '',
    room: 'General',
    phase: PHASES[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    assignee: '',
    notes: '',
    status: 'pending'
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- Derived Data ---
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  
  const filteredTasks = sortedTasks.filter(t => {
    const matchesFilter = filter === 'all' 
      ? true 
      : filter === 'completed' ? t.status === 'completed' : t.status !== 'completed';
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      t.title.toLowerCase().includes(searchLower) ||
      (t.room && t.room.toLowerCase().includes(searchLower)) ||
      (t.assignee && t.assignee.toLowerCase().includes(searchLower)) ||
      t.phase.toLowerCase().includes(searchLower);

    return matchesFilter && matchesSearch;
  });

  const groupedTasks = PHASES.reduce((acc, phase) => {
    acc[phase] = filteredTasks.filter(t => t.phase === phase);
    return acc;
  }, {});

  // Stats
  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // --- Handlers ---

  const openAddModal = () => {
    setEditingTask(null);
    setFormData(initialFormState);
    setIsFormOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({ ...initialFormState, ...task });
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title) return;

    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...formData } : t));
    } else {
      setTasks([...tasks, { ...formData, id: Date.now() }]);
    }
    setIsFormOpen(false);
  };

  const handleDelete = () => {
    if (deletingTask) {
      setTasks(tasks.filter(t => t.id !== deletingTask.id));
      setDeletingTask(null);
    }
  };

  const toggleStatus = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 h-full flex flex-col">
      
      {/* --- Modals --- */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={editingTask ? "Edit Task" : "Add New Task"}
        maxWidth="max-w-2xl" 
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input 
            label="Task Title" 
            placeholder="e.g. Demolish Kitchen Wall" 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
            autoFocus 
            required 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Room / Project" 
              placeholder="e.g. Kitchen" 
              value={formData.room} 
              onChange={e => setFormData({...formData, room: e.target.value})} 
              icon={<MapPin size={16} />}
            />
            <Select 
              label="Phase" 
              options={PHASES} 
              value={formData.phase} 
              onChange={e => setFormData({...formData, phase: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Contractor" 
              placeholder="e.g. Joe Plumber" 
              value={formData.assignee} 
              onChange={e => setFormData({...formData, assignee: e.target.value})} 
              icon={<User size={16} />}
            />
            <div className="grid grid-cols-2 gap-2">
              <DatePicker 
                label="Start" 
                value={formData.startDate} 
                onChange={e => setFormData({...formData, startDate: e.target.value})} 
              />
              <DatePicker 
                label="End" 
                value={formData.endDate} 
                onChange={e => setFormData({...formData, endDate: e.target.value})} 
              />
            </div>
          </div>

          <TextArea 
            label="Notes" 
            placeholder="Additional details..." 
            value={formData.notes} 
            onChange={e => setFormData({...formData, notes: e.target.value})} 
          />

          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
            {editingTask && (
               <button 
                 type="button"
                 onClick={() => { setDeletingTask(editingTask); setIsFormOpen(false); }}
                 className="text-red-500 text-sm hover:underline flex items-center gap-1"
               >
                 <Trash2 size={14} /> Delete Task
               </button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Save</Button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deletingTask} onClose={() => setDeletingTask(null)} title="Delete Task?">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
             <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400"><Trash2 size={24} /></div>
             <div><p className="text-slate-600 dark:text-slate-300">Are you sure you want to delete <strong>{deletingTask?.title}</strong>?</p></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
             <Button variant="secondary" onClick={() => setDeletingTask(null)}>Cancel</Button>
             <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      {/* --- Header & Controls --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Timeline</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {progress}% Complete • {completedCount}/{totalTasks} Tasks Done
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           {/* Search */}
           <div className="relative flex-1 sm:w-64">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Search tasks, rooms..." 
               className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>

           {/* View Toggle */}
           <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}><List size={18} /></button>
              <button onClick={() => setViewMode('board')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}><LayoutGrid size={18} /></button>
           </div>

           <Button variant="primary" icon={Plus} onClick={openAddModal}>New Task</Button>
        </div>
      </div>

      {/* --- Content Area --- */}
      {viewMode === 'list' ? (
        // LIST VIEW
        <div className="space-y-8 pb-10">
          {Object.entries(groupedTasks).map(([phase, phaseTasks]) => phaseTasks.length > 0 && (
            <div key={phase} className="relative">
              <div className="sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm py-3 z-10 border-b border-slate-200 dark:border-slate-800 mb-4 flex items-center gap-3">
                <span className="px-3 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold uppercase tracking-wide">{phase}</span>
                <span className="text-xs text-slate-400 font-medium">{phaseTasks.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-2">
                {phaseTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    toggleStatus={toggleStatus} 
                    openEditModal={openEditModal} 
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // KANBAN BOARD VIEW
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 -mx-4 px-4">
           <div className="flex gap-6 h-full min-w-max">
              {PHASES.map(phase => (
                <div key={phase} className="w-80 flex flex-col h-full">
                   <div className="flex-shrink-0 mb-4 flex justify-between items-center px-1">
                      <span className="font-bold text-slate-900 dark:text-white text-sm uppercase">{phase}</span>
                      <span className="text-xs text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">{groupedTasks[phase]?.length || 0}</span>
                   </div>
                   <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl p-3 overflow-y-auto space-y-3 border border-slate-200 dark:border-slate-800 custom-scrollbar">
                      {groupedTasks[phase]?.map(task => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          toggleStatus={toggleStatus} 
                          openEditModal={openEditModal} 
                          viewMode={viewMode}
                        />
                      ))}
                      {(!groupedTasks[phase] || groupedTasks[phase].length === 0) && (
                        <div className="text-center py-10 text-slate-400 text-xs italic">No tasks</div>
                      )}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

    </div>
  );
};

export default ProjectTimeline;