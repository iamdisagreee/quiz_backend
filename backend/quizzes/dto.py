from typing import List, Literal, Union, Annotated
from pydantic import Field
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


class CreateQuiz(CamelCaseModel):
    name: str
    questions: List[CreateQuestion]
    settings: Setting


class GetQuiz(CamelCaseModel):
    quiz_id: int


class BaseResultQuestion(CamelCaseModel):
    question_id: int
    type: str


class TextResultQuestion(BaseResultQuestion):
    type: Literal['text']
    answers: str


class SingleChoiceQuestion(BaseResultQuestion):
    type: Literal['single_choice']
    answers: int


class MultipleChoiceQuestion(BaseResultQuestion):
    type: Literal['multiple_choice']
    answers: List[int]

class ResultQuiz(CamelCaseModel):
    quiz_id: int
    questions: List[
        Annotated[
            Union[TextResultQuestion, SingleChoiceQuestion, MultipleChoiceQuestion],
            Field(discriminator='type')
        ]
    ]

class RunQuizTextAnswer(CamelCaseModel):
    question_id: int
    type: Literal['text']
    answer_text: str


class RunQuizSingleChoiceAnswer(CamelCaseModel):
    question_id: int
    type: Literal['single_choice']
    answer_id: int  # индекс варианта ответа (0, 1, 2, ...)


class RunQuizMultipleChoiceAnswer(CamelCaseModel):
    question_id: int
    type: Literal['multiple_choice']
    answer_ids: List[int]  # список индексов выбранных вариантов


class SubmitQuizAnswers(CamelCaseModel):
    answers: List[
        Annotated[
            Union[RunQuizTextAnswer, RunQuizSingleChoiceAnswer, RunQuizMultipleChoiceAnswer],
            Field(discriminator='type')
        ]
    ]
    time_expired: bool = False
