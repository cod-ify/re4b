import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Wand2, Download, Save, RefreshCw, Image as ImageIcon, 
  CheckCircle2, Sliders, Palette, Layers, Sparkles, Plus, X, 
  Trash2, History, Check, Lock, Unlock, Layout,
  ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen, ChevronLeft,
  Edit3
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Input } from '../components/FormElements';

const DesignStudio = ({ setGallery, rooms, setRooms }) => {
  // --- State ---
  const [selectedImage, setSelectedImage] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [activeView, setActiveView] = useState('split'); 
  const [nanoAvailable, setNanoAvailable] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [designHistory, setDesignHistory] = useState([]);

  // Post-Production State
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeAccordion, setActiveAccordion] = useState('upload'); // 'upload', 'room', 'constraints', 'style', 'edit'

  // Constraint Options
  const [maintainStructure, setMaintainStructure] = useState(true);
  const [maintainFurniture, setMaintainFurniture] = useState(true);

  // Room Management
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoom, setNewRoom] = useState('');

  // Style Management
  const DEFAULT_STYLES = [
    { id: 'modern', name: 'Modern', image: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=300&q=80' },
    { id: 'contemporary', name: 'Contemporary', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=300&q=80' },
    { id: 'minimalist', name: 'Minimalist', image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=300&q=80' },
    { id: 'scandinavian', name: 'Scandinavian', image: 'https://images.unsplash.com/photo-1595558486027-d7319e64a0e9?auto=format&fit=crop&w=300&q=80' },
    { id: 'industrial', name: 'Industrial', image: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=300&q=80' },
    { id: 'traditional', name: 'Traditional', image: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&w=300&q=80' },
    { id: 'bohemian', name: 'Bohemian', image: 'https://images.unsplash.com/photo-1522444195799-478538b28823?auto=format&fit=crop&w=300&q=80' },
    { id: 'mid-century', name: 'Mid-Century', image: 'https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?auto=format&fit=crop&w=300&q=80' },
  ];

  const [styles, setStyles] = useState(DEFAULT_STYLES);
  const [isAddingStyle, setIsAddingStyle] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');

  const [config, setConfig] = useState({
    roomType: rooms[0] || 'Kitchen',
    style: 'Modern',
    colorPalette: 'Neutral',
    prompt: ''
  });

  const PALETTES = [
    { name: 'Neutral', colors: ['bg-stone-100', 'bg-stone-300', 'bg-stone-800'] },
    { name: 'Warm', colors: ['bg-orange-100', 'bg-amber-200', 'bg-orange-800'] },
    { name: 'Cool', colors: ['bg-blue-100', 'bg-slate-300', 'bg-slate-800'] },
    { name: 'Contrast', colors: ['bg-white', 'bg-gray-900', 'bg-red-500'] },
  ];

  useEffect(() => {
    if (window.ai) setNanoAvailable(true);
  }, []);

  // --- Handlers ---

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setGeneratedImage(null);
        setEditPrompt('');
        setActiveAccordion('room');
      };
      reader.readAsDataURL(file);
    }
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
      if (config.roomType === roomToDelete && updated.length > 0) {
        setConfig({ ...config, roomType: updated[0] });
      }
    }
  };

  const handleAddStyle = (e) => {
    e.preventDefault();
    if (newStyleName) {
      const newStyle = {
        id: newStyleName.toLowerCase().replace(/\s+/g, '-'),
        name: newStyleName,
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80' // Generic placeholder
      };
      setStyles([...styles, newStyle]);
      setConfig({ ...config, style: newStyleName });
      setNewStyleName('');
      setIsAddingStyle(false);
    }
  };

  const handleMagicEnhance = async () => {
    setIsEnhancing(true);
    try {
      const response = await fetch('http://localhost:3001/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: config.prompt || `A beautiful ${config.roomType}`,
          style: config.style,
          roomType: config.roomType,
          maintainStructure,
          maintainFurniture
        })
      });
      const data = await response.json();
      if (data.success) {
        setConfig(prev => ({ ...prev, prompt: data.enhancedPrompt }));
      }
    } catch (error) {
      console.error("Enhance failed:", error);
      const basePrompt = `A ${config.style} ${config.roomType} with ${config.colorPalette} tones.`;
      const enhanced = `${basePrompt} Featuring abundant natural light, high-end textures, and a harmonious layout.`;
      setConfig(prev => ({ ...prev, prompt: enhanced }));
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;
    setIsGenerating(true);
    setGeneratedImage(null);

    const steps = ["Scanning geometry...", "Locking layout...", "Rendering design...", "Finalizing image..."];
    let stepIndex = 0;
    setProcessingStep(steps[0]);
    
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) setProcessingStep(steps[stepIndex]);
    }, 1500);

    try {
      const response = await fetch('http://localhost:3001/api/generate-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          maintainStructure,
          maintainFurniture,
          ...config
        })
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedImage(data.image);
        setActiveView('generated');
        
        // Auto-switch to Post-Production mode
        setActiveAccordion('edit'); 
      } else {
        alert("Generation failed. Please try again or relax the constraints.");
      }

    } catch (error) {
      console.error(error);
      alert("Could not connect to the Design Server.");
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleEdit = async () => {
    if (!generatedImage || !editPrompt) return;
    setIsEditing(true);

    const steps = ["Reading edit instructions...", "Adjusting image details...", "Refining textures..."];
    let stepIndex = 0;
    setProcessingStep(steps[0]);
    
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) setProcessingStep(steps[stepIndex]);
    }, 1500);

    try {
      const response = await fetch('http://localhost:3001/api/edit-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: generatedImage, // We edit the CURRENT result
          editPrompt: editPrompt
        })
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedImage(data.image);
        setEditPrompt(''); // Clear prompt on success
        alert("Edit applied successfully!");
      } else {
        alert("Edit failed. Please try a simpler instruction.");
      }

    } catch (error) {
      console.error(error);
      alert("Could not connect to the Design Server.");
    } finally {
      clearInterval(interval);
      setIsEditing(false);
    }
  };

  const handleSaveToGallery = () => {
    if (generatedImage) {
      // 1. Add to Global Gallery
      const newPhoto = {
        id: Date.now(),
        url: generatedImage,
        label: `${config.style} ${config.roomType}`
      };
      if (setGallery) {
        setGallery(prev => [...prev, newPhoto]);
      }

      // 2. Add to Local Design History (Only on Save)
      const newHistoryItem = {
        id: Date.now(),
        original: selectedImage,
        generated: generatedImage,
        style: config.style,
        room: config.roomType,
        date: new Date().toLocaleDateString()
      };
      setDesignHistory(prev => [newHistoryItem, ...prev]);

      alert("Design saved to Project Gallery & History!");
    }
  };

  // --- UI Components ---

  const ProcessingOverlay = ({ step }) => (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl text-white">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-6"></div>
        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 animate-pulse" size={24} />
      </div>
      <h3 className="text-xl font-bold tracking-wide">Processing Design</h3>
      <p className="text-blue-200 text-sm mt-2 font-mono animate-pulse">{step}</p>
    </div>
  );

  const AccordionSection = ({ id, title, icon: Icon, children, disabled }) => {
    const isOpen = activeAccordion === id;
    if (disabled) return null;

    return (
      <div className={`border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-all duration-300 ${isOpen ? 'ring-2 ring-blue-100 dark:ring-blue-900/30 shadow-md order-first' : 'hover:border-slate-300 dark:hover:border-slate-700'}`}>
        <button 
          onClick={() => setActiveAccordion(isOpen ? null : id)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              <Icon size={18} />
            </div>
            <span className={`font-bold text-sm ${isOpen ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
              {title}
            </span>
          </div>
          {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        </button>
        
        {isOpen && (
          <div className="p-4 pt-0 animate-in slide-in-from-top-2 duration-300">
            <div className="h-px w-full bg-slate-100 dark:bg-slate-800 mb-4"></div>
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header Area */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Design Studio</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Reimagine your space with AI-powered visualization.</p>
        </div>
        
        {/* Mobile Toggle for Sidebar */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm"
        >
          {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 relative">
        
        {/* --- LEFT COLUMN: Controls (Collapsible) --- */}
        <div 
          className={`
            flex-shrink-0 flex flex-col gap-4 transition-all duration-500 ease-in-out overflow-hidden
            ${isSidebarOpen ? 'lg:w-[380px] opacity-100 translate-x-0' : 'lg:w-0 opacity-0 -translate-x-10 pointer-events-none h-0 lg:h-auto'}
          `}
        >
          {/* POST PRODUCTION (Appears only after generation) */}
          {generatedImage && (
             <AccordionSection id="edit" title="Post-Production Edit" icon={Edit3}>
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs text-blue-700 dark:text-blue-300">
                     ✨ <strong>Refine your design:</strong> Describe changes you want to make to the current image.
                  </div>
                  <textarea 
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                    placeholder="e.g. 'Add a gold frame to the art', 'Make the rug blue', 'Add a plant to the corner'..."
                    value={editPrompt}
                    onChange={e => setEditPrompt(e.target.value)}
                  />
                  <Button variant="primary" className="w-full" disabled={!editPrompt || isEditing} onClick={handleEdit}>
                    {isEditing ? 'Applying Edit...' : 'Apply Changes'}
                    {!isEditing && <Wand2 size={16} className="ml-2" />}
                  </Button>
                </div>
             </AccordionSection>
          )}

          {/* 1. UPLOAD */}
          <AccordionSection id="upload" title="Source Image" icon={Camera}>
             <div className={`relative aspect-video rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-slate-50 dark:bg-slate-800 ${!selectedImage ? 'cursor-pointer' : ''}`}>
              {selectedImage ? (
                <>
                  <img src={selectedImage} alt="Original" className="w-full h-full object-cover" />
                  <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"><RefreshCw size={14} /></button>
                </>
              ) : (
                <>
                  <ImageIcon className="text-slate-300 dark:text-slate-600 mb-2" size={32} />
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Upload Room Photo</span>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                </>
              )}
            </div>
          </AccordionSection>

          {/* 2. CONFIGURATION */}
          <AccordionSection id="room" title="Configuration" icon={Layers}>
             {/* Room Type */}
             <div className="mb-4">
               <div className="flex justify-between items-center mb-2">
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Room Type</label>
                 <button onClick={() => setIsAddingRoom(!isAddingRoom)} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                   <Plus size={10} /> {isAddingRoom ? 'Cancel' : 'Add'}
                 </button>
               </div>
               
               {isAddingRoom && (
                 <div className="flex gap-2 mb-3">
                    <Input autoFocus placeholder="New Room Name..." value={newRoom} onChange={e => setNewRoom(e.target.value)} className="flex-1" />
                    <Button variant="primary" onClick={handleAddRoom} disabled={!newRoom} className="px-3"><CheckCircle2 size={18} /></Button>
                 </div>
               )}

               <div className="flex flex-wrap gap-2">
                 {rooms.map(type => (
                   <div key={type} className="relative group">
                     <button
                       onClick={() => setConfig({ ...config, roomType: type })}
                       className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                         config.roomType === type ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white'
                       }`}
                     >
                       {type}
                     </button>
                     <button onClick={(e) => handleDeleteRoom(e, type)} className="absolute -top-1 -right-1 bg-red-100 text-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X size={10} /></button>
                   </div>
                 ))}
               </div>
             </div>

             {/* Prompt */}
             <div>
               <div className="flex justify-between items-center mb-2">
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">AI Prompt</label>
                 <button onClick={handleMagicEnhance} disabled={isEnhancing} className={`flex items-center gap-1 text-[10px] font-bold uppercase transition-colors ${isEnhancing ? 'text-slate-400' : 'text-purple-600 hover:text-purple-700 dark:text-purple-400'}`}>
                   <Sparkles size={10} /> {isEnhancing ? 'Improving...' : 'Auto-Enhance'}
                 </button>
               </div>
               <textarea 
                 className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                 placeholder="Describe your vision (e.g. 'Minimalist office with plants')..."
                 value={config.prompt}
                 onChange={e => setConfig({...config, prompt: e.target.value})}
               />
            </div>
            <div className="mt-4 flex justify-end">
               <Button variant="outline" className="text-xs w-full" onClick={() => setActiveAccordion('constraints')}>Next Step</Button>
            </div>
          </AccordionSection>

          {/* 3. CONSTRAINTS */}
          <AccordionSection id="constraints" title="Structure & Layout" icon={Layout}>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
               <div className="flex gap-4">
                 <button 
                   onClick={() => setMaintainStructure(!maintainStructure)}
                   className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg text-sm border-2 transition-all ${maintainStructure ? 'bg-white dark:bg-slate-700 border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`}
                 >
                   {maintainStructure ? <Lock size={20} className="mb-1" /> : <Unlock size={20} className="mb-1" />}
                   <span className="font-bold text-xs uppercase">Structure</span>
                 </button>
                 <button 
                   onClick={() => setMaintainFurniture(!maintainFurniture)}
                   className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg text-sm border-2 transition-all ${maintainFurniture ? 'bg-white dark:bg-slate-700 border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`}
                 >
                   {maintainFurniture ? <Lock size={20} className="mb-1" /> : <Unlock size={20} className="mb-1" />}
                   <span className="font-bold text-xs uppercase">Furniture</span>
                 </button>
               </div>
               <p className="text-[10px] text-center text-slate-400 mt-3">
                 {maintainStructure ? "Maintains walls & windows. " : "Rebuilds architecture. "}
                 {maintainFurniture ? "Keeps furniture positions." : "Redesigns layout."}
               </p>
            </div>
            <div className="mt-4 flex justify-end">
               <Button variant="outline" className="text-xs w-full" onClick={() => setActiveAccordion('style')}>Next Step</Button>
            </div>
          </AccordionSection>

          {/* 4. STYLE */}
          <AccordionSection id="style" title="Design Style" icon={Sliders}>
             <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {styles.map(style => (
                  <div 
                    key={style.id}
                    onClick={() => setConfig({ ...config, style: style.name })}
                    className={`relative rounded-lg overflow-hidden cursor-pointer group border-2 transition-all ${config.style === style.name ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/30' : 'border-transparent'}`}
                  >
                    <div className="aspect-[4/3]">
                      <img src={style.image} alt={style.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className={`absolute inset-0 flex items-end p-2 transition-colors ${config.style === style.name ? 'bg-black/20' : 'bg-black/40 group-hover:bg-black/30'}`}>
                        <span className="text-white font-bold text-xs shadow-sm">{style.name}</span>
                        {config.style === style.name && <div className="absolute top-1 right-1 bg-blue-600 text-white p-0.5 rounded-full"><Check size={10} /></div>}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Add Style Button */}
                {isAddingStyle ? (
                  <div className="rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10 p-2 flex flex-col justify-center gap-2 aspect-[4/3]">
                    <input 
                      autoFocus
                      placeholder="Name" 
                      className="w-full p-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                      value={newStyleName}
                      onChange={e => setNewStyleName(e.target.value)}
                    />
                    <div className="flex gap-1">
                      <button onClick={handleAddStyle} className="flex-1 bg-blue-600 text-white rounded py-1 text-[10px] font-bold hover:bg-blue-700">Add</button>
                      <button onClick={() => setIsAddingStyle(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded py-1 text-[10px] font-bold hover:bg-slate-300">X</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAddingStyle(true)}
                    className="flex flex-col items-center justify-center gap-1 aspect-[4/3] rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <Plus size={18} />
                    <span className="text-[10px] font-bold">Custom</span>
                  </button>
                )}
              </div>
          </AccordionSection>

          {/* MAIN GENERATE BUTTON (Hidden if we are editing) */}
          <Button variant="primary" className="w-full py-4 shadow-xl shadow-blue-500/20 text-lg" disabled={!selectedImage || isGenerating || isEditing} onClick={handleGenerate}>
            {isGenerating ? 'Processing...' : 'Generate Design'}
            {!isGenerating && <Wand2 size={20} className="ml-2" />}
          </Button>

        </div>

        {/* --- RIGHT COLUMN: Canvas --- */}
        <div className="flex-1 relative transition-all duration-500">
           
           {/* Sidebar Toggle Button (Floating/Sticky) */}
           <div className="absolute top-0 -left-3 lg:-left-5 z-30 h-full pointer-events-none hidden lg:flex flex-col justify-center">
             <button
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="pointer-events-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 p-1.5 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 group"
               title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
             >
               {isSidebarOpen ? (
                 <ChevronLeft size={20} />
               ) : (
                 <ChevronRight size={20} className="animate-pulse" /> 
               )}
               {!isSidebarOpen && (
                 <span className="absolute left-full ml-2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity animate-bounce">
                    Open Controls
                 </span>
               )}
             </button>
           </div>


          <div className="bg-slate-900 dark:bg-black rounded-3xl border border-slate-800 dark:border-slate-800 overflow-hidden relative shadow-2xl min-h-[600px] flex items-center justify-center">
            {generatedImage && (
               <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur text-white p-1.5 rounded-full border border-slate-700 flex gap-1 z-20 shadow-xl">
                 <button onClick={() => setActiveView('original')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${activeView === 'original' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-400 hover:text-white'}`}>Original</button>
                 <button onClick={() => setActiveView('generated')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${activeView === 'generated' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Result</button>
               </div>
            )}
            {generatedImage && !isGenerating && !isEditing && (
              <div className="absolute top-6 right-6 flex gap-3 z-20">
                <button onClick={handleSaveToGallery} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg transition-colors font-bold flex items-center gap-2" title="Save to Gallery">
                   <Save size={18} /> <span className="hidden sm:inline">Save</span>
                </button>
                <button className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-xl shadow-lg transition-colors" title="Download"><Download size={20} /></button>
              </div>
            )}
            <div className="w-full h-full relative flex items-center justify-center p-4">
              {(isGenerating || isEditing) && <ProcessingOverlay step={processingStep} />}
              {!selectedImage ? (
                <div className="text-center text-slate-600 dark:text-slate-500 flex flex-col items-center animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-slate-800 dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/20 border border-slate-700">
                    <Wand2 size={40} className="text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-300">Ready to Reimagine?</h2>
                  <p className="text-slate-500 mt-2 max-w-sm">Upload a photo from the sidebar to start your AI design journey.</p>
                </div>
              ) : (
                <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                   <img src={generatedImage && activeView === 'generated' ? generatedImage : selectedImage} alt="Workspace" className="w-full h-full object-contain max-h-[80vh] bg-black/50" />
                   <div className="absolute bottom-6 left-6 bg-black/60 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 flex items-center gap-2">
                      {activeView === 'original' || !generatedImage ? <Camera size={14} /> : <Sparkles size={14} className="text-blue-400" />}
                      {activeView === 'original' || !generatedImage ? 'Original Photo' : 'AI Generated Render'}
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* History - Only shows saved items now */}
          {designHistory.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><History size={18} /> Saved Designs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {designHistory.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex h-32 relative">
                       <div className="w-1/2 relative overflow-hidden">
                          <img src={item.original} className="absolute inset-0 w-full h-full object-cover" alt="Old" />
                          <div className="absolute inset-0 bg-black/10"></div>
                       </div>
                       <div className="w-1/2 relative overflow-hidden">
                          <img src={item.generated} className="absolute inset-0 w-full h-full object-cover" alt="New" />
                       </div>
                       <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white z-10"></div>
                    </div>
                    <div className="p-4">
                       <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-0.5">{item.style}</span>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.room}</h4>
                          </div>
                          <span className="text-[10px] text-slate-400">{item.date}</span>
                       </div>
                       <button onClick={() => { setSelectedImage(item.original); setGeneratedImage(item.generated); setActiveView('generated'); }} className="w-full py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 transition-colors">
                          Load to Canvas
                       </button>
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