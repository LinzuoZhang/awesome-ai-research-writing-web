/**
 * AI Academic Writing Assistant - Frontend JavaScript
 */

import InputPanel from './modules/input-panel.js';

// State
let selectedTemplate = null;
let currentCategory = 'all';
let processedResult = {
    main: '',
    translation: '',
    log: ''
};

// Input Panel Instance
let inputPanel = null;

// DOM Elements
const elements = {
    apiUrl: document.getElementById('api-url'),
    apiKey: document.getElementById('api-key'),
    model: document.getElementById('model'),
    functionGrid: document.getElementById('function-grid'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    ioSection: document.querySelector('.io-section'),
    outputContainer: document.getElementById('output-container'),
    outputContent: document.getElementById('output-content'),
    outputTabs: document.querySelectorAll('.output-tab'),
    copyBtn: document.getElementById('copy-btn'),
    clearOutputBtn: document.getElementById('clear-output-btn'),
    toast: document.getElementById('toast')
};

// Templates data (loaded from window object)
const templates = window.templates || [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initInputPanel();
    renderFunctions();
    setupEventListeners();
});

// Load settings from localStorage
function loadSettings() {
    const savedApiUrl = localStorage.getItem('apiUrl');
    const savedApiKey = localStorage.getItem('apiKey');
    const savedModel = localStorage.getItem('model');

    if (savedApiUrl) elements.apiUrl.value = savedApiUrl;
    if (savedApiKey) elements.apiKey.value = savedApiKey;
    if (savedModel) elements.model.value = savedModel;
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('apiUrl', elements.apiUrl.value);
    localStorage.setItem('apiKey', elements.apiKey.value);
    localStorage.setItem('model', elements.model.value);
}

// Initialize Input Panel
function initInputPanel() {
    inputPanel = new InputPanel('input-panel-container', {
        onChange: (content) => {
            // Enable process button if there's content
            const hasContent = content.text.trim() || content.files.length > 0;
            inputPanel.setEnabled(hasContent && selectedTemplate !== null);
        },
        onFileChange: (files) => {
            const hasContent = inputPanel.getContent().text.trim() || files.length > 0;
            inputPanel.setEnabled(hasContent && selectedTemplate !== null);
        },
        onProcess: processText
    });
}

// Render function cards
function renderFunctions() {
    elements.functionGrid.innerHTML = '';

    const filteredTemplates = currentCategory === 'all'
        ? templates
        : templates.filter(t => t.category === currentCategory);

    filteredTemplates.forEach(template => {
        const card = document.createElement('div');
        card.className = `function-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`;
        card.dataset.id = template.id;
        card.innerHTML = `
            <h3>${template.name} ${template.name_en ? `(${template.name_en})` : ''}</h3>
            <p>${template.description}</p>
        `;
        card.addEventListener('click', () => selectTemplate(template));
        elements.functionGrid.appendChild(card);
    });
}

// Select a template
function selectTemplate(template) {
    selectedTemplate = template;

    // Show IO section when a template is selected
    elements.ioSection.classList.remove('hidden');

    // Render input panel based on template type
    const inputType = template.input_type || 'text';
    inputPanel.render(inputType, {
        placeholder: template.input_placeholder,
        acceptedFormats: template.accepted_formats || []
    });

    // Set selected function name
    inputPanel.setSelectedFunction(template.name);

    // Update selected state
    document.querySelectorAll('.function-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.id === template.id);
    });

    // Clear previous output
    clearOutput();
}

// Setup event listeners
function setupEventListeners() {
    // Category tabs
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderFunctions();
        });
    });

    // Output tabs
    elements.outputTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.outputTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            showOutputPart(tab.dataset.part);
        });
    });

    // Copy output
    elements.copyBtn.addEventListener('click', copyOutput);

    // Clear output
    elements.clearOutputBtn.addEventListener('click', clearOutput);

    // Settings change
    [elements.apiUrl, elements.apiKey, elements.model].forEach(el => {
        el.addEventListener('change', saveSettings);
    });
}

// Process text with API
async function processText() {
    if (!selectedTemplate) {
        showToast('请选择功能', 'error');
        return;
    }

    const content = inputPanel.getContent();
    if (!content.text.trim() && content.files.length === 0) {
        showToast('请输入文本或上传文件', 'error');
        return;
    }

    const apiUrl = elements.apiUrl.value.trim();
    if (!apiUrl) {
        showToast('请输入 API Base URL', 'error');
        return;
    }

    const apiKey = elements.apiKey.value.trim();
    if (!apiKey) {
        showToast('请输入 API Key', 'error');
        return;
    }

    // Set loading state
    setLoading(true);

    try {
        // Check if files are included
        if (content.files.length > 0) {
            // Handle file upload
            await processWithFiles(content);
        } else {
            // Handle text-only processing
            await processTextOnly(content.text);
        }

        showToast('处理成功', 'success');

    } catch (error) {
        console.error('Error:', error);
        showToast('处理失败：' + error.message, 'error');
    } finally {
        setLoading(false);
    }
}

// Process text only
async function processTextOnly(text) {
    const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            template_id: selectedTemplate.id,
            input_text: text,
            api_url: elements.apiUrl.value.trim(),
            api_key: elements.apiKey.value.trim(),
            model: elements.model.value.trim() || undefined
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || '请求失败');
    }

    parseAndDisplayResult(data.result);
}

// Process with files
async function processWithFiles(content) {
    const formData = new FormData();
    formData.append('template_id', selectedTemplate.id);
    formData.append('input_text', content.text);
    formData.append('api_url', elements.apiUrl.value.trim());
    formData.append('api_key', elements.apiKey.value.trim());

    if (elements.model.value.trim()) {
        formData.append('model', elements.model.value.trim());
    }

    content.files.forEach((file, index) => {
        formData.append(`files`, file);
    });

    const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || '请求失败');
    }

    parseAndDisplayResult(data.result);
}

// Parse result into parts (main, translation, log)
function parseAndDisplayResult(result) {
    // Try to parse Part 1, Part 2, Part 3 from result
    const part1Match = result.match(/Part\s*1\s*\[([^\]]+)\]\s*(:|\n)?([\s\S]*?)(?=Part\s*2|$)/i);
    const part2Match = result.match(/Part\s*2\s*\[([^\]]+)\]\s*(:|\n)?([\s\S]*?)(?=Part\s*3|$)/i);
    const part3Match = result.match(/Part\s*3\s*\[([^\]]+)\]\s*(:|\n)?([\s\S]*?)(?=Part\s*4|$)/i);

    processedResult = {
        main: part1Match ? part1Match[3].trim() : result,
        translation: part2Match ? part2Match[3].trim() : '',
        log: part3Match ? part3Match[3].trim() : ''
    };

    // Show main part by default
    elements.outputTabs.forEach(t => t.classList.remove('active'));
    elements.outputTabs[0].classList.add('active');
    showOutputPart('main');

    // Enable copy button
    elements.copyBtn.disabled = false;
}

// Show specific part of output
function showOutputPart(part) {
    const content = processedResult[part] || processedResult.main;
    if (content) {
        elements.outputContent.textContent = content;
    } else {
        elements.outputContent.innerHTML = '<p class="placeholder">该部分暂无内容</p>';
    }
}

// Copy output to clipboard
async function copyOutput() {
    const activeTab = document.querySelector('.output-tab.active');
    const part = activeTab?.dataset.part || 'main';
    const content = processedResult[part] || processedResult.main;

    try {
        await navigator.clipboard.writeText(content);
        showToast('已复制到剪贴板', 'success');
    } catch (err) {
        showToast('复制失败：' + err.message, 'error');
    }
}

// Clear output
function clearOutput() {
    processedResult = { main: '', translation: '', log: '' };
    elements.outputContent.innerHTML = '<p class="placeholder">处理结果将显示在这里</p>';
    elements.outputTabs.forEach(t => t.classList.remove('active'));
    elements.outputTabs[0].classList.add('active');
    elements.copyBtn.disabled = true;
}

// Set loading state
function setLoading(loading) {
    const processBtn = inputPanel?.getProcessButton();
    if (processBtn) {
        if (loading) {
            processBtn.disabled = true;
            const btnText = processBtn.querySelector('.btn-text');
            const btnLoading = processBtn.querySelector('.btn-loading');
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline-flex';
        } else {
            const hasContent = inputPanel && (inputPanel.getContent().text.trim() || inputPanel.getContent().files.length > 0);
            processBtn.disabled = !hasContent;
            const btnText = processBtn.querySelector('.btn-text');
            const btnLoading = processBtn.querySelector('.btn-loading');
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }
}

// Show toast notification
function showToast(message, type = '') {
    if (!elements.toast) {
        const toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
        elements.toast = toast;
    }

    elements.toast.textContent = message;
    elements.toast.className = 'toast ' + type;
    elements.toast.classList.add('show');

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}
