"""
Teacher (User) table schema.

Mirrors the `users` database table:
    id             VARCHAR(50) PRIMARY KEY   -- deterministic: school_unique_code_class
    school_id      VARCHAR(50) REFERENCES schools(id) ON DELETE SET NULL
    role           VARCHAR(50) NOT NULL  -- 'super_admin' | 'teacher'
    username       VARCHAR(100) UNIQUE NOT NULL  -- same as id for teachers
    password       VARCHAR(255) NOT NULL
    name           VARCHAR(255)
    class_assigned VARCHAR(100)
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class User:
    """Represents a row in the `users` table."""
    id: str
    role: str
    username: str
    password: str
    school_id: Optional[str] = None
    name: Optional[str] = None
    class_assigned: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'role': self.role,
            'username': self.username,
            'school_id': self.school_id,
            'name': self.name,
            'class_assigned': self.class_assigned,
        }

    @classmethod
    def from_row(cls, row: dict) -> 'User':
        return cls(
            id=row['id'],
            role=row['role'],
            username=row['username'],
            password=row.get('password', ''),
            school_id=row.get('school_id'),
            name=row.get('name'),
            class_assigned=row.get('class_assigned'),
        )


@dataclass
class CreateTeacherRequest:
    """Payload expected by POST /api/admin/<schoolId>/teachers."""
    password: str
    name: Optional[str]
    class_assigned: Optional[str]

    @classmethod
    def from_dict(cls, data: dict) -> 'CreateTeacherRequest':
        return cls(
            password=data.get('password', ''),
            name=data.get('name'),
            class_assigned=data.get('class_assigned'),
        )

    def validate(self):
        if not self.class_assigned or not str(self.class_assigned).strip():
            raise ValueError('Class assignment is required.')
        if not self.password:
            raise ValueError('Teacher password is required.')


@dataclass
class UpdateTeacherRequest:
    """Payload expected by PUT /api/admin/<schoolId>/teachers/<teacherId>."""
    name: Optional[str]
    password: Optional[str]
    class_assigned: Optional[str]

    @classmethod
    def from_dict(cls, data: dict) -> 'UpdateTeacherRequest':
        return cls(
            name=data.get('name'),
            password=data.get('password'),
            class_assigned=data.get('class_assigned'),
        )


@dataclass
class ResetPasswordRequest:
    """Payload expected by password reset endpoints."""
    password: str

    @classmethod
    def from_dict(cls, data: dict) -> 'ResetPasswordRequest':
        return cls(password=data.get('password', ''))

    def validate(self):
        if not self.password:
            raise ValueError('New password is required.')
