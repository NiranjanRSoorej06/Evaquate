"""
Quiz table schema.

Mirrors the `quizzes` database table:
    id            SERIAL PRIMARY KEY
    disaster_type VARCHAR(50) NOT NULL
    question      TEXT
    option_a      TEXT
    option_b      TEXT
    option_c      TEXT
    option_d      TEXT
    correct_answer TEXT
    questions     JSONB NOT NULL DEFAULT '[]'::jsonb
"""
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class QuizQuestion:
    """Represents a single parsed question (from CSV or DB)."""
    question: str
    options: List[str]
    answer: int                  # 0-indexed correct option
    option_a: str = ''
    option_b: str = ''
    option_c: str = ''
    option_d: str = ''
    correct_answer: str = ''

    def to_dict(self) -> dict:
        return {
            'question': self.question,
            'options': self.options,
            'answer': self.answer,
            'option_a': self.option_a,
            'option_b': self.option_b,
            'option_c': self.option_c,
            'option_d': self.option_d,
            'correct_answer': self.correct_answer,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'QuizQuestion':
        return cls(
            question=data.get('question', ''),
            options=data.get('options', []),
            answer=int(data.get('answer', 0)),
            option_a=data.get('option_a', ''),
            option_b=data.get('option_b', ''),
            option_c=data.get('option_c', ''),
            option_d=data.get('option_d', ''),
            correct_answer=data.get('correct_answer', ''),
        )


@dataclass
class Quiz:
    """Represents a row in the `quizzes` table."""
    id: Optional[int]
    disaster_type: str
    questions: List[dict] = field(default_factory=list)
    question: str = ''
    option_a: str = ''
    option_b: str = ''
    option_c: str = ''
    option_d: str = ''
    correct_answer: str = ''

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'disaster_type': self.disaster_type,
            'question': self.question,
            'option_a': self.option_a,
            'option_b': self.option_b,
            'option_c': self.option_c,
            'option_d': self.option_d,
            'correct_answer': self.correct_answer,
            'questions': self.questions,
        }

    @classmethod
    def from_row(cls, row: dict) -> 'Quiz':
        return cls(
            id=row.get('id'),
            disaster_type=row['disaster_type'],
            questions=row.get('questions') or [],
            question=row.get('question', ''),
            option_a=row.get('option_a', ''),
            option_b=row.get('option_b', ''),
            option_c=row.get('option_c', ''),
            option_d=row.get('option_d', ''),
            correct_answer=row.get('correct_answer', ''),
        )


@dataclass
class UploadQuizRequest:
    """Represents a quiz upload request (multipart/form-data)."""
    disaster_type: str
    # The uploaded file is handled separately via request.files

    def validate(self):
        if not self.disaster_type:
            raise ValueError('disaster_type is required.')
        valid_types = {'earthquake', 'flood', 'fire', 'cyclone', 'landslide'}
        if self.disaster_type not in valid_types:
            raise ValueError(f'disaster_type must be one of: {", ".join(sorted(valid_types))}')
