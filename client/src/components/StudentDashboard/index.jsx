import './StudentDashboard.css';
import { useStudentDashboard } from './hooks/useStudentDashboard';
import StudentMobileHeader from './StudentMobileHeader';
import StudentSidebar from './StudentSidebar';
import DisasterModuleGrid from './DisasterModuleGrid';
import TrainingOverview from './TrainingOverview';
import PerformanceLogTab from './PerformanceLogTab';
import { LogOut } from 'lucide-react';

export default function StudentDashboard({ user, onLogout }) {
  const d = useStudentDashboard(user);

  const quizProps = {
    quizLoading: d.quizLoading, quizPhase: d.quizPhase, setQuizPhase: d.setQuizPhase,
    availableQuizzes: d.availableQuizzes, startQuiz: d.startQuiz, activeQuiz: d.activeQuiz,
    quizQuestions: d.quizQuestions, currentQuestionIndex: d.currentQuestionIndex,
    selectedAnswer: d.selectedAnswer, handleAnswerSelect: d.handleAnswerSelect,
    handleNextQuestion: d.handleNextQuestion, finalPercentage: d.finalPercentage,
    quizFinished: d.quizFinished, fetchAvailableQuizzes: d.fetchAvailableQuizzes
  };

  return (
    <div className="student-dashboard" style={{ display: 'flex', flexDirection: 'row', width: '100%', minHeight: '100vh', backgroundColor: '#f0f9ff', fontFamily: '"Plus Jakarta Sans", sans-serif', position: 'relative', overflowX: 'hidden' }}>
      {d.isMobile && <StudentMobileHeader isSidebarOpen={d.isSidebarOpen} setIsSidebarOpen={d.setIsSidebarOpen} />}
      <StudentSidebar sidebarTab={d.sidebarTab} isMobile={d.isMobile} isSidebarOpen={d.isSidebarOpen} setIsSidebarOpen={d.setIsSidebarOpen} goToOverview={d.goToOverview} goToPerformance={d.goToPerformance} onLogout={onLogout} />
      <main style={{ flex: 1, padding: d.isMobile ? '20px' : '40px', paddingTop: d.isMobile ? '84px' : '40px', overflowY: 'auto', boxSizing: 'border-box', width: '100%' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: d.isMobile ? '24px' : '28px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', margin: 0 }}>
              {d.sidebarTab === 'overview' ? 'Ready for Training?' : 'Mission History'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500', margin: 0 }}>
              Student Explorer: <span style={{ color: '#0284c7', fontWeight: '600' }}>{user?.name || 'Guest'}</span> | Room: <span style={{ color: '#0f172a', fontWeight: '600' }}>{user?.class_assigned || 'N/A'}</span>
            </p>
          </div>
          <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </header>
        {d.sidebarTab === 'overview' ? (
          <>
            {!d.selectedDisaster ? (
              <DisasterModuleGrid onSelectDisaster={d.handleSelectDisaster} />
            ) : (
              <TrainingOverview selectedDisaster={d.selectedDisaster} handleSelectDisaster={d.handleSelectDisaster} isMobile={d.isMobile} activeTab={d.activeTab} setActiveTab={d.setActiveTab} user={user} submitScore={d.submitScore} quizProps={quizProps} />
            )}
          </>
        ) : (
          <PerformanceLogTab scoreHistory={d.scoreHistory} />
        )}
      </main>
    </div>
  );
}
