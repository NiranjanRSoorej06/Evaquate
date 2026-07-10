"""
School table schema.

Mirrors the `schools` database table:
    id            VARCHAR(50) PRIMARY KEY
    name          VARCHAR(255) NOT NULL
    unique_code   VARCHAR(50) UNIQUE NOT NULL
    password      VARCHAR(255) NOT NULL
    blueprint_json JSONB
    blueprint_image_path TEXT
    disabled      BOOLEAN DEFAULT false
"""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class School:
    """Represents a row in the `schools` table."""
    id: str
    name: str
    unique_code: str
    password: str
    blueprint_json: Optional[dict] = None
    blueprint_image_path: Optional[str] = None
    disabled: bool = False

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'unique_code': self.unique_code,
            'blueprint_json': self.blueprint_json,
            'blueprint_image_path': self.blueprint_image_path,
            'disabled': self.disabled,
        }

    @classmethod
    def from_row(cls, row: dict) -> 'School':
        return cls(
            id=row['id'],
            name=row['name'],
            unique_code=row['unique_code'],
            password=row.get('password', ''),
            blueprint_json=row.get('blueprint_json'),
            blueprint_image_path=row.get('blueprint_image_path'),
            disabled=row.get('disabled', False),
        )


@dataclass
class CreateSchoolRequest:
    """Payload expected by POST /api/superadmin/schools."""
    name: str
    unique_code: str
    password: str

    @classmethod
    def from_dict(cls, data: dict) -> 'CreateSchoolRequest':
        return cls(
            name=data.get('name', ''),
            unique_code=data.get('unique_code', ''),
            password=data.get('password', ''),
        )

    def validate(self):
        if not self.name:
            raise ValueError('School name is required.')
        if not self.unique_code:
            raise ValueError('School unique code is required.')
        if not self.password:
            raise ValueError('School password is required.')


@dataclass
class UpdateBlueprintRequest:
    """Payload expected by PUT /api/admin/<schoolId>/blueprint."""
    blueprint_json: Optional[dict]

    @classmethod
    def from_dict(cls, data: dict) -> 'UpdateBlueprintRequest':
        return cls(blueprint_json=data.get('blueprint_json'))
