from pathlib import Path
from PIL import Image, ImageOps, ImageFilter, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "infoBase"
PRODUCTOS_SRC = SRC / "Productos"
OUT_LOGO = ROOT / "img" / "logo"
OUT_PRODUCTOS = ROOT / "img" / "productos"
OUT_BANNERS = ROOT / "img" / "banners"

for folder in (OUT_LOGO, OUT_PRODUCTOS, OUT_BANNERS):
    folder.mkdir(parents=True, exist_ok=True)


def square_crop(path: Path, size: int = 900) -> Image.Image:
    image = Image.open(path).convert("RGB")
    image = ImageOps.exif_transpose(image)
    side = min(image.width, image.height)
    left = (image.width - side) // 2
    top = max(0, int((image.height - side) * 0.35))
    image = image.crop((left, top, left + side, top + side))
    return image.resize((size, size), Image.Resampling.LANCZOS)


def wide_crop(path: Path, size=(1600, 640)) -> Image.Image:
    image = Image.open(path).convert("RGB")
    image = ImageOps.exif_transpose(image)
    target_ratio = size[0] / size[1]
    source_ratio = image.width / image.height
    if source_ratio > target_ratio:
        new_width = int(image.height * target_ratio)
        left = (image.width - new_width) // 2
        image = image.crop((left, 0, left + new_width, image.height))
    else:
        new_height = int(image.width / target_ratio)
        top = max(0, int((image.height - new_height) * 0.30))
        image = image.crop((0, top, image.width, top + new_height))
    return image.resize(size, Image.Resampling.LANCZOS)


# Logo principal
logo = Image.open(SRC / "logo.webp").convert("RGBA")
logo.thumbnail((512, 512), Image.Resampling.LANCZOS)
logo.save(OUT_LOGO / "1460-logo.webp", "WEBP", quality=92, method=6)
logo.save(OUT_LOGO / "1460-logo.png", "PNG", optimize=True)

# Fotos de producto
product_map = {
    "extra-muzza.webp": "muzzarela1",
    "muzzarella.webp": "muzzarela1",
    "provenzal.webp": "pizzas",
    "calabresa.webp": "Pizza Turca 🍅🧄 LPH (Lista Para Hornear)",
    "turca.webp": "Pizza Turca 🍅🧄 LPH (Lista Para Hornear)",
    "huevo.webp": "Pizza Huevo 🥚 LPH (Lista Para Hornear)",
    "cheddar.webp": "Pizza Huevo 🥚 LPH (Lista Para Hornear) 2",
    "especial-jamon.webp": "especialJamon",
    "4-quesos.webp": "4quesos",
    "roquefort-nueces.webp": "Preparado1",
    "fugazza-especial.webp": "pizzas",
    "fugazzetta-caramelizada.webp": "Preparado1",
    "combo-muzzarella.webp": "4quesos",
    "combo-clasicas.webp": "pizzas",
    "pizza-party.webp": "recuaddafondos2",
}

for output_name, source_name in product_map.items():
    source = PRODUCTOS_SRC / source_name
    image = square_crop(source)
    image = ImageEnhance.Color(image).enhance(1.04)
    image.save(OUT_PRODUCTOS / output_name, "WEBP", quality=82, method=6)

# Banners de portada
banner_map = {
    "banner-lph.webp": "4quesos",
    "banner-pizza-party.webp": "Preparado1",
    "banner-clasicas.webp": "pizzas",
}

for output_name, source_name in banner_map.items():
    source = PRODUCTOS_SRC / source_name
    image = wide_crop(source)
    image = ImageEnhance.Contrast(image).enhance(1.06)
    image = ImageEnhance.Color(image).enhance(1.05)
    image.save(OUT_BANNERS / output_name, "WEBP", quality=84, method=6)

print("Assets generados correctamente.")
