import React, { useState } from 'react';
import { 
  Wrench, Search, Plus, Trash2, CheckCircle2, Circle, 
  Package, DollarSign, Filter 
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const Toolbox = ({ inventory, setInventory, currencySymbol }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTool, setNewTool] = useState({ name: '', price: '', category: 'General' });

  const CATEGORIES = ['General', 'Painting', 'Electrical', 'Plumbing', 'Woodwork', 'Safety'];

  // --- Handlers ---

  const toggleOwnership = (id) => {
    setInventory(inventory.map(t => t.id === id ? { ...t, owned: !t.owned } : t));
  };

  const deleteTool = (id) => {
    if (window.confirm('Remove this tool from your inventory?')) {
      setInventory(inventory.filter(t => t.id !== id));
    }
  };

  const handleAddTool = (e) => {
    e.preventDefault();
    if (!newTool.name) return;
    
    const tool = {
      id: Date.now(),
      name: newTool.name,
      price: parseFloat(newTool.price) || 0,
      category: newTool.category,
      owned: true
    };

    setInventory([tool, ...inventory]);
    setNewTool({ name: '', price: '', category: 'General' });
    setIsAdding(false);
  };

  // --- Derived Data ---
  
  const filteredTools = inventory.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: inventory.length,
    owned: inventory.filter(t => t.owned).length,
    value: inventory.filter(t => t.owned).reduce((acc, t) => acc + t.price, 0)
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Toolbox</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your tools inventory to get accurate project estimates.</p>
        </div>
        <div className="flex gap-4 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="px-3 py-1">
             <span className="block text-xs text-slate-400 uppercase font-bold">Tools Owned</span>
             <span className="text-lg text-slate-900 dark:text-white font-numbers">{stats.owned} <span className="text-slate-400">/ {stats.total}</span></span>
           </div>
           <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
           <div className="px-3 py-1">
             <span className="block text-xs text-slate-400 uppercase font-bold">Total Value</span>
             <span className="text-lg text-emerald-600 dark:text-emerald-400 font-numbers">{currencySymbol}{stats.value.toLocaleString()}</span>
           </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search tools..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsAdding(!isAdding)}>Add Tool</Button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 animate-in slide-in-from-top-2">
           <form onSubmit={handleAddTool} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Tool Name</label>
                <input autoFocus className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm" placeholder="e.g. Impact Driver" value={newTool.name} onChange={e => setNewTool({...newTool, name: e.target.value})} required />
              </div>
              <div className="w-full md:w-32 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Price</label>
                <input type="number" className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-numbers" placeholder="0.00" value={newTool.price} onChange={e => setNewTool({...newTool, price: e.target.value})} />
              </div>
              <div className="w-full md:w-48 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                <select className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800" value={newTool.category} onChange={e => setNewTool({...newTool, category: e.target.value})}>
                   {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                 <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
                 <Button type="submit" variant="primary">Save</Button>
              </div>
           </form>
        </Card>
      )}

      {/* Tool List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.length === 0 && (
           <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
             <Wrench size={48} className="mx-auto mb-3 opacity-20" />
             <p>No tools found. Start building your kit!</p>
           </div>
        )}

        {filteredTools.map((tool) => (
          <div 
            key={tool.id} 
            className={`group p-4 rounded-xl border transition-all duration-300 flex justify-between items-center ${tool.owned ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-70 hover:opacity-100'}`}
          >
             <div className="flex items-center gap-4">
                <button onClick={() => toggleOwnership(tool.id)} className={`transition-colors ${tool.owned ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 hover:text-slate-400'}`}>
                   {tool.owned ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                <div>
                   <h3 className={`font-bold text-sm ${tool.owned ? 'text-slate-900 dark:text-white' : 'text-slate-500 line-through'}`}>{tool.name}</h3>
                   <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{tool.category}</span>
                      <span className="text-xs text-slate-500 font-numbers">{currencySymbol}{tool.price}</span>
                   </div>
                </div>
             </div>
             <button onClick={() => deleteTool(tool.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">
               <Trash2 size={16} />
             </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Toolbox;