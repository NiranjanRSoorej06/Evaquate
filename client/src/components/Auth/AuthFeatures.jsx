import { Sparkles, Layers, BookOpen } from 'lucide-react';

const FEATURES = [
  { icon: Sparkles, title: 'Smart Blueprint Conversion', desc: 'Administrators can directly upload standard floor plan architectures and safety layouts. Our engine maps the geometry instantly, safely converting physical drawings into 3D environments ready for student simulations.', featured: true },
  { icon: Layers, title: 'Instructor Control Panels', desc: 'Teachers easily manage student rosters, view progress charts, and create custom local quizzes. They can inject localized questions focused on specific classroom locations and safety tools.' },
  { icon: BookOpen, title: 'Student Learning Environments', desc: 'Students practice safely by running through simulations of their own school buildings. The framework measures their evacuation timing and offers automated safety videos alongside testing modules.' }
];

export default function AuthFeatures({ sectionRef }) {
  return (
    <section className="functional-section" ref={sectionRef}>
      <div className="section-header">
        <h2 className="section-title">How the Portal Works</h2>
        <p className="section-subtitle">A balanced overview of features tailored specifically to your entire campus ecosystem.</p>
      </div>
      <div className="functional-grid">
        {FEATURES.map(({ icon: Icon, title, desc, featured }) => (
          <div key={title} className={`functional-card ${featured ? 'featured-highlight' : ''}`}>
            <div className="card-icon-wrap"><Icon size={18} color="#1d4ed8" /></div>
            <h3 className="card-title">{title}</h3>
            <p className="card-desc">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
