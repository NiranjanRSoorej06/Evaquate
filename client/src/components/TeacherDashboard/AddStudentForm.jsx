import { UserPlus } from 'lucide-react';

export default function AddStudentForm({ studentName, setStudentName, studentRollNo, setStudentRollNo, onSubmit }) {
  return (
    <>
      <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <UserPlus size={20} color="#0284c7" /> Add Student
      </h3>
      <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: '14px' }}>
        Students log in with their <strong>Student ID</strong> and password (their full name).
      </p>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label className="label-text">Student Name</label>
          <input type="text" className="form-control" value={studentName} onChange={e => setStudentName(e.target.value)} required />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label className="label-text">Roll Number</label>
          <input type="text" className="form-control" value={studentRollNo} onChange={e => setStudentRollNo(e.target.value)} required />
        </div>
        <button type="submit" className="btn-action" style={{ width: '100%' }}>Add Student</button>
      </form>
    </>
  );
}
