"""
schemas package - dataclass-based schemas for all 5 database tables.

Tables covered:
  - schools       -> schemas.school
  - users         -> schemas.teacher  (super_admin + teacher)
  - students      -> schemas.student
  - scores        -> schemas.student  (Score, SubmitScoreRequest)
  - quizzes       -> schemas.quiz

Auth session payload shapes are in schemas.auth.
"""
from .auth import (
    LoginRequest,
    SuperAdminSessionPayload,
    TeacherSessionPayload,
    AdminSessionPayload,
    StudentSessionPayload,
)
from .school import (
    School,
    CreateSchoolRequest,
    UpdateBlueprintRequest,
)
from .teacher import (
    User,
    CreateTeacherRequest,
    UpdateTeacherRequest,
    ResetPasswordRequest,
)
from .student import (
    Student,
    AddStudentRequest,
    BulkImportStudentsRequest,
    Score,
    SubmitScoreRequest,
)
from .quiz import (
    QuizQuestion,
    Quiz,
    UploadQuizRequest,
)

__all__ = [
    # auth
    'LoginRequest',
    'SuperAdminSessionPayload',
    'TeacherSessionPayload',
    'AdminSessionPayload',
    'StudentSessionPayload',
    # school
    'School',
    'CreateSchoolRequest',
    'UpdateBlueprintRequest',
    # teacher/user
    'User',
    'CreateTeacherRequest',
    'UpdateTeacherRequest',
    'ResetPasswordRequest',
    # student
    'Student',
    'AddStudentRequest',
    'BulkImportStudentsRequest',
    # score
    'Score',
    'SubmitScoreRequest',
    # quiz
    'QuizQuestion',
    'Quiz',
    'UploadQuizRequest',
]
