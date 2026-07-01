"""
Auth-related request/response schemas.

These dataclasses represent the shape of login request payloads
and the session/user payload stored inside JWT sessions.
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class LoginRequest:
    """Payload expected by POST /api/auth/login."""
    username: str
    password: str

    @classmethod
    def from_dict(cls, data: dict) -> 'LoginRequest':
        return cls(
            username=data.get('username', ''),
            password=data.get('password', ''),
        )

    def validate(self):
        """Raise ValueError if required fields are missing."""
        if not self.username or not self.password:
            raise ValueError('Username and password are required.')


@dataclass
class SuperAdminSessionPayload:
    """JWT session payload for a super_admin user."""
    id: str
    username: str
    role: str = 'super_admin'

    def to_dict(self) -> dict:
        return {'id': self.id, 'username': self.username, 'role': self.role}


@dataclass
class TeacherSessionPayload:
    """JWT session payload for a teacher user."""
    id: str
    username: str
    name: Optional[str]
    role: str
    school_id: Optional[str]
    class_assigned: Optional[str]
    school_name: str

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'role': self.role,
            'school_id': self.school_id,
            'class_assigned': self.class_assigned,
            'school_name': self.school_name,
        }


@dataclass
class AdminSessionPayload:
    """JWT session payload for a school admin."""
    id: str
    name: str
    unique_code: str
    role: str = 'admin'

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'unique_code': self.unique_code,
            'role': self.role,
        }


@dataclass
class StudentSessionPayload:
    """JWT session payload for a student user."""
    id: str
    roll_no: str
    name: str
    role: str
    school_id: Optional[str]
    school_name: str
    teacher_id: Optional[str]
    teacher_name: str
    class_assigned: str

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'roll_no': self.roll_no,
            'name': self.name,
            'role': self.role,
            'school_id': self.school_id,
            'school_name': self.school_name,
            'teacher_id': self.teacher_id,
            'teacher_name': self.teacher_name,
            'class_assigned': self.class_assigned,
        }
