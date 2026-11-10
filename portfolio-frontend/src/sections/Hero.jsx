import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Counter({ to, label }) {
  const [n, setN] = useState(0);
  const wrapRef = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (reducedMotion()) {
      setN(to);
      return;
    }
    const el = wrapRef.current;
    if (!el) return;

    let raf = 0;
    const DURATION = 1200;

    const run = () => {
      if (started.current) return;
      started.current = true;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / DURATION, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        setN(Math.round(eased * to));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    // Don't burn frames if the section isn't visible yet
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [to]);

  return (
    <div ref={wrapRef}>
      <b className="grad text-3xl tabular-nums">{n}+</b>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center overflow-hidden pt-20"
    >
      {/* Decorative — pointer-events-none so they never block clicks */}
      <div
        aria-hidden="true"
        className="blob pointer-events-none -left-20 -top-10 h-96 w-96 bg-indigo-600"
      />
      <div
        aria-hidden="true"
        className="blob pointer-events-none bottom-0 right-0 h-80 w-80 bg-cyan-500 [animation-delay:2s]"
      />

      <div className="relative mx-auto max-w-5xl px-5 text-center">
        <p className="mb-6 inline-block rounded-full border border-white/10 px-4 py-1 text-sm text-cyan-300">
          👋 Full Stack Developer • Freelancer • Mentor
        </p>
        <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
          Ready-to-Deploy{' '}
          <span className="grad">Enterprise Software &amp; Digital Solutions</span>
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-400">
          Scalable, cloud-native LMS, ERP, CRM, and digital platforms engineered
          to streamline business operations and learning institutions.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link to="/products" className="btn">View Products</Link>
          <a href="#contact" className="btn-outline">Contact Me</a>
        </div>
        <div className="mx-auto mt-14 grid max-w-xl grid-cols-3 gap-4">
          <Counter to={50} label="Projects" />
          <Counter to={30} label="Clients" />
          <Counter to={500} label="Students" />
        </div>
      </div>
    </section>
  );
}