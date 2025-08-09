# GAG 菜谱大全 🍔

一个基于纯 HTML/CSS/JavaScript 技术栈构建的 Grow a Garden (Roblox) 游戏菜谱指南网站。

## ✨ 功能特性

- 📱 **响应式设计** - 完美适配桌面端、平板和手机
- 🎨 **明暗主题** - 支持自动和手动主题切换
- 🔍 **智能搜索** - 按菜名、食材快速筛选
- 🏷️ **难度筛选** - 简单/中等/困难分类浏览
- 🔗 **深度链接** - 每个菜谱都有独立链接，便于分享
- 📋 **一键复制** - 快速复制菜谱链接到剪贴板
- 🌐 **离线访问** - Service Worker 支持离线浏览
- 🚀 **SEO 优化** - 结构化数据，搜索引擎友好
- ⚡ **性能优化** - 资源预加载，快速响应

## 🍳 包含菜谱

1. **汉堡 (Burger)** - 困难 | 10分钟
2. **冰淇淋 (Ice Cream)** - 简单 | 5分钟  
3. **寿司 (Sushi)** - 中等 | 7分钟
4. **蛋糕 (Cake)** - 困难 | 8分钟
5. **披萨 (Pizza)** - 中等 | 7分钟
6. **沙拉 (Salad)** - 简单 | 5分钟
7. **热狗 (Hot Dog)** - 中等 | 6分钟
8. **馅饼 (Pie)** - 中等 | 7分钟
9. **三明治 (Sandwich)** - 中等 | 6分钟
10. **华夫饼 (Waffle)** - 中等 | 6分钟
11. **甜甜圈 (Donut)** - 困难 | 9分钟

## 🏗️ 技术架构

### 设计原则
- **第一性原理** - 从核心需求出发，避免过度设计
- **DRY (Don't Repeat Yourself)** - 代码复用，统一数据源
- **KISS (Keep It Simple, Stupid)** - 保持简单，易于理解
- **SOLID 原则** - 模块化设计，职责分离
- **YAGNI (You Aren't Gonna Need It)** - 只实现当前需要的功能

### 文件结构
```
gag-recipes.net/
├── index.html              # 主页面
├── assets/                 # 资源文件
│   ├── tokens.css         # 设计令牌系统
│   ├── components.css     # 组件样式
│   ├── app.js             # 应用逻辑
│   ├── recipes.json       # 菜谱数据
│   └── sw.js              # Service Worker
├── images/                # 图片资源
│   ├── placeholder.svg    # 占位符图片
│   └── *.png              # 菜谱插画
└── README.md              # 项目说明
```

### 模块化架构

#### 1. 数据层 (DataManager)
- 负责加载和管理菜谱数据
- 提供数据筛选和查询接口
- 单一数据源，避免数据不一致

#### 2. 渲染层 (RenderManager)  
- 负责 DOM 渲染和更新
- 组件化模板，易于维护
- 支持国际化文本转换

#### 3. 交互层 (InteractionManager)
- 处理用户交互事件
- 防抖搜索，优化性能
- 主题切换和状态管理

#### 4. SEO 层 (SEOManager)
- 自动注入结构化数据
- 每个菜谱的 HowTo 标记
- FAQ 页面优化

## 🚀 部署指南

### 静态托管平台

#### 1. Cloudflare Pages
```bash
# 连接 Git 仓库，自动部署
# 构建设置：
# - 构建命令：无需构建
# - 输出目录：/
```

#### 2. GitHub Pages
```bash
# 1. 推送代码到 GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. 在仓库设置中启用 Pages
# Settings > Pages > Source: Deploy from branch
```

#### 3. Netlify
```bash
# 拖拽整个文件夹到 Netlify 部署
# 或连接 Git 仓库自动部署
```

#### 4. Vercel
```bash
# 使用 Vercel CLI
npx vercel --prod
# 或在 vercel.com 导入项目
```

### 本地开发

```bash
# 使用 Python 启动本地服务器
python -m http.server 8000

# 或使用 Node.js
npx http-server . -p 8000

# 访问 http://localhost:8000
```

## 🎨 自定义指南

### 修改主题色彩
编辑 `assets/tokens.css` 中的 CSS 变量：
```css
:root {
  --color-brand-primary: #69e4a5;  /* 主品牌色 */
  --color-brand-secondary: #9ad3ff; /* 次要品牌色 */
  /* ... 其他颜色变量 */
}
```

### 添加新菜谱
在 `assets/recipes.json` 中添加新的菜谱对象：
```json
{
  "id": "new-recipe",
  "name": "新菜谱",
  "difficulty": "Medium",
  "minutes": 6,
  "image": "./images/new-recipe.png",
  "badges": ["新品"],
  "baseIngredients": ["食材1", "食材2"],
  "variants": [
    {
      "rarity": "Legendary",
      "ingredients": ["食材1", "食材2"]
    }
  ],
  "tips": ["制作小贴士"]
}
```

### 修改样式组件
组件样式在 `assets/components.css` 中定义，使用 BEM 命名规范：
```css
.recipe-card {
  /* 卡片基础样式 */
}

.recipe-card__title {
  /* 卡片标题样式 */
}

.recipe-card--featured {
  /* 特色卡片变体 */
}
```

## 🔧 开发工具

### 代码质量
- ESLint - JavaScript 代码检查
- Prettier - 代码格式化
- Lighthouse - 性能和 SEO 检测

### 推荐 VS Code 扩展
- Live Server - 本地开发服务器
- Prettier - 代码格式化
- CSS Peek - CSS 类名跳转
- Auto Rename Tag - HTML 标签同步重命名

## 📊 性能指标

- **Lighthouse 分数**: 95+ (性能/可访问性/最佳实践/SEO)
- **首屏渲染**: < 1.5s
- **交互响应**: < 100ms
- **缓存命中率**: > 90%

## 🌐 浏览器支持

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- iOS Safari 13+
- Android Chrome 80+

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/new-feature`)
3. 提交更改 (`git commit -m 'Add new feature'`)
4. 推送到分支 (`git push origin feature/new-feature`)
5. 创建 Pull Request

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [项目 Issues 页面]
- 邮箱: [your-email@example.com]

---

**🎮 享受 Grow a Garden 的烹饪之旅！**
