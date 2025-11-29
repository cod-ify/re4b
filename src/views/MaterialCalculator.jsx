import React, { useState, useEffect } from 'react';
import { Calculator, PaintBucket, Grid, Box, Square, Plus, Save, Trash2, DollarSign, Info, CheckCircle2, Settings2 } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Input } from '../components/FormElements';
import { useLocalStorage } from '../hooks/useLocalStorage';

const MaterialCalculator = ({ currencySymbol = "£", setBudgetItems }) => {
  const [mode, setMode] = useState('paint'); 
  const [unitSystem, setUnitSystem] = useState('metric'); // 'metric' | 'imperial'
  const [history, setHistory] = useLocalStorage([], 're4b-calc-history');
  
  // Modal State
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '' });

  // Default values for inputs
  const [inputs, setInputs] = useState({
    length: 4, width: 3.5, height: 2.4, // Defaults in Meters
    doors: 1, windows: 1, waste: 10, coats: 2, 
    pricePerUnit: 25, coveragePerUnit: 12
  });

  const MODES = [
    { id: 'paint', label: 'Paint', icon: PaintBucket },
    { id: 'flooring', label: 'Flooring', icon: Square },
    { id: 'tile', label: 'Tile', icon: Grid },
    { id: 'drywall', label: 'Drywall', icon: Box },
  ];

  // Unit-specific configurations
  const UNIT_CONFIG = {
    metric: {
      label: 'Metric (m)',
      dimUnit: 'm',
      areaUnit: 'm²',
      paintUnit: 'Litres',
      paintCoverage: 12, // approx m²/L
      flooringUnit: 'Boxes',
      flooringCoverage: 2.2, // approx m²/box
      tileCoverage: 1.4, // approx m²/box
      drywallUnit: 'Sheets',
      drywallCoverage: 2.88, // 1.2m x 2.4m sheet
      drywallPrice: 12,
      paintPrice: 20,
      flooringPrice: 30
    },
    imperial: {
      label: 'Imperial (ft)',
      dimUnit: 'ft',
      areaUnit: 'sq ft',
      paintUnit: 'Gallons',
      paintCoverage: 350, // sq ft/gal
      flooringUnit: 'Boxes',
      flooringCoverage: 20, // sq ft/box
      tileCoverage: 15, // sq ft/box
      drywallUnit: 'Sheets',
      drywallCoverage: 32, // 4x8 ft sheet
      drywallPrice: 15,
      paintPrice: 45,
      flooringPrice: 65
    }
  };

  const currentConfig = UNIT_CONFIG[unitSystem];

  // Reset defaults when mode or unit changes
  useEffect(() => {
    const defaults = {
      paint: { waste: 0, coveragePerUnit: currentConfig.paintCoverage, pricePerUnit: currentConfig.paintPrice, coats: 2 },
      flooring: { waste: 10, coveragePerUnit: currentConfig.flooringCoverage, pricePerUnit: currentConfig.flooringPrice },
      tile: { waste: 15, coveragePerUnit: currentConfig.tileCoverage, pricePerUnit: 50 },
      drywall: { waste: 10, coveragePerUnit: currentConfig.drywallCoverage, pricePerUnit: currentConfig.drywallPrice },
    };
    setInputs(prev => ({ ...prev, ...defaults[mode] }));
  }, [mode, unitSystem]);

  const calculate = () => {
    const L = Number(inputs.length) || 0;
    const W = Number(inputs.width) || 0;
    const H = Number(inputs.height) || 0;
    
    const floorArea = L * W;
    const ceilingArea = L * W;
    const wallArea = (L + W) * 2 * H;
    
    // Standard deduction sizes converted roughly
    const doorArea = unitSystem === 'metric' ? 1.8 : 20; // m² vs sq ft
    const windowArea = unitSystem === 'metric' ? 1.4 : 15; // m² vs sq ft
    
    const deductions = (inputs.doors * doorArea) + (inputs.windows * windowArea);
    
    let netArea = 0, totalMaterial = 0;

    if (mode === 'paint') {
      netArea = Math.max(0, wallArea - deductions);
      totalMaterial = Math.ceil((netArea * inputs.coats) / inputs.coveragePerUnit);
    } else if (mode === 'flooring' || mode === 'tile') {
      netArea = floorArea;
      totalMaterial = Math.ceil((netArea * (1 + (inputs.waste / 100))) / inputs.coveragePerUnit);
    } else if (mode === 'drywall') {
      netArea = Math.max(0, wallArea - deductions) + ceilingArea;
      totalMaterial = Math.ceil((netArea * (1 + (inputs.waste / 100))) / inputs.coveragePerUnit);
    }
    const totalCost = totalMaterial * inputs.pricePerUnit;
    return { netArea, totalMaterial, totalCost };
  };

  const results = calculate();
  
  const getUnitLabel = () => {
    if (mode === 'paint') return currentConfig.paintUnit;
    if (mode === 'drywall') return currentConfig.drywallUnit;
    return 'Boxes'; // Flooring/Tile
  };

  const handleSave = () => {
    const newItem = {
      id: Date.now(), 
      mode, 
      name: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Estimate`,
      date: new Date().toLocaleDateString(), 
      details: `${inputs.length} x ${inputs.width} ${currentConfig.dimUnit}`,
      result: `${results.totalMaterial} ${getUnitLabel()}`, 
      cost: results.totalCost
    };
    setHistory([newItem, ...history]);
  };

  const handleDelete = (id) => setHistory(history.filter(h => h.id !== id));

  const handleAddToBudget = () => {
    if (!setBudgetItems) return;
    const budgetItem = {
      id: Date.now(),
      name: `${mode.charAt(0).toUpperCase() + mode.slice(1)} - ${results.totalMaterial} ${getUnitLabel()}`,
      category: 'Materials',
      room: 'Renovation Project',
      estimated: results.totalCost,
      actual: 0,
      paid: false,
      paymentMethod: 'Credit Card',
      date: new Date().toISOString().split('T')[0],
      notes: `Calculated for ${Math.round(results.netArea)} ${currentConfig.areaUnit}`
    };
    setBudgetItems(prev => [budgetItem, ...prev]);
    setModalConfig({ isOpen: true, title: 'Added to Budget', message: `Successfully added ${budgetItem.name} to your budget.` });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      <Modal isOpen={modalConfig.isOpen} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} title={modalConfig.title}>
        <div className="flex items-center gap-4 mb-4">
           <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={24} /></div>
           <p className="text-slate-600 dark:text-slate-300">{modalConfig.message}</p>
        </div>
        <div className="flex justify-end"><Button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}>Done</Button></div>
      </Modal>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Material Calculator</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Estimate material quantities and costs.</p>
        </div>
        
        {/* Unit Toggle */}
        <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
           <button 
             onClick={() => setUnitSystem('metric')} 
             className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${unitSystem === 'metric' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}
           >
             Metric (m)
           </button>
           <button 
             onClick={() => setUnitSystem('imperial')} 
             className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${unitSystem === 'imperial' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}
           >
             Imperial (ft)
           </button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-1 overflow-x-auto max-w-full shadow-sm">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-1 justify-center ${mode === m.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'}`}
          >
            <m.icon size={18} />
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Calculator size={18} className="text-blue-500" /> Dimensions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Input label={`Length (${currentConfig.dimUnit})`} type="number" value={inputs.length} onChange={e => setInputs({...inputs, length: e.target.value})} />
              <Input label={`Width (${currentConfig.dimUnit})`} type="number" value={inputs.width} onChange={e => setInputs({...inputs, width: e.target.value})} />
              {(mode === 'paint' || mode === 'drywall') && (
                <Input label={`Height (${currentConfig.dimUnit})`} type="number" value={inputs.height} onChange={e => setInputs({...inputs, height: e.target.value})} />
              )}
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-6"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Adjustments</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <Input label="Doors (qty)" type="number" value={inputs.doors} onChange={e => setInputs({...inputs, doors: e.target.value})} />
                     <Input label="Windows (qty)" type="number" value={inputs.windows} onChange={e => setInputs({...inputs, windows: e.target.value})} />
                     <Input label="Waste %" type="number" value={inputs.waste} onChange={e => setInputs({...inputs, waste: e.target.value})} />
                     {mode === 'paint' && <Input label="Coats" type="number" value={inputs.coats} onChange={e => setInputs({...inputs, coats: e.target.value})} />}
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Product Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <Input label="Price / Unit" type="number" icon={<span className="text-xs font-bold text-slate-400">{currencySymbol}</span>} value={inputs.pricePerUnit} onChange={e => setInputs({...inputs, pricePerUnit: e.target.value})} />
                     <Input label={`Coverage / Unit (${currentConfig.areaUnit})`} type="number" value={inputs.coveragePerUnit} onChange={e => setInputs({...inputs, coveragePerUnit: e.target.value})} />
                  </div>
                  
                  {/* Quick Tip Box */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-500 flex gap-2 items-start border border-slate-100 dark:border-slate-700">
                     <Info size={14} className="shrink-0 mt-0.5 text-blue-500" />
                     <p>
                       {mode === 'paint' && `Standard coverage is ~${currentConfig.paintCoverage} ${currentConfig.areaUnit} per ${unitSystem === 'metric' ? 'litre' : 'gallon'}.`}
                       {mode === 'flooring' && `Standard box covers ~${currentConfig.flooringCoverage} ${currentConfig.areaUnit}.`}
                       {mode === 'drywall' && `Standard sheet covers ${currentConfig.drywallCoverage} ${currentConfig.areaUnit}.`}
                     </p>
                  </div>
               </div>
            </div>
          </Card>
          
          {/* History Section */}
          {history.length > 0 && (
             <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 px-1 uppercase tracking-wide opacity-50">Recent Calculations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {history.map((item) => (
                      <div key={item.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center group">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">{item.mode}</span>
                              <span className="text-[10px] text-slate-400">{item.date}</span>
                            </div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">{item.result} <span className="text-slate-300 mx-1">|</span> {currencySymbol}{item.cost.toLocaleString()}</div>
                        </div>
                        <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1.5 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                      </div>
                  ))}
                </div>
             </div>
          )}
        </div>

        {/* RIGHT: Results Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            {/* Result Card - Removed black outline, used soft blue border */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-blue-50 dark:border-slate-800 shadow-xl overflow-hidden relative">
              {/* Subtle background decoration */}
              <div className="absolute top-0 right-0 p-16 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="p-6 relative z-10">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">Estimated Requirements</h3>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-end pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-5xl font-bold text-slate-900 dark:text-white mb-1 font-numbers tracking-tight">{results.totalMaterial}</div>
                      <div className="text-blue-500 font-bold text-sm uppercase tracking-wide">{getUnitLabel()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 uppercase font-bold mb-1">Net Area</div>
                      <div className="text-lg font-bold text-slate-700 dark:text-slate-300 font-numbers">{Math.round(results.netArea)} <span className="text-xs text-slate-400">{currentConfig.areaUnit}</span></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-bold"><DollarSign size={16} /> Total Cost</div>
                    <span className="text-3xl font-bold text-emerald-500 font-numbers tracking-tight">{currencySymbol}{results.totalCost.toLocaleString()}</span>
                  </div>

                  <div className="space-y-3 pt-2">
                     <Button variant="primary" className="w-full font-bold shadow-lg shadow-blue-500/20" onClick={handleAddToBudget}>
                        <Plus size={18} className="mr-2" /> Add to Budget
                     </Button>
                     <Button variant="secondary" className="w-full border border-slate-200 dark:border-slate-700" onClick={handleSave}>
                        <Save size={18} className="mr-2" /> Save Calculation
                     </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialCalculator;