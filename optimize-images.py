#!/usr/bin/env python3
"""
图片优化脚本 - 压缩PNG图片并转换为WebP格式
用法: python optimize-images.py
"""

import os
import sys
from PIL import Image, ImageOpt
import subprocess

def compress_png(input_path, output_path, quality=85):
    """压缩PNG图片"""
    try:
        with Image.open(input_path) as img:
            # 转换为RGB如果是RGBA（去除透明度）
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            # 保存为优化的JPEG（更小的文件大小）
            img.save(output_path, 'JPEG', quality=quality, optimize=True)
            print(f"✅ 压缩完成: {input_path} -> {output_path}")
            
    except Exception as e:
        print(f"❌ 压缩失败 {input_path}: {e}")

def convert_to_webp(input_path, output_path, quality=80):
    """转换为WebP格式"""
    try:
        with Image.open(input_path) as img:
            img.save(output_path, 'WebP', quality=quality, optimize=True)
            print(f"✅ WebP转换完成: {input_path} -> {output_path}")
    except Exception as e:
        print(f"❌ WebP转换失败 {input_path}: {e}")

def get_file_size(file_path):
    """获取文件大小（MB）"""
    return os.path.getsize(file_path) / (1024 * 1024)

def optimize_images():
    """优化image文件夹中的所有图片"""
    image_dir = "./image"
    optimized_dir = "./image_optimized"
    webp_dir = "./image_webp"
    
    # 创建输出目录
    os.makedirs(optimized_dir, exist_ok=True)
    os.makedirs(webp_dir, exist_ok=True)
    
    if not os.path.exists(image_dir):
        print(f"❌ 目录不存在: {image_dir}")
        return
    
    total_original_size = 0
    total_compressed_size = 0
    total_webp_size = 0
    
    print("🚀 开始图片优化...")
    print("=" * 60)
    
    for filename in os.listdir(image_dir):
        if filename.lower().endswith('.png'):
            input_path = os.path.join(image_dir, filename)
            
            # 原始文件大小
            original_size = get_file_size(input_path)
            total_original_size += original_size
            
            # 压缩为JPEG
            jpeg_filename = filename.replace('.png', '.jpg')
            jpeg_path = os.path.join(optimized_dir, jpeg_filename)
            compress_png(input_path, jpeg_path, quality=85)
            
            if os.path.exists(jpeg_path):
                compressed_size = get_file_size(jpeg_path)
                total_compressed_size += compressed_size
                compression_ratio = ((original_size - compressed_size) / original_size) * 100
                print(f"   📊 {filename}: {original_size:.2f}MB -> {compressed_size:.2f}MB (节省 {compression_ratio:.1f}%)")
            
            # 转换为WebP
            webp_filename = filename.replace('.png', '.webp')
            webp_path = os.path.join(webp_dir, webp_filename)
            convert_to_webp(input_path, webp_path, quality=80)
            
            if os.path.exists(webp_path):
                webp_size = get_file_size(webp_path)
                total_webp_size += webp_size
    
    print("\n" + "=" * 60)
    print("📈 优化总结:")
    print(f"原始PNG总大小: {total_original_size:.2f}MB")
    print(f"压缩JPEG总大小: {total_compressed_size:.2f}MB")
    print(f"WebP总大小: {total_webp_size:.2f}MB")
    
    if total_original_size > 0:
        jpeg_savings = ((total_original_size - total_compressed_size) / total_original_size) * 100
        webp_savings = ((total_original_size - total_webp_size) / total_original_size) * 100
        print(f"JPEG格式节省: {jpeg_savings:.1f}%")
        print(f"WebP格式节省: {webp_savings:.1f}%")
    
    print("\n🎯 下一步操作:")
    print("1. 检查 image_optimized/ 文件夹中的JPEG文件")
    print("2. 检查 image_webp/ 文件夹中的WebP文件")
    print("3. 选择最佳格式替换原始PNG文件")
    print("4. 更新HTML/CSS中的图片引用路径")

if __name__ == "__main__":
    try:
        optimize_images()
    except KeyboardInterrupt:
        print("\n⏹️  用户取消操作")
    except Exception as e:
        print(f"❌ 脚本执行错误: {e}")
