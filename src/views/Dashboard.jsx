import React from 'react';
import { 
  Wallet, TrendingUp, CheckCircle2, Clock, ArrowRight, 
  Wrench, ShieldAlert, Sparkles, Image as ImageIcon, Plus
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const Dashboard = ({ budgetItems, timeline, gallery, renovationPlans, inventory, setActiveTab, currencySymbol }) => {
  
  // --- Metrics Calculation ---
  const totalBudget = budgetItems.reduce((acc, item) => acc + item.estimated, 0);
  const totalSpent = budgetItems.reduce((acc, item) => acc + (item.actual || 0), 0);
  const budgetRemaining = totalBudget - totalSpent;
  const progress = Math.min((totalSpent / (totalBudget || 1)) * 100, 100); // Avoid NaN
  
  const upcomingTasks = timeline.filter(t => t.status === 'pending').sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(0, 4);
  const toolsNeeded = inventory.filter(t => !t.owned).length;
  const activePlan = renovationPlans.length > 0 ? renovationPlans[0] : null; // Grab the most recent plan

  // Helper to get current phase
  const getCurrentPhase = () => {
    if (!activePlan) return "Planning";
    // Logic: find first phase with pending tasks in timeline? 
    // Simpler: Just show the first phase name for now as "Active"
    return activePlan.data?.phases?.[0]?.name || "Preparation";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back. Here is your project overview.</p>
        </div>
        <div className="flex gap-3">
           <Button variant="secondary" onClick={() => setActiveTab('design')} icon={Sparkles}>New Design</Button>
           <Button variant="primary" onClick={() => setActiveTab('planner')} icon={Plus}>New Plan</Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget Card */}
        <Card className="p-4 flex flex-col justify-between border-l-4 border-l-emerald-500">
           <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Budget Health</span>
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600"><Wallet size={18} /></div>
           </div>
           <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-numbers">{currencySymbol}{Math.abs(budgetRemaining).toLocaleString()}</span>
              <p className="text-xs text-slate-500 mt-1">{budgetRemaining >= 0 ? 'Left to spend' : 'Over budget'}</p>
           </div>
        </Card>
        
        {/* Progress Card */}
        <Card className="p-4 flex flex-col justify-between border-l-4 border-l-blue-500">
           <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</span>
              <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600"><TrendingUp size={18} /></div>
           </div>
           <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-numbers">{progress.toFixed(0)}%</span>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                 <div className="h-full bg-blue-500" style={{ width: `${progress}%` }}></div>
              </div>
           </div>
        </Card>

        {/* Tools Card */}
        <Card className="p-4 flex flex-col justify-between border-l-4 border-l-amber-500">
           <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Toolbox</span>
              <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600"><Wrench size={18} /></div>
           </div>
           <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-numbers">{toolsNeeded}</span>
              <p className="text-xs text-slate-500 mt-1">Tools needed for projects</p>
           </div>
        </Card>

        {/* Risk Card */}
        <Card className="p-4 flex flex-col justify-between border-l-4 border-l-red-500">
           <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Safety</span>
              <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600"><ShieldAlert size={18} /></div>
           </div>
           <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {activePlan && activePlan.data?.diyRating === 'High' ? 'Pro Recommended' : 'DIY Friendly'}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                {activePlan ? `Current Plan: ${activePlan.data?.diyRating} Risk` : 'No active plans'}
              </p>
           </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Active Renovation Plan (Hero) */}
        <div className="lg:col-span-2">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              Current Project
              {activePlan && <span className="text-xs font-normal text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">{activePlan.name}</span>}
           </h3>

           {activePlan ? (
             <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg group cursor-pointer" onClick={() => setActiveTab('planner')}>
                {/* Background Image */}
                <img 
                  src={activePlan.afterImage || activePlan.beforeImage} 
                  alt="Project" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                
                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                   <div className="flex justify-between items-end">
                      <div>
                         <span className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded mb-2 inline-block">Active Phase</span>
                         <h2 className="text-2xl font-bold text-white">{getCurrentPhase()}</h2>
                         <p className="text-slate-300 text-sm mt-1 line-clamp-1">
                            {activePlan.data?.phases?.[0]?.steps?.[0]?.action || "Start renovation..."}
                         </p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md p-2 rounded-full hover:bg-white/20 transition-colors">
                         <ArrowRight className="text-white" />
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <div className="h-64 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900">
                <p className="mb-4">No active renovation plans.</p>
                <Button variant="primary" onClick={() => setActiveTab('planner')} icon={Plus}>Start Planning</Button>
             </div>
           )}
        </div>

        {/* RIGHT: Up Next (Timeline) */}
        <div className="lg:col-span-1 flex flex-col">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Up Next</h3>
              <button onClick={() => setActiveTab('timeline')} className="text-xs font-bold text-blue-600 hover:underline">See All</button>
           </div>
           
           <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1 flex-1">
              {upcomingTasks.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {upcomingTasks.map(task => (
                    <div key={task.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-lg group">
                       <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{task.title}</h4>
                          <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{task.phase}</span>
                       </div>
                       <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock size={12} className="text-blue-500" />
                          <span>{new Date(task.startDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                          {task.assignee && <span className="text-slate-300">• {task.assignee}</span>}
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm p-6">
                   <CheckCircle2 size={32} className="mb-2 opacity-20" />
                   <p>All caught up!</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Footer: Recent Designs */}
      <div>
         <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Designs</h3>
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Add New Card */}
            <button onClick={() => setActiveTab('design')} className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all bg-slate-50 dark:bg-slate-900">
               <Plus size={24} className="mb-1" />
               <span className="text-xs font-bold">New Design</span>
            </button>

            {/* Gallery Items */}
            {gallery.slice(0, 5).reverse().map((img) => (
               <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm border border-slate-100 dark:border-slate-800">
                  <img src={img.url} alt="Design" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                     <span className="text-white text-xs font-bold truncate w-full">{img.label}</span>
                  </div>
               </div>
            ))}
         </div>
      </div>

    </div>
  );
};

export default Dashboard;