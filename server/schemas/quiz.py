"""
Quiz table schema.

Mirrors the `quizzes` database table:
    id         SERIAL PRIMARY KEY
    teacher_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE
    quiz_data  JSONB NOT NULL DEFAULT '{}'::jsonb

quiz_data JSON shape:
    {
        "title": "Fire Safety Quiz",
        "disaster": "fire",
        "q1": {
            "question": "...",
            "option_a": "...",
            "option_b": "...",
            "option_c": "...",
            "option_d": "...",
            "answer": "a"
        },
        "q2": { ... }
    }
"""
from dataclasses import dataclass, field
from typing import Dict, Optional


@dataclass
class QuizQuestion:
    """Represents a single question stored under q1, q2, ... in quiz_data."""
    question: str
    option_a: str = ''
    option_b: str = ''
    option_c: str = ''
    option_d: str = ''
    answer: str = 'a'

    def to_dict(self) -> dict:
        return {
            'question': self.question,
            'option_a': self.option_a,
            'option_b': self.option_b,
            'option_c': self.option_c,
            'option_d': self.option_d,
            'answer': self.answer,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'QuizQuestion':
        return cls(
            question=data.get('question', ''),
            option_a=data.get('option_a', ''),
            option_b=data.get('option_b', ''),
            option_c=data.get('option_c', ''),
            option_d=data.get('option_d', ''),
            answer=str(data.get('answer', 'a')),
        )


@dataclass
class Quiz:
    """Represents a row in the `quizzes` table."""
    id: Optional[int]
    teacher_id: str
    quiz_data: Dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'teacher_id': self.teacher_id,
            'quiz_data': self.quiz_data,
        }

    @classmethod
    def from_row(cls, row: dict) -> 'Quiz':
        return cls(
            id=row.get('id'),
            teacher_id=row.get('teacher_id', ''),
            quiz_data=row.get('quiz_data') or {},
        )


@dataclass
class UploadQuizRequest:
    """Represents a quiz upload request (multipart/form-data)."""
    disaster_type: str

    def validate(self):
        if not self.disaster_type:
            raise ValueError('disaster_type is required.')
        valid_types = {'earthquake', 'flood', 'fire', 'cyclone', 'landslide'}
        if self.disaster_type not in valid_types:
            raise ValueError(f'disaster_type must be one of: {", ".join(sorted(valid_types))}')
