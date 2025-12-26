/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Code, Database, Zap, Play, RotateCcw } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}

interface SystemState {
  title: string;
  type: 'code' | 'memory' | 'empty';
  content: string;
  highlight?: string;
}

export const DemoSimulation: React.FC = () => {
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      id: 0,
      action: "Initialize System",
      trigger: "Start Demo",
    },
    {
      id: 1,
      user: "I need a tool that can query real-time stock data from Alpha Vantage.",
      agent: "I've researched the documentation. I have generated a tool definition for 'alpha_vantage_api' with 'get_quote' capabilities. Validating in sandbox...",
      state: {
        title: "LUBAN ENGINE: Tool Generation",
        type: "code",
        content: `{
  "tool": "alpha_vantage",
  "capabilities": [
    {
      "name": "get_global_quote",
      "params": { "symbol": "string" },
      "endpoint": "https://www.alphavantage.co/query"
    }
  ],
  "security": {
    "rate_limit": "5/min",
    "sandbox_verified": true
  }
}`
      }
    },
    {
      id: 2,
      user: "Great. Now create a stock trading character named 'Wolf' that uses this tool.",
      agent: "Understood. Initiating Nuwa engine... \n\nI have created the 'Wolf' persona using the ISSUE framework. The agent is now active and bound to the Alpha Vantage tool.",
      state: {
        title: "NUWA ENGINE: PML Generation",
        type: "code",
        content: `<role name="Wolf">
  <persona>
    <trait>Analytical</trait>
    <trait>Risk-Averse</trait>
  </persona>
  <capabilities>
    <use_tool name="alpha_vantage" />
  </capabilities>
  <memory_policy>
    <strategy>ActivationDiffusion</strategy>
  </memory_policy>
</role>`
      }
    },
    {
      id: 3,
      user: "I currently hold Tesla (TSLA) and Amazon (AMZN) stocks. I hope to make a profit.",
      agent: "Noted. I have analyzed this input. Saving core facts to Engram memory: 'User holds TSLA, AMZN'.",
      state: {
        title: "MEMORY LAYER: Experience Encoding",
        type: "memory",
        content: "Encoding Fact...",
        highlight: "UserHolding(TSLA, AMZN)"
      }
    },
    {
      id: 4,
      user: "System: *2 Hours Later (New Session)*... \nActivate the stock analyst. Recall my stocks and analyze today's market.",
      agent: "Welcome back. Retrieving context... \n\nRecalling from Long-term Memory: You hold TSLA and AMZN. \n\nFetching current data... TSLA is up 2.1%. AMZN is down 0.5%. Based on your portfolio, I recommend holding.",
      state: {
        title: "RECALL AGENT: Activation-Diffusion",
        type: "memory",
        content: "Query: 'my stocks'",
        highlight: "Found Engram: [TSLA, AMZN] (Strength: 0.95)"
      }
    }
  ];

  useEffect(() => {
    // Only scroll within the chat container, not the page
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, isTyping]);

  const handleNextStep = async () => {
    if (step >= steps.length - 1) return;
    
    const nextStepIdx = step + 1;
    const nextStepData = steps[nextStepIdx];
    setStep(nextStepIdx);

    // User Message
    setIsTyping(true);
    // Simulate user typing delay briefly
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'user',
        text: nextStepData.user || "",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      
      // Agent Thinking/Typing
      setTimeout(() => {
        setMessages(prev => [...prev, {
            id: Date.now() + 1,
            role: 'agent',
            text: nextStepData.agent || "",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(false);
      }, 1500);
    }, 800);
  };

  const resetDemo = () => {
    setStep(0);
    setMessages([]);
    setIsTyping(false);
  };

  const currentState = steps[step].state as SystemState | undefined;

  return (
    <div className="flex flex-col lg:flex-row lg:h-[600px] w-full bg-white rounded-xl border border-stone-200 shadow-xl overflow-hidden">

      {/* Left Panel: Chat Interface */}
      <div className="h-[350px] lg:h-auto lg:flex-1 flex flex-col bg-[#FAFAF9] border-b lg:border-b-0 lg:border-r border-stone-200 relative">
        <div className="p-4 border-b border-stone-200 bg-white flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-serif font-bold text-stone-900">PromptX Desktop</span>
            </div>
            <button onClick={resetDemo} aria-label="Reset demo" className="p-1 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-600 transition-colors">
                <RotateCcw size={16} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 text-sm">
                    <Bot size={48} className="mb-4 text-stone-300" />
                    <p>System Ready.</p>
                    <p>Start the demo to initialize agents.</p>
                </div>
            )}
            
            <AnimatePresence>
                {messages.map((msg) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id} 
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'agent' ? 'bg-stone-900 text-white' : 'bg-nobel-gold text-white'}`}>
                            {msg.role === 'agent' ? <Bot size={16} /> : <User size={16} />}
                        </div>
                        <div className={`max-w-[80%] p-3 rounded-lg text-sm leading-relaxed shadow-sm ${msg.role === 'agent' ? 'bg-white border border-stone-200 text-stone-800' : 'bg-nobel-gold/10 border border-nobel-gold/20 text-stone-900'}`}>
                            <p className="whitespace-pre-line">{msg.text}</p>
                            <span className="text-[10px] text-stone-400 mt-2 block opacity-70">{msg.timestamp}</span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            
            {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center shrink-0">
                        <Bot size={16} />
                    </div>
                    <div className="bg-white border border-stone-200 p-3 rounded-lg flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                </motion.div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-stone-200">
            {step < steps.length - 1 ? (
                <button 
                    onClick={handleNextStep} 
                    disabled={isTyping}
                    className="w-full py-3 bg-stone-900 hover:bg-nobel-gold text-white rounded-sm font-medium transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {step === 0 ? <><Play size={16} /> Run Scenario</> : <><Send size={16} /> Continue</>}
                </button>
            ) : (
                <button 
                    onClick={resetDemo}
                    className="w-full py-3 bg-white border border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400 rounded-sm font-medium transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                >
                    <RotateCcw size={16} /> Restart Simulation
                </button>
            )}
        </div>
      </div>

      {/* Right Panel: System Internals */}
      <div className="h-[350px] lg:h-auto lg:flex-1 bg-[#1c1917] text-stone-300 flex flex-col font-mono text-xs overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
            <Code size={120} />
        </div>

        <div className="p-4 border-b border-stone-800 flex items-center gap-2 bg-[#1c1917] z-10">
            <Zap size={14} className="text-nobel-gold" />
            <span className="uppercase tracking-widest font-bold text-stone-500">System Internals</span>
        </div>

        <div className="flex-1 p-6 relative z-10">
            <AnimatePresence mode="wait">
                {currentState ? (
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="h-full flex flex-col"
                    >
                        <h3 className="text-nobel-gold font-bold text-sm mb-4 border-l-2 border-nobel-gold pl-3 uppercase tracking-wider">
                            {currentState.title}
                        </h3>

                        {currentState.type === 'code' && (
                             <div className="bg-stone-900/50 p-4 rounded border border-stone-800 font-mono text-xs leading-relaxed overflow-auto">
                                <pre className="text-stone-300">
                                    {currentState.content}
                                </pre>
                             </div>
                        )}

                        {currentState.type === 'memory' && (
                            <div className="flex flex-col items-center justify-center h-full gap-6">
                                <div className="relative w-32 h-32">
                                    <motion.div 
                                        className="absolute inset-0 border-2 border-nobel-gold rounded-full opacity-20"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Database size={48} className="text-nobel-gold" />
                                    </div>
                                    <motion.div 
                                        className="absolute -top-2 -right-2 bg-green-500 text-stone-900 text-[10px] font-bold px-2 py-1 rounded-full"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        ACTIVE
                                    </motion.div>
                                </div>
                                <div className="text-center">
                                    <p className="text-stone-500 mb-2">{currentState.content}</p>
                                    <div className="px-4 py-2 bg-nobel-gold/20 text-nobel-gold border border-nobel-gold/30 rounded">
                                        {currentState.highlight}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-stone-700">
                        <p>Waiting for input...</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
};