import React, { useState, useEffect } from 'react';
import { Calculator, PaintBucket, Grid, Box, Square, Plus, Minus, Save, Trash2, DollarSign, Info } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const MaterialCalculator = ({ currencySymbol = "$" }) => {
  const [mode, setMode] = useState('paint'); 
  const [history, setHistory] = useState([]);
  
  const [inputs, setInputs] = useState({
    length: 12, width: 10, height: 8, doors: 1, windows: 1, waste: 10, coats: 2, pricePerUnit: 45, coveragePerUnit: 350
  });

  const MODES = [
    { id: 'paint', label: 'Paint', icon: PaintBucket, unit: 'Gallons' },
    { id: 'flooring', label: 'Flooring', icon: Square, unit: 'Boxes' },
    { id: 'tile', label: 'Tile', icon: Grid, unit: 'Boxes' },
    { id: 'drywall', label: 'Drywall', icon: Box, unit: 'Sheets' },
  ];

  const DEFAULTS = {
    paint: { waste: 0, coveragePerUnit: 350, pricePerUnit: 45 },
    flooring: { waste: 10, coveragePerUnit: 20, pricePerUnit: 65 },
    tile: { waste: 15, coveragePerUnit: 15, pricePerUnit: 50 },
    drywall: { waste: 10, coveragePerUnit: 32, pricePerUnit: 14 },
  };

  useEffect(() => {
    setInputs(prev => ({ ...prev, ...DEFAULTS[mode] }));
  }, [mode]);

  const calculate = () => {
    const L = Number(inputs.length);
    const W = Number(inputs.width);
    const H = Number(inputs.height);
    const floorArea = L * W;
    const wallArea = (L + W) * 2 * H;
    const ceilingArea = L * W;
    const deductions = (inputs.doors * 21) + (inputs.windows * 15);
    
    let netArea = 0, totalMaterial = 0;

    if (mode === 'paint') {
      netArea = Math.max(0, wallArea - deductions);
      totalMaterial = Math.ceil((netArea * inputs.coats) / inputs.coveragePerUnit);
    } else if (mode === 'flooring' || mode === 'tile') {
      netArea = floorArea;
      totalMaterial = Math.ceil((netArea * (1 + (inputs.waste / 100))) / inputs.coveragePerUnit);
    } else if (mode === 'drywall') {
      netArea = Math.max(0, wallArea - deductions) + ceilingArea;
      totalMaterial = Math.ceil((netArea * (1 + (inputs.waste / 100))) / 32);
    }
    const totalCost = totalMaterial * inputs.pricePerUnit;
    return { netArea, totalMaterial, totalCost };
  };

  const results = calculate();

  const handleSave = () => {
    setHistory([{
      id: Date.now(), mode, name: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Calculation`,
      date: new Date().toLocaleDateString(), details: `${inputs.length}' x ${inputs.width}' Room`,
      result: `${results.totalMaterial} ${MODES.find(m => m.id === mode).unit}`, cost: results.totalCost
    }, ...history]);
  };

  const handleDelete = (id) => setHistory(history.filter(h => h.id !== id));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Material Calculator</h1>
          <p className="text-slate-500 dark:text-slate-400">Estimate materials, costs, and waste.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 flex gap-1">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === m.id ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <m.icon size={16} />
              <span className="hidden md:inline">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Calculator size={18} className="text-blue-600" /> Room Dimensions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {['Length', 'Width', 'Height'].map(dim => (
                (dim !== 'Height' || (mode !== 'flooring' && mode !== 'tile')) && 
                <div key={dim} className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{dim} (ft)</label>
                  <input type="number" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg text-slate-900 dark:text-white" value={inputs[dim.toLowerCase()]} onChange={e => setInputs({...inputs, [dim.toLowerCase()]: e.target.value})} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-slate-800">
               {/* Deductions & Specifics Inputs Omitted for brevity, assume similar dark mode styling */}
               <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Cost & Coverage</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Price / Unit</label>
                       <div className="relative">
                         <span className="absolute left-2 top-2 text-slate-400 text-xs">{currencySymbol}</span>
                         <input type="number" className="w-full p-1.5 pl-5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white" value={inputs.pricePerUnit} onChange={e => setInputs({...inputs, pricePerUnit: e.target.value})} />
                       </div>
                     </div>
                  </div>
               </div>
            </div>
          </Card>
          
          {/* History Section */}
          <div className="space-y-4">
             <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 px-1"><Save size={18} className="text-slate-400" /> Saved Estimates</h3>
             {history.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-start">
                   <div>
                      <div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">{item.mode}</span><span className="text-xs text-slate-400">{item.date}</span></div>
                      <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                      <div className="mt-3 font-numbers font-medium text-blue-600 dark:text-blue-400">{item.result} <span className="text-slate-300 mx-1">|</span> {currencySymbol}{item.cost.toLocaleString()}</div>
                   </div>
                   <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                </div>
             ))}
          </div>
        </div>

        {/* RIGHT: Results Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            <Card className="p-6 bg-slate-900 dark:bg-blue-950 text-white border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-20 bg-blue-600 rounded-full blur-3xl opacity-10 -mr-10 -mt-10 pointer-events-none"></div>
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">Estimated Requirements</h3>
              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-end pb-4 border-b border-slate-700">
                  <div>
                    <div className="text-5xl font-bold mb-1 font-numbers">{results.totalMaterial}</div>
                    <div className="text-blue-400 font-medium">{MODES.find(m => m.id === mode).unit}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400 mb-1">Net Area</div>
                    <div className="text-xl font-medium font-numbers">{Math.round(results.netArea)} <span className="text-sm text-slate-500">sq ft</span></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2"><DollarSign size={18} className="text-emerald-400" /><span className="text-slate-300 font-medium">Est. Cost</span></div>
                  <span className="text-2xl font-bold text-emerald-400 font-numbers">{currencySymbol}{results.totalCost.toLocaleString()}</span>
                </div>
                <Button variant="primary" className="w-full bg-white text-slate-900 hover:bg-blue-50 border-none font-bold mt-4" onClick={handleSave}><Save size={18} className="mr-2" /> Save to Project</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialCalculator;