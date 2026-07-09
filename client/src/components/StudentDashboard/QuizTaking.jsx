export default function QuizTaking({
  activeQuiz, quizQuestions, currentQuestionIndex, selectedAnswer,
  handleAnswerSelect, handleNextQuestion
}) {
  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
          {activeQuiz?.label || activeQuiz?.title || 'Knowledge Quiz'} • Question {currentQuestionIndex + 1} of {quizQuestions.length}
        </div>
      </div>
      <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#1e293b', margin: '0 0 24px 0' }}>
        {quizQuestions[currentQuestionIndex]?.question}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        {quizQuestions[currentQuestionIndex]?.options?.map((opt, i) => (
          <button key={i} onClick={() => handleAnswerSelect(i)} className={`quiz-option ${selectedAnswer === i ? 'quiz-option-selected' : ''}`}>{opt}</button>
        ))}
      </div>
      <button disabled={selectedAnswer === null} onClick={handleNextQuestion} className="btn-primary" style={{ width: '100%' }}>Next Question</button>
    </>
  );
}
