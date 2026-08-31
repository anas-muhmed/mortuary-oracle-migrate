import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Search, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Sparkles, 
  HelpCircle, 
  AlertCircle, 
  FileText,
  Video
} from 'lucide-react';
import { userGuideContent } from '../data/userGuideContent';

export default function UserGuide() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State variables
  const [lang, setLang] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModule, setActiveModule] = useState('module-1');
  const [pulseVideo, setPulseVideo] = useState(false);
  
  // Retrieve the current content according to selected language
  const currentContent = userGuideContent[lang] || userGuideContent.en;
  
  // Accordion state (default all expanded to allow scrolling and search visibility)
  const [expandedModules, setExpandedModules] = useState({
    'module-1': true,
    'module-2': true,
    'module-3': true,
    'module-4': true,
    'module-5': true,
    'module-6': true,
  });

  const videoRef = useRef(null);

  // Check for watch=true query parameter to scroll to video and animate it
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('watch') === 'true') {
      setPulseVideo(true);
      if (videoRef.current) {
        videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      // Remove pulsing after 4 seconds
      const timer = setTimeout(() => setPulseVideo(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  // If search query is typed, automatically expand matching modules so results are visible
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nextExpanded = { ...expandedModules };
      currentContent.modules.forEach(mod => {
        const titleMatch = mod.title.toLowerCase().includes(query);
        const blockMatch = mod.blocks.some(b => b.text.toLowerCase().includes(query));
        if (titleMatch || blockMatch) {
          nextExpanded[mod.id] = true;
        }
      });
      setExpandedModules(nextExpanded);
    }
  }, [searchQuery, lang]);

  // Intersection Observer to highlight current active module in sidebar on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveModule(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0px -60% 0px' }
    );

    currentContent.modules.forEach((mod) => {
      const el = document.getElementById(mod.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [lang, expandedModules]);

  // Toggle single module accordion
  const toggleModule = (id) => {
    setExpandedModules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Click sidebar navigation to expand and scroll to module
  const handleNavClick = (id) => {
    setExpandedModules(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Safe search highlight helper
  const highlightText = (text, query) => {
    if (!query || !query.trim()) return text;
    const cleanQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${cleanQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-slate-900 rounded-sm font-semibold px-0.5 shadow-sm">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors text-sm py-1.5 px-3 rounded-lg hover:bg-slate-100/80"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </button>

        <div className="flex items-center gap-4">
          {/* Language Switching Tabs */}
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200/50 shadow-inner">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                lang === 'en'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang('ml')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                lang === 'ml'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              മലയാളം
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        
        {/* Banner Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs mb-3 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MOSC Training & Help Center</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            {currentContent.title}
          </h1>
          <p className="max-w-3xl mx-auto text-slate-500 mt-3 text-base leading-relaxed">
            {currentContent.welcome}
          </p>
        </div>

        {/* Video Tutorial Section */}
        <section 
          ref={videoRef}
          className={`bg-white rounded-3xl border border-slate-200/80 p-6 lg:p-8 mb-10 shadow-sm transition-all duration-700 ${
            pulseVideo ? 'ring-4 ring-indigo-500/30 border-indigo-500 scale-[1.01]' : ''
          }`}
        >
          <div className="flex flex-col xl:flex-row gap-8 items-stretch">
            {/* Embedded Iframe */}
            <div className="flex-1 min-w-[320px] aspect-video rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-slate-900 relative">
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/RHd-QoOMOhQ"
                title="MOSC Mortuary Management System Training Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>

            {/* Description Card */}
            <div className="xl:w-1/3 flex flex-col justify-between py-2">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider mb-2">
                  <Video className="w-4 h-4" />
                  <span>Video Tutorial</span>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-3">
                  MOSC Mortuary Management System Training Video
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  "Watch this complete tutorial to understand the MOSC Mortuary Management System workflow from Staff Registration through Housekeeping Verification."
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex gap-3 items-start">
                <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-500 leading-normal">
                  <span className="font-semibold text-slate-700">Need help fast?</span> Click through the sidebar modules on the left (or scroll below) to access targeted steps with visual search.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <div className="sticky top-[60px] z-30 bg-slate-50/90 backdrop-blur-md pb-4 pt-1 mb-8">
          <div className="relative max-w-2xl mx-auto shadow-sm hover:shadow transition-shadow rounded-xl">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'en' ? "Search User Guide..." : "സഹായി തിരയുക..."}
              className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm lg:text-base font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Collapsible / Split Screen Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          
          {/* Left Column: Navigation Sidebar */}
          <nav className="w-full lg:w-1/4 lg:sticky lg:top-[140px] z-20 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 scrollbar-none border-b lg:border-b-0 border-slate-200">
            {currentContent.modules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => handleNavClick(mod.id)}
                className={`shrink-0 lg:shrink-1 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between gap-3 ${
                  activeModule === mod.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 translate-x-1 lg:translate-x-2'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950 border border-slate-200/60 shadow-sm'
                }`}
              >
                <span className="truncate max-w-[200px] lg:max-w-none">
                  {mod.title.split(':')[0]}
                </span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  activeModule === mod.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {mod.id.split('-')[1]}
                </span>
              </button>
            ))}
          </nav>

          {/* Right Column: Guide Content Panels */}
          <div className="flex-1 w-full space-y-6">
            {currentContent.modules.map((mod) => {
              const isExpanded = !!expandedModules[mod.id];
              return (
                <article
                  key={mod.id}
                  id={mod.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden scroll-mt-[210px] transition-all"
                >
                  {/* Module Header / Toggle Accordion */}
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full text-left px-6 py-5 bg-slate-50 hover:bg-slate-100/70 border-b border-slate-100 flex items-center justify-between transition-colors group"
                  >
                    <h3 className="text-base lg:text-lg font-bold text-slate-800 group-hover:text-slate-950 flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                      {highlightText(mod.title, searchQuery)}
                    </h3>
                    <div className="p-1 rounded-lg bg-slate-200/60 text-slate-500 group-hover:text-slate-700 transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </button>

                  {/* Module Body Content */}
                  {isExpanded && (
                    <div className="p-6 lg:p-8 space-y-4">
                      {mod.blocks.map((block, bIdx) => {
                        switch (block.type) {
                          case 'paragraph':
                            return (
                              <p key={bIdx} className="text-slate-600 text-sm lg:text-base leading-relaxed">
                                {highlightText(block.text, searchQuery)}
                              </p>
                            );

                          case 'heading':
                            return (
                              <h4 key={bIdx} className="text-sm lg:text-base font-extrabold text-slate-800 pt-3 flex items-center gap-2 border-b border-slate-100 pb-1.5 tracking-tight">
                                <span className="text-indigo-600">▪</span>
                                {highlightText(block.text, searchQuery)}
                              </h4>
                            );

                          case 'list-item':
                            return (
                              <div key={bIdx} className="flex gap-3 pl-2 py-0.5">
                                <span className="text-indigo-500 font-bold text-sm mt-0.5 shrink-0">✓</span>
                                <p className="text-slate-600 text-sm lg:text-base leading-relaxed">
                                  {highlightText(block.text, searchQuery)}
                                </p>
                              </div>
                            );

                          case 'sub-list-item':
                            return (
                              <div key={bIdx} className="flex gap-3 pl-8 py-0.5">
                                <span className="text-slate-400 font-semibold text-xs mt-1 shrink-0">•</span>
                                <p className="text-slate-500 text-xs lg:text-sm leading-relaxed">
                                  {highlightText(block.text, searchQuery)}
                                </p>
                              </div>
                            );

                          case 'note':
                            return (
                              <div key={bIdx} className="bg-amber-50/60 border-l-4 border-amber-500 p-4 rounded-r-xl my-4 text-amber-900 shadow-inner flex gap-3 items-start">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="text-xs lg:text-sm font-medium leading-relaxed">
                                  {highlightText(block.text, searchQuery)}
                                </div>
                              </div>
                            );

                          default:
                            return null;
                        }
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </main>

      {/* Sticky Bottom Help Bar */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-20 border-t border-slate-800 text-center px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div>
            <span className="font-semibold text-slate-200">MOSC Mortuary Management System</span> &mdash; Training & Resource Center
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Login Portal</button>
            <span className="text-slate-700">|</span>
            <button onClick={() => handleNavClick('module-1')} className="hover:text-white transition-colors">User Guide Start</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
