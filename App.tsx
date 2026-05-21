/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { MemoryActivationDiagram, ArchitectureDiagram, ImpactMetrics, IssueFrameworkDiagram, LubanWorkflowDiagram } from './components/Diagrams';
import { DemoSimulation } from './components/DemoSimulation';
import { TechSpecs } from './components/TechSpecs';
import { ArrowDown, Menu, X, Github, ExternalLink, FileText, Copy, Check, ChevronUp, Download, Loader2 } from 'lucide-react';

// Lazy load heavy 3D components
const HeroScene = lazy(() => import('./components/QuantumScene').then(m => ({ default: m.HeroScene })));
const EngramNetwork3D = lazy(() => import('./components/EngramNetwork3D').then(m => ({ default: m.EngramNetwork3D })));

// Loading fallback for 3D components
const SceneLoader = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <Loader2 className="w-8 h-8 text-nobel-gold animate-spin" />
  </div>
);

// Fade-in section wrapper for scroll animations
const FadeInSection: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className = "", delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

const AuthorCard = ({ name, role, symbol, link, delay }: { name: string, role: string, symbol?: string, link?: string, delay: string }) => {
  const cardClass = "relative flex flex-col group animate-fade-in-up items-center p-6 bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-lg transition-all duration-500 w-full sm:w-64 hover:border-nobel-gold/50";
  const inner = (
    <>
      {link && (
        <Github size={14} className="absolute top-3 right-3 text-stone-400 group-hover:text-nobel-gold transition-colors" aria-hidden="true" />
      )}
      <h3 className="font-serif text-lg text-stone-900 text-center mb-2 group-hover:text-nobel-gold transition-colors duration-300">
        {name}
        {symbol && <sup className="ml-0.5 text-nobel-gold font-sans text-sm not-italic">{symbol}</sup>}
      </h3>
      <div className="w-8 h-0.5 bg-nobel-gold mb-3 opacity-60 group-hover:w-16 transition-all duration-300"></div>
      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest text-center leading-relaxed h-8 flex items-center justify-center">{role}</p>
    </>
  );

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${name} — open profile`}
        className={`${cardClass} cursor-pointer hover:-translate-y-1`}
        style={{ animationDelay: delay }}
      >
        {inner}
      </a>
    );
  }

  return (
    <div className={cardClass} style={{ animationDelay: delay }}>
      {inner}
    </div>
  );
};

const BibTeXSection = () => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const bibtex = `@inproceedings{promptx2026,
  title={PromptX: A Cognitive Agent Platform with Long-term Memory},
  author={Wang, Binhao and Huang, Jianglin and Hu, Xiao and Jiang, Shan and Wang, Maolin and Yang, Ching-ho and Jiang, Jian and Ye, Junhao and Cen, Yaozu and Zeng, Rui and Zhou, Yingtong and Luo, Yingjie and Wu, Guanjie and Xu, Wangzhong and Zhou, Feiyu and Zhao, Xiangyu},
  booktitle={Proceedings of the ACM Web Conference 2026 (WWW Companion '26)},
  year={2026},
  publisher={ACM},
  doi={10.1145/3774905.3793108}
}`;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(bibtex);
      setCopied(true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (non-https / permission denied) — fail silently.
    }
  }, [bibtex]);

  return (
    <div className="mt-16 w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
         <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Citation (BibTeX)</span>
         <button 
           onClick={handleCopy}
           className="flex items-center gap-1 text-xs text-nobel-gold hover:text-stone-900 transition-colors"
         >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
         </button>
      </div>
      <div className="bg-stone-800 p-6 rounded-sm border border-stone-700 font-mono text-xs text-stone-400 leading-relaxed">
        <pre className="whitespace-pre-wrap break-words">{bibtex}</pre>
      </div>
    </div>
  );
};

const PaperReaderModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the close button when modal opens (a11y: keyboard users land inside)
      requestAnimationFrame(() => closeBtnRef.current?.focus());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paper-modal-title"
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full h-[92vh] sm:h-[80vh] sm:max-w-4xl rounded-t-2xl sm:rounded-sm shadow-2xl flex flex-col overflow-hidden relative animate-scale-up"
      >
        {/* Drag handle (mobile only) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
           <div className="w-10 h-1 rounded-full bg-stone-300" aria-hidden="true" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50">
           <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-stone-200 rounded-sm shrink-0">
                 <FileText size={18} className="text-stone-600" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                 <h3 id="paper-modal-title" className="font-serif font-bold text-stone-900 leading-tight text-sm sm:text-base truncate">PromptX_WWW26_CameraReady.pdf</h3>
                 <span className="text-[10px] text-stone-500 uppercase tracking-widest">Preview Mode</span>
              </div>
           </div>
           <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <a href={import.meta.env.BASE_URL + "2026_WWW_Demo.pdf"} download className="p-2 text-stone-400 hover:text-stone-900 transition-colors" title="Download PDF" aria-label="Download PDF">
                 <Download size={18} />
              </a>
              <button ref={closeBtnRef} onClick={onClose} className="p-2 text-stone-400 hover:text-red-500 transition-colors" aria-label="Close">
                 <X size={18} />
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-stone-50">
           <article className="max-w-3xl mx-auto px-5 py-8 sm:px-10 sm:py-12 text-stone-800">
              <header className="text-center mb-10 sm:mb-12">
                 <h1 className="font-serif font-bold text-stone-900 mb-5 leading-tight text-balance text-xl sm:text-2xl md:text-3xl">
                    PromptX: A Cognitive Agent Platform with Long-term Memory
                 </h1>
                 <div className="inline-block px-3 py-1 border border-stone-200 text-[10px] uppercase tracking-widest text-stone-400 rounded-sm">
                    WWW Companion '26
                 </div>
              </header>

              <section className="mb-8">
                 <h4 className="font-bold text-sm uppercase tracking-widest mb-3 text-stone-900 border-b border-stone-100 pb-2">Abstract</h4>
                 <p className="font-serif text-stone-600 leading-relaxed text-[15px] text-left sm:text-justify">
                    Large Language Models (LLMs) have demonstrated remarkable capabilities in natural language understanding and generation. However, their application in complex, long-term industrial scenarios is often hindered by catastrophic forgetting and a lack of personalized reasoning. Existing approaches, such as Retrieval-Augmented Generation (RAG), typically rely on retrieving static text chunks, which fails to capture the complex, evolving inter-dependencies of real-world tasks. To address these gaps, we introduce PromptX, a cognitive agent platform designed to enable agents to construct structured memory and develop reasoning capabilities over time. PromptX introduces three core technical innovations: (1) Prompt Markup Language (PML), a standardized definition language for agent personas; (2) An Engram-based Memory Architecture using Activation-Diffusion networks; and (3) The Agent Context Protocol (ACP) for dynamic tool discovery.
                 </p>
              </section>

              <section className="mb-8">
                 <h4 className="font-bold text-sm uppercase tracking-widest mb-3 text-stone-900 border-b border-stone-100 pb-2">1. Introduction</h4>
                 <p className="font-serif text-stone-600 leading-relaxed text-[15px] mb-4 text-left sm:text-justify">
                    The evolution of AI agents has shifted from simple command-response systems to autonomous entities capable of planning and tool use. Despite this progress, "memory" remains a solved problem only in the context of short context windows. When an agent needs to recall a specific user preference from a conversation three weeks ago and apply it to a new, tangentially related task, traditional vector databases often fail due to a lack of semantic structure.
                 </p>
                 <p className="font-serif text-stone-600 leading-relaxed text-[15px] text-left sm:text-justify">
                    PromptX proposes a shift from "Storage" to "Cognition". By modeling memory as <strong>Engrams</strong>—graph nodes with activation states—we mimic biological memory processes where retrieving one concept primes the activation of related concepts. This allows PromptX agents to exhibit "intuition-like" retrieval patterns...
                 </p>
              </section>

              <div className="mt-10 py-8 flex flex-col items-center gap-4 bg-white border border-dashed border-stone-200 rounded-sm">
                 <span className="text-stone-400 text-[10px] uppercase tracking-widest">[Preview Ends]</span>
                 <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-5 sm:px-0">
                    <a href={import.meta.env.BASE_URL + "2026_WWW_Demo.pdf"} target="_blank" rel="noopener noreferrer" className="px-5 py-3 sm:py-2 bg-stone-900 text-white text-xs uppercase tracking-widest rounded-sm hover:bg-nobel-gold transition-colors text-center">
                       View Full PDF
                    </a>
                    <a href={import.meta.env.BASE_URL + "2026_WWW_Demo.pdf"} download className="px-5 py-3 sm:py-2 border border-stone-300 text-stone-600 text-xs uppercase tracking-widest rounded-sm hover:border-nobel-gold hover:text-nobel-gold transition-colors text-center">
                       Download
                    </a>
                 </div>
              </div>
           </article>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPaperOpen, setIsPaperOpen] = useState(false);
  const paperTriggerRef = useRef<HTMLButtonElement | null>(null);

  // ESC closes overlays
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setIsPaperOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when any full-screen overlay is open (modal or mobile menu)
  useEffect(() => {
    if (!isPaperOpen && !menuOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isPaperOpen, menuOpen]);

  // Restore focus to trigger ONLY on the open→closed transition (not on mount).
  const wasPaperOpenRef = useRef(false);
  useEffect(() => {
    if (wasPaperOpenRef.current && !isPaperOpen) {
      paperTriggerRef.current?.focus();
    }
    wasPaperOpenRef.current = isPaperOpen;
  }, [isPaperOpen]);

  useEffect(() => {
    // Scroll to top on mount to prevent Three.js canvas from causing scroll jump
    window.scrollTo(0, 0);

    // Debounced scroll handler for better performance
    let timeoutId: number | null = null;
    const handleScroll = () => {
      if (timeoutId) return;
      timeoutId = window.setTimeout(() => {
        setScrolled(window.scrollY > 50);
        timeoutId = null;
      }, 16); // ~60fps
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-800">

      <PaperReaderModal isOpen={isPaperOpen} onClose={() => setIsPaperOpen(false)} />

      {/* Navigation - hidden at top on mobile, always visible on desktop */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#FAFAF9]/90 backdrop-blur-md shadow-sm py-4 translate-y-0' : 'md:bg-transparent md:py-6 -translate-y-full md:translate-y-0'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={import.meta.env.BASE_URL + "promptx-logo.png"} alt="PromptX" width="32" height="32" decoding="async" fetchPriority="high" className="w-8 h-8" />
            <span className="font-serif font-bold text-lg tracking-wide">
              PROMPT<span className="text-nobel-gold group-hover:text-stone-900 transition-colors">X</span> <span className="font-normal text-stone-400 text-xs ml-2">2026</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-stone-600">
            <a href="#overview" onClick={scrollToSection('overview')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase text-xs tracking-widest">Overview</a>
            <a href="#architecture" onClick={scrollToSection('architecture')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase text-xs tracking-widest">Architecture</a>
            <a href="#specs" onClick={scrollToSection('specs')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase text-xs tracking-widest">Specs</a>
            <a href="#demo" onClick={scrollToSection('demo')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase text-xs tracking-widest">Demo</a>
            <a href="#impact" onClick={scrollToSection('impact')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase text-xs tracking-widest">Impact</a>
            <a href="#team" onClick={scrollToSection('team')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase text-xs tracking-widest">Team</a>
            <a 
              href="https://github.com/Deepractice/PromptX" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-5 py-2 bg-stone-900 text-white rounded-sm hover:bg-nobel-gold transition-colors shadow-sm cursor-pointer flex items-center gap-2 text-xs uppercase tracking-widest"
            >
              <Github size={14} /> GitHub
            </a>
          </div>

          <button
            className="md:hidden text-stone-900 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-[#FAFAF9] flex flex-col items-center justify-center gap-6 text-xl font-serif animate-fade-in">
            <a href="#overview" onClick={scrollToSection('overview')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase tracking-widest text-sm">Overview</a>
            <a href="#architecture" onClick={scrollToSection('architecture')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase tracking-widest text-sm">Architecture</a>
            <a href="#specs" onClick={scrollToSection('specs')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase tracking-widest text-sm">Specs</a>
            <a href="#demo" onClick={scrollToSection('demo')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase tracking-widest text-sm">Demo</a>
            <a href="#impact" onClick={scrollToSection('impact')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase tracking-widest text-sm">Impact</a>
            <a href="#team" onClick={scrollToSection('team')} className="hover:text-nobel-gold transition-colors cursor-pointer uppercase tracking-widest text-sm">Team</a>
            <a
              href="https://github.com/Deepractice/PromptX"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="px-8 py-3 bg-stone-900 text-white rounded-sm shadow-lg cursor-pointer uppercase tracking-widest text-sm"
            >
              GitHub
            </a>
        </div>
      )}

      {/* Scroll To Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
        className={`fixed bottom-8 right-8 z-40 p-3 bg-stone-900 text-white rounded-full shadow-lg hover:bg-nobel-gold transition-all duration-300 ${scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <ChevronUp size={20} />
      </button>

      {/* Hero Section */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#FAFAF9] to-[#E7E5E4]">
        <Suspense fallback={<SceneLoader className="absolute inset-0" />}>
          <HeroScene />
        </Suspense>
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <a
            href="https://www2026.thewebconf.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mb-6 px-4 py-1.5 border border-nobel-gold/50 text-nobel-gold text-[10px] tracking-[0.3em] uppercase font-bold rounded-sm backdrop-blur-sm bg-white/50 shadow-sm hover:bg-nobel-gold hover:text-white hover:border-nobel-gold transition-colors duration-300"
          >
            WWW Companion '26 • Dubai
          </a>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-medium leading-tight mb-8 text-stone-900 drop-shadow-sm">
            Prompt<span className="text-nobel-gold italic">X</span>
            <span className="block text-2xl md:text-3xl font-light text-stone-500 mt-6 leading-relaxed">
              A Cognitive Agent Platform <br className="hidden md:block"/> with Long-term Memory
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-stone-600 font-light leading-relaxed mb-12">
            Enabling AI agents to construct structured memory and develop reasoning over time through Activation-Diffusion Networks and the Agent Context Protocol.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <a href="#overview" onClick={scrollToSection('overview')} className="flex items-center justify-center gap-2 px-8 py-3 bg-stone-900 text-white rounded-sm font-medium shadow-lg hover:bg-nobel-gold transition-all duration-300 text-xs uppercase tracking-widest hover:-translate-y-1">
                Discover
                <ArrowDown size={14} />
             </a>
             <button
                ref={paperTriggerRef}
                onClick={() => setIsPaperOpen(true)}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-white text-stone-900 border border-stone-200 rounded-sm font-medium shadow-sm hover:bg-stone-50 hover:border-nobel-gold transition-all duration-300 text-xs uppercase tracking-widest hover:-translate-y-1"
             >
                <FileText size={14} />
                Read Paper
             </button>
             <a href="https://promptx.deepractice.ai/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-8 py-3 bg-transparent text-stone-900 border border-stone-400 rounded-sm font-medium hover:bg-stone-50 hover:border-nobel-gold transition-all duration-300 text-xs uppercase tracking-widest hover:-translate-y-1">
                Live Demo
                <ExternalLink size={14} />
             </a>
          </div>
        </div>
      </header>

      <main>
        {/* Overview */}
        <section id="overview" className="py-24 bg-white relative z-20">
          <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-4">
              <div className="inline-block mb-3 text-xs font-bold tracking-[0.2em] text-nobel-gold uppercase">The Problem</div>
              <h2 className="font-serif text-4xl mb-6 leading-tight text-stone-900">Beyond "Flat" RAG</h2>
              <div className="w-16 h-0.5 bg-nobel-gold mb-6"></div>
              <p className="text-stone-500 italic font-serif text-lg leading-relaxed">
                "Existing Retrieval-Augmented Generation relies on text chunk retrieval, failing to capture complex inter-dependencies."
              </p>
            </div>
            <div className="md:col-span-8 text-lg text-stone-600 leading-relaxed space-y-6 font-light">
              <p>
                <span className="text-6xl float-left mr-3 mt-[-10px] font-serif text-nobel-gold">W</span>hile Large Language Models demonstrate impressive contextual understanding, they suffer from catastrophic forgetting and lack personalized reasoning in industrial settings.
              </p>
              <p>
                To address these gaps, we introduce <strong>PromptX</strong>. Unlike traditional RAG which retrieves static text chunks, PromptX implements a <strong>Cognitive Architecture</strong>. It integrates three core technologies:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <li className="p-6 bg-[#FAFAF9] rounded-sm border border-stone-100 hover:border-nobel-gold/30 transition-colors duration-300">
                    <strong className="block text-stone-900 mb-2 font-serif text-xl">PML</strong>
                    <span className="text-xs uppercase tracking-widest text-stone-400 mb-2 block">Prompt Markup Language</span>
                    <span className="text-sm">Machine-parsable definitions for agent personas and memory organization.</span>
                </li>
                <li className="p-6 bg-[#FAFAF9] rounded-sm border border-stone-100 hover:border-nobel-gold/30 transition-colors duration-300">
                    <strong className="block text-stone-900 mb-2 font-serif text-xl">Engram Networks</strong>
                    <span className="text-xs uppercase tracking-widest text-stone-400 mb-2 block">Memory Architecture</span>
                    <span className="text-sm">Activation-diffusion graph memory uniting raw experience with conceptual sequences.</span>
                </li>
                <li className="p-6 bg-[#FAFAF9] rounded-sm border border-stone-100 md:col-span-2 hover:border-nobel-gold/30 transition-colors duration-300">
                    <strong className="block text-stone-900 mb-2 font-serif text-xl">ACP Protocol</strong>
                    <span className="text-xs uppercase tracking-widest text-stone-400 mb-2 block">Agent Context Protocol</span>
                    <span className="text-sm">HATEOAS-inspired protocol enabling dynamic tool discovery and "delegating tasks" rather than just using tools.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section id="architecture" className="py-24 bg-stone-900 text-stone-100 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-12">
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-800 text-nobel-gold text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm mb-6 border border-stone-700">
                        Design Framework
                     </div>
                     <h2 className="font-serif text-4xl md:text-5xl mb-6 text-white">Three-Layer Architecture</h2>
                     <p className="text-lg text-stone-400 font-light">
                        PromptX unifies cognitive structure, associative memory, and autonomous tool orchestration.
                     </p>
                </div>
                <ArchitectureDiagram />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-20">
                    <div className="p-8 border border-stone-800 rounded-sm hover:border-nobel-gold/30 transition-colors duration-300 bg-stone-800/20">
                        <h3 className="font-serif text-2xl text-nobel-gold mb-4">Nuwa: Role Creation</h3>
                        <p className="text-stone-400 leading-relaxed font-light mb-6">
                            A human-AI collaboration paradigm called <strong>ISSUE</strong> (Initiate, Structure, Socratic, Unify, Execute). Nuwa creates PML roles in 2-3 minutes via guided questioning, automatically generating structured cognitive architectures.
                        </p>
                        <IssueFrameworkDiagram />
                    </div>
                    <div className="p-8 border border-stone-800 rounded-sm hover:border-nobel-gold/30 transition-colors duration-300 bg-stone-800/20">
                        <h3 className="font-serif text-2xl text-nobel-gold mb-4">Luban: Tool Integration</h3>
                        <p className="text-stone-400 leading-relaxed font-light mb-6">
                            Integrates any API into AI-callable tools within 3 minutes. Generates capability specifications with security constraints and validates them in a sandbox before registration.
                        </p>
                        <LubanWorkflowDiagram />
                    </div>
                </div>
            </div>
        </section>

         {/* Technical Specifications */}
         <section id="specs" className="py-24 bg-white border-t border-stone-100">
            <div className="container mx-auto px-6">
                 <div className="text-center max-w-3xl mx-auto mb-8">
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FAFAF9] text-nobel-gold text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm mb-6 border border-stone-200">
                        Core Protocols
                     </div>
                     <h2 className="font-serif text-4xl md:text-5xl mb-6 text-stone-900">Technical Deep Dive</h2>
                     <p className="text-lg text-stone-600 font-light">
                        Explore the standardized markup and automated workflows that power the PromptX ecosystem.
                     </p>
                </div>
                <TechSpecs />
            </div>
        </section>

        {/* Live Demo Simulation */}
        <section id="demo" className="py-24 bg-[#FAFAF9]">
            <div className="container mx-auto px-6">
                <div className="mb-12">
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-white text-nobel-gold text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm mb-6 border border-stone-200">
                        Demonstration
                     </div>
                     <h2 className="font-serif text-4xl md:text-5xl mb-6 text-stone-900">Interactive Scenario</h2>
                     <p className="text-lg text-stone-600 font-light max-w-3xl">
                        Experience how PromptX builds an agent from scratch. In this scenario (from Section 3), we create a stock analysis tool, generate a persona, and demonstrate cross-session long-term memory.
                     </p>
                </div>
                <DemoSimulation />
            </div>
        </section>

        {/* Memory System */}
        <section id="memory" className="py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FAFAF9] text-nobel-gold text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm mb-6 border border-stone-200">
                            Core Innovation
                        </div>
                        <h2 className="font-serif text-4xl md:text-5xl mb-6 text-stone-900">Engram Memory</h2>
                        <div className="w-12 h-1 bg-nobel-gold mb-8"></div>
                        <p className="text-lg text-stone-600 mb-6 leading-relaxed font-light">
                           PromptX moves beyond vector similarity. It uses <strong>Engrams</strong>—memory units containing content, schema, strength, and type. 
                        </p>
                        <p className="text-lg text-stone-600 mb-8 leading-relaxed font-light">
                            The <strong>Recall Agent</strong> uses a graph-based activation-diffusion process. When a query is received, activation spreads across the network to uncover causally or conceptually related memories, even if they aren't textually similar.
                        </p>
                        <ul className="space-y-4 text-stone-600">
                            <li className="flex items-start gap-4 p-4 border-l-2 border-nobel-gold/20 hover:border-nobel-gold transition-colors bg-[#FAFAF9]">
                                <div>
                                    <span className="block text-xs uppercase tracking-widest font-bold text-stone-400 mb-1">Encoding</span>
                                    <span className="font-serif text-lg text-stone-900">Remember Agent</span>
                                    <p className="text-sm mt-1 text-stone-500">Encodes raw experience into structured Engrams.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 p-4 border-l-2 border-nobel-gold/20 hover:border-nobel-gold transition-colors bg-[#FAFAF9]">
                                <div>
                                    <span className="block text-xs uppercase tracking-widest font-bold text-stone-400 mb-1">Retrieval</span>
                                    <span className="font-serif text-lg text-stone-900">Recall Agent</span>
                                    <p className="text-sm mt-1 text-stone-500">Retrieves via graph propagation (Algorithm 2).</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-[#FAFAF9] p-2 rounded-lg shadow-inner min-h-[400px]">
                        <Suspense fallback={<SceneLoader className="h-[400px]" />}>
                          <EngramNetwork3D />
                        </Suspense>
                    </div>
                </div>
            </div>
        </section>

        {/* Impact */}
        <section id="impact" className="py-24 bg-[#FAFAF9] border-t border-stone-200">
             <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <div className="inline-block mb-3 text-xs font-bold tracking-[0.2em] text-nobel-gold uppercase">Validation</div>
                    <h2 className="font-serif text-4xl md:text-5xl mb-6 text-stone-900">Deployment at Scale</h2>
                    <p className="text-lg text-stone-600 leading-relaxed font-light">
                        Over 5 months of deployment across 15+ enterprises in 6 industries. Validated by system internals and algorithms.
                    </p>
                </div>

                <ImpactMetrics />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                     <div className="bg-white p-10 rounded-sm border border-stone-200 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-nobel-gold/5 rounded-bl-full group-hover:bg-nobel-gold/10 transition-colors"></div>
                        <h4 className="font-serif text-2xl mb-4 text-stone-900">Education: AI Tutor</h4>
                        <div className="w-8 h-0.5 bg-nobel-gold mb-6 opacity-40"></div>
                        <p className="text-stone-600 italic mb-6 font-serif leading-relaxed">"Memory networks enable AI to remember each student's learning trajectory... Students report feeling 'understood'."</p>
                        <div className="text-[10px] font-bold text-nobel-gold uppercase tracking-[0.2em]">Memory-Augmented Teaching Assistant</div>
                     </div>
                     
                     <div className="bg-white p-10 rounded-sm border border-stone-200 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-nobel-gold/5 rounded-bl-full group-hover:bg-nobel-gold/10 transition-colors"></div>
                        <h4 className="font-serif text-2xl mb-4 text-stone-900">Consulting: Sales Agent</h4>
                        <div className="w-8 h-0.5 bg-nobel-gold mb-6 opacity-40"></div>
                        <p className="text-stone-600 italic mb-6 font-serif leading-relaxed">"Reduced ramp-up time from 6 months to 6 weeks... Impossible with traditional RAG."</p>
                        <div className="text-[10px] font-bold text-nobel-gold uppercase tracking-[0.2em]">Knowledge Systematization</div>
                     </div>
                </div>
             </div>
        </section>

        {/* Team */}
        <section id="team" className="py-24 bg-white border-t border-stone-200">
           <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-block mb-3 text-xs font-bold tracking-[0.2em] text-nobel-gold uppercase">The Team</div>
                    <h2 className="font-serif text-3xl md:text-5xl mb-4 text-stone-900">Contributors</h2>
                    <p className="text-stone-500 max-w-2xl mx-auto font-light">
                        A collaboration between City University of Hong Kong, Deepractice AI, and NYU.
                    </p>
                </div>
                
                {/* Core Contributors (symbol legend follows the PDF) */}
                <div className="flex flex-wrap gap-6 justify-center max-w-5xl mx-auto">
                    <AuthorCard name="Binhao Wang" role="City University of Hong Kong" symbol="*" delay="0s" />
                    <AuthorCard name="Jianglin Huang" role="Deepractice AI Limited" symbol="*" delay="0.1s" />
                    <AuthorCard name="Xiao Hu" role="Deepractice AI Limited" symbol="*" delay="0.1s" />
                    <AuthorCard name="Shan Jiang" role="Deepractice AI Limited" symbol="†" delay="0.2s" />
                    <AuthorCard name="Maolin Wang" role="CityU HK & Deepractice AI" symbol="*‡" delay="0.2s" />
                    <AuthorCard name="Ching-ho Yang" role="Deepractice AI Limited" symbol="*§" link="https://github.com/deepracticexc" delay="0.3s" />
                </div>

                {/* Symbol legend — first row mirrors the PDF, second row adds website-only role */}
                <div className="mt-6 text-center text-xs text-stone-500 flex flex-wrap justify-center gap-x-6 gap-y-1">
                    <span><sup className="text-nobel-gold">*</sup> Core Contributor</span>
                    <span><sup className="text-nobel-gold">†</sup> Project Leader</span>
                    <span><sup className="text-nobel-gold">‡</sup> Corresponding Author</span>
                    <span><sup className="text-nobel-gold">§</sup> Co-Founder &amp; Site Author</span>
                </div>

                {/* Contributing Authors (the remaining 10 PDF-listed authors) */}
                <div className="mt-16 max-w-5xl mx-auto">
                    <div className="text-center mb-6">
                        <div className="inline-block text-[10px] font-bold tracking-[0.2em] text-nobel-gold uppercase">Contributing Authors</div>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center">
                        {[
                            { name: "Jian Jiang", affiliation: "Deepractice AI" },
                            { name: "Junhao Ye", affiliation: "Deepractice AI" },
                            { name: "Yaozu Cen", affiliation: "Deepractice AI" },
                            { name: "Rui Zeng", affiliation: "Deepractice AI" },
                            { name: "Yingtong Zhou", affiliation: "Deepractice AI" },
                            { name: "Yingjie Luo", affiliation: "Deepractice AI" },
                            { name: "Guanjie Wu", affiliation: "Deepractice AI" },
                            { name: "Wangzhong Xu", affiliation: "Deepractice AI" },
                            { name: "Feiyu Zhou", affiliation: "New York University" },
                            { name: "Xiangyu Zhao", affiliation: "City University of Hong Kong" }
                        ].map((contributor, i) => (
                            <div key={i} className="px-5 py-3 bg-stone-50 rounded-sm text-sm text-stone-600 border border-stone-200 hover:border-nobel-gold/50 hover:text-nobel-gold transition-colors duration-300 text-center min-w-[160px]">
                                <div className="font-semibold text-stone-800">{contributor.name}</div>
                                <div className="text-xs text-stone-500 mt-1">{contributor.affiliation}</div>
                            </div>
                        ))}
                    </div>
                </div>
           </div>
        </section>

      </main>

      <footer className="bg-stone-900 text-stone-400 py-16 border-t border-nobel-gold/20">
        <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                <div className="text-center md:text-left">
                    <div className="text-white font-serif font-bold text-2xl mb-2 flex items-center gap-2 justify-center md:justify-start">
                        <img src={import.meta.env.BASE_URL + "promptx-logo.png"} alt="PromptX" width="24" height="24" loading="lazy" decoding="async" className="w-6 h-6" />
                        PromptX
                    </div>
                    <p className="text-sm text-stone-500">Cognitive Agent Platform with Long-term Memory</p>
                </div>
                <div className="flex gap-6 text-sm">
                    <a href="https://github.com/Deepractice/PromptX" className="hover:text-nobel-gold transition-colors">GitHub</a>
                    <a href="https://promptx.deepractice.ai" className="hover:text-nobel-gold transition-colors">Demo</a>
                    <a href="https://promptx.deepractice.ai/docs" className="hover:text-nobel-gold transition-colors">Documentation</a>
                </div>
            </div>
            
            <BibTeXSection />

            <div className="text-center mt-12 text-xs text-stone-600 border-t border-stone-800 pt-8 flex flex-col gap-2">
                <div className="flex flex-col md:flex-row justify-center items-center gap-2">
                    <span>© 2026 Deepractice AI & Authors.</span>
                    <span className="hidden md:inline">•</span>
                    <span>Published in WWW Companion '26.</span>
                </div>
                <div className="text-stone-500">
                    Paper content under ACM copyright. Website code under <a href="https://github.com/Deepractice/Research/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-nobel-gold transition-colors">MIT License</a>.
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;