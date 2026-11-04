from typing import Annotated, Literal
from urllib.parse import urlparse
from pydantic import BaseModel, ConfigDict, Field, SecretStr, model_validator


class Settings(BaseModel):
    base_url: str = Field(min_length=8, max_length=500)
    model: str = Field(min_length=1, max_length=100)
    api_key: SecretStr
    json_mode: bool = True

    @model_validator(mode='after')
    def valid_url(self):
        url = urlparse(self.base_url)
        if url.scheme not in ('https', 'http') or not url.hostname or url.username or url.password or url.query or url.fragment:
            raise ValueError('Invalid API base URL')
        if url.scheme == 'http' and url.hostname not in ('localhost', '127.0.0.1', '::1'):
            raise ValueError('Use HTTPS for remote API services')
        if not self.api_key.get_secret_value().strip():
            raise ValueError('API key is required')
        return self


class BaseScene(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=160)
    objective: str = Field(min_length=1, max_length=1000)
    explanation: str = Field(min_length=1, max_length=4000)
    hint: str = Field(min_length=1, max_length=1000)
    quote: str = Field(max_length=2000)


class Point(BaseModel):
    x: float = Field(allow_inf_nan=False)
    y: float = Field(allow_inf_nan=False)


class Experiment(BaseScene):
    type: Literal['experiment']
    variable: str = Field(min_length=1, max_length=100)
    unit: str = Field(max_length=40)
    result_label: str = Field(min_length=1, max_length=100)
    result_unit: str = Field(max_length=40)
    min: float = Field(allow_inf_nan=False)
    max: float = Field(allow_inf_nan=False)
    step: float = Field(gt=0, allow_inf_nan=False)
    points: list[Point] = Field(min_length=2, max_length=30)
    target_min: float = Field(allow_inf_nan=False)
    target_max: float = Field(allow_inf_nan=False)

    @model_validator(mode='after')
    def valid_range(self):
        xs = [p.x for p in self.points]
        if not self.min < self.max or not self.min <= self.target_min <= self.target_max <= self.max:
            raise ValueError('Invalid experiment range')
        if xs != sorted(set(xs)) or xs[0] != self.min or xs[-1] != self.max:
            raise ValueError('Points must cover the range and have strictly increasing x')
        if self.step > self.max - self.min:
            raise ValueError('Step exceeds range')
        from math import ceil
        reachable = self.min + ceil((self.target_min - self.min) / self.step - 1e-8) * self.step
        if reachable > self.target_max + 1e-8:
            raise ValueError('Experiment target is unreachable with this step')
        return self


class Option(BaseModel):
    id: str = Field(min_length=1)
    text: str = Field(min_length=1)
    correct: bool
    feedback: str = Field(min_length=1)


class Decision(BaseScene):
    type: Literal['decision']
    context: str = Field(min_length=1, max_length=4000)
    options: list[Option] = Field(min_length=2, max_length=5)

    @model_validator(mode='after')
    def valid_options(self):
        if not any(o.correct for o in self.options) or len({o.id for o in self.options}) != len(self.options):
            raise ValueError('Decision needs unique options and a correct answer')
        return self


class Item(BaseModel):
    id: str = Field(min_length=1)
    text: str = Field(min_length=1)


class SortScene(BaseScene):
    type: Literal['sort']
    items: list[Item] = Field(min_length=3, max_length=7)
    correct_order: list[str]

    @model_validator(mode='after')
    def valid_order(self):
        ids = [item.id for item in self.items]
        if len(set(ids)) != len(ids) or sorted(ids) != sorted(self.correct_order):
            raise ValueError('Correct order must contain every item exactly once')
        return self


Scene = Annotated[Experiment | Decision | SortScene, Field(discriminator='type')]


class Course(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    summary: str = Field(min_length=1, max_length=2000)
    subject: str = Field(min_length=1, max_length=80)
    scenes: list[Scene] = Field(min_length=2, max_length=6)

    @model_validator(mode='after')
    def valid_scenes(self):
        if len({s.id for s in self.scenes}) != len(self.scenes):
            raise ValueError('Scene IDs must be unique')
        if len({s.type for s in self.scenes}) < 2:
            raise ValueError('Use at least two interaction types')
        return self


class Progress(BaseModel):
    completed: list[str] = []
    active: str = ''
    attempts: dict[str, int] = {}
    answers: dict[str, str | float | list[str]] = {}


class Project(BaseModel):
    id: str
    source: str = Field(max_length=60000)
    source_name: str = Field(max_length=200)
    source_kind: Literal['text', 'pdf', 'topic', 'example']
    course: Course
    progress: Progress
    updated_at: str


class GenerateRequest(BaseModel):
    source: str = Field(min_length=1, max_length=60000)
    source_name: str = Field(min_length=1, max_length=200)
    source_kind: Literal['text', 'pdf', 'topic']
    language: Literal['zh', 'en'] = 'zh'
    settings: Settings

    @model_validator(mode='after')
    def valid_source(self):
        self.source = self.source.strip()
        minimum = 1 if self.source_kind == 'topic' else 10
        if len(self.source) < minimum:
            raise ValueError(f'Source needs at least {minimum} characters')
        return self


class ChatRequest(BaseModel):
    settings: Settings
    project: Project
    scene_id: str
    question: str = Field(min_length=1, max_length=2000)
    language: Literal['zh', 'en'] = 'zh'
    history: list[dict[str, str]] = Field(default_factory=list, max_length=10)
