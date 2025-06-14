from datetime import datetime, timezone
from random import randint
from typing import List, TYPE_CHECKING

from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, false
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database.base import Base

if TYPE_CHECKING:
    from .users import User
    from .questions import Question
    from .games import Game


class Quiz(Base):
    __tablename__ = 'quizzes'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete='cascade'), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    slug: Mapped[str] = mapped_column(String(128), nullable=False)
    connection_code: Mapped[int] = mapped_column(Integer, default=randint(100000, 999999))
    timer_enabled: Mapped[int] = mapped_column(Integer, nullable=False, default=False)
    timer_value: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.now(timezone.utc))
    is_opened: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())

    user: Mapped["User"] = relationship("User", back_populates="quizzes")
    questions: Mapped[List["Question"]] = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    games: Mapped[List["Game"]] = relationship("Game", back_populates="quiz", cascade='all, delete-orphan')