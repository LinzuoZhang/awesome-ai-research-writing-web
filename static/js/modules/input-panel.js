/**
 * Input Panel Module
 *
 * Provides a modular input panel component that supports:
 * - Text input (textarea)
 * - File input (PDF, ZIP, etc.)
 * - Mixed input (both text and files)
 *
 * Usage:
 *   const inputPanel = new InputPanel('input-panel-container', onChangeCallback);
 *   inputPanel.render('text', { placeholder: 'Enter text...' });
 *   const content = inputPanel.getContent();
 */

export class InputPanel {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            onChange: options.onChange || (() => {}),
            onFileChange: options.onFileChange || (() => {}),
            onProcess: options.onProcess || (() => {})
        };

        this.state = {
            inputType: 'text',
            text: '',
            files: [],
            placeholder: ''
        };

        this.elements = {};
    }

    /**
     * Render the input panel based on type
     * @param {string} type - 'text', 'file', or 'mixed'
     * @param {object} options - Additional options (placeholder, acceptedFormats, etc.)
     */
    render(type = 'text', options = {}) {
        this.state.inputType = type;
        this.state.placeholder = options.placeholder || '在此处输入内容';
        this.state.acceptedFormats = options.acceptedFormats || [];

        this.container.innerHTML = '';
        this.container.className = 'input-panel';

        // Panel header
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.innerHTML = `
            <h2>输入</h2>
            <span id="selected-function" class="selected-function">未选择功能</span>
        `;
        this.container.appendChild(header);

        // Content area based on type
        const contentArea = document.createElement('div');
        contentArea.className = 'input-content';

        if (type === 'mixed') {
            // Mixed mode: side-by-side layout with radio selection
            contentArea.classList.add('mixed-input');
            contentArea.innerHTML = `
                <div class="input-column" id="text-column">
                    <div class="column-header">
                        <label class="radio-label">
                            <input type="radio" name="input-mode" value="text" checked>
                            <span>文本输入</span>
                        </label>
                    </div>
                    <div class="column-content">
                        <textarea id="input-text" placeholder="${this.state.placeholder}"></textarea>
                    </div>
                </div>
                <div class="input-column" id="file-column">
                    <div class="column-header">
                        <label class="radio-label">
                            <input type="radio" name="input-mode" value="file">
                            <span>文件上传</span>
                        </label>
                    </div>
                    <div class="column-content">
                    </div>
                </div>
            `;
            // Create file upload area and append to file column
            const fileColumnContent = contentArea.querySelector('#file-column .column-content');
            const fileArea = this.createFileUploadArea();
            fileColumnContent.appendChild(fileArea);

            // Store references
            this.elements.textarea = contentArea.querySelector('#input-text');
            this.elements.textColumn = contentArea.querySelector('#text-column');
            this.elements.fileColumn = contentArea.querySelector('#file-column');

            // Bind radio button change
            const radioButtons = contentArea.querySelectorAll('input[name="input-mode"]');
            radioButtons.forEach(radio => {
                radio.addEventListener('change', () => this.handleInputModeChange());
            });

            // Initialize: disable file column by default
            this.elements.fileColumn.classList.add('disabled');
        } else {
            // Single mode: text only
            if (type === 'text') {
                const textarea = document.createElement('textarea');
                textarea.id = 'input-text';
                textarea.placeholder = this.state.placeholder;
                textarea.value = this.state.text;
                contentArea.appendChild(textarea);
                this.elements.textarea = textarea;
            }

            // Single mode: file only
            if (type === 'file') {
                const fileArea = this.createFileUploadArea();
                contentArea.appendChild(fileArea);
            }
        }

        this.container.appendChild(contentArea);

        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'input-actions';
        actions.innerHTML = `
            <button id="clear-btn" class="btn btn-secondary">清空</button>
            <button id="paste-btn" class="btn btn-secondary">粘贴</button>
            <button id="process-btn" class="btn btn-primary" disabled>
                <span class="btn-text">开始处理</span>
                <span class="btn-loading" style="display: none;">处理中...</span>
            </button>
            <span class="char-count"><span id="char-count">0</span> 字符</span>
        `;
        this.container.appendChild(actions);

        // Bind events
        this.bindEvents();
    }

    /**
     * Handle input mode change (text vs file)
     */
    handleInputModeChange() {
        const textRadio = this.container.querySelector('input[name="input-mode"][value="text"]');
        const fileRadio = this.container.querySelector('input[name="input-mode"][value="file"]');

        if (textRadio && fileRadio && this.elements.textColumn && this.elements.fileColumn) {
            if (textRadio.checked) {
                // Text mode enabled, disable file column
                this.elements.textColumn.classList.remove('disabled');
                this.elements.fileColumn.classList.add('disabled');
                this.state.files = [];
                this.updateFileList();
            } else {
                // File mode enabled, disable text column
                this.elements.textColumn.classList.add('disabled');
                this.elements.fileColumn.classList.remove('disabled');
                if (this.elements.textarea) {
                    this.elements.textarea.value = '';
                }
            }
            this.options.onChange(this.getContent());
        }
    }

    /**
     * Create file upload area
     */
    createFileUploadArea() {
        const fileArea = document.createElement('div');
        fileArea.className = 'file-upload-area';

        const formatsHint = this.state.acceptedFormats.length > 0
            ? `支持格式：${this.state.acceptedFormats.join(', ')}`
            : '支持 PDF、ZIP 等格式';

        fileArea.innerHTML = `
            <label class="file-drop-zone" id="file-drop-zone" for="file-input">
                <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span class="drop-hint">点击或拖拽文件到此处上传</span>
                <span class="formats-hint">${formatsHint}</span>
                
                <input type="file" id="file-input" class="visually-hidden"
                    ${this.state.acceptedFormats.length > 0 ? `accept="${this.state.acceptedFormats.join(',')}"` : ''}>
            </label>

            <div class="file-list" id="file-list" aria-live="polite"></div>
        `;

        this.elements.fileDropZone = fileArea.querySelector('#file-drop-zone');
        this.elements.fileInput = fileArea.querySelector('#file-input');
        this.elements.fileList = fileArea.querySelector('#file-list');

        return fileArea;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Textarea events
        if (this.elements.textarea) {
            this.elements.textarea.addEventListener('input', () => {
                this.state.text = this.elements.textarea.value;
                this.updateCharCount();
                this.options.onChange(this.getContent());
            });
        }

        // Clear button
        const clearBtn = this.container.querySelector('#clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clear());
        }

        // Paste button
        const pasteBtn = this.container.querySelector('#paste-btn');
        if (pasteBtn) {
            pasteBtn.addEventListener('click', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    if (this.elements.textarea) {
                        this.elements.textarea.value = text;
                        this.state.text = text;
                        this.updateCharCount();
                        this.options.onChange(this.getContent());
                    }
                    showToast('粘贴成功', 'success');
                } catch (err) {
                    showToast('粘贴失败：' + err.message, 'error');
                }
            });
        }

        // File upload events
        if (this.elements.fileDropZone && this.elements.fileInput) {
            const dropZone = this.elements.fileDropZone;
            const fileInput = this.elements.fileInput;

            // Note: click is handled by <label> element automatically
            // Only handle drag events

            fileInput.addEventListener('change', (e) => {
                this.handleFiles(e.target.files);
            });

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                this.handleFiles(e.dataTransfer.files);
            });
        }

        // Process button
        const processBtn = this.container.querySelector('#process-btn');
        if (processBtn) {
            processBtn.addEventListener('click', () => this.options.onProcess());
        }
    }

    /**
     * Handle uploaded files
     */
    handleFiles(files) {
        const newFiles = Array.from(files);
        this.state.files = [...this.state.files, ...newFiles];
        this.updateFileList();
        this.options.onFileChange(this.state.files);
    }

    /**
     * Update file list display
     */
    updateFileList() {
        if (!this.elements.fileList) return;

        this.elements.fileList.innerHTML = '';

        this.state.files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${this.formatFileSize(file.size)})</span>
                <button class="file-remove" data-index="${index}">&times;</button>
            `;

            fileItem.querySelector('.file-remove').addEventListener('click', () => {
                this.state.files.splice(index, 1);
                this.updateFileList();
                this.options.onFileChange(this.state.files);
            });

            this.elements.fileList.appendChild(fileItem);
        });
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Update character count
     */
    updateCharCount() {
        const countEl = this.container.querySelector('#char-count');
        if (countEl && this.elements.textarea) {
            countEl.textContent = this.elements.textarea.value.length;
        }
    }

    /**
     * Get current content
     * @returns {object} - { text, files, type }
     */
    getContent() {
        // In mixed mode, only return content from the active column
        if (this.state.inputType === 'mixed') {
            const textRadio = this.container.querySelector('input[name="input-mode"][value="text"]');
            const isTextMode = textRadio && textRadio.checked;

            if (isTextMode) {
                return {
                    text: this.elements.textarea ? this.elements.textarea.value : '',
                    files: [],
                    type: 'text'
                };
            } else {
                return {
                    text: '',
                    files: [...this.state.files],
                    type: 'file'
                };
            }
        }

        return {
            text: this.elements.textarea ? this.elements.textarea.value : '',
            files: [...this.state.files],
            type: this.state.inputType
        };
    }

    /**
     * Set content
     * @param {string} text - Text content
     */
    setText(text) {
        if (this.elements.textarea) {
            this.elements.textarea.value = text;
            this.state.text = text;
            this.updateCharCount();
        }
    }

    /**
     * Clear all input
     */
    clear() {
        if (this.elements.textarea) {
            this.elements.textarea.value = '';
            this.state.text = '';
            this.updateCharCount();
        }

        this.state.files = [];
        if (this.elements.fileInput) {
            this.elements.fileInput.value = '';
        }
        this.updateFileList();

        this.options.onChange(this.getContent());
    }

    /**
     * Update char count display
     */
    updateCharCount() {
        const countEl = this.container.querySelector('#char-count');
        if (countEl && this.elements.textarea) {
            countEl.textContent = this.elements.textarea.value.length;
        }
    }

    /**
     * Set placeholder text
     * @param {string} placeholder
     */
    setPlaceholder(placeholder) {
        this.state.placeholder = placeholder;
        if (this.elements.textarea) {
            this.elements.textarea.placeholder = placeholder;
        }
    }

    /**
     * Set selected function name display
     * @param {string} name
     */
    setSelectedFunction(name) {
        const el = this.container.querySelector('#selected-function');
        if (el) {
            el.textContent = name;
        }
    }

    /**
     * Get process button element
     */
    getProcessButton() {
        return this.container.querySelector('#process-btn');
    }

    /**
     * Enable or disable process button
     */
    setEnabled(enabled) {
        const processBtn = this.getProcessButton();
        if (processBtn) {
            processBtn.disabled = !enabled;
        }
    }
}

// Toast notification helper (matches existing main.js implementation)
function showToast(message, type = '') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

export default InputPanel;
