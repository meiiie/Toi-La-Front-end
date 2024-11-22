// src/components/Section.tsx

import React from 'react';

const sectionStyle = 'py-24 text-white';

const Section = React.forwardRef<
  HTMLElement,
  { title: string; children: React.ReactNode; className?: string }
>(({ title, children, className = '' }, ref) => (
  <section className={`${sectionStyle} ${className}`} data-aos="fade-up" ref={ref}>
    <div className="container mx-auto text-center">
      <h2 className="text-3xl font-bold mb-12 font-sans text-white">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-16">{children}</div>
    </div>
  </section>
));

export default React.memo(Section);
