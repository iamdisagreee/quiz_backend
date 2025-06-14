from datetime import datetime
from typing import List

from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database.base import Base
from . import results, quizzes, users

class Game(Base):
    __tablename__ = 'games'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizzes.id", ondelete='cascade'),
                                         nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete='cascade'),
                                         nullable=False)
    finished_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now())

    results: Mapped[List["results.Result"]] = relationship(back_populates="game", cascade='delete')
    quiz: Mapped["quizzes.Quiz"] = relationship(back_populates="games", cascade='delete')
    user: Mapped["users.User"] = relationship(back_populates="games", cascade='delete')