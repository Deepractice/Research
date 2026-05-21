/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, FileText, CheckCircle, Shield, Box, ArrowRight, Settings, Workflow, Link2, GitBranch } from 'lucide-react';

export const TechSpecs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pml' | 'luban' | 'acp'>('pml');

  return (
    <div className="w-full bg-white rounded-sm border border-stone-200 shadow-sm overflow-hidden my-12">
      <div className="flex flex-col md:flex-row border-b border-stone-200" role="tablist" aria-label="Technical specifications">
        <button
          onClick={() => setActiveTab('pml')}
          role="tab"
          aria-selected={activeTab === 'pml'}
          aria-controls="panel-pml"
          id="tab-pml"
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${
            activeTab === 'pml' ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:bg-stone-50'
          }`}
        >
          PML Syntax
        </button>
        <button
          onClick={() => setActiveTab('luban')}
          role="tab"
          aria-selected={activeTab === 'luban'}
          aria-controls="panel-luban"
          id="tab-luban"
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${
            activeTab === 'luban' ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:bg-stone-50'
          }`}
        >
          Luban Engine
        </button>
        <button
          onClick={() => setActiveTab('acp')}
          role="tab"
          aria-selected={activeTab === 'acp'}
          aria-controls="panel-acp"
          id="tab-acp"
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${
            activeTab === 'acp' ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:bg-stone-50'
          }`}
        >
          ACP Protocol
        </button>
      </div>

      <div className="p-8 min-h-[500px] bg-[#FAFAF9]">
        <div role="tabpanel" id="panel-pml" aria-labelledby="tab-pml" hidden={activeTab !== 'pml'}>
          {activeTab === 'pml' && <PMLViewer />}
        </div>
        <div role="tabpanel" id="panel-luban" aria-labelledby="tab-luban" hidden={activeTab !== 'luban'}>
          {activeTab === 'luban' && <LubanWorkflow />}
        </div>
        <div role="tabpanel" id="panel-acp" aria-labelledby="tab-acp" hidden={activeTab !== 'acp'}>
          {activeTab === 'acp' && <ACPViewer />}
        </div>
      </div>
    </div>
  );
};

// Syntax highlighting helper
const highlightPML = (text: string): React.ReactElement => {
  // Pattern to match XML-like syntax
  const parts: React.ReactElement[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Match opening/closing tag with attributes: <tag attr="value"> or </tag> or <tag />
    const tagMatch = remaining.match(/^(<\/?)([\w_]+)((?:\s+[\w_]+="[^"]*")*)\s*(\/?>)/);
    if (tagMatch) {
      const [full, bracket, tagName, attrs, closeBracket] = tagMatch;
      parts.push(<span key={key++} className="text-stone-500">{bracket}</span>);
      parts.push(<span key={key++} className="text-pink-400">{tagName}</span>);

      // Parse attributes
      if (attrs) {
        const attrRegex = /([\w_]+)="([^"]*)"/g;
        let attrMatch;
        let attrStr = attrs;
        while ((attrMatch = attrRegex.exec(attrs)) !== null) {
          const [, attrName, attrValue] = attrMatch;
          const beforeAttr = attrStr.indexOf(attrMatch[0]);
          if (beforeAttr > 0) {
            parts.push(<span key={key++} className="text-stone-500">{attrStr.slice(0, beforeAttr)}</span>);
          }
          parts.push(<span key={key++} className="text-stone-500"> </span>);
          parts.push(<span key={key++} className="text-sky-400">{attrName}</span>);
          parts.push(<span key={key++} className="text-stone-500">=</span>);
          parts.push(<span key={key++} className="text-amber-400">"{attrValue}"</span>);
          attrStr = attrStr.slice(attrStr.indexOf(attrMatch[0]) + attrMatch[0].length);
        }
      }

      parts.push(<span key={key++} className="text-stone-500">{closeBracket}</span>);
      remaining = remaining.slice(full.length);
      continue;
    }

    // Match text content between tags
    const textMatch = remaining.match(/^([^<]+)/);
    if (textMatch) {
      parts.push(<span key={key++} className="text-emerald-400">{textMatch[1]}</span>);
      remaining = remaining.slice(textMatch[1].length);
      continue;
    }

    // Fallback: single character
    parts.push(<span key={key++} className="text-stone-300">{remaining[0]}</span>);
    remaining = remaining.slice(1);
  }

  return <>{parts}</>;
};

const PMLViewer: React.FC = () => {
  const [selectedTag, setSelectedTag] = useState<string>('role'); // Default to showing 'role' explanation

  const codeLines = [
    { text: '<role name="Investment_Banker">', tag: 'role', indent: 0 },
    { text: '<persona>', tag: 'persona', indent: 1 },
    { text: '<trait>Analytical</trait>', tag: 'persona', indent: 2 },
    { text: '<trait>Risk-Aware</trait>', tag: 'persona', indent: 2 },
    { text: '</persona>', tag: 'persona', indent: 1 },
    { text: '', tag: null, indent: 0 },
    { text: '<capabilities>', tag: 'capabilities', indent: 1 },
    { text: '<use_tool name="market_data_api" />', tag: 'capabilities', indent: 2 },
    { text: '<permission level="read_only" />', tag: 'capabilities', indent: 2 },
    { text: '</capabilities>', tag: 'capabilities', indent: 1 },
    { text: '', tag: null, indent: 0 },
    { text: '<memory_policy>', tag: 'memory', indent: 1 },
    { text: '<strategy>ActivationDiffusion</strategy>', tag: 'memory', indent: 2 },
    { text: '<retention>LongTerm</retention>', tag: 'memory', indent: 2 },
    { text: '</memory_policy>', tag: 'memory', indent: 1 },
    { text: '</role>', tag: 'role', indent: 0 },
  ];

  const explanations: Record<string, { title: string; desc: string }> = {
    role: { title: 'Role Definition', desc: 'The root element defining the agent entity. Encapsulates all cognitive and behavioral properties.' },
    persona: { title: 'Persona Layer', desc: 'Defines the psychological traits and tone. Influences the style of response generation.' },
    capabilities: { title: 'Capability Registry', desc: 'Links to the Luban Tool Engine. Defines which standardized tools the agent can access and their permission scopes.' },
    memory: { title: 'Memory Policy', desc: 'Configures the Engram Network parameters. Determines how experiences are encoded and the threshold for activation-diffusion retrieval.' },
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:flex-1 bg-[#1c1917] rounded-sm p-4 md:p-6 font-mono text-sm shadow-inner border border-stone-800 max-h-[280px] md:max-h-none overflow-y-auto">
        <div className="flex items-center justify-between gap-2 mb-3 text-stone-500 border-b border-stone-800 pb-2">
            <div className="flex items-center gap-2">
              <Code size={14} />
              <span className="text-xs uppercase">agent_def.pml</span>
            </div>
            <span className="text-sm animate-bounce">👇</span>
        </div>
        {codeLines.map((line, idx) => (
          <div
            key={idx}
            onClick={() => line.tag && setSelectedTag(line.tag)}
            className={`cursor-pointer transition-colors duration-200 leading-relaxed ${
              selectedTag === line.tag ? 'bg-nobel-gold/20 border-l-2 border-nobel-gold' : 'hover:bg-stone-800/50 border-l-2 border-transparent'
            }`}
            style={{ paddingLeft: `${line.indent * 1.2}rem` }}
          >
            {line.text ? highlightPML(line.text) : '\u00A0'}
          </div>
        ))}
      </div>

      <div className="md:flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTag}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 bg-white border border-nobel-gold/50 rounded-sm shadow-sm"
          >
            <h3 className="font-serif text-xl md:text-2xl text-stone-900 mb-2">{explanations[selectedTag].title}</h3>
            <div className="w-10 h-0.5 bg-nobel-gold mb-3"></div>
            <p className="text-stone-600 leading-relaxed text-sm">
              {explanations[selectedTag].desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const LubanWorkflow: React.FC = () => {
  const steps = [
    { icon: <FileText size={20} />, title: "Input", desc: "Raw API Docs (OpenAPI/Swagger)" },
    { icon: <Settings size={20} />, title: "Generation", desc: "Luban Engine creates Tool Spec" },
    { icon: <Shield size={20} />, title: "Validation", desc: "Security & Sandbox Testing" },
    { icon: <Box size={20} />, title: "Registry", desc: "Available to Nuwa Agents" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full py-8">
      <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-4xl">
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 }}
                className="flex-1 flex flex-col items-center text-center p-4 bg-white border border-stone-200 rounded-sm shadow-sm hover:border-nobel-gold transition-colors group relative"
            >
               <div className="absolute top-0 left-0 w-full h-1 bg-stone-100 group-hover:bg-nobel-gold transition-colors"></div> 
               <div className="w-12 h-12 bg-stone-50 text-stone-400 rounded-full flex items-center justify-center mb-4 group-hover:text-nobel-gold transition-colors">
                 {step.icon}
               </div>
               <h4 className="font-serif font-bold text-stone-900 mb-1">{step.title}</h4>
               <p className="text-xs text-stone-500">{step.desc}</p>
            </motion.div>
            
            {idx < steps.length - 1 && (
                <div className="hidden md:flex text-stone-300">
                    <ArrowRight size={24} />
                </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-12 p-6 bg-stone-100 rounded-sm border border-stone-200 max-w-2xl text-center">
        <div className="flex items-center justify-center gap-2 mb-2 text-nobel-gold">
            <CheckCircle size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Automation Result</span>
        </div>
        <p className="text-stone-600 italic">
            "Luban reduces tool integration time from hours to <strong className="text-stone-900">3 minutes</strong> per API, enabling rapid capability expansion."
        </p>
      </div>
    </div>
  );
};

// --- ACP PROTOCOL VISUALIZATION ---
const ACPViewer: React.FC = () => {
  const [state, setState] = useState<'idle' | 'analyzing' | 'complete'>('idle');

  const transitions = {
    idle: {
      label: 'IDLE',
      json: `{
  "status": "idle",
  "_links": {
    "analyze": { "href": "/tasks/analyze", "method": "POST" }
  }
}`,
      next: 'analyzing'
    },
    analyzing: {
        label: 'RUN',
        json: `{
  "status": "processing",
  "_links": {
    "cancel": { "href": "/tasks/cancel", "method": "DELETE" },
    "status": { "href": "/tasks/status", "method": "GET" }
  }
}`,
        next: 'complete'
    },
    complete: {
        label: 'DONE',
        json: `{
  "status": "completed",
  "result": "Profit: +12%",
  "_links": {
    "report": { "href": "/tasks/report", "method": "GET" },
    "restart": { "href": "/tasks/reset", "method": "POST" }
  }
}`,
        next: 'idle'
    }
  };

  const handleAction = () => {
    // Determine next state based on current
    const nextState = transitions[state].next as 'idle' | 'analyzing' | 'complete';
    setState(nextState);
  };

  return (
      <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
          <div className="lg:flex-1 w-full max-w-md">
             <div className="mb-6">
                <h3 className="font-serif text-2xl text-stone-900 mb-2">HATEOAS State Machine</h3>
                <div className="w-12 h-0.5 bg-nobel-gold mb-4"></div>
                <p className="text-stone-600 text-sm leading-relaxed">
                   The <strong>Agent Context Protocol (ACP)</strong> allows agents to function like web browsers. Instead of hardcoding tool sequences, agents receive available actions (links) dynamically based on their current state.
                </p>
             </div>
             
             <div className="flex flex-wrap gap-2 mb-4">
                {(Object.keys(transitions) as Array<keyof typeof transitions>).map((s) => (
                    <div
                        key={s}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border text-[10px] font-bold uppercase tracking-wider transition-all ${state === s ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-400 border-stone-200'}`}
                    >
                        {state === s && <motion.div layoutId="dot" className="w-1.5 h-1.5 rounded-full bg-nobel-gold" />}
                        {transitions[s].label}
                    </div>
                ))}
             </div>

             <button 
                onClick={handleAction}
                className="flex items-center gap-2 px-6 py-3 bg-nobel-gold text-white rounded-sm font-medium shadow-sm hover:bg-stone-900 transition-colors text-sm uppercase tracking-widest"
             >
                <GitBranch size={16} />
                Trigger Transition
             </button>
          </div>

          <div className="lg:flex-1 w-full max-w-md bg-[#1c1917] rounded-sm p-6 font-mono text-sm overflow-hidden shadow-xl border border-stone-800 relative group">
             <div className="flex items-center justify-between mb-4 border-b border-stone-800 pb-2">
                 <div className="flex items-center gap-2 text-stone-500">
                    <Link2 size={14} />
                    <span className="text-xs uppercase">protocol_response.json</span>
                 </div>
                 <span className="text-[10px] text-nobel-gold uppercase tracking-widest animate-pulse">Live State</span>
             </div>
             
             <AnimatePresence mode="wait">
                 <motion.pre
                    key={state}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-stone-300 whitespace-pre-wrap"
                 >
                    {transitions[state].json}
                 </motion.pre>
             </AnimatePresence>
          </div>
      </div>
  )
}