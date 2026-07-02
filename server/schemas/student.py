"""
Student table schema.

Mirrors the `students` database table:
    id         VARCHAR(50) PRIMARY KEY   -- deterministic: schoolcode_class_rollnumber
    school_id  VARCHAR(50) REFERENCES schools(id) ON DELETE CASCADE
    teacher_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
    roll_no    VARCHAR(50) NOT NULL
    name       VARCHAR(255) NOT NULL
    password   VARCHAR(255) NOT NULL     -- defaults to student name
    UNIQUE (school_id, roll_no)

Also includes the `scores` table schema (used alongside students):
    id               VARCHAR(50) PRIMARY KEY
    student_id       VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE
    disaster_type    VARCHAR(50) NOT NULL
    activity_type    VARCHAR(50) NOT NULL
    score            INT NOT NULL
    duration_seconds INT NOT NULL
    timestamp        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
"""
from dataclasses import dataclass, field
from typing import Optional, List


@dataclass
class Student:
    """Represents a row in the `students` table."""
    id: str
    school_id: str
    roll_no: str
    name: str
    password: str
    teacher_id: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'school_id': self.school_id,
            'teacher_id': self.teacher_id,
            'roll_no': self.roll_no,
            'name': self.name,
        }

    @classmethod
    def from_row(cls, row: dict) -> 'Student':
        return cls(
            id=row['id'],
            school_id=row['school_id'],
            roll_no=row['roll_no'],
            name=row['name'],
            password=row.get('password', ''),
            teacher_id=row.get('teacher_id'),
        )


@dataclass
class AddStudentRequest:
    """Payload expected by POST /api/teacher/<teacherId>/students."""
    name: str
    roll_no: str
    school_id: str

    @classmethod
    def from_dict(cls, data: dict) -> 'AddStudentRequest':
        return cls(
            name=data.get('name', ''),
            roll_no=data.get('roll_no', ''),
            school_id=data.get('school_id', ''),
        )

    def validate(self):
        if not self.name:
            raise ValueError('Student name is required.')
        if not self.roll_no:
            raise ValueError('Roll number is required.')
        if not self.school_id:
            raise ValueError('School ID is required.')


@dataclass
class BulkStudentEntry:
    """One student record inside a bulk import payload."""
    name: str
    roll_no: str


@dataclass
class BulkImportStudentsRequest:
    """Payload expected by POST /api/teacher/<teacherId>/students/bulk."""
    students: List[dict]
    school_id: str

    @classmethod
    def from_dict(cls, data: dict) -> 'BulkImportStudentsRequest':
        return cls(
            students=data.get('students', []),
            school_id=data.get('school_id', ''),
        )

    def validate(self):
        if not self.school_id:
            raise ValueError('School ID is required.')
        if not isinstance(self.students, list):
            raise ValueError('students must be a list.')


@dataclass
class Score:
    """Represents a row in the `scores` table."""
    id: str
    student_id: str
    disaster_type: str
    activity_type: str
    score: int
    duration_seconds: int
    timestamp: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'student_id': self.student_id,
            'disaster_type': self.disaster_type,
            'activity_type': self.activity_type,
            'score': self.score,
            'duration_seconds': self.duration_seconds,
            'timestamp': self.timestamp,
        }

    @classmethod
    def from_row(cls, row: dict) -> 'Score':
        return cls(
            id=row['id'],
            student_id=row['student_id'],
            disaster_type=row['disaster_type'],
            activity_type=row['activity_type'],
            score=row['score'],
            duration_seconds=row['duration_seconds'],
            timestamp=str(row['timestamp']) if row.get('timestamp') else None,
        )


@dataclass
class SubmitScoreRequest:
    """Payload expected by POST /api/student/score."""
    student_id: str
    disaster_type: str
    activity_type: str
    score: int
    duration_seconds: int

    @classmethod
    def from_dict(cls, data: dict) -> 'SubmitScoreRequest':
        return cls(
            student_id=data.get('student_id', ''),
            disaster_type=data.get('disaster_type', ''),
            activity_type=data.get('activity_type', ''),
            score=int(data.get('score', 0)),
            duration_seconds=int(data.get('duration_seconds', 0)),
        )

    def validate(self):
        if not self.student_id:
            raise ValueError('student_id is required.')
        if not self.disaster_type:
            raise ValueError('disaster_type is required.')
        if not self.activity_type:
            raise ValueError('activity_type is required.')
