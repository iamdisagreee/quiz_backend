from datetime import datetime

from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database.base import Base
from . import games, results

class Reply(Base):
    __tablename__ = 'replies'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    result_id: Mapped[int] = mapped_column(Integer, ForeignKey("results.id", ondelete='cascade'),
                                           nullable=False)
    answer_id: Mapped[int] = mapped_column(Integer, nullable=True)
    answer_text: Mapped[str] = mapped_column(String(128), nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)

    result: Mapped["results.Result"] = relationship(back_populates="replies", cascade='delete')