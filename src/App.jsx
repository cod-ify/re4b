import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Wallet, PaintBucket, ListTodo, Calculator, 
  Moon, Sun, Settings, UserCircle, ChevronLeft, ChevronRight,
  ClipboardList, Wrench, Trash2, AlertTriangle
} from 'lucide-react';

// Logic & Data
import { useLocalStorage } from './hooks/useLocalStorage';
import { 
  INITIAL_BUDGET_ITEMS, INITIAL_TIMELINE, INITIAL_ACTIVITY, 
  INITIAL_GALLERY, ROOMS as DEFAULT_ROOMS, CATEGORIES as DEFAULT_CATEGORIES 
} from './data/mockData';

// Components
import Modal from './components/Modal';
import { Select } from './components/FormElements';
import Button from './components/Button';

// Views
import Dashboard from './views/Dashboard';
import BudgetTracker from './views/BudgetTracker';
import DesignStudio from './views/DesignStudio';
import ProjectTimeline from './views/ProjectTimeline';
import MaterialCalculator from './views/MaterialCalculator';
import RenovationPlanner from './views/RenovationPlanner';
import Toolbox from './views/Toolbox';

import API_BASE_URL from './config'; // Ensure this is imported

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Theme & Settings
  const [theme, setTheme] = useLocalStorage('light', 're4b-theme');
  const [currency, setCurrency] = useLocalStorage('USD', 're4b-currency');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage(false, 're4b-sidebar-collapsed');

  // Data Persistence
  const [budgetItems, setBudgetItems] = useLocalStorage(INITIAL_BUDGET_ITEMS, 're4b-budget');
  const [tasks, setTasks] = useLocalStorage(INITIAL_TIMELINE, 're4b-timeline');
  const [activity, setActivity] = useLocalStorage(INITIAL_ACTIVITY, 're4b-activity');
  const [gallery, setGallery] = useLocalStorage(INITIAL_GALLERY, 're4b-gallery');
  const [rooms, setRooms] = useLocalStorage(DEFAULT_ROOMS, 're4b-rooms-list');
  const [categories, setCategories] = useLocalStorage(DEFAULT_CATEGORIES, 're4b-categories-list');
  const [renovationPlans, setRenovationPlans] = useLocalStorage([], 're4b-renovation-plans');
  const [inventory, setInventory] = useLocalStorage([], 're4b-tool-inventory');

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const alertCount = budgetItems.filter(i => !i.paid && i.estimated > 1000).length;
  const CURRENCIES = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'CAD': 'C$', 'JPY': '¥' };
  const currencySymbol = CURRENCIES[currency];

  // Reset Data Handler
  const handleResetData = () => {
    if (window.confirm("Are you sure? This will delete ALL your saved projects, budget, and settings.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const renderContent = () => {
    const props = { currencySymbol }; 
    const listProps = { rooms, setRooms, categories, setCategories };

    switch (activeTab) {
      case 'dashboard': return <Dashboard budgetItems={budgetItems} timeline={tasks} activity={activity} gallery={gallery} setGallery={setGallery} renovationPlans={renovationPlans} inventory={inventory} setActiveTab={setActiveTab} {...props} />;
      case 'budget': return <BudgetTracker items={budgetItems} setItems={setBudgetItems} {...listProps} {...props} />;
      case 'design': return <DesignStudio setGallery={setGallery} rooms={rooms} setRooms={setRooms} {...props} />;
      case 'planner': return <RenovationPlanner plans={renovationPlans} setPlans={setRenovationPlans} setBudgetItems={setBudgetItems} setTasks={setTasks} setActiveTab={setActiveTab} inventory={inventory} setInventory={setInventory} {...props} />;
      case 'tools': return <Toolbox inventory={inventory} setInventory={setInventory} {...props} />;
      case 'timeline': return <ProjectTimeline tasks={tasks} setTasks={setTasks} {...props} />;
      case 'calculator': return <MaterialCalculator setBudgetItems={setBudgetItems} {...props} />;
      default: return <Dashboard budgetItems={budgetItems} timeline={tasks} activity={activity} gallery={gallery} setGallery={setGallery} setActiveTab={setActiveTab} {...props} />;
    }
  };

  const NavItem = ({ id, icon: Icon, label, alert }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all w-full relative group
        ${activeTab === id 
          ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/20 dark:text-blue-400' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
        }
        ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}
      `}
      title={isSidebarCollapsed ? label : ''}
    >
      <div className="relative shrink-0">
        <Icon size={22} />
        {alert && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
      </div>
      {!isSidebarCollapsed && <span className="hidden md:block truncate transition-opacity duration-300 animate-in fade-in">{label}</span>}
      {isSidebarCollapsed && <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">{label}</div>}
    </button>
  );

  return (
    // MOBILE OPTIMIZATION: Use h-[100dvh] to fix mobile browser address bar issues
    <div className="h-[100dvh] overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Sidebar (Desktop Only) */}
      <aside className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 fixed h-full z-20 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-3 bottom-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 p-1.5 rounded-full shadow-md transition-transform hover:scale-110 active:scale-95 z-30 flex items-center justify-center group">
          {isSidebarCollapsed ? <ChevronRight size={14} className="group-hover:animate-pulse" /> : <ChevronLeft size={14} />}
        </button>

        <div className={`flex items-center gap-2 px-2 mb-8 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20 shrink-0">r</div>
          {!isSidebarCollapsed && <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2">re4b</span>}
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="budget" icon={Wallet} label="Budget" alert={alertCount > 0} />
          <NavItem id="design" icon={PaintBucket} label="Design Studio" />
          <NavItem id="planner" icon={ClipboardList} label="Renovation Plan" />
          <NavItem id="tools" icon={Wrench} label="My Toolbox" />
          <NavItem id="timeline" icon={ListTodo} label="Timeline" />
          <NavItem id="calculator" icon={Calculator} label="Calculators" />
        </nav>

        <div className="mt-auto space-y-4">
          <div className="px-1 py-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setIsSettingsOpen(true)} className={`flex items-center gap-3 w-full text-left hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors group ${isSidebarCollapsed ? 'justify-center' : ''}`} title="User Settings">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0"><Settings size={16} /></div>
              {!isSidebarCollapsed && <div className="text-sm overflow-hidden"><div className="font-medium dark:text-slate-200 truncate">Demo User</div><div className="text-slate-500 dark:text-slate-500 text-xs truncate">{currency} • Free Plan</div></div>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 h-full overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <header className="shrink-0 flex justify-end items-center p-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm z-30">
           <div>
             <button onClick={toggleTheme} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}<span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
           </div>
        </header>

        {/* MOBILE OPTIMIZATION: Added 'pb-24' to prevent content being hidden behind bottom nav on phones */}
        <div className="flex-1 overflow-y-scroll p-4 md:p-8 pt-0 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto w-full">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="User Settings">
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
             <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><UserCircle size={32} /></div>
             <div><h4 className="font-bold text-slate-900 dark:text-white">Demo User</h4><p className="text-sm text-slate-500 dark:text-slate-400">demo@re4b.app</p></div>
          </div>
          <div className="space-y-4">
             <Select label="Preferred Currency" options={Object.keys(CURRENCIES)} value={currency} onChange={(e) => setCurrency(e.target.value)} />
             <div className="pt-2">
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Appearance</label>
               <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setTheme('light')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all ${theme === 'light' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Sun size={18} /> Light</button>
                 <button onClick={() => setTheme('dark')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white ring-2 ring-slate-600/50' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'}`}><Moon size={18} /> Dark</button>
               </div>
             </div>
             <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
               <label className="block text-xs font-bold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1"><AlertTriangle size={12} /> Danger Zone</label>
               <button onClick={handleResetData} className="w-full p-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/30">Reset All App Data</button>
             </div>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end"><Button onClick={() => setIsSettingsOpen(false)}>Done</Button></div>
        </div>
      </Modal>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around p-4 z-50 pb-safe transition-colors duration-300">
        <button onClick={() => setActiveTab('dashboard')} className={`${activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}><LayoutDashboard size={24} /></button>
        <button onClick={() => setActiveTab('budget')} className={`${activeTab === 'budget' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} relative`}><Wallet size={24} />{alertCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}</button>
        <button onClick={() => setActiveTab('design')} className={`${activeTab === 'design' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}><PaintBucket size={24} /></button>
        <button onClick={() => setActiveTab('planner')} className={`${activeTab === 'planner' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}><ClipboardList size={24} /></button>
        <button onClick={() => setActiveTab('tools')} className={`${activeTab === 'tools' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}><Wrench size={24} /></button>
      </nav>
    </div>
  );
};

export default App;