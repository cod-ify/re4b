import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  CheckCircle2, 
  MoreHorizontal,
  Image as ImageIcon,
  Plus,
  CalendarDays,
  PieChart,
  ArrowRight,
  Wand2
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const Dashboard = ({ budgetItems, timeline, activity, gallery, setGallery, setActiveTab, currencySymbol }) => {
  // --- Derived Metrics ---
  const totalBudget = budgetItems.reduce((acc, item) => acc + item.estimated, 0);
  const totalSpent = budgetItems.reduce((acc, item) => acc + (item.actual || 0), 0);
  const budgetRemaining = totalBudget - totalSpent;
  const progress = Math.min((totalSpent / totalBudget) * 100, 100);
  
  // Budget Category Logic
  const categories = ['Materials', 'Labor', 'Demolition'];
  const categoryData = categories.map(cat => {
    const items = budgetItems.filter(i => i.category === cat);
    const total = items.reduce((acc, i) => acc + i.estimated, 0);
    const spent = items.reduce((acc, i) => acc + (i.actual || 0), 0);
    return { name: cat, total, spent, percent: total > 0 ? (spent/total)*100 : 0 };
  });

  // Timeline Logic
  const currentTask = timeline.find(t => t.status === 'in-progress');
  const upcomingTasks = timeline.filter(t => t.status === 'pending').slice(0, 3);
  const completedCount = timeline.filter(t => t.status === 'completed').length;
  const totalTasks = timeline.length;
  const taskProgress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const handleAddPhoto = () => {
    const newPhoto = {
      id: Date.now(),
      url: "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&w=400&q=80",
      label: "New Upload"
    };
    setGallery([...gallery, newPhoto]);
  };

  const getDayFromDate = (dateStr) => {
    if (!dateStr) return '--';
    const parts = dateStr.split('-');
    return parts.length === 3 ? parts[2] : '01';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of your <span className="font-medium text-slate-900 dark:text-white">Kitchen Remodel</span></p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm hidden md:block">
            Last updated: Just now
          </span>
          <Button variant="primary" onClick={() => setActiveTab('budget')} icon={Wallet}>Log Expense</Button>
        </div>
      </div>

      {/* --- BENTO GRID LAYOUT --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Budget Snapshot */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Budget Left</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-numbers">
                {currencySymbol}{budgetRemaining.toLocaleString()}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${budgetRemaining < 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
              <Wallet size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-numbers">{currencySymbol}{totalSpent.toLocaleString()} Spent</span>
              <span className="font-numbers">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${totalSpent > totalBudget ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </Card>

        {/* 2. Velocity Snapshot */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Completion</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-numbers">{taskProgress}%</h3>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>{completedCount} of {totalTasks} phases done</span>
          </div>
        </Card>

        {/* 3. Current Focus (Wide) */}
        <div className="md:col-span-2 bg-slate-900 dark:bg-blue-950 rounded-xl p-5 text-white relative overflow-hidden flex flex-col justify-between shadow-sm border border-slate-800">
           <div className="absolute top-0 right-0 p-24 bg-blue-600 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 pointer-events-none"></div>
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Active Phase</p>
             </div>
             <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-bold text-white">{currentTask ? currentTask.title : "Project Complete"}</h3>
                  <p className="text-blue-300 text-sm mt-1 flex items-center gap-2">
                    <CalendarDays size={14} /> Target: {currentTask ? currentTask.endDate : '-'}
                  </p>
                </div>
                <Button variant="primary" className="bg-white text-slate-900 hover:bg-blue-50 border-none" onClick={() => setActiveTab('timeline')}>
                   Manage
                </Button>
             </div>
           </div>
        </div>

        {/* 4. Main Roadmap Area */}
        <Card className="md:col-span-2 lg:row-span-2 p-0 flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white">Project Roadmap</h3>
            <button onClick={() => setActiveTab('timeline')} className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:text-blue-700 flex items-center gap-1 uppercase">
                Full Schedule <ArrowRight size={12} />
            </button>
          </div>
          
          <div className="p-6 flex-1 flex flex-col gap-6">
            <div className="relative px-2">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 -z-10"></div>
              <div className="flex justify-between w-full">
                {timeline.slice(0, 5).map((task, index) => {
                  const isCompleted = task.status === 'completed';
                  const isActive = task.status === 'in-progress';
                  return (
                    <div key={task.id} className="flex flex-col items-center gap-2 bg-white dark:bg-slate-900 px-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : isActive ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 dark:text-blue-400 shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600'}`}>
                        {isCompleted ? <CheckCircle2 size={14} /> : isActive ? <div className="w-2.5 h-2.5 bg-blue-600 dark:bg-blue-400 rounded-full" /> : <span className="text-xs font-medium">{index + 1}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 flex-1">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Up Next</h4>
              <div className="space-y-3">
                {upcomingTasks.length > 0 ? upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                      {getDayFromDate(task.startDate)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{task.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled for {task.startDate}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  </div>
                )) : (
                   <div className="text-center py-4 text-slate-400 text-sm">No upcoming tasks</div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 5. Budget Breakdown */}
        <Card className="md:col-span-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white">Spend Breakdown</h3>
            <PieChart size={18} className="text-slate-400" />
          </div>
          <div className="space-y-4">
            {categoryData.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-numbers">{currencySymbol}{cat.spent.toLocaleString()} / {currencySymbol}{cat.total.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-800 dark:bg-slate-200 rounded-full" style={{ width: `${cat.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 6. Activity Feed */}
        <Card className="md:col-span-1 lg:row-span-2 p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white">Activity</h3>
            <MoreHorizontal size={18} className="text-slate-400" />
          </div>
          
          <div className="flex-1 overflow-hidden hover:overflow-y-auto pr-2 -mr-2 space-y-6">
            {activity.map((act, i) => (
              <div key={act.id} className="flex gap-3 relative">
                {i !== activity.length - 1 && (
                  <div className="absolute top-8 left-3.5 bottom-[-24px] w-px bg-slate-100 dark:bg-slate-800"></div>
                )}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white dark:ring-slate-900 ${act.type === 'money' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : act.type === 'edit' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'}`}>
                  {act.type === 'money' ? <Wallet size={12} /> : act.type === 'edit' ? <CheckCircle2 size={12} /> : <Wand2 size={12} />}
                </div>
                <div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-tight">{act.text}</p>
                  <p className="text-xs text-slate-400 mt-1">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-6 text-xs">View Full Log</Button>
        </Card>

        {/* 7. Gallery */}
        <Card className="md:col-span-2 lg:col-span-3 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white">Project Gallery</h3>
            <div className="flex gap-2">
               <button onClick={handleAddPhoto} className="text-slate-400 hover:text-blue-600 transition-colors"><Plus size={20} /></button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {gallery.map((img) => (
               <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer">
                 <img src={img.url} alt={img.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                   <span className="text-white text-xs font-medium">{img.label}</span>
                 </div>
               </div>
             ))}
             <div onClick={handleAddPhoto} className="aspect-square rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 group">
                <ImageIcon size={20} className="mb-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs font-medium">Add Photo</span>
             </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;