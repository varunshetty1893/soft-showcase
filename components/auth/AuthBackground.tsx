"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Code2,
  Smartphone,
  Brain,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function AuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle nodes representing connected software architecture
    const particleCount = Math.min(36, Math.floor(width / 35));
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1.2,
        alpha: Math.random() * 0.25 + 0.15,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connecting lines between close nodes
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.15;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(21, 87, 97, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(47, 125, 120, ${p.alpha})`;
        ctx.fill();

        // Update positions
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges gently
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10 bg-[#F8FAFA]">
      {/* Interactive Node Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-70"
      />

      {/* Modern Engineering Grid with radial fade */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(#155761 1px, transparent 1px), linear-gradient(to right, #155761 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      {/* Ambient Pulsing Glow Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.08, 0.14, 0.08],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -left-20 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-[#155761] to-[#2F7D78] blur-[120px]"
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.06, 0.12, 0.06],
          x: [0, -40, 0],
          y: [0, 25, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-24 -right-24 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-[#2F7D78] via-[#155761] to-[#DDF4EC] blur-[140px]"
      />

      {/* Floating Software Project Badges (Desktop visible) */}
      <div className="hidden lg:block">
        {/* Top Left: SaaS / Next.js */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: 0.9,
            y: [0, -12, 0],
            rotate: [-1, 1, -1],
          }}
          transition={{
            opacity: { duration: 0.8 },
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute top-24 left-10 xl:left-20 bg-white/90 backdrop-blur-md border border-[#D9E2E4] rounded-2xl p-3.5 shadow-lg max-w-[240px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#DDF4EC] text-[#155761] flex items-center justify-center shrink-0 border border-[#2F7D78]/20 shadow-xs">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#102124]">CRM & Billing SaaS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] text-[#526267] font-medium">Next.js • Prisma • ₹14,999</p>
            </div>
          </div>
        </motion.div>

        {/* Top Right: AI / ML Project */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: 0.9,
            y: [0, 14, 0],
            rotate: [1, -1, 1],
          }}
          transition={{
            opacity: { duration: 0.8, delay: 0.2 },
            y: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 },
            rotate: { duration: 9, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute top-28 right-10 xl:right-20 bg-white/90 backdrop-blur-md border border-[#D9E2E4] rounded-2xl p-3.5 shadow-lg max-w-[240px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F3F7F7] text-[#2F7D78] flex items-center justify-center shrink-0 border border-[#D9E2E4] shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-[#102124]">AI Agent Workflow</span>
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
              </div>
              <p className="text-[10px] text-[#526267] font-medium">Gemini 2.5 • Fast API • 4.9 ★</p>
            </div>
          </div>
        </motion.div>

        {/* Bottom Left: Mobile App */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 0.9,
            y: [0, 10, 0],
            rotate: [1, -1, 1],
          }}
          transition={{
            opacity: { duration: 0.8, delay: 0.4 },
            y: { duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 },
            rotate: { duration: 8.5, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute bottom-28 left-12 xl:left-24 bg-white/90 backdrop-blur-md border border-[#D9E2E4] rounded-2xl p-3.5 shadow-lg max-w-[250px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#155761] to-[#2F7D78] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#102124]">Fitness Tracker App</span>
              <p className="text-[10px] text-[#526267] font-medium">React Native • iOS & Android</p>
            </div>
          </div>
        </motion.div>

        {/* Bottom Right: Verified Security & Marketplace */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 0.9,
            y: [0, -12, 0],
            rotate: [-1, 1, -1],
          }}
          transition={{
            opacity: { duration: 0.8, delay: 0.6 },
            y: { duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
            rotate: { duration: 9, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute bottom-24 right-12 xl:right-24 bg-white/90 backdrop-blur-md border border-[#D9E2E4] rounded-2xl p-3.5 shadow-lg max-w-[250px]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#DDF4EC] text-[#2F7D78] flex items-center justify-center shrink-0 border border-[#2F7D78]/25 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#102124]">100% Verified Code</span>
              <p className="text-[10px] text-[#526267] font-medium">Direct Provider WhatsApp Connect</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative Subtle Floating Code Snippet Badges */}
      <div className="hidden 2xl:block opacity-40">
        <div className="absolute top-1/2 left-8 -translate-y-1/2 font-mono text-[11px] text-[#155761] space-y-1 select-none">
          <p className="text-gray-400">&#47;&#47; Soft Showcase Verified</p>
          <p>git checkout -b release&#47;v2.4</p>
          <p className="text-[#2F7D78]">✓ Database: PostgreSQL</p>
          <p className="text-[#2F7D78]">✓ Deployment: Vercel Ready</p>
        </div>
        <div className="absolute top-1/2 right-8 -translate-y-1/2 font-mono text-[11px] text-[#155761] space-y-1 text-right select-none">
          <p className="text-gray-400">&#47;&#47; Direct Provider Contact</p>
          <p>const deal = await negotiate()</p>
          <p className="text-[#2F7D78]">whatsapp.openChat(&quot;+91 ...&quot;)</p>
          <p className="text-[#2F7D78]">status: &quot;Instant Delivery&quot;</p>
        </div>
      </div>
    </div>
  );
}
