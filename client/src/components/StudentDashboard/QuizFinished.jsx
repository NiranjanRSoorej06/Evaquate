import { Award } from 'lucide-react';

export default function QuizFinished({ finalPercentage, activeQuiz, startQuiz, onBackToBrowse }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <Award size={64} color="#0284c7" style={{ marginBottom: '16px' }} />
      <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>Awesome Job! 🎉</h2>
      <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#0284c7', margin: '0 0 8px 0' }}>Your Score: {finalPercentage}%</h3>
      {activeQuiz?.label && <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>{activeQuiz.label}</p>}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => activeQuiz && startQuiz(activeQuiz)} className="btn-primary">Try Again 🔄</button>
        <button onClick={onBackToBrowse} className="btn-primary" style={{ background: '#e0f2fe', color: '#0284c7' }}>Back to Quiz 📚</button>
      </div>
    </div>
  );
}
