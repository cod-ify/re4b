import React, { useState } from 'react';
import { 
  ArrowRight, Upload, Scale, Hammer, AlertTriangle, 
  CheckCircle2, PlayCircle, Plus, Trash2, Calculator,
  DollarSign, FileText, ChevronDown, ChevronUp, Search,
  HardHat, Wrench, ShieldAlert
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Input } from '../components/FormElements';

const RenovationPlanner = ({ currencySymbol }) => {
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [plan, setPlan] = useState(null);
  const [measurements, setMeasurements] = useState({});
  const [videoLinks, setVideoLinks] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [expandedPhase, setExpandedPhase] = useState(0); // Default open first phase

  // Handlers
  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'before') setBeforeImage(reader.result);
        else setAfterImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!beforeImage || !afterImage) return;
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/analyze-renovation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beforeImage, afterImage, currencySymbol })
      });
      const data = await response.json();
      if (data.success) {
        setPlan(data.plan);
        // Initialize measurement state
        const initialMeasurements = {};
        data.plan.materials.forEach(m => {
          initialMeasurements[m.id] = 0;
        });
        setMeasurements(initialMeasurements);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Could not analyze renovation. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddVideo = () => {
    if (newLink) {
      setVideoLinks([...videoLinks, newLink]);
      setNewLink('');
    }
  };

  const calculateTotalCost = () => {
    if (!plan) return 0;
    return plan.materials.reduce((acc, item) => {
      const qty = parseFloat(measurements[item.id] || 0);
      return acc + (qty * item.unitPrice);
    }, 0);
  };

  // Helper for DIY Rating Color
  const getRatingColor = (rating) => {
    if (rating === 'High') return 'bg-red-500 text-red-700 border-red-200 bg-red-50';
    if (rating === 'Medium') return 'bg-amber-500 text-amber-700 border-amber-200 bg-amber-50';
    return 'bg-emerald-500 text-emerald-700 border-emerald-200 bg-emerald-50';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Renovation Planner</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Compare current vs. desired state to generate a detailed project roadmap.</p>
        </div>
      </div>

      {/* 1. Comparison Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 border-dashed border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-slate-500 uppercase text-xs tracking-wider">Before (Current)</span>
            {beforeImage && <button onClick={() => setBeforeImage(null)} className="text-red-500 hover:text-red-600"><Trash2 size={16}/></button>}
          </div>
          <div className="aspect-video bg-white dark:bg-slate-800 rounded-lg overflow-hidden relative flex items-center justify-center group">
            {beforeImage ? (
              <img src={beforeImage} alt="Before" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Upload className="mx-auto text-slate-300 mb-2" size={32} />
                <span className="text-sm text-slate-400 font-medium">Upload Current Room</span>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'before')} />
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4 border-dashed border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-slate-500 uppercase text-xs tracking-wider">After (Goal)</span>
            {afterImage && <button onClick={() => setAfterImage(null)} className="text-red-500 hover:text-red-600"><Trash2 size={16}/></button>}
          </div>
          <div className="aspect-video bg-white dark:bg-slate-800 rounded-lg overflow-hidden relative flex items-center justify-center group">
            {afterImage ? (
              <img src={afterImage} alt="After" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Upload className="mx-auto text-slate-300 mb-2" size={32} />
                <span className="text-sm text-slate-400 font-medium">Upload Design / Reference</span>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'after')} />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Analyze Button */}
      <div className="flex justify-center">
        <Button 
          variant="primary" 
          className="w-full md:w-auto px-12 py-4 text-lg font-bold shadow-xl shadow-blue-500/20"
          disabled={!beforeImage || !afterImage || isAnalyzing}
          onClick={handleAnalyze}
        >
          {isAnalyzing ? 'Analyzing Details...' : 'Analyze & Plan Project'}
          {!isAnalyzing && <ArrowRight size={20} className="ml-2" />}
        </Button>
      </div>

      {/* 2. Analysis Results */}
      {plan && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* DIY RATING BAR */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="flex justify-between items-end mb-2">
                <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                     <HardHat size={20} className="text-blue-500" /> DIY Difficulty Assessment
                   </h3>
                   <p className="text-sm text-slate-500">Based on plumbing, electrical, and structural requirements.</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${plan.diyRating === 'High' ? 'bg-red-50 text-red-700 border-red-200' : plan.diyRating === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                  {plan.diyRating} Risk
                </span>
             </div>
             
             {/* The Bar */}
             <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div className={`h-full transition-all duration-1000 ${plan.diyRating === 'Low' ? 'w-1/3 bg-emerald-500' : plan.diyRating === 'Medium' ? 'w-2/3 bg-amber-500' : 'w-full bg-red-500'}`}></div>
             </div>

             {/* PRO ADVISORY if High Risk */}
             {plan.diyRating === 'High' && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg flex gap-3">
                   <ShieldAlert size={24} className="text-red-600 dark:text-red-400 shrink-0" />
                   <div>
                      <h4 className="font-bold text-red-900 dark:text-red-300 text-sm">Professional Recommended</h4>
                      <p className="text-xs text-red-700 dark:text-red-200 mt-1">
                         This project involves complex tasks (like electrical rewiring or structural changes) where mistakes can be costly or dangerous. We highly recommend consulting a contractor for the <strong>{plan.riskyPhases.join(', ')}</strong> phases.
                      </p>
                   </div>
                </div>
             )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Detailed Phase Guide */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={20} className="text-blue-500" /> Step-by-Step Guide
              </h3>
              
              {plan.phases.map((phase, index) => {
                const isOpen = expandedPhase === index;
                return (
                  <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all">
                    <button 
                      onClick={() => setExpandedPhase(isOpen ? null : index)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                          {index + 1}
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-900 dark:text-white">{phase.name}</h4>
                           <p className="text-xs text-slate-500">{phase.steps.length} Steps • {phase.tools.length} Tools</p>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
                    </button>

                    {isOpen && (
                      <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                         {/* Phase-Specific Tools */}
                         <div className="my-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex flex-wrap gap-2 items-center">
                            <Wrench size={16} className="text-slate-400 mr-1" />
                            {phase.tools.map(tool => (
                              <span key={tool} className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">{tool}</span>
                            ))}
                         </div>

                         {/* Detailed Steps */}
                         <div className="space-y-4">
                           {phase.steps.map((step, sIdx) => (
                             <div key={sIdx} className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 pb-2 last:pb-0">
                               <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-900"></div>
                               <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{step.action}</p>
                               <p className="text-xs text-slate-500 mt-0.5">{step.detail}</p>
                               {step.warning && (
                                 <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                   <AlertTriangle size={10} /> {step.warning}
                                 </span>
                               )}
                             </div>
                           ))}
                         </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Column: Resources & Material Cost */}
            <div className="space-y-6">
              
              {/* Material Estimator */}
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                    <Calculator size={16} /> Materials
                  </h3>
                  <span className="text-xl font-bold font-numbers text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}{calculateTotalCost().toLocaleString()}
                  </span>
                </div>
                <div className="space-y-3">
                  {plan.materials.map((item) => (
                    <div key={item.id} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                        <span className="text-slate-400 text-xs">{currencySymbol}{item.unitPrice}/{item.unit}</span>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          className="flex-1 p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-numbers"
                          placeholder="Qty"
                          value={measurements[item.id] || ''}
                          onChange={(e) => setMeasurements({ ...measurements, [item.id]: e.target.value })}
                        />
                        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-500 w-16 text-center">{item.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Video Search Hints */}
              <Card className="p-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                  <PlayCircle size={16} className="text-red-500" /> Learning Resources
                </h3>
                
                {/* AI Suggested Search Terms */}
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Recommended Search Terms:</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.videoSearchTerms.map((term, i) => (
                      <span key={i} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-900/30 flex items-center gap-1 cursor-pointer hover:bg-blue-100" onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`, '_blank')}>
                        <Search size={10} /> {term}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {videoLinks.map((link, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs truncate">
                      <a href={link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate flex-1">{link}</a>
                      <button onClick={() => setVideoLinks(videoLinks.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500 ml-2"><X size={14}/></button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      placeholder="Paste video link..."
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                    />
                    <button onClick={handleAddVideo} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg transition-colors"><Plus size={16}/></button>
                  </div>
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