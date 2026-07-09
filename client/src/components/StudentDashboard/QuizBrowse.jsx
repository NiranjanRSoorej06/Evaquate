import { CheckSquare } from 'lucide-react';
import { getDisasterMeta } from './constants';

export default function QuizBrowse({ selectedDisaster, availableQuizzes, startQuiz }) {
  const meta = getDisasterMeta(selectedDisaster);
  return (
    <>
      <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>
        {meta?.label || selectedDisaster} Quiz
      </h4>
      <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0' }}>
        Pick a quiz below to start. New uploads from your teacher appear here right away.
      </p>
      {availableQuizzes.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {availableQuizzes.map(quiz => {
            const quizMeta = getDisasterMeta(quiz.disaster_type);
            const Icon = quizMeta?.icon || CheckSquare;
            return (
              <button key={quiz.id} type="button" onClick={() => startQuiz(quiz)} className="quiz-picker-card quiz-picker-card-current">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${quizMeta?.color || '#0284c7'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={22} color={quizMeta?.color || '#0284c7'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '16px', marginBottom: '4px' }}>{quiz.label || quiz.title}</div>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>
                      {quizMeta?.label || quiz.disaster_type} • {quiz.question_count} question{quiz.question_count === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div style={{ color: '#0284c7', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>Start →</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 16px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <p style={{ color: '#64748b', margin: 0 }}>
            No quizzes available for {meta?.label?.toLowerCase() || selectedDisaster} yet. Your teacher hasn&apos;t uploaded one for this module.
          </p>
        </div>
      )}
    </>
  );
}
