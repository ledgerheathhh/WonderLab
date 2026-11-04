import io
import json
import pytest
import httpx
from fastapi.testclient import TestClient
from pypdf import PdfWriter
from backend import main, ai
from backend.models import Course, Settings

SOURCE = 'Water follows a cycle. First water evaporates, then it condenses into clouds, and finally precipitation returns it to the ground.'
COURSE = {
    'title': 'The water cycle', 'summary': 'Explore how water moves.', 'subject': 'Science',
    'scenes': [
        {'id': 'choose', 'type': 'decision', 'title': 'What comes next?', 'objective': 'Choose the step after evaporation.',
         'explanation': 'Water vapor condenses.', 'hint': 'Think of clouds.', 'quote': 'then it condenses into clouds',
         'context': 'Water has evaporated. What happens next?', 'options': [
             {'id': 'yes', 'text': 'Condensation', 'correct': True, 'feedback': 'Correct: clouds form.'},
             {'id': 'no', 'text': 'No change', 'correct': False, 'feedback': 'Water continues to cycle.'}]},
        {'id': 'order', 'type': 'sort', 'title': 'Order the cycle', 'objective': 'Order these steps.',
         'explanation': 'Evaporation, condensation, precipitation.', 'hint': 'Start at the surface.', 'quote': 'invented quotation',
         'items': [{'id': 'a', 'text': 'Evaporation'}, {'id': 'b', 'text': 'Condensation'}, {'id': 'c', 'text': 'Precipitation'}],
         'correct_order': ['a', 'b', 'c']}
    ]
}
SETTINGS = {'base_url': 'https://provider.example/v1', 'model': 'example-model', 'api_key': 'secret-test-key', 'json_mode': True}


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(main, 'DB_PATH', tmp_path / 'test.sqlite3')
    with TestClient(main.app) as c:
        yield c


@pytest.fixture
def mock_ai(monkeypatch):
    async def fake(settings, messages, structured=False):
        assert settings.api_key.get_secret_value() == 'secret-test-key'
        return json.dumps(COURSE) if structured else 'Clouds form through condensation.'
    monkeypatch.setattr(ai, 'complete', fake)
    monkeypatch.setattr(main, 'complete', fake)


def generate(client, **kwargs):
    return client.post('/api/generate', json={'source': SOURCE, 'source_name': 'Science notes', 'source_kind': 'text', 'settings': SETTINGS, 'language': 'en', **kwargs})


def test_generation_citations_and_persistence(client, mock_ai):
    response = generate(client)
    assert response.status_code == 200
    project = response.json()
    assert project['course']['scenes'][0]['quote'] == 'then it condenses into clouds'
    assert project['course']['scenes'][1]['quote'] == ''
    assert 'secret-test-key' not in json.dumps(client.get('/api/projects').json())
    project['progress']['completed'] = ['choose']
    project['progress']['answers'] = {'choose': 'yes'}
    assert client.put('/api/projects/' + project['id'], json=project).status_code == 200
    assert client.get('/api/projects').json()[0]['progress']['completed'] == ['choose']
    assert client.delete('/api/projects/' + project['id']).status_code == 200
    assert client.get('/api/projects').json() == []


def test_topic_has_no_source_quotes(client, mock_ai):
    project = generate(client, source_kind='topic').json()
    assert all(s['quote'] == '' for s in project['course']['scenes'])


@pytest.mark.parametrize('source', ['复利', '熵'])
def test_short_topic_can_generate(client, mock_ai, source):
    response = generate(client, source_kind='topic', source=source)
    assert response.status_code == 200
    assert response.json()['source'] == source


@pytest.mark.parametrize('kind,source', [('topic', '   '), ('text', '复利'), ('text', '   123456789   '), ('pdf', 'short')])
def test_insufficient_source_is_rejected(client, mock_ai, kind, source):
    assert generate(client, source_kind=kind, source=source).status_code == 422
    assert client.get('/api/projects').json() == []


def test_source_length_uses_trimmed_content(client, mock_ai):
    response = generate(client, source='   1234567890   ')
    assert response.status_code == 200
    assert response.json()['source'] == '1234567890'


def test_bad_ai_output_is_not_saved(client, monkeypatch):
    async def invalid(*args, **kwargs):
        return '{"title":"broken"}'
    monkeypatch.setattr(ai, 'complete', invalid)
    assert generate(client).status_code == 502
    assert client.get('/api/projects').json() == []


@pytest.mark.parametrize('content', ['{"title":', '```', '```json\n{"title":'])
def test_invalid_generated_json_has_specific_error(client, monkeypatch, content):
    async def invalid(*args, **kwargs):
        return content
    monkeypatch.setattr(ai, 'complete', invalid)
    response = generate(client)
    assert response.status_code == 502
    assert 'valid JSON' in response.json()['detail']
    assert client.get('/api/projects').json() == []


@pytest.mark.parametrize('kind,expected', [
    ('missing', 'scenes.0.decision.hint: Missing required field'),
    ('order', 'scenes.1.sort: Correct order must contain every item exactly once'),
    ('duplicate', 'course: Scene IDs must be unique'),
    ('tag', 'scenes.0: Unsupported interaction type'),
    ('extra', 'scenes.0.decision: Unexpected field'),
])
def test_generated_course_reports_rule_without_model_content(client, monkeypatch, kind, expected):
    course = json.loads(json.dumps(COURSE))
    private = 'private-source-and-key-must-not-appear'
    if kind == 'missing':
        del course['scenes'][0]['hint']
    elif kind == 'order':
        course['scenes'][1]['correct_order'] = ['a', 'a', 'c']
    elif kind == 'duplicate':
        course['scenes'][1]['id'] = 'choose'
    elif kind == 'tag':
        course['scenes'][0]['type'] = private
    else:
        course['scenes'][0][private] = private
    async def invalid(*args, **kwargs):
        return json.dumps(course)
    monkeypatch.setattr(ai, 'complete', invalid)
    response = generate(client)
    assert response.status_code == 502
    assert expected in response.json()['detail']
    assert private not in response.text
    assert 'secret-test-key' not in response.text
    assert client.get('/api/projects').json() == []


def test_markdown_fenced_course_can_generate(client, monkeypatch):
    async def fenced(*args, **kwargs):
        return '```json\n' + json.dumps(COURSE) + '\n```'
    monkeypatch.setattr(ai, 'complete', fenced)
    assert generate(client).status_code == 200


def test_topic_validation_error_uses_requested_language(client, monkeypatch):
    async def invalid(*args, **kwargs):
        return '{"title":"KV cache"}'
    monkeypatch.setattr(ai, 'complete', invalid)
    response = generate(client, source='kv-cache', source_kind='topic', language='zh',
                        settings={**SETTINGS, 'model': 'openrouter/free'})
    assert response.status_code == 502
    assert 'summary: 缺少必填字段' in response.json()['detail']
    assert 'secret-test-key' not in response.text


def test_tutor_context_and_missing_scene(client, mock_ai):
    project = generate(client).json()
    payload = {'settings': SETTINGS, 'project': project, 'scene_id': 'choose', 'question': 'Why?', 'language': 'en'}
    response = client.post('/api/chat', json=payload)
    assert response.status_code == 200
    assert 'condensation' in response.json()['answer']
    payload['scene_id'] = 'missing'
    assert client.post('/api/chat', json=payload).status_code == 404


def test_no_secret_in_validation_errors(client):
    invalid = {**SETTINGS, 'base_url': 'bad-url'}
    response = client.post('/api/test-connection', json=invalid)
    assert response.status_code == 422
    assert 'secret-test-key' not in response.text


def test_foreign_origin_is_rejected(client):
    assert client.post('/api/test-connection', json=SETTINGS, headers={'Origin': 'https://evil.example'}).status_code == 403


def test_invalid_progress_rejected(client, mock_ai):
    project = generate(client).json()
    project['progress']['completed'] = ['nonexistent']
    assert client.put('/api/projects/' + project['id'], json=project).status_code == 422


def test_bad_sort_order_rejected():
    course = json.loads(json.dumps(COURSE))
    course['scenes'][1]['correct_order'] = ['a', 'a', 'c']
    with pytest.raises(ValueError):
        Course.model_validate(course)


def test_unreachable_experiment_rejected():
    scene = {'id': 'exp', 'type': 'experiment', 'title': 'Test', 'objective': 'Test', 'explanation': 'Test',
             'hint': 'Test', 'quote': '', 'variable': 'x', 'unit': '', 'result_label': 'y', 'result_unit': '',
             'min': 0, 'max': 10, 'step': 3, 'points': [{'x': 0, 'y': 0}, {'x': 10, 'y': 10}], 'target_min': 4, 'target_max': 5}
    with pytest.raises(ValueError):
        Course.model_validate({**COURSE, 'scenes': [scene, COURSE['scenes'][0]]})
    scene.update(target_min=6, target_max=7)
    assert Course.model_validate({**COURSE, 'scenes': [scene, COURSE['scenes'][0]]})


def test_pdf_errors(client):
    assert client.post('/api/pdf', files={'file': ('x.pdf', b'not a PDF', 'application/pdf')}).status_code == 400
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    buf = io.BytesIO(); writer.write(buf)
    response = client.post('/api/pdf', files={'file': ('scan.pdf', buf.getvalue(), 'application/pdf')})
    assert response.status_code == 422
    assert 'OCR' in response.text


def test_pdf_text_extraction(client):
    from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject
    writer = PdfWriter(); page = writer.add_blank_page(width=300, height=300)
    font = DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'), NameObject('/BaseFont'): NameObject('/Helvetica')})
    page[NameObject('/Resources')] = DictionaryObject({NameObject('/Font'): DictionaryObject({NameObject('/F1'): writer._add_object(font)})})
    stream = DecodedStreamObject(); stream.set_data(b'BT /F1 12 Tf 20 200 Td (The water cycle includes evaporation and condensation.) Tj ET')
    page[NameObject('/Contents')] = writer._add_object(stream)
    buf = io.BytesIO(); writer.write(buf)
    response = client.post('/api/pdf', files={'file': ('notes.pdf', buf.getvalue(), 'application/pdf')})
    assert response.status_code == 200
    assert 'evaporation' in response.json()['text']
    assert response.json()['pages'] == 1


def test_provider_request_and_error_redaction(monkeypatch):
    real_client = httpx.AsyncClient
    captured = []
    def handler(request):
        captured.append(request)
        return httpx.Response(200, json={'choices': [{'message': {'content': '{"ok": true}'}}]})
    monkeypatch.setattr(ai.httpx, 'AsyncClient', lambda **kwargs: real_client(transport=httpx.MockTransport(handler)))
    import asyncio
    assert asyncio.run(ai.complete(Settings(**SETTINGS), [{'role': 'user', 'content': 'json'}], True)) == '{"ok": true}'
    assert str(captured[0].url) == 'https://provider.example/v1/chat/completions'
    assert captured[0].headers['authorization'] == 'Bearer secret-test-key'
    assert json.loads(captured[0].content)['response_format'] == {'type': 'json_object'}
    def denied(request):
        return httpx.Response(401, json={'error': 'secret-test-key'})
    monkeypatch.setattr(ai.httpx, 'AsyncClient', lambda **kwargs: real_client(transport=httpx.MockTransport(denied)))
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as caught:
        asyncio.run(ai.complete(Settings(**SETTINGS), []))
    assert 'secret-test-key' not in caught.value.detail
