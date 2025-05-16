from typing import List

from backend.database.base import Base
from datetime import datetime, timezone
from random import randint

from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database.base import Base
from . import quiz, answer

class Question(Base):
    __tablename__ = 'questions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizzes.id", ondelete='cascade'),
                                         nullable=False)
    question: Mapped[str] = mapped_column(String(256), nullable=False)
    is_answer_text: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_answer_choice: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    quiz: Mapped["quiz.Quiz"] = relationship(back_populates="questions", cascade="delete")
    answers: Mapped[List["answer.Answer"]] = relationship(back_populates="question", cascade='delete')