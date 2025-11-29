import React, { useState } from 'react';
import { 
  Wrench, Search, Plus, Trash2, CheckCircle2, Circle, 
  Package, DollarSign, Filter, ShoppingBag, AlertCircle 
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Input, Select } from '../components/FormElements';

// Remove spinner from number inputs
const styleTag = `
  .no-spin::-webkit-inner-spin-button, 
  .no-spin::-webkit-outer-spin-button { 
    -webkit-appearance: none; 
    margin: 0; 
  }
  .no-spin { 
    -moz-appearance: textfield; 
  }
`;

const Toolbox = ({ inventory, setInventory, currencySymbol }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTool, setNewTool] = useState({ name: '', price: '', category: 'General' });
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'owned', 'needed'
  
  // Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, toolId: null, toolName: '' });

  const CATEGORIES = ['General', 'Painting', 'Electrical', 'Plumbing', 'Woodwork', 'Safety', 'Power Tools'];

  // --- Handlers ---

  const toggleOwnership = (id) => {
    setInventory(inventory.map(t => t.id === id ? { ...t, owned: !t.owned } : t));
  };

  const handlePriceChange = (id, newPrice) => {
    setInventory(inventory.map(t => t.id === id ? { ...t, price: parseFloat(newPrice) || 0 } : t));
  };

  const confirmDelete = (tool) => {
    setDeleteModal({ isOpen: true, toolId: tool.id, toolName: tool.name });
  };

  const performDelete = () => {
    if (deleteModal.toolId) {
      setInventory(inventory.filter(t => t.id !== deleteModal.toolId));
      setDeleteModal({ isOpen: false, toolId: null, toolName: '' });
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
      owned: true // Default to owned when adding manually, unless specified otherwise
    };

    setInventory([tool, ...inventory]);
    setNewTool({ name: '', price: '', category: 'General' });
    setIsAdding(false);
  };

  // --- Derived Data ---
  
  const filteredTools = inventory.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                       (activeTab === 'owned' && t.owned) || 
                       (activeTab === 'needed' && !t.owned);
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: inventory.length,
    owned: inventory.filter(t => t.owned).length,
    needed: inventory.filter(t => !t.owned).length,
    value: inventory.filter(t => t.owned).reduce((acc, t) => acc + t.price, 0),
    costToAcquire: inventory.filter(t => !t.owned).reduce((acc, t) => acc + t.price, 0)
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <style>{styleTag}</style>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} 
        title="Remove Tool?"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4">
             <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                <Trash2 size={24} />
             </div>
             <div>
                <p className="text-slate-600 dark:text-slate-300">
                  Are you sure you want to remove <strong>{deleteModal.toolName}</strong> from your inventory?
                </p>
             </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
             <Button variant="secondary" onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}>Cancel</Button>
             <Button variant="danger" onClick={performDelete}>Remove Tool</Button>
          </div>
        </div>
      </Modal>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Toolbox</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track what you have and what you need for your projects.</p>
        </div>
        
        {/* Stats Cards */}
        <div className="flex gap-3">
           <div className="bg-white dark:bg-slate-900 p-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center min-w-[100px]">
             <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Owned Value</span>
             <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-numbers">{currencySymbol}{stats.value.toLocaleString()}</span>
           </div>
           {stats.costToAcquire > 0 && (
             <div className="bg-white dark:bg-slate-900 p-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center min-w-[100px]">
               <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Est. Cost</span>
               <span className="text-lg font-bold text-slate-600 dark:text-slate-300 font-numbers">{currencySymbol}{stats.costToAcquire.toLocaleString()}</span>
             </div>
           )}
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Tabs */}
        <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-lg w-full md:w-auto">
          {['all', 'owned', 'needed'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold capitalize transition-all flex-1 md:flex-none ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter tools..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setIsAdding(!isAdding)}>Add Tool</Button>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <Card className="p-5 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 animate-in slide-in-from-top-2">
           <form onSubmit={handleAddTool} className="flex flex-col md:flex-row gap-4 items-start">
              <Input 
                label="Tool Name" 
                placeholder="e.g. Impact Driver" 
                value={newTool.name} 
                onChange={e => setNewTool({...newTool, name: e.target.value})} 
                className="flex-1 w-full" 
                autoFocus 
              />
              <div className="w-full md:w-48">
                <Select 
                  label="Category" 
                  options={CATEGORIES} 
                  value={newTool.category} 
                  onChange={e => setNewTool({...newTool, category: e.target.value})} 
                />
              </div>
              <Input 
                label="Price" 
                type="number" 
                placeholder="0.00" 
                value={newTool.price} 
                onChange={e => setNewTool({...newTool, price: e.target.value})} 
                className="w-full md:w-32" 
                icon={<span className="text-xs font-bold text-slate-400">{currencySymbol}</span>}
              />
              <div className="flex gap-2 mt-auto pt-7 w-full md:w-auto">
                 <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
                 <Button type="submit" variant="primary">Save</Button>
              </div>
           </form>
        </Card>
      )}

      {/* Tool List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.length === 0 && (
           <div className="col-span-full py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
             <Wrench size={48} className="mx-auto mb-4 opacity-20" />
             <p className="font-medium">No tools found matching your criteria.</p>
             {activeTab === 'needed' && <p className="text-sm mt-1">Start a Renovation Plan to see required tools here.</p>}
           </div>
        )}

        {filteredTools.map((tool) => (
          <div 
            key={tool.id} 
            className={`group p-4 rounded-xl border transition-all duration-300 flex justify-between items-center relative overflow-hidden ${tool.owned ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/30 border-dashed border-slate-300 dark:border-slate-700'}`}
          >
             {/* Status Strip */}
             <div className={`absolute left-0 top-0 bottom-0 w-1 ${tool.owned ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>

             <div className="flex items-center gap-4 pl-2">
                <button 
                  onClick={() => toggleOwnership(tool.id)} 
                  className={`transition-colors p-1 rounded-full ${tool.owned ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:text-blue-500 hover:bg-blue-50'}`}
                  title={tool.owned ? "Mark as Needed" : "Mark as Owned"}
                >
                   {tool.owned ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                
                <div>
                   <div className="flex items-center gap-2">
                     <h3 className={`font-bold text-sm ${tool.owned ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{tool.name}</h3>
                     {!tool.owned && <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Needed</span>}
                   </div>
                   
                   <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{tool.category}</span>
                      
                      {/* Inline Editable Price */}
                      <div className="flex items-center group/price cursor-text">
                        <span className="text-xs text-slate-400 font-medium mr-0.5">{currencySymbol}</span>
                        <input 
                          type="number" 
                          className={`w-16 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-xs font-numbers focus:outline-none no-spin ${tool.owned ? 'text-emerald-600' : 'text-slate-500'}`}
                          value={tool.price}
                          onChange={(e) => handlePriceChange(tool.id, e.target.value)}
                        />
                      </div>
                   </div>
                </div>
             </div>

             <button onClick={() => confirmDelete(tool)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
               <Trash2 size={18} />
             </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Toolbox;