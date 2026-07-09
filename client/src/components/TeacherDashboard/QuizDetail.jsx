import { ChevronLeft } from 'lucide-react';

export default function QuizDetail({ selectedQuizDetail, quizDetailLoading, getDisasterOption, answerLabel, onBack }) {
  return (
    <div className="panel-card">
      <button
        type="button"
        onClick={onBack}
        style={{ background: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0, marginBottom: '18px', fontWeight: '600', fontSize: '14px' }}
      >
        <ChevronLeft size={18} /> Back to my quizzes
      </button>
      {quizDetailLoading ? (
        <p style={{ color: '#64748b' }}>Loading questions...</p>
      ) : (
        <>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '700' }}>{selectedQuizDetail.label || selectedQuizDetail.title}</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              {getDisasterOption(selectedQuizDetail.disaster_type)?.label || selectedQuizDetail.disaster_type} • {selectedQuizDetail.questions.length} questions
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedQuizDetail.questions.map((question, index) => (
              <div key={index} className="question-card">
                <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
                  Q{index + 1}. {question.question}
                </div>
                <div>
                  {question.options.map((option, optionIndex) => (
                    <span key={optionIndex} className={`option-pill ${optionIndex === question.answer ? 'option-pill-correct' : ''}`}>
                      {answerLabel(optionIndex)}. {option}
                      {optionIndex === question.answer ? ' (Correct)' : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
