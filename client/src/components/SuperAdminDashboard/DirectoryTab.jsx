import { Building2 } from 'lucide-react';
import BreadcrumbNav from './BreadcrumbNav';
import SchoolsTable from './SchoolsTable';
import TeachersTable from './TeachersTable';
import StudentsTable from './StudentsTable';

const VIEW_TITLES = {
  schools: 'Managed Educational Campuses',
  teachers: (school) => `Teachers - ${school?.name}`,
  students: (teacher) => `Students - ${teacher?.name}`
};

export default function DirectoryTab({
  viewLevel, setViewLevel, selectedSchool, selectedTeacher,
  schools, teachers, students, onViewTeachers, onViewStudents,
  onDisableSchool, onResetPassword
}) {
  const title = viewLevel === 'schools'
    ? VIEW_TITLES.schools
    : viewLevel === 'teachers'
      ? VIEW_TITLES.teachers(selectedSchool)
      : VIEW_TITLES.students(selectedTeacher);

  return (
    <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
      <BreadcrumbNav viewLevel={viewLevel} setViewLevel={setViewLevel} selectedSchool={selectedSchool} selectedTeacher={selectedTeacher} />
      <div style={{ padding: '24px 24px 12px 24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Building2 size={20} color="#0284c7" /> {title}
        </h2>
      </div>
      {viewLevel === 'schools' && (
        <SchoolsTable schools={schools} onViewTeachers={onViewTeachers} onDisableSchool={onDisableSchool} />
      )}
      {viewLevel === 'teachers' && (
        <TeachersTable teachers={teachers} onViewStudents={onViewStudents} onResetPassword={onResetPassword} />
      )}
      {viewLevel === 'students' && (
        <StudentsTable students={students} onResetPassword={onResetPassword} />
      )}
    </div>
  );
}
