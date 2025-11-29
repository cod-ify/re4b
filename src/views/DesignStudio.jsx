import React, { useState, useEffect } from 'react';
import { 
  Camera, Download, Save, RefreshCw, Image as ImageIcon, 
  CheckCircle2, Sliders, Layers, Plus, X, 
  Trash2, History, Check, Lock, Unlock, Layout,
  ChevronDown, ChevronRight, Edit3, Maximize2, Minimize2, Upload, Sparkles, Zap
} from 'lucide-react';
import Button from '../components/Button';
import { Input } from '../components/FormElements';
import API_BASE_URL from '../config'; // Import Config

// --- UI Components ---

const ProcessingOverlay = ({ step }) => (
  <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md flex flex-col items-center justify-center z-10 rounded-xl text-white animate-in fade-in duration-700">
    <div className="relative mb-6">
      <div className="flex gap-3">
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
      </div>
    </div>
    <h3 className="text-xl font-bold tracking-tight font-sans">Creating Design</h3>
    <p className="text-slate-300 text-sm mt-3 font-medium animate-pulse font-sans">{step}</p>
  </div>
);

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 border ${
      type === 'error' ? 'bg-red-600 text-white border-red-500' : 'bg-slate-900 text-white border-slate-700'
    }`}>
      {type === 'success' ? <CheckCircle2 size={20} className="text-emerald-400" /> : <CheckCircle2 size={20} className="text-red-200" />}
      <span className="text-sm font-bold tracking-wide">{message}</span>
    </div>
  );
};

const AccordionSection = ({ id, title, icon: Icon, children, isActive, onToggle, disabled }) => {
  if (disabled) return null;

  return (
    <div className={`border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isActive ? 'ring-2 ring-blue-100 dark:ring-blue-900/30 shadow-md order-first' : 'hover:border-slate-300 dark:hover:border-slate-700'}`}>
      <button 
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between p-4 text-left focus:outline-none group"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl transition-colors duration-500 ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 group-hover:bg-slate-100 dark:group-hover:bg-slate-700'}`}>
            <Icon size={18} />
          </div>
          <span className={`font-bold text-sm transition-colors duration-500 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
            {title}
          </span>
        </div>
        <div className={`text-slate-400 transition-transform duration-500 ease-in-out ${isActive ? 'rotate-180 text-blue-600' : ''}`}>
          <ChevronDown size={18} />
        </div>
      </button>
      
      <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-50'}`}>
        <div className="overflow-hidden">
          <div className="p-4 pt-0">
            <div className="h-px w-full bg-slate-100 dark:bg-slate-800 mb-5"></div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const DesignStudio = ({ setGallery, rooms, setRooms }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [activeView, setActiveView] = useState('split'); 
  const [nanoAvailable, setNanoAvailable] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [designHistory, setDesignHistory] = useState([]);
  
  const [toast, setToast] = useState(null);
  
  // Suggestion State
  const [suggestion, setSuggestion] = useState(null);

  // Post-Production
  const [editPrompt, setEditPrompt] = useState('');
  const [editRefImage, setEditRefImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // View State
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeAccordion, setActiveAccordion] = useState('upload'); 

  // Constraints
  const [maintainStructure, setMaintainStructure] = useState(true);
  const [maintainFurniture, setMaintainFurniture] = useState(true);

  // Data
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoom, setNewRoom] = useState('');
  const [styles, setStyles] = useState([
    { id: 'modern', name: 'Modern', image: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=300&q=80' },
    { id: 'contemporary', name: 'Contemporary', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=300&q=80' },
    { id: 'minimalist', name: 'Minimalist', image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=300&q=80' },
    { id: 'scandinavian', name: 'Scandinavian', image: 'https://images.unsplash.com/photo-1595558486027-d7319e64a0e9?auto=format&fit=crop&w=300&q=80' },
    { id: 'industrial', name: 'Industrial', image: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=300&q=80' },
    { id: 'traditional', name: 'Traditional', image: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&w=300&q=80' },
    { id: 'bohemian', name: 'Bohemian', image: 'https://images.unsplash.com/photo-1522444195799-478538b28823?auto=format&fit=crop&w=300&q=80' },
    { id: 'mid-century', name: 'Mid-Century', image: 'https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?auto=format&fit=crop&w=300&q=80' },
  ]);
  const [isAddingStyle, setIsAddingStyle] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [config, setConfig] = useState({ roomType: rooms[0] || 'Kitchen', style: 'Modern', colorPalette: 'Neutral', prompt: '' });

  useEffect(() => { if (window.ai) setNanoAvailable(true); }, []);

  // --- Handlers ---

  const showToast = (message, type = 'success') => setToast({ message, type });
  const handleAccordionToggle = (id) => setActiveAccordion(prev => prev === id ? null : id);

  const handleImageUpload = (e, isRef = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isRef) {
          setEditRefImage(reader.result);
        } else {
          setSelectedImage(reader.result);
          setGeneratedImage(null);
          setEditPrompt('');
          setActiveAccordion('room');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `re4b-design-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Image downloaded!");
  };

  const handleAddRoom = () => {
    if (newRoom && !rooms.includes(newRoom)) {
      setRooms([...rooms, newRoom]);
      setConfig({ ...config, roomType: newRoom });
      setNewRoom('');
      setIsAddingRoom(false);
    }
  };

  const handleDeleteRoom = (e, roomToDelete) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${roomToDelete}"?`)) {
      const updated = rooms.filter(r => r !== roomToDelete);
      setRooms(updated);
      if (config.roomType === roomToDelete && updated.length > 0) setConfig({ ...config, roomType: updated[0] });
    }
  };

  const handleAddStyle = (e) => {
    e.preventDefault();
    if (newStyleName) {
      setStyles([...styles, { id: newStyleName.toLowerCase().replace(/\s+/g, '-'), name: newStyleName, image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80' }]);
      setConfig({ ...config, style: newStyleName });
      setNewStyleName('');
      setIsAddingStyle(false);
    }
  };

  const handleGetSuggestions = async () => {
    setIsEnhancing(true);
    setSuggestion(null); 
    try {
      const response = await fetch(`${API_BASE_URL}/api/enhance-prompt`, { // Updated URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: config.prompt, style: config.style, roomType: config.roomType, maintainStructure, maintainFurniture })
      });
      const data = await response.json();
      if (data.success) {
        setSuggestion(data.enhancedPrompt);
      }
    } catch (error) {
      console.error("Enhance failed:", error);
      showToast("Failed to get suggestions", "error");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (suggestion) {
      const newConfig = { ...config, prompt: suggestion };
      setConfig(newConfig);
      setSuggestion(null);
      handleGenerate(newConfig); 
    }
  };

  const handleGenerate = async (currentConfig = config) => {
    if (!selectedImage) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    
    const activeConfig = currentConfig; 
    const steps = ["Analyzing geometry...", "Locking camera angle...", "Generating new design...", "Finalizing render..."];
    let stepIndex = 0;
    setProcessingStep(steps[0]);
    const interval = setInterval(() => { stepIndex++; if (stepIndex < steps.length) setProcessingStep(steps[stepIndex]); }, 1500);

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-design`, { // Updated URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: selectedImage, maintainStructure, maintainFurniture, ...activeConfig })
      });
      const data = await response.json();
      if (data.success) {
        setGeneratedImage(data.image);
        setActiveView('generated');
        setActiveAccordion('edit');
      } else {
        showToast("Generation failed.", "error");
      }
    } catch (error) {
      showToast("Server connection failed.", "error");
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleEdit = async () => {
    if (!generatedImage || !editPrompt) return;
    setIsEditing(true);
    const steps = ["Reading instructions...", "Analyzing reference...", "Blending changes...", "Polishing result..."];
    let stepIndex = 0;
    setProcessingStep(steps[0]);
    const interval = setInterval(() => { stepIndex++; if (stepIndex < steps.length) setProcessingStep(steps[stepIndex]); }, 1500);

    try {
      const response = await fetch(`${API_BASE_URL}/api/edit-design`, { // Updated URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: generatedImage, editPrompt, referenceImage: editRefImage })
      });
      const data = await response.json();
      if (data.success) {
        setGeneratedImage(data.image);
        setEditPrompt('');
        setEditRefImage(null);
        showToast("Edit applied successfully!");
      } else {
        showToast("Edit failed.", "error");
      }
    } catch (error) {
      showToast("Server connection failed.", "error");
    } finally {
      clearInterval(interval);
      setIsEditing(false);
    }
  };

  const handleSaveToGallery = () => {
    if (generatedImage) {
      if (setGallery) {
        setGallery(prev => [...prev, { id: Date.now(), url: generatedImage, label: `${config.style} ${config.roomType}` }]);
      }
      setDesignHistory(prev => [{ id: Date.now(), original: selectedImage, generated: generatedImage, style: config.style, room: config.roomType, date: new Date().toLocaleDateString() }, ...prev]);
      showToast("Design saved to Gallery!");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Maximized Modal View */}
      {isMaximized && generatedImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <button onClick={() => setIsMaximized(false)} className="absolute top-4 right-4 text-white hover:text-slate-300 p-2"><X size={32}/></button>
          <img src={generatedImage} alt="Full View" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          <div className="absolute bottom-8 flex gap-4">
             <Button variant="primary" onClick={handleDownload} icon={Download}>Download High-Res</Button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Design Studio</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Reimagine your space with AI-powered visualization.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 relative">
        <div className={`shrink-0 flex flex-col gap-4 transition-all duration-700 ease-in-out overflow-hidden ${isSidebarOpen ? 'lg:w-[380px] opacity-100 translate-x-0' : 'lg:w-0 opacity-0 -translate-x-10 pointer-events-none h-0 lg:h-auto'}`}>
          
          {generatedImage && (
             <AccordionSection id="edit" title="Post-Production" icon={Edit3} isActive={activeAccordion === 'edit'} onToggle={handleAccordionToggle}>
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs text-blue-700 dark:text-blue-300 font-medium">Describe changes (e.g., 'Add this rug').</div>
                  <textarea className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24 placeholder:text-slate-400" placeholder="Instructions..." value={editPrompt} onChange={e => setEditPrompt(e.target.value)} />
                  
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload(e, true)} />
                      <div className={`p-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-center text-xs font-bold ${editRefImage ? 'bg-blue-50 text-blue-600 border-blue-300' : 'text-slate-500'}`}>
                        {editRefImage ? "Reference Image Added" : "+ Add Reference Image (Optional)"}
                      </div>
                    </div>
                    {editRefImage && <button onClick={() => setEditRefImage(null)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>}
                  </div>

                  <Button variant="primary" className="w-full font-bold" disabled={!editPrompt || isEditing} onClick={handleEdit}>{isEditing ? 'Refining...' : 'Apply Changes'}</Button>
                </div>
             </AccordionSection>
          )}

          <AccordionSection id="upload" title="Upload Photo" icon={Camera} isActive={activeAccordion === 'upload'} onToggle={handleAccordionToggle}>
             <div className={`relative aspect-video rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-slate-50 dark:bg-slate-800 ${!selectedImage ? 'cursor-pointer' : ''}`}>
              {selectedImage ? (
                <>
                  <img src={selectedImage} alt="Original" className="w-full h-full object-cover" />
                  <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"><RefreshCw size={14} /></button>
                </>
              ) : (
                <>
                  <ImageIcon className="text-slate-300 dark:text-slate-600 mb-2" size={32} />
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Click to Upload</span>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                </>
              )}
            </div>
          </AccordionSection>

          <AccordionSection id="room" title="Room Details" icon={Layers} isActive={activeAccordion === 'room'} onToggle={handleAccordionToggle}>
             <div className="mb-4">
               <div className="flex justify-between items-center mb-2">
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Room Type</label>
                 <button onClick={() => setIsAddingRoom(!isAddingRoom)} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"><Plus size={10} /> {isAddingRoom ? 'Cancel' : 'Add'}</button>
               </div>
               {isAddingRoom && <div className="flex gap-2 mb-3"><Input autoFocus placeholder="Room Name..." value={newRoom} onChange={e => setNewRoom(e.target.value)} className="flex-1" /><Button variant="primary" onClick={handleAddRoom} disabled={!newRoom} className="px-3"><CheckCircle2 size={18} /></Button></div>}
               <div className="flex flex-wrap gap-2">{rooms.map(type => (<div key={type} className="relative group"><button onClick={() => setConfig({ ...config, roomType: type })} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${config.roomType === type ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white'}`}>{type}</button><button onClick={(e) => handleDeleteRoom(e, type)} className="absolute -top-1 -right-1 bg-red-100 text-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X size={10} /></button></div>))}</div>
             </div>
             <div>
               <div className="flex justify-between items-center mb-2">
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Instructions</label>
                 <button onClick={handleGetSuggestions} disabled={isEnhancing || suggestion} className={`flex items-center gap-1 text-[10px] font-bold uppercase transition-colors ${isEnhancing ? 'text-slate-400' : 'text-purple-600 hover:text-purple-700 dark:text-purple-400'}`}>
                   {isEnhancing ? 'Thinking...' : 'Get Suggestions'}
                 </button>
               </div>
               
               {/* Suggestion Review Card */}
               {suggestion && (
                 <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/50 rounded-xl animate-in fade-in slide-in-from-top-2">
                   <div className="flex items-start gap-2 mb-2">
                     <Sparkles size={16} className="text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                     <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{suggestion}"</p>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => setSuggestion(null)} className="flex-1 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Discard</button>
                     <button onClick={handleAcceptSuggestion} className="flex-1 py-1.5 text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 rounded-lg flex items-center justify-center gap-1">
                       <Zap size={12} /> Accept & Generate
                     </button>
                   </div>
                 </div>
               )}

               <textarea className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24 placeholder:text-slate-400" placeholder="Describe the desired look..." value={config.prompt} onChange={e => setConfig({...config, prompt: e.target.value})} />
            </div>
            <div className="mt-4 flex justify-end"><Button variant="outline" className="text-xs w-full font-bold" onClick={() => setActiveAccordion('constraints')}>Continue</Button></div>
          </AccordionSection>

          <AccordionSection id="constraints" title="Structure & Layout" icon={Layout} isActive={activeAccordion === 'constraints'} onToggle={handleAccordionToggle}>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
               <div className="flex gap-4">
                 <button onClick={() => setMaintainStructure(!maintainStructure)} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg text-sm border-2 transition-all duration-300 ${maintainStructure ? 'bg-white dark:bg-slate-700 border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`}>{maintainStructure ? <Lock size={20} className="mb-1" /> : <Unlock size={20} className="mb-1" />}<span className="font-bold text-xs uppercase tracking-wider">Structure</span></button>
                 <button onClick={() => setMaintainFurniture(!maintainFurniture)} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg text-sm border-2 transition-all duration-300 ${maintainFurniture ? 'bg-white dark:bg-slate-700 border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`}>{maintainFurniture ? <Lock size={20} className="mb-1" /> : <Unlock size={20} className="mb-1" />}<span className="font-bold text-xs uppercase tracking-wider">Furniture</span></button>
               </div>
               <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">{maintainStructure ? "Maintains existing walls & windows. " : "Rebuilds architectural elements. "}{maintainFurniture ? "Keeps furniture positions." : "Redesigns furniture layout."}</p>
            </div>
            <div className="mt-4 flex justify-end"><Button variant="outline" className="text-xs w-full font-bold" onClick={() => setActiveAccordion('style')}>Continue</Button></div>
          </AccordionSection>

          <AccordionSection id="style" title="Design Style" icon={Sliders} isActive={activeAccordion === 'style'} onToggle={handleAccordionToggle}>
             <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">{styles.map(style => (<div key={style.id} onClick={() => setConfig({ ...config, style: style.name })} className={`relative rounded-lg overflow-hidden cursor-pointer group border-2 transition-all duration-300 ${config.style === style.name ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/30' : 'border-transparent'}`}><div className="aspect-4/3"><img src={style.image} alt={style.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /><div className={`absolute inset-0 flex items-end p-2 transition-colors duration-300 ${config.style === style.name ? 'bg-black/20' : 'bg-black/40 group-hover:bg-black/30'}`}><span className="text-white font-bold text-xs shadow-sm">{style.name}</span>{config.style === style.name && <div className="absolute top-1 right-1 bg-blue-600 text-white p-0.5 rounded-full"><Check size={10} /></div>}</div></div></div>))}
                {isAddingStyle ? (<div className="rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10 p-2 flex flex-col justify-center gap-2 aspect-4/3"><input autoFocus placeholder="Name" className="w-full p-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none" value={newStyleName} onChange={e => setNewStyleName(e.target.value)} /><div className="flex gap-1"><button onClick={handleAddStyle} className="flex-1 bg-blue-600 text-white rounded py-1 text-[10px] font-bold hover:bg-blue-700">Add</button><button onClick={() => setIsAddingStyle(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded py-1 text-[10px] font-bold hover:bg-slate-300">X</button></div></div>) : (<button onClick={() => setIsAddingStyle(true)} className="flex flex-col items-center justify-center gap-1 aspect-4/3 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"><Plus size={18} /><span className="text-[10px] font-bold">Custom</span></button>)}</div>
          </AccordionSection>

          <Button variant="primary" className="w-full py-4 shadow-xl shadow-blue-500/20 text-lg font-bold" disabled={!selectedImage || isGenerating || isEditing} onClick={() => handleGenerate()}>{isGenerating ? 'Processing...' : 'Generate Design'}</Button>
        </div>

        <div className="flex-1 relative transition-all duration-500">
          <div className="bg-slate-900 dark:bg-black rounded-3xl border border-slate-800 dark:border-slate-800 overflow-hidden relative shadow-2xl min-h-[600px] flex items-center justify-center">
            {generatedImage && (
               <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur text-white p-1.5 rounded-full border border-slate-700 flex gap-1 z-20 shadow-xl">
                 <button onClick={() => setActiveView('original')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${activeView === 'original' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-400 hover:text-white'}`}>Original</button>
                 <button onClick={() => setActiveView('generated')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${activeView === 'generated' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Result</button>
               </div>
            )}
            {generatedImage && !isGenerating && !isEditing && (
              <div className="absolute top-6 right-6 flex gap-3 z-20">
                <button onClick={() => setIsMaximized(true)} className="bg-slate-800/80 hover:bg-slate-700 text-white p-2.5 rounded-xl backdrop-blur border border-slate-600 shadow-lg" title="Maximize"><Maximize2 size={20} /></button>
                <button onClick={handleSaveToGallery} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg transition-colors font-bold flex items-center gap-2" title="Save to Gallery"><Save size={18} /> <span className="hidden sm:inline">Save</span></button>
                <button onClick={handleDownload} className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-xl shadow-lg transition-colors" title="Download"><Download size={20} /></button>
              </div>
            )}
            <div className="w-full h-full relative flex items-center justify-center p-4">
              {(isGenerating || isEditing) && <ProcessingOverlay step={processingStep} />}
              {!selectedImage ? (
                <div className="text-center text-slate-600 dark:text-slate-500 flex flex-col items-center animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-slate-800 dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/20 border border-slate-700"><Camera size={40} className="text-blue-500" /></div>
                  <h2 className="text-2xl font-bold text-slate-300">Ready to Create?</h2>
                  <p className="text-slate-500 mt-2 max-w-sm">Upload a photo from the sidebar to start your design journey.</p>
                </div>
              ) : (
                <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                   <img src={generatedImage && activeView === 'generated' ? generatedImage : selectedImage} alt="Workspace" className="w-full h-full object-contain max-h-[80vh] bg-black/50" />
                   <div className="absolute bottom-6 left-6 bg-black/60 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 flex items-center gap-2">
                      {activeView === 'original' || !generatedImage ? 'Original Photo' : 'AI Render'}
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          {designHistory.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><History size={18} /> Saved Designs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {designHistory.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex h-32 relative">
                       <div className="w-1/2 relative overflow-hidden"><img src={item.original} className="absolute inset-0 w-full h-full object-cover" alt="Old" /><div className="absolute inset-0 bg-black/10"></div></div>
                       <div className="w-1/2 relative overflow-hidden"><img src={item.generated} className="absolute inset-0 w-full h-full object-cover" alt="New" /></div>
                       <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white z-10"></div>
                    </div>
                    <div className="p-4">
                       <div className="flex justify-between items-start mb-2"><div><span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-0.5">{item.style}</span><h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.room}</h4></div><span className="text-[10px] text-slate-400">{item.date}</span></div>
                       <button onClick={() => { setSelectedImage(item.original); setGeneratedImage(item.generated); setActiveView('generated'); }} className="w-full py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 transition-colors">Load to Canvas</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignStudio;