import './TeacherDashboard.css';
import { useTeacherDashboard } from './hooks/useTeacherDashboard';
import TeacherMobileHeader from './TeacherMobileHeader';
import TeacherSidebar from './TeacherSidebar';
import AlertMessages from './AlertMessages';
import OverviewTab from './OverviewTab';
import QuizzesTab from './QuizzesTab';
import AddQuizTab from './AddQuizTab';
import { LogOut } from 'lucide-react';

export default function TeacherDashboard({ user, onLogout }) {
  const d = useTeacherDashboard(user);

  return (
    <div className="teacher-dashboard">
      {d.isMobile && (
        <TeacherMobileHeader isSidebarOpen={d.isSidebarOpen} setIsSidebarOpen={d.setIsSidebarOpen} />
      )}
      <TeacherSidebar
        activeTab={d.activeTab} setActiveTab={d.setActiveTab}
        isMobile={d.isMobile} isSidebarOpen={d.isSidebarOpen}
        setIsSidebarOpen={d.setIsSidebarOpen}
        setSelectedQuizDetail={d.setSelectedQuizDetail}
        onLogout={onLogout}
      />
      <main style={{ flex: 1, padding: d.isMobile ? '24px 20px 20px' : '40px', paddingTop: d.isMobile ? '84px' : '40px', boxSizing: 'border-box', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: d.isMobile ? '22px' : '28px', fontWeight: '700', margin: 0 }}>Teacher Control Center</h1>
            <p style={{ color: '#64748b', margin: '6px 0 0 0' }}>
              Welcome back, {user?.name || 'Teacher'} • {user?.class_assigned || 'Classroom'}
            </p>
          </div>
          <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </header>
        <AlertMessages successMsg={d.successMsg} errorMsg={d.errorMsg} />
        {d.activeTab === 'overview' && (
          <OverviewTab
            isMobile={d.isMobile} students={d.students}
            assignedQuizCount={d.assignedQuizCount}
            studentName={d.studentName} setStudentName={d.setStudentName}
            studentRollNo={d.studentRollNo} setStudentRollNo={d.setStudentRollNo}
            uploadingStudents={d.uploadingStudents}
            handleAddStudent={d.handleAddStudent}
            downloadStudentTemplate={d.downloadStudentTemplate}
            handleStudentFileChange={d.handleStudentFileChange}
            handleImportStudents={d.handleImportStudents}
            getLatestScore={d.getLatestScore}
            handleDeleteStudent={d.handleDeleteStudent}
          />
        )}
        {d.activeTab === 'quizzes' && (
          <QuizzesTab
            selectedQuizDetail={d.selectedQuizDetail}
            setSelectedQuizDetail={d.setSelectedQuizDetail}
            quizzesLoading={d.quizzesLoading}
            assignedQuizzes={d.assignedQuizzes}
            quizDetailLoading={d.quizDetailLoading}
            getDisasterOption={d.getDisasterOption}
            handleViewQuiz={d.handleViewQuiz}
            handleDeleteQuiz={d.handleDeleteQuiz}
          />
        )}
        {d.activeTab === 'quiz' && (
          <AddQuizTab
            isMobile={d.isMobile}
            selectedDisaster={d.selectedDisaster}
            setSelectedDisaster={d.setSelectedDisaster}
            setQuizFile={d.setQuizFile}
            uploadingQuiz={d.uploadingQuiz}
            handleQuizUpload={d.handleQuizUpload}
          />
        )}
      </main>
    </div>
  );
}
