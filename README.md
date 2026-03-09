# AI Academic Writing Assistant Web

基于 [awesome-ai-research-writing](https://github.com/Leey21/awesome-ai-research-writing) 的 Web 界面，提供论文写作辅助功能。

## 功能特性

### 核心功能

| 功能 | 描述 | 输入类型 |
|------|------|----------|
| **中译英** (zh-to-en) | 将中文草稿翻译并润色为英文学术论文片段 | 文本 |
| **英译中** (en-to-zh) | 将英文 LaTeX 代码片段翻译为流畅的中文文本 | 文本 |
| **缩写** (abbreviate) | 在不损失信息量的前提下精简文本（5-15 词） | 文本 |
| **扩写** (expand) | 通过深挖内容深度和增强逻辑连接扩写文本（5-15 词） | 文本 |
| **表达润色（英文）** (english-polish) | 深度润色英文论文，提升学术严谨性、清晰度与可读性 | 文本 |
| **表达润色（中文）** (chinese-polish) | 审慎润色中文论文，仅在必要时修改，保持原文风格 | 文本 |
| **去 AI 味** (remove-ai-tone) | 将 AI 生成的机械化文本重写为自然的学术表达 | 文本 |
| **逻辑检查** (logic-check) | 对论文进行红线审查，检查逻辑断层、术语一致性和严重语病 | 文本 / ZIP |

### 技术特点

- **多模型支持**: 兼容 Anthropic、OpenAI 及兼容格式的第三方 API（如 DeepSeek、Moonshot 等）
- **文件上传**: 支持上传 ZIP 格式的 LaTeX 项目，自动合并后处理
- **模块化前端**: 基于 Web Components 的模块化架构，支持多种输入模式（文本/文件/混合）
- **本地存储**: API Key 保存在本地浏览器，安全可控
- **响应式设计**: 支持移动端和桌面端
- **输出分块**: 支持将输出结果分块展示（主要结果/中文翻译/修改说明）

## 快速开始

### 1. 安装依赖

```bash
cd awesome-ai-research-writing-web
pip install -r requirements.txt
```

### 2. 配置环境变量（可选）

如果希望服务端预设 API Key，可复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
SECRET_KEY=your-secret-key
```

> 注：也可在 Web 界面直接输入 API Key，会保存在本地浏览器。

### 3. 运行应用

```bash
python app.py
```

访问 http://localhost:5000

## 项目结构

```
awesome-ai-research-writing-web/
├── app.py                     # Flask 主应用
├── config.py                  # 配置文件
├── requirements.txt           # Python 依赖
├── .env.example              # 环境变量模板
├── prompts/
│   ├── prompts.json          # Prompt 元数据配置
│   ├── templates.py          # Prompt 模板加载器
│   └── templates/            # Prompt 模板文件目录
│       ├── zh-to-en.md
│       ├── en-to-zh.md
│       ├── abbreviate.md
│       ├── expand.md
│       ├── english-polish.md
│       ├── chinese-polish.md
│       ├── remove-ai-tone.md
│       └── logic_check.md
├── services/
│   └── model_client.py       # 大模型客户端（Anthropic/OpenAI）
├── tools/
│   └── latex_merger/         # LaTeX 合并工具
│       └── latex_merger.py
├── static/
│   ├── css/
│   │   └── style.css         # 样式文件
│   └── js/
│       ├── main.js           # 前端主逻辑
│       └── modules/
│           └── input-panel.js # 输入面板组件
└── templates/
    └── index.html            # 主页面
```

## 使用说明

1. **配置 API**: 在设置面板中填入 API Base URL（如 `https://api.anthropic.com` 或 `https://api.openai.com/v1`）和 API Key
2. **选择模型** (可选): 指定模型名称，留空使用默认模型
3. **选择功能**: 点击功能卡片选择需要的功能（可按分类筛选）
4. **输入内容**:
   - 文本模式：直接粘贴需要处理的文本
   - 文件模式：上传 ZIP 文件（如 LaTeX 项目）
5. **开始处理**: 点击"开始处理"按钮
6. **查看结果**: 处理完成后查看结果，支持分块浏览和一键复制

## API 接口

### GET /api/templates

获取所有可用的模板

### POST /api/process

处理文本或文件

支持 JSON 格式（文本）:
```json
{
    "template_id": "zh-to-en",
    "input_text": "要处理的文本",
    "api_url": "https://api.anthropic.com",
    "api_key": "sk-...",
    "model": "claude-sonnet-4-20250514"
}
```

支持 multipart/form-data（文件上传）:
- `template_id`: 模板 ID
- `input_text`: 可选的附加文本
- `api_url`: API 地址
- `api_key`: API Key
- `model`: 可选的模型名称
- `files`: 文件列表

### GET /api/health

健康检查

## 扩展开发

### 添加新的 Prompt 模板

1. 在 `prompts/templates/` 目录下创建新的模板文件（如 `my-template.md`）
2. 在 `prompts/prompts.json` 中添加配置：

```json
{
  "id": "my-template",
  "name": "我的模板",
  "name_en": "My Template",
  "description": "功能描述",
  "template_file": "templates/my-template.md",
  "input_placeholder": "输入提示",
  "output_format": "latex",
  "input_type": "text",
  "category": "polishing",
  "output_tags": ["Part 1", "Part 2"]
}
```

### 添加新的模型提供商

在 `services/model_client.py` 的 `ModelClient._init_client()` 方法中添加新的 provider 支持。

## 注意事项

1. **API Key 安全**: API Key 仅保存在本地浏览器，不会上传到服务器
2. **输入长度限制**: 默认最大输入长度为 10000 字符（可在 `.env` 中调整 `MAX_INPUT_LENGTH`）
3. **请求超时**: 默认请求超时为 120 秒（可在 `.env` 中调整 `REQUEST_TIMEOUT`）
4. **LaTeX 合并**: 上传 ZIP 文件时，会自动合并项目中的所有 `.tex` 文件

## 技术栈

- **后端**: Python 3, Flask
- **前端**: Vanilla JavaScript (ES6+), CSS3
- **AI 集成**: Anthropic SDK, OpenAI SDK
- **工具**: LaTeX 合并工具 (TexMerger)

## License

MIT

## Acknowledgements

基于 [awesome-ai-research-writing](https://github.com/Leey21/awesome-ai-research-writing) 的 Prompt 模板开发
