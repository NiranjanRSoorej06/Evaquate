import AddStudentForm from './AddStudentForm';
import BulkStudentUpload from './BulkStudentUpload';
import StudentStatisticsTable from './StudentStatisticsTable';

export default function OverviewTab({
  isMobile, students, assignedQuizCount, studentName, setStudentName,
  studentRollNo, setStudentRollNo, uploadingStudents, handleAddStudent,
  downloadStudentTemplate, handleStudentFileChange, handleImportStudents,
  getLatestScore, handleDeleteStudent
}) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="panel-card">
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>Students</div>
          <div style={{ fontSize: '30px', fontWeight: '700', color: '#0284c7', marginTop: '6px' }}>{students.length}</div>
        </div>
        <div className="panel-card">
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>Assigned Quizzes</div>
          <div style={{ fontSize: '30px', fontWeight: '700', color: '#0284c7', marginTop: '6px' }}>{assignedQuizCount}</div>
        </div>
        <div className="panel-card">
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>Latest Drill</div>
          <div style={{ fontSize: '30px', fontWeight: '700', color: '#0284c7', marginTop: '6px' }}>
            {students.length ? `${students[0]?.scores?.find(sc => sc.activity_type === 'drill')?.score || 0} pts` : '0 pts'}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.1fr', gap: '24px' }}>
        <div className="panel-card">
          <AddStudentForm
            studentName={studentName} setStudentName={setStudentName}
            studentRollNo={studentRollNo} setStudentRollNo={setStudentRollNo}
            onSubmit={handleAddStudent}
          />
          <BulkStudentUpload
            onDownloadTemplate={downloadStudentTemplate}
            onFileChange={handleStudentFileChange}
            onSubmit={handleImportStudents}
            uploadingStudents={uploadingStudents}
          />
        </div>
        <StudentStatisticsTable
          students={students} getLatestScore={getLatestScore}
          onDeleteStudent={handleDeleteStudent}
        />
      </div>
    </>
  );
}
