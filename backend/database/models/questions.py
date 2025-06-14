from typing import List

from backend.database.base import Base
from datetime import datetime, timezone
from random import randint

from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database.base import Base
from . import quizzes, answers, results

class Question(Base):
    __tablename__ = 'questions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizzes.id", ondelete='cascade'),
                                         nullable=False)
    text: Mapped[str] = mapped_column(String(256), nullable=False)
    type: Mapped[str] = mapped_column(String(30), nullable=False)

    quiz: Mapped["quizzes.Quiz"] = relationship(back_populates="questions", cascade="delete")
    answers: Mapped[List["answers.Answer"]] = relationship(back_populates="question", cascade='delete')
    result: Mapped["results.Result"] = relationship(back_populates='question', cascade='delete')