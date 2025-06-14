from typing import List, TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.base import Base

if TYPE_CHECKING:
    from .games import Game
    from .replies import Reply
    from .questions import Question

class Result(Base):
    __tablename__ = 'results'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    game_id: Mapped[int] = mapped_column(Integer, ForeignKey("games.id", ondelete='cascade'),
                                         nullable=False)
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id", ondelete='cascade'),
                                             nullable=False)

    game: Mapped["Game"] = relationship(back_populates='results')
    replies: Mapped[List["Reply"]] = relationship(back_populates="result", cascade='all, delete-orphan')
    question: Mapped["Question"] = relationship(back_populates="results")
