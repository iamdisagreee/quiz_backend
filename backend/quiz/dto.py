from typing import List, Literal

from backend.dto import CamelCaseModel


class CreateAnswer(CamelCaseModel):
    text: str
    is_correct: bool = False

class CreateQuestion(CamelCaseModel):
    text: str
    type: Literal['text', 'single_choice', 'multiple_choice']
    answers: List[CreateAnswer]

class Setting(CamelCaseModel):
    timer_enabled: bool = False
    timer_value: int
    # timer_to_one_question: int

class CreateQuiz(CamelCaseModel):
    name: str
    questions: List[CreateQuestion]
    settings: Setting



