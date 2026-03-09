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
    // Prevent switching while processing
    if (inputPanel && inputPanel.isProcessing()) {
        showToast('正在处理中，请稍后再试', 'error');
        return;
    }

    selectedTemplate = template;

    // Show IO section when a template is selected
    elements.ioSection.classList.remove('hidden');

    // Render input panel based on template type (this will clear previous input)
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

// Parse result into parts based on output_tags
function parseAndDisplayResult(result) {
    const outputTags = selectedTemplate?.output_tags || [];

    // Initialize processedResult with empty values
    processedResult = {};

    if (outputTags.length === 0) {
        // No output tags - show entire result as main content
        processedResult.main = result;
    } else {
        // Parse result based on output_tags
        outputTags.forEach((tag, index) => {
            const nextTag = outputTags[index + 1];
            const pattern = new RegExp(
                escapeRegExp(tag) + '\\s*\\[([^\\]]+)\\]\\s*(:|\\n)?([\\s\\S]*?)(?=' +
                (nextTag ? escapeRegExp(nextTag) : '$') + ')',
                'i'
            );
            const match = result.match(pattern);
            const key = `part${index + 1}`;
            processedResult[key] = match ? match[3].trim() : '';
        });
    }

    // Render output tabs dynamically
    renderOutputTabs(outputTags);

    // Show first part by default
    const firstPart = outputTags.length > 0 ? 'part1' : 'main';
    showOutputPart(firstPart);

    // Enable copy button
    elements.copyBtn.disabled = false;
}

// Escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Render output tabs dynamically based on output_tags
function renderOutputTabs(outputTags) {
    const tabsContainer = document.querySelector('.output-tabs');
    if (!tabsContainer) return;

    // Clear existing tabs
    tabsContainer.innerHTML = '';

    if (outputTags.length === 0) {
        // Single tab for non-partitioned output
        const tab = document.createElement('button');
        tab.className = 'output-tab active';
        tab.dataset.part = 'main';
        tab.textContent = '输出结果';
        tabsContainer.appendChild(tab);
    } else {
        // Create tabs based on output_tags
        const tabLabels = {
            'Part 1': '主要结果',
            'Part 2': '中文翻译',
            'Part 3': '修改说明'
        };

        outputTags.forEach((tag, index) => {
            const tab = document.createElement('button');
            tab.className = `output-tab${index === 0 ? ' active' : ''}`;
            tab.dataset.part = `part${index + 1}`;
            tab.textContent = tabLabels[tag] || tag;
            tabsContainer.appendChild(tab);
        });
    }

    // Re-attach event listeners to new tabs
    tabsContainer.querySelectorAll('.output-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            elements.outputTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            showOutputPart(tab.dataset.part);
        });
    });

    // Update the outputTabs reference
    elements.outputTabs = tabsContainer.querySelectorAll('.output-tab');
}

// Show specific part of output
function showOutputPart(part) {
    const content = processedResult[part];
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
    processedResult = { main: '' };
    elements.outputContent.innerHTML = '<p class="placeholder">处理结果将显示在这里</p>';

    // Reset tabs to default state (main, translation, log)
    const tabsContainer = document.querySelector('.output-tabs');
    if (tabsContainer) {
        tabsContainer.innerHTML = `
            <button class="output-tab active" data-part="part1">主要结果</button>
            <button class="output-tab" data-part="part2">中文翻译</button>
            <button class="output-tab" data-part="part3">修改说明</button>
        `;
        // Re-attach event listeners
        tabsContainer.querySelectorAll('.output-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                tabsContainer.querySelectorAll('.output-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                showOutputPart(tab.dataset.part);
            });
        });
        elements.outputTabs = tabsContainer.querySelectorAll('.output-tab');
    }

    elements.copyBtn.disabled = true;
}

// Set loading state
function setLoading(loading) {
    // Update input panel processing state
    if (inputPanel) {
        inputPanel.setProcessing(loading);
    }

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
