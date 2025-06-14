from datetime import datetime, timezone
from typing import List, TYPE_CHECKING
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.base import Base

if TYPE_CHECKING:
    from .quizzes import Quiz
    from .answers import Answer
    from .results import Result

class Question(Base):
    __tablename__ = 'questions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizzes.id", ondelete='cascade'), nullable=False)
    text: Mapped[str] = mapped_column(String(512), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'text', 'single_choice', 'multiple_choice'
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.now(timezone.utc))

    # Relationships
    quiz: Mapped["Quiz"] = relationship(back_populates="questions")
    answers: Mapped[List["Answer"]] = relationship(back_populates="question", cascade="all, delete-orphan")
    results: Mapped[List["Result"]] = relationship(back_populates="question", cascade="all, delete-orphan")
