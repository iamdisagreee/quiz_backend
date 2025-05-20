from datetime import datetime

from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database.base import Base
from . import game

class Result(Base):
    __tablename__ = 'results'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    game_id: Mapped[int] = mapped_column(Integer, ForeignKey("games.id", ondelete='cascade'),
                                         nullable=False)
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id", ondelete='cascade'),
                                             nullable=False)
    success_rate: Mapped[float] = mapped_column(Float, nullable=False)

    game: Mapped["game.Game"] = relationship(back_populates='results', cascade='delete')
