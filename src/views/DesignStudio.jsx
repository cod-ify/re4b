import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Wand2, Download, Save, RefreshCw, Image as ImageIcon, 
  CheckCircle2, Sliders, Palette, Layers, Sparkles, Plus, X, 
  Trash2, History, Check, Lock, Unlock, Layout
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

  // Constraint Options - Defaulting to TRUE for better initial results
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

    // Updated processing steps to reflect the backend logic
    const steps = ["Analyzing room geometry...", "Grounding layout constraints...", "Rendering with Gemini...", "Finalizing image..."];
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
        const newHistoryItem = {
          id: Date.now(),
          original: selectedImage,
          generated: data.image,
          style: config.style,
          room: config.roomType,
          date: new Date().toLocaleDateString()
        };
        setDesignHistory(prev => [newHistoryItem, ...prev]);
      } else {
        alert("Generation failed. Please try again or relax constraints.");
      }

    } catch (error) {
      console.error(error);
      alert("Could not connect to the Design Server.");
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleSaveToGallery = () => {
    if (setGallery && generatedImage) {
      const newPhoto = {
        id: Date.now(),
        url: generatedImage,
        label: `${config.style} ${config.roomType}`
      };
      setGallery(prev => [...prev, newPhoto]);
      alert("Design saved to Project Gallery!");
    }
  };

  const ProcessingOverlay = () => (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl text-white">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-6"></div>
        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 animate-pulse" size={24} />
      </div>
      <h3 className="text-xl font-bold tracking-wide">Generating Design</h3>
      <p className="text-blue-200 text-sm mt-2 font-mono animate-pulse">{processingStep}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Design Studio</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Reimagine your space with AI-powered visualization.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <Card className="p-4">
            <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Camera size={18} className="text-blue-600 dark:text-blue-400" /> Source Image
            </h3>
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
          </Card>

          <Card className="p-5 flex-1 flex flex-col gap-6">
            
            {/* Room Type with Add Func */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  <Layers size={14} /> Room Type
                </label>
                <button onClick={() => setIsAddingRoom(!isAddingRoom)} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  <Plus size={10} /> {isAddingRoom ? 'Cancel' : 'Add'}
                </button>
              </div>
              
              {isAddingRoom && (
                <div className="flex gap-2 mb-3 animate-in fade-in slide-in-from-top-2">
                   <Input autoFocus placeholder="New Room Name..." value={newRoom} onChange={e => setNewRoom(e.target.value)} className="flex-1" />
                   <Button variant="primary" onClick={handleAddRoom} disabled={!newRoom} className="px-3"><CheckCircle2 size={18} /></Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {rooms.map(type => (
                  <div key={type} className="relative group">
                    <button
                      onClick={() => setConfig({ ...config, roomType: type })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                        config.roomType === type ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
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
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Description</label>
                 <button onClick={handleMagicEnhance} disabled={isEnhancing} className={`flex items-center gap-1 text-[10px] font-bold uppercase transition-colors ${isEnhancing ? 'text-slate-400' : 'text-purple-600 hover:text-purple-700 dark:text-purple-400'}`}>
                   <Sparkles size={10} /> {isEnhancing ? 'Enhancing...' : 'Magic Enhance'}
                 </button>
               </div>
               <textarea 
                 className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                 placeholder="Describe your vision..."
                 value={config.prompt}
                 onChange={e => setConfig({...config, prompt: e.target.value})}
               />
            </div>

            {/* Layout Constraints */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
               <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">
                  <Layout size={14} /> Structure & Layout
               </label>
               <div className="flex gap-4">
                 <button 
                   onClick={() => setMaintainStructure(!maintainStructure)}
                   className={`flex-1 flex items-center justify-between p-2 rounded-lg text-sm border transition-all ${maintainStructure ? 'bg-white dark:bg-slate-700 border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm ring-1 ring-blue-500/20' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}
                 >
                   <span className="font-medium">Structure</span>
                   {maintainStructure ? <Lock size={14} /> : <Unlock size={14} />}
                 </button>
                 <button 
                   onClick={() => setMaintainFurniture(!maintainFurniture)}
                   className={`flex-1 flex items-center justify-between p-2 rounded-lg text-sm border transition-all ${maintainFurniture ? 'bg-white dark:bg-slate-700 border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm ring-1 ring-blue-500/20' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}
                 >
                   <span className="font-medium">Furniture</span>
                   {maintainFurniture ? <Lock size={14} /> : <Unlock size={14} />}
                 </button>
               </div>
               <p className="text-[10px] text-slate-400 mt-2 leading-tight">
                 {maintainStructure ? "Maintains walls, windows & doors. " : "Allows structural changes. "}
                 {maintainFurniture ? "Keeps furniture positions." : "Reimagines furniture layout."}
               </p>
            </div>

            {/* Style Selector (Grid with Images) */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">
                <Sliders size={14} /> Design Style
              </label>
              
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {/* Style Cards */}
                {styles.map(style => (
                  <div 
                    key={style.id}
                    onClick={() => setConfig({ ...config, style: style.name })}
                    className={`relative rounded-xl overflow-hidden cursor-pointer group border-2 transition-all ${config.style === style.name ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/30' : 'border-transparent'}`}
                  >
                    <div className="aspect-[4/3]">
                      <img src={style.image} alt={style.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className={`absolute inset-0 flex items-end p-3 transition-colors ${config.style === style.name ? 'bg-black/20' : 'bg-black/40 group-hover:bg-black/30'}`}>
                        <span className="text-white font-medium text-sm shadow-sm">{style.name}</span>
                        {config.style === style.name && <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full"><Check size={12} /></div>}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Style Button */}
                {isAddingStyle ? (
                  <div className="rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10 p-3 flex flex-col justify-center gap-2 aspect-[4/3]">
                    <input 
                      autoFocus
                      placeholder="Style Name" 
                      className="w-full p-2 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                      value={newStyleName}
                      onChange={e => setNewStyleName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={handleAddStyle} className="flex-1 bg-blue-600 text-white rounded py-1 text-xs font-bold hover:bg-blue-700">Add</button>
                      <button onClick={() => setIsAddingStyle(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded py-1 text-xs font-bold hover:bg-slate-300">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAddingStyle(true)}
                    className="flex flex-col items-center justify-center gap-2 aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <Plus size={24} />
                    <span className="text-xs font-bold">Add Custom</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4">
              <Button variant="primary" className="w-full py-3 shadow-lg shadow-blue-500/20" disabled={!selectedImage || isGenerating} onClick={handleGenerate}>
                {isGenerating ? 'Processing...' : 'Generate Design'}
                {!isGenerating && <Wand2 size={16} className="ml-2" />}
              </Button>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Canvas */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-slate-900 dark:bg-black rounded-2xl border border-slate-800 dark:border-slate-800 overflow-hidden relative shadow-2xl min-h-[500px] flex items-center justify-center">
            {generatedImage && (
               <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur text-white p-1 rounded-lg border border-slate-700 flex gap-1 z-20 shadow-lg">
                 <button onClick={() => setActiveView('original')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeView === 'original' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>Original</button>
                 <button onClick={() => setActiveView('generated')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeView === 'generated' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>Result</button>
               </div>
            )}
            {generatedImage && !isGenerating && (
              <div className="absolute top-4 right-4 flex gap-2 z-20">
                <button onClick={handleSaveToGallery} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-lg transition-colors" title="Save to Gallery"><Save size={20} /></button>
                <button className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg shadow-lg transition-colors" title="Download"><Download size={20} /></button>
              </div>
            )}
            <div className="w-full h-full relative flex items-center justify-center">
              {isGenerating && <ProcessingOverlay />}
              {!selectedImage ? (
                <div className="text-center text-slate-600 dark:text-slate-500">
                  <div className="bg-slate-800 dark:bg-slate-900 p-4 rounded-full inline-block mb-4"><Wand2 size={32} className="text-slate-500 dark:text-slate-400" /></div>
                  <p className="text-lg font-medium text-slate-400">Ready to create</p>
                  <p className="text-sm text-slate-600 dark:text-slate-500 mt-1">Upload an image to start designing</p>
                </div>
              ) : (
                <div className="relative w-full h-full">
                   <img src={generatedImage && activeView === 'generated' ? generatedImage : selectedImage} alt="Workspace" className="w-full h-full object-contain max-h-[70vh]" />
                   <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border border-white/10">{activeView === 'original' || !generatedImage ? 'Original Photo' : 'AI Generated Render'}</div>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          {designHistory.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><History size={18} /> Design History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {designHistory.map((item) => (
                  <Card key={item.id} className="p-4 flex gap-4 items-center">
                    <div className="flex gap-1 h-20 shrink-0">
                      <img src={item.original} className="h-full w-20 object-cover rounded-l-lg opacity-80" alt="Old" />
                      <div className="w-px bg-white"></div>
                      <img src={item.generated} className="h-full w-20 object-cover rounded-r-lg shadow-md" alt="New" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{item.style}</h4>
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{item.date}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.room}</p>
                      <button onClick={() => { setSelectedImage(item.original); setGeneratedImage(item.generated); setActiveView('generated'); }} className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-2 hover:underline">Load to Canvas</button>
                    </div>
                  </Card>
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