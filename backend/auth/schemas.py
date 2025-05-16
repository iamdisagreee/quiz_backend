from typing import List

class Answer:
    answer: str
    is_correct: bool

class Question:
    text: str
    is_answer_text: bool
    is_answer_choice: bool
    answers: List[Answer]

class Quiz:
    questions: List[Question]



