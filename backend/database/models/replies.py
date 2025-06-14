from typing import TYPE_CHECKING
from sqlalchemy import Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.base import Base

if TYPE_CHECKING:
    from .results import Result

class Reply(Base):
    __tablename__ = 'replies'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    result_id: Mapped[int] = mapped_column(Integer, ForeignKey("results.id", ondelete='cascade'),
                                           nullable=False)
    answer_id: Mapped[int] = mapped_column(Integer, nullable=True)
    answer_text: Mapped[str] = mapped_column(String(128), nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)

    result: Mapped["Result"] = relationship(back_populates="replies")
