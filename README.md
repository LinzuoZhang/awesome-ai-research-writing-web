# AI Academic Writing Assistant Web

基于 [awesome-ai-research-writing](https://github.com/Leey21/awesome-ai-research-writing) 的 Web 界面，提供论文写作辅助功能。

## 功能特性

### 核心功能
- **中译英**: 将中文草稿翻译并润色为英文学术论文
- **英译中**: 将英文 LaTeX 代码翻译为中文
- **缩写**: 在不损失信息的前提下精简文本
- **扩写**: 通过深挖内容深度扩写文本

### 技术特点
- 支持自定义 API Base URL，兼容 Anthropic、OpenAI 及第三方 API
- API Key 本地存储，安全可控
- 响应式设计，支持移动端
- 模块化架构，易于扩展新功能

## 快速开始

### 1. 安装依赖

```bash
cd awesome-ai-research-writing-web
pip install -r requirements.txt
```

### 2. 配置 API Key

复制环境变量模板并填入 API Key：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
SECRET_KEY=your-secret-key
```

### 3. 运行应用

```bash
python app.py
```

访问 http://localhost:5000

## 项目结构

```
awesome-ai-research-writing-web/
├── app.py                  # Flask 主应用
├── config.py               # 配置文件
├── requirements.txt        # Python 依赖
├── .env.example           # 环境变量模板
├── prompts/
│   └── templates.py       # Prompt 模板定义
├── services/
│   └── model_client.py    # 大模型客户端
├── static/
│   ├── css/
│   │   └── style.css      # 样式文件
│   └── js/
│       └── main.js        # 前端交互逻辑
└── templates/
    └── index.html         # 主页面
```

## 使用说明

1. **输入 API Base URL**: 填入 API 地址，如 `https://api.anthropic.com` 或 `https://api.openai.com/v1`，也支持第三方 API
2. **输入 API Key**: 填入你的 API Key（会保存在本地浏览器）
3. **选择功能**: 点击功能卡片选择需要的功能
4. **输入文本**: 在输入框中粘贴需要处理的文本
5. **开始处理**: 点击"开始处理"按钮
6. **查看结果**: 处理完成后查看结果，可一键复制

## 扩展开发

### 添加新的 Prompt 模板

在 `prompts/templates.py` 中添加新的 `PromptTemplate`：

```python
PromptTemplate(
    id='new-function',
    name='新功能',
    name_en='New Function',
    description='功能描述',
    template='''# Role
...''',
    input_placeholder='输入提示',
    output_format='latex',
    category='polishing'
)
```

### 添加新的模型提供商

在 `services/model_client.py` 中添加新的 provider 支持。

## API 接口

### GET /api/templates
获取所有可用的模板

### POST /api/process
处理文本

```json
{
    "template_id": "zh-to-en",
    "input_text": "要处理的文本",
    "api_url": "https://api.anthropic.com",
    "api_key": "sk-...",
    "model": "claude-sonnet-4-20250514"
}
```

### GET /api/health
健康检查

## 注意事项

1. **API Key 安全**: API Key 仅保存在本地浏览器，不会上传到服务器
2. **输入长度限制**: 默认最大输入长度为 10000 字符
3. **请求超时**: 默认请求超时为 120 秒
4. **支持的 API**:
   - Anthropic: `https://api.anthropic.com`
   - OpenAI: `https://api.openai.com/v1`
   - 其他兼容 OpenAI 格式的 API（如 DeepSeek、Moonshot 等）

## 后续计划

- [ ] 添加更多 Prompt 模板（润色、逻辑检查等）
- [ ] 支持 Word 文档上传
- [ ] 支持 LaTeX 项目完整解析
- [ ] 添加历史记录功能
- [ ] 支持多模型对比

## License

MIT

## Acknowledgements

基于 [awesome-ai-research-writing](https://github.com/Leey21/awesome-ai-research-writing) 的 Prompt 模板开发
