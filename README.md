# 投资看板 V10

一个基于 Vue 3 + Element Plus + SQLite 的智能投资管理看板，支持 AI 图片识别、实时价格更新、持仓盈亏分析、CSV 导入导出等功能。

## 🎉 V10 新特性

### 核心升级
- ✅ **SQLite 数据库**：交易记录存储在数据库中，支持多端访问和更新
- ✅ **CSV 导入导出**：方便数据迁移和批量录入
- ✅ **后端 API**：完整的 RESTful API，支持 CRUD 操作
- ✅ **数据持久化**：配置和价格缓存也存储在数据库中

### 数据存储升级
- **之前 V9**: 使用浏览器 localStorage（仅限单端）
- **现在 V10**: 使用 SQLite 数据库（支持多端共享）

## 功能特性

- ✏️ **投资记录管理**：手动录入或 AI 识别截图自动录入
- 💾 **数据库存储**：所有数据存储在 SQLite 数据库中
- 📥 **CSV 导入导出**：支持批量导入和导出交易记录
- 📊 **资产分布可视化**：饼图展示资产配置
- 💰 **持仓盈亏分析**：实时计算每个标的的盈亏情况
- 🔄 **实时价格更新**：从 Yahoo Finance 获取最新股价（支持缓存）
- 🙈 **隐私模式**：一键隐藏所有金额信息
- 🎨 **拖拽排序**：自定义卡片布局
- 🌐 **汇率自动更新**：支持 USD/CNY 实时汇率

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动后端服务

```bash
npm start
# 或使用开发模式（自动重启）
npm run dev
```

服务启动后会在 `http://localhost:3001` 运行。

### 3. 访问前端

在浏览器中打开 `index.html`，或使用本地服务器：

```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve .

# VS Code Live Server 插件
```

然后访问 `http://localhost:8000`

## 项目结构

```
InvestLog/
├── index.html              # 前端入口文件
├── server.js               # 后端服务（Express + SQLite）
├── database.js             # 数据库操作模块
├── csv-handler.js          # CSV 导入导出处理
├── package.json            # Node.js 依赖配置
├── data/
│   ├── investlog.db       # SQLite 数据库文件（自动创建）
│   └── template.csv       # CSV 导入模板
└── src/
    ├── styles/            # 样式文件
    │   ├── base.css       # 基础样式
    │   ├── components.css # 组件样式
    │   └── position.css   # 持仓盈亏样式
    ├── utils/             # 工具函数
    │   ├── api.js         # API 调用（已更新支持数据库）
    │   ├── formatter.js   # 数据格式化
    │   └── storage.js     # 本地存储（已废弃，保留兼容）
    ├── composables/       # Vue Composables
    │   ├── useConfig.js   # 配置管理
    │   ├── useRecords.js  # 记录管理（已更新支持数据库）
    │   ├── usePosition.js # 持仓盈亏管理
    │   └── useChart.js    # 图表管理
    └── app.js             # 主应用逻辑
```

## 数据库设计

### 交易记录表 (transactions)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | 资产名称 |
| symbol | TEXT | 股票代码 |
| date | TEXT | 交易日期 |
| total | REAL | 总金额（USD）|
| price | REAL | 单价（USD）|
| shares | REAL | 股数 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 配置表 (config)

| 字段 | 类型 | 说明 |
|------|------|------|
| key | TEXT | 配置键（主键）|
| value | TEXT | 配置值（JSON）|
| updated_at | DATETIME | 更新时间 |

### 价格缓存表 (price_cache)

| 字段 | 类型 | 说明 |
|------|------|------|
| symbol | TEXT | 股票代码（主键）|
| price | REAL | 价格 |
| updated_at | DATETIME | 更新时间 |

## API 接口

### 交易记录

- `GET /api/transactions` - 获取所有交易记录
- `GET /api/transactions/:id` - 获取单个交易记录
- `POST /api/transactions` - 添加交易记录
- `POST /api/transactions/batch` - 批量添加交易记录
- `PUT /api/transactions/:id` - 更新交易记录
- `DELETE /api/transactions/:id` - 删除交易记录
- `DELETE /api/transactions` - 清空所有交易记录
- `GET /api/transactions/summary` - 获取持仓汇总

### CSV 导入导出

- `GET /api/export/csv` - 导出 CSV
- `POST /api/import/csv` - 导入 CSV
- `POST /api/import/csv/validate` - 验证 CSV

### 配置管理

- `GET /api/config` - 获取所有配置
- `GET /api/config/:key` - 获取单个配置
- `POST /api/config` - 保存配置

### 股票价格

- `GET /api/price/:symbol` - 获取单个股票价格
- `POST /api/prices` - 批量获取股票价格

### 健康检查

- `GET /api/health` - 服务健康检查

## CSV 导入导出

### CSV 格式

CSV 文件应包含以下列（按顺序）：

```csv
name,symbol,date,total,price,shares
NVDA,NVDA,2024-01-15,1000.50,125.50,7.97
AAPL,AAPL,2024-01-20,2000.00,180.25,11.09
```

### 导出数据

1. 点击"持仓明细"卡片中的"数据"下拉菜单
2. 选择"导出 CSV"
3. 文件会自动下载

### 导入数据

1. 点击"持仓明细"卡片中的"数据"下拉菜单
2. 选择"导入 CSV"
3. 选择导入模式：
   - **追加模式**：保留原有数据，添加新数据
   - **覆盖模式**：清空原有数据，仅保留导入数据
4. 选择 CSV 文件并上传

### CSV 模板

项目提供了 CSV 模板文件：`data/template.csv`

## 配置说明

### AI 识别配置

1. 点击右上角 ⚙️ 图标打开设置
2. 选择 AI 服务商（Google Gemini 或 OpenAI）
3. 填写 API Key 和模型名称
4. 保存配置（配置会存储到数据库）

### 汇率配置

- 系统会自动获取最新汇率
- 也可以手动点击刷新按钮更新
- 汇率会自动保存到数据库

## 数据迁移

### 从 V9 迁移到 V10

如果你之前使用 V9 版本（localStorage 存储），可以通过以下步骤迁移数据：

1. 在 V9 版本中，手动复制 localStorage 中的 `investData`
2. 将数据转换为 CSV 格式（可使用在线工具或脚本）
3. 在 V10 版本中使用 CSV 导入功能

或者，可以在浏览器控制台运行以下脚本：

```javascript
// 1. 在 V9 版本中导出数据
const data = JSON.parse(localStorage.getItem('investData') || '[]');
console.log(JSON.stringify(data, null, 2));

// 2. 将 JSON 转换为 CSV 后导入到 V10
```

## 多端访问

由于数据存储在 SQLite 数据库中，你可以：

1. **局域网访问**：
   - 启动服务器时绑定到 `0.0.0.0`：
     ```bash
     PORT=3001 node server.js
     ```
   - 其他设备通过局域网 IP 访问：`http://192.168.x.x:3001`

2. **云端部署**：
   - 部署到 Vercel、Railway、Render 等云平台
   - 所有设备通过云端地址访问

3. **数据同步**：
   - 使用 CSV 导出/导入在不同设备间同步数据
   - 或将数据库文件 `data/investlog.db` 复制到其他设备

## 技术栈

### 前端
- **Vue 3**: 渐进式 JavaScript 框架
- **Element Plus**: Vue 3 组件库
- **ECharts**: 数据可视化库
- **Sortable.js**: 拖拽排序库

### 后端
- **Express**: Node.js Web 框架
- **better-sqlite3**: SQLite 数据库驱动
- **csv-parser**: CSV 解析
- **fast-csv**: CSV 生成
- **multer**: 文件上传处理
- **node-fetch**: HTTP 请求

### 数据源
- **Yahoo Finance API**: 股票价格数据
- **Exchange Rate API**: 汇率数据

## 注意事项

1. **数据库位置**: 数据库文件位于 `data/investlog.db`，请勿删除
2. **备份建议**: 定期使用 CSV 导出功能备份数据
3. **API 限流**: Yahoo Finance API 有请求频率限制
4. **浏览器兼容**: 推荐使用现代浏览器（Chrome、Firefox、Safari、Edge）
5. **端口占用**: 如果 3001 端口被占用，可通过环境变量修改：
   ```bash
   PORT=3002 npm start
   ```

## 开发指南

### 修改样式

- **全局样式**: 编辑 `src/styles/base.css`
- **组件样式**: 编辑 `src/styles/components.css`
- **持仓盈亏样式**: 编辑 `src/styles/position.css`

### 修改功能

- **数据库操作**: 编辑 `database.js`
- **CSV 处理**: 编辑 `csv-handler.js`
- **API 路由**: 编辑 `server.js`
- **前端逻辑**: 编辑 `src/composables/` 下的文件

### 添加新表

在 `database.js` 的 `initDatabase()` 函数中添加新表：

```javascript
db.exec(`
    CREATE TABLE IF NOT EXISTS your_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ...
    )
`);
```

### 添加新 API

在 `server.js` 中添加新的路由：

```javascript
app.get('/api/your-endpoint', (req, res) => {
    // 处理逻辑
});
```

## 故障排查

### 数据库无法创建

- 检查 `data` 目录是否存在写权限
- 确保 `better-sqlite3` 模块安装成功

### 价格获取失败

- 检查网络连接
- Yahoo Finance API 可能存在限流，稍后重试

### CSV 导入失败

- 检查 CSV 格式是否正确
- 确保必填字段（name、date、total、price）都存在

### 前端无法连接后端

- 确认后端服务已启动
- 检查 API 地址配置（默认 `http://localhost:3001`）

## 安全说明

- **API Keys**: 前端 AI API Key 由用户自行配置，存储在数据库中
- **数据库访问**: 数据库文件仅本地访问，无远程权限
- **部署安全**: 部署到云端时，建议使用环境变量配置敏感信息

## 许可证

MIT License

## 更新日志

### V10 (2024-11)
- ✨ 添加 SQLite 数据库支持
- ✨ 添加 CSV 导入导出功能
- ✨ 完整的后端 API
- ✨ 支持多端访问和数据共享
- 🔧 优化数据存储结构
- 🗑️ 清理冗余文件

### V9
- ✨ 后端价格服务
- ✨ AI 图片识别
- ✨ 持仓盈亏分析
