"""Generate ZaoAn font PNG images"""
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = r"D:\NewThings\ZAOAN\assets\fonts"
FONTS_DIR = os.path.join(OUT_DIR, "_ttf")
os.makedirs(FONTS_DIR, exist_ok=True)

# 6 款字体：ID, 显示名, jsDelivr 下载 URL (GitHub proxy)
FONTS = [
    ("mashan",   "Ma Shan Zheng",       "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/mashanzheng/MaShanZheng-Regular.ttf"),
    ("zhimang",  "Zhi Mang Xing",       "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zhimangxing/ZhiMangXing-Regular.ttf"),
    ("longcang", "Long Cang",           "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/longcang/LongCang-Regular.ttf"),
    ("kuaile",   "ZCOOL KuaiLe",        "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf"),
    ("liujian",  "Liu Jian Mao Cao",    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/liujianmaocao/LiuJianMaoCao-Regular.ttf"),
    ("xiaowei",  "ZCOOL XiaoWei",       "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zcoolxiaowei/ZCOOLXiaoWei-Regular.ttf"),
]

# 渲染参数 — 4x 分辨率保证 Retina 清晰
FONT_SIZE = 260          # 渲染字号
CANVAS_W = 700           # 画布宽
CANVAS_H = 320           # 画布高
TEXT = "早安"
FILL_COLOR = (200, 160, 80)  # 古金色 #C8A050


def download(url, path):
    import urllib.request
    if os.path.exists(path):
        print(f"  [OK] exists: {os.path.basename(path)}")
        return
    print(f"  [DL] downloading: {os.path.basename(path)} ...")
    urllib.request.urlretrieve(url, path)
    print(f"  [OK] done")


def render(font_id, ttf_path):
    """渲染「早安」PNG，返回 (combined_path, zao_path, an_path)"""
    font = ImageFont.truetype(ttf_path, FONT_SIZE)

    # --- 组合「早安」---
    img = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    bbox = draw.textbbox((0, 0), TEXT, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (CANVAS_W - tw) // 2 - bbox[0]
    y = (CANVAS_H - th) // 2 - bbox[1]
    draw.text((x, y), TEXT, fill=FILL_COLOR, font=font)
    combined_path = os.path.join(OUT_DIR, f"{font_id}.png")
    img.save(combined_path)
    print(f"    -> {font_id}.png ({tw}x{th})")

    # --- 单字「早」---
    img_z = Image.new("RGBA", (CANVAS_W // 2, CANVAS_H), (0, 0, 0, 0))
    draw_z = ImageDraw.Draw(img_z)
    bbox_z = draw_z.textbbox((0, 0), "早", font=font)
    tw_z = bbox_z[2] - bbox_z[0]
    th_z = bbox_z[3] - bbox_z[1]
    x_z = (CANVAS_W // 2 - tw_z) // 2 - bbox_z[0]
    y_z = (CANVAS_H - th_z) // 2 - bbox_z[1]
    draw_z.text((x_z, y_z), "早", fill=FILL_COLOR, font=font)
    zao_path = os.path.join(OUT_DIR, f"{font_id}_zao.png")
    img_z.save(zao_path)

    # --- 单字「安」---
    img_a = Image.new("RGBA", (CANVAS_W // 2, CANVAS_H), (0, 0, 0, 0))
    draw_a = ImageDraw.Draw(img_a)
    bbox_a = draw_a.textbbox((0, 0), "安", font=font)
    tw_a = bbox_a[2] - bbox_a[0]
    th_a = bbox_a[3] - bbox_a[1]
    x_a = (CANVAS_W // 2 - tw_a) // 2 - bbox_a[0]
    y_a = (CANVAS_H - th_a) // 2 - bbox_a[1]
    draw_a.text((x_a, y_a), "安", fill=FILL_COLOR, font=font)
    an_path = os.path.join(OUT_DIR, f"{font_id}_an.png")
    img_a.save(an_path)

    return combined_path


def main():
    print("=" * 60)
    print("早安字体 PNG 生成器")
    print("=" * 60)

    # Step 1: Download fonts
    print("\n[1/2] 下载字体文件...")
    for fid, name, url in FONTS:
        ttf_path = os.path.join(FONTS_DIR, f"{fid}.ttf")
        download(url, ttf_path)

    # Step 2: Render PNGs
    print("\n[2/2] 渲染 PNG 图片...")
    for fid, name, _ in FONTS:
        ttf_path = os.path.join(FONTS_DIR, f"{fid}.ttf")
        print(f"  {name}:")
        render(fid, ttf_path)

    print(f"\n✅ 全部完成！图片保存在: {OUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
