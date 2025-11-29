import React, { useState } from 'react';
import { 
  ArrowRight, Upload, Scale, Hammer, AlertTriangle, 
  CheckCircle2, PlayCircle, Plus, Trash2, Calculator,
  DollarSign, FileText, ChevronDown, ChevronUp, Search,
  HardHat, Wrench, ShieldAlert, Save, Calendar, Archive,
  Ruler, MapPin, Info, PenLine, CheckSquare, Square
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Input, Select, TextArea } from '../components/FormElements';
import API_BASE_URL from '../config'; // Import Config

// --- Static Guides for Common Materials ---
const STATIC_MEASUREMENT_GUIDES = {
  paint: "**For Paint:** Measure the height and width of each wall to get the total area. Crucially, **subtract the area of doors and windows** (approx. 20 sq ft per door, 15 sq ft per window) to avoid overbuying.",
  flooring: "**For Flooring:** Measure the length and width of the floor in a straight line from wall to wall. Multiply to get the area. Add **10% extra** to your total for waste and cuts.",
  tile: "**For Tiles:** Calculate the total area (Length × Width). Add **15% extra** for breakage and complex cuts.",
  wallpaper: "**For Wallpaper:** Measure wall width and height. Ignore doors/windows initially to ensure pattern matching continuity, but subtract them if using a plain texture."
};

const FormattedText = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

const RenovationPlanner = ({ currencySymbol, plans, setPlans, setBudgetItems, setTasks, setActiveTab, inventory, setInventory }) => {
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [plan, setPlan] = useState(null);
  
  // Context for Measurements
  const [projectContext, setProjectContext] = useState('');

  // Project State
  const [measurements, setMeasurements] = useState({});
  const [videoLinks, setVideoLinks] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [expandedPhase, setExpandedPhase] = useState(0); 
  const [projectName, setProjectName] = useState('New Project');
  
  // Cost & Tools State
  const [resourceTab, setResourceTab] = useState('materials');
  const [customPrices, setCustomPrices] = useState({});

  const [modalConfig, setModalConfig] = useState({
    isOpen: false, title: '', message: '', primaryAction: null, primaryLabel: 'OK', secondaryLabel: 'Close', showSecondary: true
  });
  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  // --- Helpers for Global Inventory ---
  const isToolOwned = (toolName) => {
    if (!inventory) return false;
    return inventory.some(t => t.name.toLowerCase() === toolName.toLowerCase() && t.owned);
  };

  const toggleToolOwnership = (toolName, currentPrice) => {
    if (!inventory) return;
    const existing = inventory.find(t => t.name.toLowerCase() === toolName.toLowerCase());
    
    if (existing) {
      setInventory(inventory.map(t => t.id === existing.id ? { ...t, owned: !t.owned } : t));
    } else {
      const newTool = {
        id: Date.now(),
        name: toolName,
        price: currentPrice || 0,
        category: 'General',
        owned: true
      };
      setInventory([...inventory, newTool]);
    }
  };

  // --- Handlers ---
  
  const handleLoadPlan = (e) => {
    const selectedName = e.target.value;
    const selected = plans.find(p => p.name === selectedName);
    if (selected) {
      setPlan(selected.data);
      setProjectName(selected.name);
      setMeasurements(selected.measurements || {});
      setVideoLinks(selected.videoLinks || []);
      setBeforeImage(selected.beforeImage);
      setAfterImage(selected.afterImage);
      setCustomPrices(selected.customPrices || {});
      setProjectContext(selected.projectContext || '');
    }
  };

  const handleSavePlan = () => {
    if (!plan) return;
    const newPlan = {
      id: Date.now(),
      name: projectName,
      data: plan,
      measurements,
      videoLinks,
      beforeImage,
      afterImage,
      customPrices,
      projectContext,
      date: new Date().toLocaleDateString()
    };
    
    const existingIndex = plans.findIndex(p => p.name === projectName);
    if (existingIndex >= 0) {
      const updated = [...plans];
      updated[existingIndex] = newPlan;
      setPlans(updated);
    } else {
      setPlans([newPlan, ...plans]);
    }
    setModalConfig({ isOpen: true, title: 'Project Saved', message: `"${projectName}" has been saved.`, primaryAction: closeModal, primaryLabel: 'Done', showSecondary: false });
  };

  const handleExportToBudget = () => {
    if (!plan) return;
    
    const materialItems = plan.materials.map((m, i) => {
      const qty = parseFloat(measurements[m.id] || 0);
      const price = customPrices[m.id] !== undefined ? customPrices[m.id] : m.unitPrice;
      return { id: Date.now() + i, name: m.name, category: 'Materials', room: projectName, estimated: qty * price, actual: 0, paid: false, paymentMethod: 'Credit Card', date: new Date().toISOString().split('T')[0], notes: `Imported: ${qty} ${m.unit}` };
    });

    const toolItems = plan.toolsList
      .filter(t => !isToolOwned(t.name))
      .map((t, i) => {
        const price = customPrices[t.name] !== undefined ? customPrices[t.name] : t.price;
        return { id: Date.now() + 100 + i, name: t.name, category: 'Tools', room: projectName, estimated: price, actual: 0, paid: false, paymentMethod: 'Credit Card', date: new Date().toISOString().split('T')[0], notes: 'New Tool Required' };
      });

    setBudgetItems(prev => [...materialItems, ...toolItems, ...prev]);
    setModalConfig({ isOpen: true, title: 'Budget Updated', message: `Added ${materialItems.length} materials and ${toolItems.length} tools to your Budget Tracker.`, primaryAction: () => { closeModal(); setActiveTab('budget'); }, primaryLabel: 'View Budget', secondaryLabel: 'Stay Here', showSecondary: true });
  };

  const handleExportToTimeline = () => {
    if (!plan) return;
    const newTasks = plan.phases.map((phase, i) => ({ id: Date.now() + i, title: `${projectName}: ${phase.name}`, phase: i === 0 ? "Demolition" : "Rough-in", startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], status: 'pending', assignee: 'Contractor', notes: `${phase.steps.length} steps.` }));
    setTasks(prev => [...prev, ...newTasks]);
    setModalConfig({ isOpen: true, title: 'Timeline Updated', message: `Added ${newTasks.length} phases to Timeline.`, primaryAction: () => { closeModal(); setActiveTab('timeline'); }, primaryLabel: 'View Timeline', secondaryLabel: 'Stay Here', showSecondary: true });
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { if (type === 'before') setBeforeImage(reader.result); else setAfterImage(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!beforeImage || !afterImage) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-renovation`, { // Updated URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beforeImage, afterImage, currencySymbol, userNotes: projectContext })
      });
      const data = await response.json();
      if (data.success) {
        setPlan(data.plan);
        const initialMeasurements = {};
        data.plan.materials.forEach(m => initialMeasurements[m.id] = m.defaultQty || 0);
        setMeasurements(initialMeasurements);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Could not analyze renovation. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddVideo = () => { if (newLink) { setVideoLinks([...videoLinks, newLink]); setNewLink(''); } };
  const handlePriceChange = (id, newPrice) => setCustomPrices(prev => ({ ...prev, [id]: parseFloat(newPrice) || 0 }));

  const calculateTotalCost = () => {
    if (!plan) return 0;
    
    const materialCost = plan.materials.reduce((acc, item) => {
      const qty = parseFloat(measurements[item.id] || 0);
      const price = customPrices[item.id] !== undefined ? customPrices[item.id] : item.unitPrice;
      return acc + (qty * price);
    }, 0);

    const toolCost = plan.toolsList.reduce((acc, tool) => {
      if (isToolOwned(tool.name)) return acc; 
      const price = customPrices[tool.name] !== undefined ? customPrices[tool.name] : tool.price;
      return acc + price;
    }, 0);

    return materialCost + toolCost;
  };

  const getMeasurementGuides = () => {
    if (!plan) return [];
    const guides = [];
    const materialNames = plan.materials.map(m => m.name.toLowerCase());
    
    if (materialNames.some(n => n.includes('paint') || n.includes('primer'))) guides.push(STATIC_MEASUREMENT_GUIDES.paint);
    if (materialNames.some(n => n.includes('floor') || n.includes('laminate') || n.includes('wood'))) guides.push(STATIC_MEASUREMENT_GUIDES.flooring);
    if (materialNames.some(n => n.includes('tile'))) guides.push(STATIC_MEASUREMENT_GUIDES.tile);
    if (materialNames.some(n => n.includes('wallpaper'))) guides.push(STATIC_MEASUREMENT_GUIDES.wallpaper);
    
    if (plan.measurementGuide) {
      plan.measurementGuide.forEach(g => {
        const isDuplicate = guides.some(existing => (existing.includes("Paint") && g.includes("Paint")) || (existing.includes("Flooring") && g.includes("Flooring")));
        if (!isDuplicate) guides.push(g);
      });
    }
    return guides;
  };

  // --- Components ---
  const RiskMeter = ({ rating }) => {
    const positions = { Low: '10%', Medium: '50%', High: '90%' };
    const colors = { Low: 'bg-emerald-500', Medium: 'bg-amber-500', High: 'bg-red-500' };
    const textColors = { Low: 'text-emerald-600', Medium: 'text-amber-600', High: 'text-red-600' };

    return (
      <div className="relative w-64 h-8 select-none">
        <div className="absolute top-3 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
        <div className={`absolute top-3 left-0 h-1 rounded-full transition-all duration-1000 ${colors[rating]}`} style={{ width: positions[rating] }}></div>
        {['Low', 'Medium', 'High'].map((level) => (
          <div key={level} className="absolute top-5 flex flex-col items-center transform -translate-x-1/2" style={{ left: positions[level] }}>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${rating === level ? textColors[level] : 'text-slate-300 dark:text-slate-600'}`}>{level}</span>
          </div>
        ))}
        <div className={`absolute top-3 w-3 h-3 -mt-1 border-2 border-white dark:border-slate-900 rounded-full shadow-sm z-10 transition-all duration-1000 ${colors[rating]}`} style={{ left: positions[rating], transform: 'translateX(-50%)' }}></div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <Modal isOpen={modalConfig.isOpen} onClose={closeModal} title={modalConfig.title}>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
             <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={24} /></div>
             <div><p className="text-slate-600 dark:text-slate-300 leading-relaxed">{modalConfig.message}</p></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
             {modalConfig.showSecondary && <Button variant="secondary" onClick={closeModal}>{modalConfig.secondaryLabel}</Button>}
             <Button variant="primary" onClick={modalConfig.primaryAction}>{modalConfig.primaryLabel}</Button>
          </div>
        </div>
      </Modal>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div><h1 className="text-3xl font-bold text-slate-900 dark:text-white">Renovation Planner</h1><p className="text-slate-500 dark:text-slate-400 mt-1">Compare current vs. desired state to generate a detailed project roadmap.</p></div>
        {plans.length > 0 && (
          <div className="w-full md:w-64"><Select label="Load Saved Plan" options={plans.map(p => p.name)} value={plans.some(p => p.name === projectName) ? projectName : ""} onChange={handleLoadPlan} /></div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 border-dashed border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex justify-between items-center mb-3"><span className="font-bold text-slate-500 uppercase text-xs tracking-wider">Before (Current)</span>{beforeImage && <button onClick={() => setBeforeImage(null)} className="text-red-500 hover:text-red-600"><Trash2 size={16}/></button>}</div>
          <div className="aspect-video bg-white dark:bg-slate-800 rounded-lg overflow-hidden relative flex items-center justify-center group">{beforeImage ? <img src={beforeImage} alt="Before" className="w-full h-full object-cover" /> : <div className="text-center"><Upload className="mx-auto text-slate-300 mb-2" size={32} /><span className="text-sm text-slate-400 font-medium">Upload Current Room</span><input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'before')} /></div>}</div>
        </Card>
        <Card className="p-4 border-dashed border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex justify-between items-center mb-3"><span className="font-bold text-slate-500 uppercase text-xs tracking-wider">After (Goal)</span>{afterImage && <button onClick={() => setAfterImage(null)} className="text-red-500 hover:text-red-600"><Trash2 size={16}/></button>}</div>
          <div className="aspect-video bg-white dark:bg-slate-800 rounded-lg overflow-hidden relative flex items-center justify-center group">{afterImage ? <img src={afterImage} alt="After" className="w-full h-full object-cover" /> : <div className="text-center"><Upload className="mx-auto text-slate-300 mb-2" size={32} /><span className="text-sm text-slate-400 font-medium">Upload Design / Reference</span><input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'after')} /></div>}</div>
        </Card>
      </div>

      <Card className="p-4">
         <TextArea label="Project Notes / Measurements (Optional)" placeholder="e.g. 'The room is 12x14 ft', 'Ceiling is 9ft high', 'I already have paint'." value={projectContext} onChange={(e) => setProjectContext(e.target.value)} className="h-32 min-h-32" />
      </Card>

      {!plan && (
        <div className="flex justify-center">
          <Button variant="primary" className="w-full md:w-auto px-12 py-4 text-lg font-bold shadow-xl shadow-blue-500/20" disabled={!beforeImage || !afterImage || isAnalyzing} onClick={handleAnalyze}>
            {isAnalyzing ? 'Analyzing Details...' : 'Analyze & Plan Project'}
            {!isAnalyzing && <ArrowRight size={20} className="ml-2" />}
          </Button>
        </div>
      )}

      {plan && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="flex items-center gap-3 w-full md:w-auto">
               <span className="text-sm font-bold text-slate-500">Project Name:</span>
               <input className="bg-transparent border-b border-slate-300 dark:border-slate-700 text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
             </div>
             <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" onClick={handleSavePlan} icon={Save}>Save Plan</Button>
                <Button variant="outline" onClick={handleExportToBudget} icon={DollarSign}>Export to Budget</Button>
                <Button variant="outline" onClick={handleExportToTimeline} icon={Calendar}>Export to Schedule</Button>
             </div>
          </div>

          <Card className="p-6">
             <div className="flex flex-wrap justify-between items-center mb-2 gap-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><HardHat size={20} className="text-blue-500" /> DIY Complexity</h3>
                <RiskMeter rating={plan.diyRating} />
             </div>
             {(plan.diyRating === 'High' || (plan.riskyPhases && plan.riskyPhases.length > 0)) && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg flex gap-3">
                   <ShieldAlert size={24} className="text-red-600 dark:text-red-400 shrink-0" />
                   <div>
                      <h4 className="font-bold text-red-900 dark:text-red-300 text-sm">Professional Recommended</h4>
                      <p className="text-xs text-red-700 dark:text-red-200 mt-1">This project involves tasks like <strong>{plan.riskyPhases?.join(', ')}</strong> that may be unsafe for beginners. Consult a pro for these specific steps.</p>
                   </div>
                </div>
             )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {plan.phases.map((phase, index) => {
                const isOpen = expandedPhase === index;
                return (
                  <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all">
                    <button onClick={() => setExpandedPhase(isOpen ? null : index)} className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{index + 1}</div>
                        <div><h4 className="font-bold text-slate-900 dark:text-white">{phase.name}</h4><p className="text-xs text-slate-500">{phase.steps.length} Steps • {phase.tools.length} Tools</p></div>
                      </div>
                      {isOpen ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                         <div className="my-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex flex-wrap gap-2 items-center"><Wrench size={16} className="text-slate-400 mr-1" />{phase.tools.map(tool => (<span key={tool} className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">{tool}</span>))}</div>
                         <div className="space-y-4">{phase.steps.map((step, sIdx) => (<div key={sIdx} className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 pb-2 last:pb-0"><div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-900"></div><p className="text-sm font-bold text-slate-800 dark:text-slate-200">{step.action}</p><p className="text-xs text-slate-500 mt-0.5">{step.detail}</p>{step.warning && <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded"><AlertTriangle size={10} /> {step.warning}</span>}</div>))}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-6">
              <Card className="p-0 overflow-hidden">
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                   <button onClick={() => setResourceTab('materials')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${resourceTab === 'materials' ? 'bg-white dark:bg-slate-900 text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>Materials</button>
                   <button onClick={() => setResourceTab('tools')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${resourceTab === 'tools' ? 'bg-white dark:bg-slate-900 text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>Tools</button>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2"><Calculator size={16} /> Total Est.</h3><span className="text-xl font-bold font-numbers text-emerald-600 dark:text-emerald-400">{currencySymbol}{calculateTotalCost().toLocaleString()}</span></div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                    {resourceTab === 'materials' && plan.materials.map((item) => {
                      const currentPrice = customPrices[item.id] !== undefined ? customPrices[item.id] : item.unitPrice;
                      return (
                        <div key={item.id} className="text-sm group">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                            <div className="flex items-center gap-0.5"><span className="text-slate-400 text-xs">{currencySymbol}</span><input type="number" className="w-12 p-0 text-right bg-transparent border-b border-transparent hover:border-slate-300 text-xs text-slate-500 focus:border-blue-500 focus:outline-none font-numbers no-spin" value={currentPrice} onChange={(e) => handlePriceChange(item.id, e.target.value)} /><span className="text-slate-400 text-xs">/{item.unit}</span></div>
                          </div>
                          <div className="flex gap-2">
                            <input type="number" className={`flex-1 p-1.5 rounded border ${measurements[item.id] > 0 ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/10 text-blue-600' : 'border-slate-200 bg-slate-50 text-slate-900'} dark:border-slate-700 dark:text-white text-xs font-numbers no-spin`} placeholder="Qty" value={measurements[item.id] || ''} onChange={(e) => setMeasurements({ ...measurements, [item.id]: e.target.value })} />
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-500 w-16 text-center">{item.unit}</div>
                          </div>
                        </div>
                      );
                    })}
                    {resourceTab === 'tools' && plan.toolsList.map((tool, i) => {
                      const isOwned = isToolOwned(tool.name);
                      const currentPrice = customPrices[tool.name] !== undefined ? customPrices[tool.name] : tool.price;
                      return (
                        <div key={i} className={`flex items-center justify-between p-2 rounded-lg border transition-all ${isOwned ? 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-800' : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700'}`}>
                           <div className="flex items-center gap-3"><button onClick={() => toggleToolOwnership(tool.name, currentPrice)} className={`transition-colors ${isOwned ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'}`}>{isOwned ? <CheckSquare size={18} /> : <Square size={18} />}</button><div><p className={`text-sm font-medium ${isOwned ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{tool.name}</p></div></div>
                           <div className={`flex items-center gap-0.5 ${isOwned ? 'opacity-50' : 'opacity-100'}`}><span className="text-xs text-slate-400">{currencySymbol}</span><input type="number" className="w-12 text-right bg-transparent border-b border-transparent hover:border-slate-300 text-sm font-numbers focus:border-blue-500 focus:outline-none no-spin" value={currentPrice} onChange={(e) => handlePriceChange(tool.name, e.target.value)} disabled={isOwned} /></div>
                        </div>
                      );
                    })}
                  </div>
                  {getMeasurementGuides().length > 0 && resourceTab === 'materials' && (
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                       <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Measurement Tips</h4>
                       <ul className="space-y-2">{getMeasurementGuides().map((guide, i) => (<li key={i} className="flex gap-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed"><Info size={12} className="mt-0.5 shrink-0 text-blue-500" /> <FormattedText text={guide} /></li>))}</ul>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2"><PlayCircle size={16} className="text-red-500" /> Resources</h3>
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">{plan.videoSearchTerms.map((term, i) => (<span key={i} className="text-xs bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 px-2 py-1 rounded cursor-pointer" onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`, '_blank')}><Search size={10} className="inline mr-1"/> {term}</span>))}</div>
                </div>
                <div className="space-y-2">
                  {videoLinks.map((link, i) => (<div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs truncate"><a href={link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate flex-1">{link}</a><button onClick={() => setVideoLinks(videoLinks.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500 ml-2"><X size={14}/></button></div>))}
                  <div className="flex gap-2"><input className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" placeholder="Paste video link..." value={newLink} onChange={(e) => setNewLink(e.target.value)} /><button onClick={handleAddVideo} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg transition-colors"><Plus size={16}/></button></div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenovationPlanner;