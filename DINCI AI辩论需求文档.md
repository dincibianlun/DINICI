
### **一、项目概要**

DINCI AI辩论是一款能够调用 OpenRouter 集成的多种主流 AI 模型，支持实时辩论互动的系统。用户可通过输入自定义辩题，选择正方、反方及裁判模型，完成系统化辩论流程，生成内容并保存，探索案例库，实现娱乐与教育融合的创新体验。

### **二、项目功能清单**

#### **1. 用户功能**
- **辩论配置与互动**：
  - 自定义输入辩题，基于 OpenRouter 模型调用进行实时交互。
  - 选择正方、反方、裁判等模型（通过下拉菜单选择）。
  - 系统按指定流程生成辩论内容，动态渲染结果。
- **辩论记录**：
  - 用户可将辩论记录保存到“个人历史”。
  - 辩论记录支持提交至“公开案例库”，供其他用户阅读。
- **密钥与配置管理**：
  - 支持管理 OpenRouter API 密钥（支持新增/修改/删除）。
  -  TTS 配置（新增/修改/删除）。（Cluster ID；APPID；Access Token）
  - 提供用户界面直接选择密钥发起辩论。
- **探索案例库**：
  - 用户可浏览公开的高质量辩论记录。
  - 支持搜索（按关键词或标签）和分类筛选。

#### **2. 管理员功能**
- **内容管理**：
  - 编辑教程文章（如如何获取 OpenRouter API 密钥）。
  - 审核案例库提交内容（拒绝或批准）。
- **数据统计**（新增功能）：
  - 查看总注册用户数。
  - 统计用户活跃情况（日活、周活）。
- **反馈处理**：
  - 用户提交平台问题或建议，管理员查看受理。

---

### **三、页面与交互设计**

#### **1. 首页**
- 赛博朋克风格（深色主题+亮色点缀）。
- 简洁明了的功能布局，居中显示平台简介。
- 主要功能入口：进入“用户中心”或“开始辩论”。

#### **2. 辩论页面**
#### 布局与功能（新增要求）：
- **集中布局**：
  - 动态组件（提示当前发言者）放置在主标题右上角，用小色块动态展示，例如“当前发言者：正方”。
- **流程说明区**：
  - 流程顺序展示：“主持人开场 → 正方立论 → 反方反驳 → 自由辩论 → 裁判总结”。
- **对话区展示**：
  - 实时显示双方辩手及裁判的发言。
  - 打字机文字加载特效，搭配滑入动画。
  - 当前发言者区域高亮，未发言区域淡化。

#### 功能流程：
1. 用户输入自定义辩题。
2. 用户选择正方、反方和裁判模型（下拉框，指定 OpenRouter 支持的模型）。
3. 用户点击“开始辩论”。
4. 系统动态执行以下操作：(每一步均分段流式返回结果)
   - 主持人开场白（解释规则及辩题）。
   - 正反方轮流发言（包括逻辑陈述与反驳）。
   - 自由辩论（多轮交替短句攻防）。
   - 裁判总结分析并给出最终胜负评级。

#### **新增示例交互细节**
- 流程引导组件：
  - 位于页面顶部，实时显示当前流程阶段（如“流程：正方立论”）。
- 模拟进度体验：
  - 当前发言内容播放时，对应区域“闪烁发亮”+未发言区域背景淡化。
  
---

#### **3. 用户中心**
- OpenRouter API Key 和 TTS 配置管理：
  - 提供添加、修改、删除功能，支持显示密钥备注及创建时间。

- 历史辩论记录：
  - 显示标题和保存时间，用户可选择查看详情或删除记录。

#### **4. 案例库**
#### **新增内容：总述页面 + 分类与搜索**
- 支持按标签、关键词搜索，并按热度或时间降序排列案例。
- 每个案例展示标题、摘要、标签和时间。

---

### **四、API 调用说明**

#### **调用 URL 与 Body 格式**
- 请求 URL:
    ```plaintext
    https://openrouter.ai/api/v1/chat/completions
    ```
- 请求数据格式:
    ```json
    {
      "model": "openai/gpt-5-chat", 
      "messages": [
        { "role": "user", "content": "辩题：人工智能是否威胁就业？" },
        { "role": "assistant", "content": "正方发言..." }
      ],
      "stream": true
    }
    ```

#### 可用模型：
| 模型名称     | 模型 ID                       |
| ------------ | ----------------------------- |
| OPENAI       | `openai/gpt-5-chat`           |
| Claude       | `anthropic/claude-3-haiku`    |
| DeepSeek     | `deepseek/deepseek-chat-v3.1` |
| 百度文心一言 | baidu/ernie-4.5-vl-28b-a3b    |
| 智谱清言     | z-ai/glm-4.5                  |
| 月之暗面     | moonshotai/kimi-k2            |
| XAI-Grok     | x-ai/grok-4                   |
| 通义千问     | qwen/qwen-max                 |
| 谷歌gemini   | google/gemini-2.5-pro         |

---

TTS语音Voice_type要求指定 请求方式请参考下方语音合成接口文档

正方：Voice_type：zh_female_sajiaonvyou_moon_bigtts
反方：Voice_type：zh_female_shuangkuaisisi_moon_bigtts
裁判：Voice_type：zh_female_meilinvyou_moon_bigtts

### **五、数据存储设计**

#### 用户表：
```json
{
  "userId": "uuid-12345",
  "email": "user@example.com",
  "openApiKeys": [
    { "keyId": "key-1", "apiKey": "secret-key", "createdAt": "2023-10-10" }
  ]
}
```

#### 辩论记录表：
```json
{
  "debateId": "debate-0001",
  "userId": "uuid-12345",
  "topic": "人工智能是否威胁就业？",
  "roles": {
    "positive": "openai/gpt-5-chat",
    "negative": "anthropic/claude-3-haiku",
    "judge": "openai/gpt-5-chat"
  },
  "content": [
    { "role": "host", "text": "欢迎来到辩论，今天的辩题是..." },
    { "role": "positive", "text": "人工智能将创造更多高薪职位..." }
  ]
}
```

---

### **六、开发分阶段描述**

#### **阶段 1：框架设计**
- 创建项目整体目录结构，并设置基础页面（首页、用户中心、辩论页面、案例库）。

#### **阶段 2：辩论页面实现**
- 支持辩题输入、模型选择、动态显示辩论流程。
- 实现流式返回的模拟（正方、反方、裁判发言）。

#### **阶段 3：案例库功能**
- 设计案例库基础数据结构（存储与查询）。
- 开发案例提交和展示逻辑。

#### **阶段 4：管理后台**
- 实现统计用户数与案例审核。
- 添加文章编辑功能。

#### **阶段 5：整体优化与联调**
- 融合前后端，加入微交互效果。

---

### **七、已实现功能模块**

#### **1. 数据库架构已实现**
- ✅ **用户表 (users)** - 包含最后活跃时间字段 (last_active_at)
- ✅ **辩论记录表 (debates)** - 包含标签字段 (tags) 支持分类筛选
- ✅ **API密钥表 (api_keys)** - 包含创建时间显示 (created_at)
- ✅ **标签表 (tags)** - 支持案例库分类筛选，已预置10个默认标签
- ✅ **教程文章表 (tutorial_articles)** - 支持文章编辑系统
- ✅ **案例审核表 (case_reviews)** - 包含拒绝理由字段 (rejection_reason)

#### **2. 核心功能已就绪**
- ✅ **数据库架构** - 所有表结构已创建完成
- ✅ **基础字段** - 包含所有必需字段（tags、created_at、last_active_at、rejection_reason等）
- ✅ **数据完整性** - 支持基本的数据存储和查询功能

#### **3. 前端功能已实现**
- ✅ **辩论页面** - 支持辩题输入、模型选择、动态辩论流程显示
- ✅ **案例库系统** - 包含案例库页面、详情页、总述页面，支持标签分类筛选
- ✅ **TTS配置** - 完整支持Cluster ID、APPID、Access Token字段配置
- ✅ **密钥管理** - 支持创建时间显示和完整CRUD操作
- ✅ **审核流程** - 案例审核页面支持拒绝理由填写功能
- ✅ **文章编辑** - 文章编辑器和管理页面已开发完成
- ✅ **进度指示** - 辩论进度组件和发言者高亮动画已实现
- ✅ **权限控制** - 管理员路由和私有路由组件已就绪

#### **4. 服务层已完备**
- ✅ **TTS服务** - 完整的语音合成服务实现
- ✅ **OpenRouter服务** - AI模型调用服务
- ✅ **案例服务** - 案例管理和查询服务
- ✅ **分析服务** - 数据统计和分析服务
- ✅ **认证服务** - 用户认证和权限管理

#### **3. 技术特性实现**
- ✅ **数据库迁移** - 提供完整的SQL迁移脚本
- ✅ **错误防护** - 所有数据库操作都有存在性检查
- ✅ **扩展性设计** - 支持后续功能扩展

#### **4. 待开发功能优先级**
**高优先级：**
- TTS高级参数配置 (disable_markdown_filter, enable_latex_tn)
- 音频缓存机制 (cache_config参数)
- 案例库搜索排序功能优化

**中优先级：**
- 教程文章内容管理系统
- 标签热度统计和分析
- 用户活跃度深度分析

**低优先级：**
- 页面微交互动画优化
- 发言者区域动态闪烁效果增强
- 案例库总述页面内容填充

---

### **八、后续开发计划**

#### **1. Supabase集成**
- 对接Supabase Analytics接口
- 完善前端筛选组件
- 扩展TTS配置界面
- 添加文章编辑模块存储

#### **2. 性能优化**
- 实现音频缓存机制
- 数据库查询优化
- 响应式设计完善

#### **3. 安全增强**
- 启用行级安全(RLS)策略
- API密钥加密存储
- 访问权限控制

---

# 豆包语音合成HTTP 非流式语音合成接口文档  

使用账号申请部分获得的 `appid` 与 `access_token` 进行调用。文本全部合成完毕后，一次性返回全部音频数据（base64 编码）。  

## 1. 接口说明  

- 方法：HTTP POST  
- 地址：openspeech.bytedance.com/api/v1/tts  

## 2. 身份认证  

- 方式：Bearer Token  

- Header：Authorization: Bearer;YourAccessToken  

  > 注意：`Bearer` 与 `token` 之间使用英文分号 `;` 分隔，替换时请勿保留 `${}`。  

## 3. 通用注意事项  

1. 请求与返回均为 JSON 格式。  
2. 音频数据经 base64 编码后嵌于 JSON，需解码得到二进制音频。  
3. 每次合成必须重新生成并保证 reqid 唯一（建议使用 UUID/GUID）。  
4. HTTP 场景下 operation 固定为 query。  
5. Websocket 与 HTTP 调用参数相同，但 Websocket 单条链接仅支持单次合成。  

## 4. 请求参数  

| 字段              | 含义         | 层级 | 格式       | 必需 | 备注                                               |
| ----------------- | ------------ | ---- | ---------- | ---- | -------------------------------------------------- |
| **app**           | 应用相关配置 | 1    | dict       | ✓    |                                                    |
| appid             | 应用标识     | 2    | string     | ✓    | 需提前申请                                         |
| token             | 应用令牌     | 2    | string     | ✓    | 无实际鉴权作用，可传任意非空字符串                 |
| cluster           | 业务集群     | 2    | string     | ✓    | 固定值 volcano_tts                                 |
| **user**          | 用户相关配置 | 1    | dict       | ✓    |                                                    |
| uid               | 用户标识     | 2    | string     | ✓    | 可任意非空，便于日志追溯                           |
| **audio**         | 音频相关配置 | 1    | dict       | ✓    |                                                    |
| voice_type        | 音色类型     | 2    | string     | ✓    |                                                    |
| emotion           | 音色情感     | 2    | string     |      | 部分音色支持，如 "angry"                           |
| enable_emotion    | 开启音色情感 | 2    | bool       |      | 需设为 true 才能使用 emotion                       |
| emotion_scale     | 情绪值       | 2    | float      |      | 1~5，默认 4                                        |
| encoding          | 音频编码格式 | 2    | string     |      | wav / pcm / ogg_opus / mp3，默认 pcm               |
| speed_ratio       | 语速         | 2    | float      |      | [0.8, 2]，默认 1                                   |
| rate              | 采样率       | 2    | int        |      | 默认 24000，可选 8000、16000                       |
| bitrate           | 比特率       | 2    | int        |      | kb/s，仅 MP3 生效，默认 160                        |
| explicit_language | 明确语种     | 2    | string     |      | 见文档枚举                                         |
| context_language  | 参考语种     | 2    | string     |      | 西欧语种默认英语                                   |
| loudness_ratio    | 音量调节     | 2    | float      |      | [0.5, 2]，默认 1                                   |
| **request**       | 请求相关配置 | 1    | dict       | ✓    |                                                    |
| reqid             | 请求标识     | 2    | string     | ✓    | 需唯一                                             |
| text              | 合成文本     | 2    | string     | ✓    | ≤1024 字节，建议 <300 字符                         |
| model             | 模型版本     | 2    | string     |      | seed-tts-1.1 或不传                                |
| text_type         | 文本类型     | 2    | string     |      | "ssml" 时使用 SSML                                 |
| silence_duration  | 句尾静音     | 2    | float      |      | 0~30000 ms，需先启用 enable_trailing_silence_audio |
| with_timestamp    | 时间戳       | 2    | int/string |      | 传 1 启用                                          |
| operation         | 操作         | 2    | string     | ✓    | query（HTTP 非流式）/ submit（流式）               |
| extra_param       | 附加参数     | 2    | jsonstring |      | JSON 字符串，子字段见下                            |

### extra_param 子字段（JSON 字符串）

- disable_markdown_filter: bool（true 时过滤 markdown 语法）  
- enable_latex_tn: bool（true 时支持朗读 LaTeX，需先 disable_markdown_filter=true）  
- mute_cut_threshold & mute_cut_remain_ms: string（静音阈值与保留长度）  
- disable_emoji_filter: bool（true 时不过滤 emoji）  
- unsupported_char_ratio_thresh: float（不支持的字符占比阈值，默认 0.3）  
- cache_config: dict（开启缓存，示例 {"text_type":1,"use_cache":true}）

## 5. 返回参数  

| 字段     | 含义           | 层级 | 格式   | 备注             |
| -------- | -------------- | ---- | ------ | ---------------- |
| reqid    | 请求 ID        | 1    | string | 与请求一致       |
| code     | 状态码         | 1    | int    | 见错误码表       |
| message  | 状态信息       | 1    | string |                  |
| sequence | 音频段序号     | 1    | int    | 负数表示合成完毕 |
| data     | 音频数据       | 1    | string | base64 编码      |
| addition | 额外信息父节点 | 1    | string |                  |
| duration | 音频时长       | 2    | string | 单位 ms          |

## 6. 请求示例  

```json
{
  "app": { "appid": "appid123", "token": "access_token", "cluster": "volcano_tts" },
  "user": { "uid": "uid123" },
  "audio": {
    "voice_type": "zh_male_M392_conversation_wvae_bigtts",
    "encoding": "mp3",
    "speed_ratio": 1.0
  },
  "request": {
    "reqid": "uuid",
    "text": "字节跳动语音合成",
    "operation": "query"
  }
}

7. 响应示例

{
  "reqid": "reqid",
  "code": 3000,
  "operation": "query",
  "message": "Success",
  "sequence": -1,
  "data": "base64 encoded binary data",
  "addition": { "duration": "1960" }
}
```