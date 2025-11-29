import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  DollarSign, 
  Save, 
  CreditCard, 
  Calendar, 
  Landmark,
  Download,
  Settings,
  X,
  AlertTriangle,
  Check
} from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Input, Select, TextArea, DatePicker } from '../components/FormElements';
import { PAYMENT_METHODS } from '../data/mockData';
import { useLocalStorage } from '../hooks/useLocalStorage';

const BudgetTracker = ({ items, setItems, rooms, setRooms, categories, setCategories, currencySymbol = "$" }) => {
  // Form & List State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isManageListsOpen, setIsManageListsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Deletion State
  const [itemToDelete, setItemToDelete] = useState(null);
  const [confirmDeletePref, setConfirmDeletePref] = useLocalStorage(true, 're4b-confirm-delete');
  const [dontAskChecked, setDontAskChecked] = useState(false);

  // List Management State
  const [newRoom, setNewRoom] = useState('');
  const [newCategory, setNewCategory] = useState('');
  
  // Inline Add State
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [tempNewItem, setTempNewItem] = useState(''); 

  const [filterRoom, setFilterRoom] = useState('All Rooms');
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [searchTerm, setSearchTerm] = useState('');
  
  const initialFormState = {
    name: '', estimated: '', actual: '', category: categories[0] || 'Materials', 
    room: rooms[0] || 'Kitchen', paymentMethod: 'Credit Card', paid: false, notes: '',
    installments: '12', financeProvider: '', nextPaymentDate: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const stats = useMemo(() => {
    const totalEst = items.reduce((acc, i) => acc + Number(i.estimated), 0);
    const totalPaid = items.reduce((acc, i) => acc + Number(i.actual || 0), 0);
    const remaining = totalEst - totalPaid;
    const paidItems = items.filter(i => i.paid).length;
    return { totalEst, totalPaid, remaining, paidItems };
  }, [items]);

  const filteredItems = items.filter(item => {
    const matchesRoom = filterRoom === 'All Rooms' || item.room === filterRoom;
    const matchesCat = filterCategory === 'All Categories' || item.category === filterCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRoom && matchesCat && matchesSearch;
  });

  // --- Handlers ---
  
  const handleEditClick = (item) => {
    setEditingId(item.id);
    setFormData({ ...initialFormState, ...item });
    setIsFormOpen(true);
    setIsAddingRoom(false);
    setIsAddingCategory(false);
    setTempNewItem('');
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setTimeout(() => {
      setEditingId(null);
      setFormData(initialFormState);
      setIsAddingRoom(false);
      setIsAddingCategory(false);
      setTempNewItem('');
    }, 200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.estimated) return;

    if (editingId) {
      setItems(items.map(item => 
        item.id === editingId ? { ...item, ...formData, estimated: Number(formData.estimated), actual: Number(formData.actual) || 0 } : item
      ));
    } else {
      const newItem = {
        id: Date.now(),
        ...formData,
        estimated: Number(formData.estimated),
        actual: Number(formData.actual) || 0,
        date: new Date().toISOString().split('T')[0]
      };
      setItems([newItem, ...items]);
    }
    handleCancel();
  };

  const handleDeleteClick = (id) => {
    if (!confirmDeletePref) {
      performDelete(id);
    } else {
      setItemToDelete(id);
      setDontAskChecked(false);
    }
  };

  const performDelete = (id) => {
    setItems(items.filter(i => i.id !== id));
    if (editingId === id) handleCancel();
    setItemToDelete(null);
  };

  const confirmDelete = () => {
    if (dontAskChecked) {
      setConfirmDeletePref(false);
    }
    if (itemToDelete) {
      performDelete(itemToDelete);
    }
  };

  const togglePaid = (id) => {
    setItems(items.map(i => i.id === id ? { ...i, paid: !i.paid } : i));
  };
  
  const handleAddRoom = (e) => {
    e.preventDefault();
    if (newRoom && !rooms.includes(newRoom)) {
      setRooms([...rooms, newRoom]);
      setNewRoom('');
    }
  };
  
  const handleDeleteRoom = (roomToDelete) => {
    if (window.confirm(`Delete room "${roomToDelete}"?`)) {
      setRooms(rooms.filter(r => r !== roomToDelete));
      if (filterRoom === roomToDelete) setFilterRoom('All Rooms');
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };
  
  const handleDeleteCategory = (catToDelete) => {
    if (window.confirm(`Delete category "${catToDelete}"?`)) {
      setCategories(categories.filter(c => c !== catToDelete));
      if (filterCategory === catToDelete) setFilterCategory('All Categories');
    }
  };

  const saveInlineRoom = () => {
    if (tempNewItem && !rooms.includes(tempNewItem)) {
      setRooms([...rooms, tempNewItem]);
      setFormData({ ...formData, room: tempNewItem });
    }
    setIsAddingRoom(false);
    setTempNewItem('');
  };

  const saveInlineCategory = () => {
    if (tempNewItem && !categories.includes(tempNewItem)) {
      setCategories([...categories, tempNewItem]);
      setFormData({ ...formData, category: tempNewItem });
    }
    setIsAddingCategory(false);
    setTempNewItem('');
  };

  const handleInstallmentChange = (e) => {
    const term = e.target.value; // e.g. "3 Months"
    const months = parseInt(term.split(' ')[0], 10);
    
    // Auto-calculate date: Today + N months
    if (!isNaN(months)) {
      const date = new Date();
      date.setMonth(date.getMonth() + months);
      const formatted = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      
      setFormData({ 
        ...formData, 
        installments: months.toString(),
        nextPaymentDate: formatted 
      });
    } else {
      setFormData({ ...formData, installments: '12' }); // Default fallback
    }
  };

  const StatCard = ({ label, value, subValue, type = "neutral" }) => {
    const colors = {
      neutral: "text-slate-900 dark:text-white",
      positive: "text-emerald-600 dark:text-emerald-400",
      negative: "text-red-600 dark:text-red-400",
      blue: "text-blue-600 dark:text-blue-400"
    };

    return (
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</span>
        <span className={`text-2xl font-bold font-numbers ${colors[type]}`}>{value}</span>
        {subValue && <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subValue}</span>}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Budget</h1>
          <p className="text-slate-500 dark:text-slate-400">Track expenses, payments, and balances</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Budget" value={`${currencySymbol}${stats.totalEst.toLocaleString()}`} type="neutral" />
        <StatCard label="Paid So Far" value={`${currencySymbol}${stats.totalPaid.toLocaleString()}`} subValue={`${((stats.totalPaid / stats.totalEst) * 100).toFixed(1)}%`} type="blue" />
        <StatCard label="Remaining Balance" value={`${currencySymbol}${Math.abs(stats.remaining).toLocaleString()}`} subValue={stats.remaining >= 0 ? "Left to Spend" : "Over Budget"} type={stats.remaining >= 0 ? "positive" : "negative"} />
        <StatCard label="Items Settled" value={`${stats.paidItems} / ${items.length}`} subValue="Marked as Paid" type="neutral" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search expenses..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select options={['All Categories', ...categories]} value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full md:w-48" />
          <Select options={['All Rooms', ...rooms]} value={filterRoom} onChange={e => setFilterRoom(e.target.value)} className="w-full md:w-48" />
        </div>
      </div>

      {/* Budget List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="w-[30%] p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item & Room</th>
                <th className="w-[15%] p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <th className="w-[10%] p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Estimated</th>
                <th className="w-[10%] p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Paid</th>
                <th className="w-[15%] p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Balance</th>
                <th className="w-[10%] p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="w-[10%] p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map((item) => {
                const diff = item.estimated - (item.actual || 0);
                let balanceLabel = '';
                let balanceColor = '';
                
                if (!item.paid) {
                   balanceLabel = `${currencySymbol}${diff.toLocaleString()} Left`;
                   balanceColor = 'text-blue-600 dark:text-blue-400';
                   if (diff < 0) {
                     balanceLabel = `-${currencySymbol}${Math.abs(diff).toLocaleString()}`;
                     balanceColor = 'text-red-500';
                   }
                } else {
                   if (diff === 0) {
                     balanceLabel = '-';
                     balanceColor = 'text-slate-400 dark:text-slate-600 font-bold';
                   } else if (diff > 0) {
                     balanceLabel = `+${currencySymbol}${diff.toLocaleString()}`;
                     balanceColor = 'text-emerald-600 dark:text-emerald-400';
                   } else {
                     balanceLabel = `-${currencySymbol}${Math.abs(diff).toLocaleString()}`;
                     balanceColor = 'text-red-500';
                   }
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="p-4 truncate">
                      <div className="font-medium text-slate-900 dark:text-white truncate">{item.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-0.5 mt-0.5">
                        <span className="flex items-center gap-1 truncate">
                          {item.room}
                          {item.notes && <span className="text-slate-300">•</span>}
                          {item.notes && <span className="truncate max-w-[150px]">{item.notes}</span>}
                        </span>
                        {item.paymentMethod === 'Finance' && (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {item.installments}mo via {item.financeProvider || 'Provider'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-1 truncate max-w-full">
                          {item.paymentMethod === 'Finance' ? <Landmark size={10} /> : <CreditCard size={10} />}
                          {item.paymentMethod}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-numbers text-sm text-slate-600 dark:text-slate-300">
                      {currencySymbol}{item.estimated.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                       <span className={`font-bold font-numbers text-sm ${item.actual > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-600'}`}>
                         {item.actual ? `${currencySymbol}${item.actual.toLocaleString()}` : '0'}
                       </span>
                    </td>
                    <td className="p-4 text-right">
                       <span className={`font-numbers text-sm font-medium ${balanceColor}`}>
                         {balanceLabel}
                       </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => togglePaid(item.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors border ${
                          item.paid
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {item.paid && <CheckCircle2 size={12} />}
                        {item.paid ? 'Settled' : 'Open'}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEditClick(item)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteClick(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals Footer */}
            <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-100 dark:border-slate-800">
               <tr>
                 <td colSpan="2" className="p-4 text-sm font-bold text-slate-900 dark:text-white text-right uppercase tracking-wider">Total</td>
                 <td className="p-4 text-right font-bold font-numbers text-slate-900 dark:text-white">{currencySymbol}{stats.totalEst.toLocaleString()}</td>
                 <td className="p-4 text-right font-bold font-numbers text-slate-900 dark:text-white">{currencySymbol}{stats.totalPaid.toLocaleString()}</td>
                 <td className="p-4 text-right font-bold font-numbers">
                    <span className={stats.remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>
                      {stats.remaining >= 0 
                        ? `+${currencySymbol}${stats.remaining.toLocaleString()}` 
                        : `-${currencySymbol}${Math.abs(stats.remaining).toLocaleString()}`
                      }
                    </span>
                 </td>
                 <td colSpan="2"></td>
               </tr>
            </tfoot>
          </table>
        </div>

        {/* Bottom Actions Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center rounded-b-xl">
          <div className="flex gap-2">
            <Button variant="outline" className="text-xs" icon={Download}>Export CSV</Button>
            <Button variant="outline" className="text-xs" icon={Settings} onClick={() => setIsManageListsOpen(true)}>Manage Lists</Button>
          </div>
          <Button 
            variant="primary" 
            onClick={() => { setEditingId(null); setFormData(initialFormState); setIsFormOpen(true); }} 
            icon={Plus}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Main Expense Form Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCancel} title={editingId ? 'Edit Expense' : 'Add New Expense'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Item Name" placeholder="e.g. Kitchen Faucet" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required autoFocus />
          <div className="grid grid-cols-2 gap-4">
             <Input label="Est. Cost" type="number" icon={<span className="text-sm font-numbers">{currencySymbol}</span>} value={formData.estimated} onChange={e => setFormData({...formData, estimated: e.target.value})} required />
             <Input label="Paid So Far" type="number" icon={<span className="text-sm font-numbers">{currencySymbol}</span>} value={formData.actual} onChange={e => setFormData({...formData, actual: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Category Select with Inline Add */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Category</label>
                <button 
                  type="button" 
                  onClick={() => { setIsAddingCategory(!isAddingCategory); setTempNewItem(''); }}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Plus size={10} /> {isAddingCategory ? 'Cancel' : 'Add New'}
                </button>
              </div>
              {isAddingCategory ? (
                 <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                    <input 
                      autoFocus
                      className="w-full p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="New Category..."
                      value={tempNewItem}
                      onChange={e => setTempNewItem(e.target.value)}
                    />
                    <button type="button" onClick={saveInlineCategory} disabled={!tempNewItem} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                       <Check size={16} />
                    </button>
                 </div>
              ) : (
                <Select options={categories} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              )}
            </div>

            {/* Room Select with Inline Add */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Room</label>
                <button 
                  type="button" 
                  onClick={() => { setIsAddingRoom(!isAddingRoom); setTempNewItem(''); }}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Plus size={10} /> {isAddingRoom ? 'Cancel' : 'Add New'}
                </button>
              </div>
              {isAddingRoom ? (
                 <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                    <input 
                      autoFocus
                      className="w-full p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="New Room..."
                      value={tempNewItem}
                      onChange={e => setTempNewItem(e.target.value)}
                    />
                    <button type="button" onClick={saveInlineRoom} disabled={!tempNewItem} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                       <Check size={16} />
                    </button>
                 </div>
              ) : (
                <Select options={rooms} value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} />
              )}
            </div>
          </div>
          
          <Select label="Payment Method" options={PAYMENT_METHODS} value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} />

          {/* Conditional Finance Fields */}
          {formData.paymentMethod === 'Finance' && (
             <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl space-y-4 border border-blue-100 dark:border-blue-900/30 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wide">
                  <Landmark size={14} /> Finance Details
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* FIXED: Added handleInstallmentChange here */}
                  <Select 
                    label="Term" 
                    options={['3 Months', '6 Months', '12 Months', '24 Months', '36 Months']} 
                    value={formData.installments ? `${formData.installments} Months` : '12 Months'} 
                    onChange={handleInstallmentChange} 
                  />
                  <Input label="Provider" placeholder="e.g. Affirm, Klarna" value={formData.financeProvider} onChange={e => setFormData({...formData, financeProvider: e.target.value})} />
                </div>
                <DatePicker label="Next Payment Date" value={formData.nextPaymentDate} onChange={e => setFormData({...formData, nextPaymentDate: e.target.value})} />
             </div>
          )}

          <TextArea label="Notes (Optional)" placeholder="Invoice #, vendor details..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
              <Button variant="secondary" onClick={handleCancel} type="button">Cancel</Button>
              <Button variant="primary" type="submit" icon={editingId ? Save : Plus}>{editingId ? 'Save Changes' : 'Add Expense'}</Button>
          </div>
        </form>
      </Modal>

      {/* Manage Lists Modal */}
      <Modal isOpen={isManageListsOpen} onClose={() => setIsManageListsOpen(false)} title="Manage Lists">
        <div className="grid grid-cols-2 gap-8 min-h-[300px]">
          {/* Rooms Column */}
          <div className="flex flex-col h-full">
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Rooms</h4>
            <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-3 bg-slate-50 dark:bg-slate-800/50">
               <div className="overflow-y-auto max-h-[300px] p-2 space-y-1">
                 {rooms.map(room => (
                   <div key={room} className="flex justify-between items-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 group">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{room}</span>
                      <button onClick={() => handleDeleteRoom(room)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><X size={14} /></button>
                   </div>
                 ))}
               </div>
            </div>
            <form onSubmit={handleAddRoom} className="flex gap-2">
              <input 
                className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none focus:border-blue-500"
                placeholder="New Room..." 
                value={newRoom}
                onChange={e => setNewRoom(e.target.value)}
              />
              <Button variant="secondary" type="submit" disabled={!newRoom} className="px-3"><Plus size={18} /></Button>
            </form>
          </div>

          {/* Categories Column */}
          <div className="flex flex-col h-full">
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Categories</h4>
            <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-3 bg-slate-50 dark:bg-slate-800/50">
               <div className="overflow-y-auto max-h-[300px] p-2 space-y-1">
                 {categories.map(cat => (
                   <div key={cat} className="flex justify-between items-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 group">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat}</span>
                      <button onClick={() => handleDeleteCategory(cat)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><X size={14} /></button>
                   </div>
                 ))}
               </div>
            </div>
            <form onSubmit={handleAddCategory} className="flex gap-2">
               <input 
                className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none focus:border-blue-500"
                placeholder="New Category..." 
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
              />
              <Button variant="secondary" type="submit" disabled={!newCategory} className="px-3"><Plus size={18} /></Button>
            </form>
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
           <Button onClick={() => setIsManageListsOpen(false)}>Done</Button>
        </div>
      </Modal>

      {/* Confirmation Modal for Deletion */}
      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Delete Expense">
        <div className="flex flex-col gap-4">
           <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-red-900 dark:text-red-300 text-sm uppercase tracking-wide mb-1">Warning</h4>
                <p className="text-sm text-red-700 dark:text-red-200">Are you sure you want to delete this expense? This action cannot be undone.</p>
              </div>
           </div>
           
           <div className="flex items-center gap-2 px-1">
             <input 
               type="checkbox" 
               id="dontAsk" 
               checked={dontAskChecked}
               onChange={e => setDontAskChecked(e.target.checked)}
               className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
             />
             <label htmlFor="dontAsk" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">Don't ask me again</label>
           </div>

           <div className="flex justify-end gap-3 mt-2">
             <Button variant="secondary" onClick={() => setItemToDelete(null)}>Cancel</Button>
             <Button variant="danger" onClick={confirmDelete}>Delete Expense</Button>
           </div>
        </div>
      </Modal>

    </div>
  );
};

export default BudgetTracker;