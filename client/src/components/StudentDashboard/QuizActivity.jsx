import { getDisasterMeta } from './constants';
import QuizBrowse from './QuizBrowse';
import QuizTaking from './QuizTaking';
import QuizFinished from './QuizFinished';
import SplashScreen from '../SplashScreen';

export default function QuizActivity({
  selectedDisaster, quizLoading, quizPhase, setQuizPhase, availableQuizzes,
  startQuiz, activeQuiz, quizQuestions, currentQuestionIndex, selectedAnswer,
  handleAnswerSelect, handleNextQuestion, finalPercentage, quizFinished,
  fetchAvailableQuizzes
}) {
  if (quizLoading && quizPhase === 'browse') {
    return <SplashScreen mini message="Loading available quizzes" />;
  }
  if (quizPhase === 'browse') {
    return (
      <QuizBrowse
        selectedDisaster={selectedDisaster}
        availableQuizzes={availableQuizzes}
        startQuiz={startQuiz}
      />
    );
  }
  if (quizLoading) {
    return <SplashScreen mini message="Loading quiz questions" />;
  }
  if (quizPhase === 'finished' || quizFinished) {
    return (
      <QuizFinished
        finalPercentage={finalPercentage}
        activeQuiz={activeQuiz}
        startQuiz={startQuiz}
        onBackToBrowse={() => { setQuizPhase('browse'); fetchAvailableQuizzes(selectedDisaster); }}
      />
    );
  }
  if (quizQuestions.length > 0) {
    return (
      <QuizTaking
        activeQuiz={activeQuiz}
        quizQuestions={quizQuestions}
        currentQuestionIndex={currentQuestionIndex}
        selectedAnswer={selectedAnswer}
        handleAnswerSelect={handleAnswerSelect}
        handleNextQuestion={handleNextQuestion}
      />
    );
  }
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: '#64748b', marginBottom: '16px' }}>This quiz is no longer available. Ask your teacher to upload it again.</p>
      <button onClick={() => { setQuizPhase('browse'); fetchAvailableQuizzes(selectedDisaster); }} className="btn-primary">Back to Quizzes</button>
    </div>
  );
}
