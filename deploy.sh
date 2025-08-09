#!/bin/bash

# GAG 菜谱网站部署脚本
# 使用方法: ./deploy.sh [platform]
# 支持平台: github, netlify, vercel, cloudflare

set -e

echo "🍔 GAG 菜谱网站部署脚本"
echo "=========================="

# 检查文件完整性
echo "📋 检查项目文件..."

required_files=(
    "index.html"
    "assets/tokens.css"
    "assets/components.css"
    "assets/app.js"
    "assets/recipes.json"
    "assets/sw.js"
    "README.md"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "❌ 缺少必需文件: $file"
        exit 1
    fi
done

echo "✅ 所有必需文件都存在"

# 验证 JSON 格式
echo "🔍 验证 JSON 格式..."
if ! python -m json.tool assets/recipes.json > /dev/null 2>&1; then
    echo "❌ recipes.json 格式错误"
    exit 1
fi
echo "✅ JSON 格式正确"

# 检查图片文件
echo "🖼️ 检查图片文件..."
image_dir="images"
if [[ ! -d "$image_dir" ]]; then
    echo "⚠️ 图片目录不存在，创建占位符目录"
    mkdir -p "$image_dir"
fi

# 创建占位符图片（如果不存在）
recipes=("burger" "icecream" "sushi" "cake" "pizza" "salad" "hotdog" "pie" "sandwich" "waffle" "donut")
for recipe in "${recipes[@]}"; do
    if [[ ! -f "$image_dir/${recipe}.png" ]]; then
        echo "⚠️ 缺少图片: ${recipe}.png，将使用占位符"
        # 这里可以添加创建占位符图片的逻辑
    fi
done

# 根据平台执行部署
platform=${1:-"local"}

case $platform in
    "github")
        echo "🚀 部署到 GitHub Pages..."
        git add .
        git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" || echo "没有新的更改"
        git push origin main
        echo "✅ 已推送到 GitHub，请在仓库设置中启用 Pages"
        ;;
    
    "netlify")
        echo "🚀 准备 Netlify 部署..."
        if command -v zip >/dev/null 2>&1; then
            zip -r "gag-recipes-$(date +%Y%m%d).zip" . -x "*.git*" "*.sh" "node_modules/*"
            echo "✅ 已创建部署包，请上传到 Netlify"
        else
            echo "⚠️ 请手动打包项目文件上传到 Netlify"
        fi
        ;;
    
    "vercel")
        echo "🚀 部署到 Vercel..."
        if command -v vercel >/dev/null 2>&1; then
            vercel --prod
        else
            echo "❌ 请先安装 Vercel CLI: npm i -g vercel"
            exit 1
        fi
        ;;
    
    "cloudflare")
        echo "🚀 准备 Cloudflare Pages 部署..."
        echo "请在 Cloudflare Pages 中连接此 Git 仓库"
        echo "构建设置："
        echo "  - 构建命令: (留空)"
        echo "  - 输出目录: /"
        ;;
    
    "local")
        echo "🏠 启动本地开发服务器..."
        if command -v python3 >/dev/null 2>&1; then
            echo "在 http://localhost:8000 访问网站"
            python3 -m http.server 8000
        elif command -v python >/dev/null 2>&1; then
            echo "在 http://localhost:8000 访问网站"
            python -m http.server 8000
        elif command -v npx >/dev/null 2>&1; then
            echo "在 http://localhost:8000 访问网站"
            npx http-server . -p 8000
        else
            echo "❌ 请安装 Python 或 Node.js 来启动本地服务器"
            exit 1
        fi
        ;;
    
    *)
        echo "❌ 不支持的平台: $platform"
        echo "支持的平台: github, netlify, vercel, cloudflare, local"
        exit 1
        ;;
esac

echo ""
echo "🎉 部署完成！"
echo "📖 更多信息请查看 README.md"
