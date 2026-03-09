"""
AI Academic Writing Assistant - Flask Web Application
"""

import os
import tempfile
from flask import Flask, render_template, request, jsonify
from config import Config
from prompts.templates import TEMPLATES, get_template_by_id
from services.model_client import ModelClient
from tools.latex_merger.latex_merger import TexMerger

app = Flask(__name__)
app.config.from_object(Config)


@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html', templates=TEMPLATES)


@app.route('/api/templates', methods=['GET'])
def get_templates():
    """Get all available templates."""
    templates_data = [
        {
            'id': t.id,
            'name': t.name,
            'name_en': t.name_en,
            'description': t.description,
            'input_placeholder': t.input_placeholder,
            'output_format': t.output_format,
            'input_type': t.input_type,
            'accepted_formats': t.accepted_formats,
            'category': t.category,
            'output_tags': t.output_tags
        }
        for t in TEMPLATES
    ]
    return jsonify({'templates': templates_data})


def extract_latex_from_zip(file_storage):
    """从上传的 ZIP 文件中提取并合并 LaTeX 内容"""
    merger = TexMerger()
    with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as tmp_zip:
        try:
            file_storage.save(tmp_zip.name)
            with tempfile.NamedTemporaryFile(suffix='.tex', delete=False) as tmp_out:
                try:
                    merger.merge_zip(tmp_zip.name, tmp_out.name)
                    with open(tmp_out.name, 'r', encoding='utf-8') as f:
                        content = f.read()
                    return content
                finally:
                    os.unlink(tmp_out.name)
        finally:
            os.unlink(tmp_zip.name)


@app.route('/api/process', methods=['POST'])
def process():
    """Process text using the specified template and model."""
    # Check if this is a file upload (multipart/form-data)
    if request.content_type and 'multipart/form-data' in request.content_type:
        template_id = request.form.get('template_id')
        input_text = request.form.get('input_text', '')
        api_url = request.form.get('api_url')
        api_key = request.form.get('api_key')
        model = request.form.get('model')
        files = request.files.getlist('files')
    else:
        # JSON request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        template_id = data.get('template_id')
        input_text = data.get('input_text')
        api_url = data.get('api_url')
        api_key = data.get('api_key')
        model = data.get('model')
        files = []

    # Validate inputs
    if not template_id:
        return jsonify({'error': 'Template ID is required'}), 400
    if not api_url:
        return jsonify({'error': 'API Base URL is required'}), 400
    if not api_key:
        # Try to use server-configured API key based on URL
        if 'anthropic' in api_url.lower():
            api_key = app.config.get('ANTHROPIC_API_KEY')
        else:
            api_key = app.config.get('OPENAI_API_KEY')

    if not api_key:
        return jsonify({'error': 'API key is required (provide in request or set in .env)'}), 400

    # Get template
    template = get_template_by_id(template_id)
    if not template:
        return jsonify({'error': f'Template "{template_id}" not found'}), 404

    # Process files if provided
    final_input_text = input_text
    if files and len(files) > 0:
        for file in files:
            if file.filename.endswith('.zip'):
                # Merge LaTeX files from ZIP
                merged_content = extract_latex_from_zip(file)
                if merged_content:
                    if final_input_text:
                        final_input_text += '\n\n' + merged_content
                    else:
                        final_input_text = merged_content
            else:
                # Handle plain text files
                file_content = file.read().decode('utf-8')
                if final_input_text:
                    final_input_text += '\n\n' + file_content
                else:
                    final_input_text = file_content

    if not final_input_text:
        return jsonify({'error': 'Input text is required'}), 400

    # Process with model
    try:
        client = ModelClient(api_key=api_key, api_url=api_url)
        result = client.generate(template.template, final_input_text, model=model)

        return jsonify({
            'success': True,
            'result': result,
            'template_id': template_id,
            'api_url': api_url
        })
    except Exception as e:
        return jsonify({
            'error': f'Failed to process: {str(e)}',
            'success': False
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'templates_count': len(TEMPLATES),
        'info': 'Supports Anthropic, OpenAI, and compatible API endpoints'
    })


if __name__ == '__main__':
    print("Starting AI Academic Writing Assistant...")
    print("Templates available:", [t.name for t in TEMPLATES])
    app.run(debug=True, host='0.0.0.0', port=5000)
