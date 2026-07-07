import { disasterOptions } from './constants';

export default function QuizList({ assignedQuizzes, onViewQuiz, onDeleteQuiz }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {disasterOptions.map(option => {
        const moduleQuizzes = assignedQuizzes.filter(quiz => quiz.disaster_type === option.id);
        if (moduleQuizzes.length === 0) return null;
        const Icon = option.icon;
        return (
          <div key={option.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${option.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={option.color} />
              </div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{option.label}</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {moduleQuizzes.map(quiz => (
                <div key={quiz.id} className="quiz-list-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{quiz.label || quiz.title}</div>
                    <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
                      {quiz.question_count} question{quiz.question_count === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="quiz-list-actions">
                    <button type="button" onClick={() => onViewQuiz(quiz.id)} className="btn-action" style={{ padding: '8px 14px', fontSize: '13px' }}>View</button>
                    <button type="button" onClick={() => onDeleteQuiz(quiz.id, quiz.label)} className="btn-danger-outline" style={{ padding: '8px 14px', fontSize: '13px' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
