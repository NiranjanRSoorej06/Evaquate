import { BookOpen, ChevronLeft } from 'lucide-react';
import { answerLabel } from './constants';
import QuizList from './QuizList';
import QuizDetail from './QuizDetail';
import SplashScreen from '../SplashScreen';

export default function QuizzesTab({
  selectedQuizDetail, setSelectedQuizDetail, quizzesLoading, assignedQuizzes,
  quizDetailLoading, getDisasterOption, handleViewQuiz, handleDeleteQuiz
}) {
  return (
    <div style={{ maxWidth: '960px' }}>
      {!selectedQuizDetail ? (
        <div className="panel-card">
          <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={20} color="#0284c7" /> My Quizzes
          </h3>
          <p style={{ color: '#64748b', margin: '0 0 24px 0', fontSize: '14px' }}>
            View or delete uploaded quizzes. You can upload multiple quizzes per disaster from Add Quiz.
          </p>
          {quizzesLoading ? (
            <SplashScreen mini message="Loading quizzes" />
          ) : assignedQuizzes.length > 0 ? (
            <QuizList
              assignedQuizzes={assignedQuizzes}
              onViewQuiz={handleViewQuiz}
              onDeleteQuiz={handleDeleteQuiz}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b', margin: 0 }}>No quizzes uploaded yet. Use Add Quiz to upload your first one.</p>
            </div>
          )}
        </div>
      ) : (
        <QuizDetail
          selectedQuizDetail={selectedQuizDetail}
          quizDetailLoading={quizDetailLoading}
          getDisasterOption={getDisasterOption}
          answerLabel={answerLabel}
          onBack={() => setSelectedQuizDetail(null)}
        />
      )}
    </div>
  );
}
