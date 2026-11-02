"""Convert the raw shop status photos (assets/raw/Statuses) into web-ready
product images in public/products. Mapping is by filename prefix."""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets/raw/Statuses"
OUT = ROOT / "public/products"

MAP = {
    "046c101d": "torch-652c", "175a17c1": "torch-1056s", "18483dca": "ext-6way",
    "212faacc": "torch-th5155", "21478693": "soldering-iron-60w", "32684818": "speaker-phone-stand",
    "337c613c": "torch-metal-classic", "3983a21e": "bulb-avc", "3b27bdba": "speaker-ln726bt",
    "3eac483b": "speaker-caston-sth10", "552054a0": "mic-bnk-b1", "57db488d": "radio-sonitec-st5400",
    "61183b13": "cam-panoramic-bulb", "651d64bc": "speaker-ln-f15", "6cb9c900": "gotv-gotenna",
    "6db65ba9": "mini-fan", "750f3423": "plug-h13a", "7efb4d8e": "cooker-coil",
    "8105525d": "voltage-tester", "87e42c5d": "voltage-tester", "826b0010": "gas-regulator",
    "865c3144": "cable-twin-earth", "87dff358": "headphones-oraimo", "91275991": "torch-jc7125",
    "9acb26f5": "pliers-aweisi-8", "9c020465": "mount-sh45f", "a08b4b3d": "plug-881",
    "a41cf771": "speaker-solar-oval", "a6cb26a0": "tape-packing", "abe2bc3a": "radio-solar-torch",
    "ac5792fb": "bulb-dplight-rgb", "e363ae68": "bulb-dplight-rgb", "ac8b7074": "mount-sh20t",
    "affb316e": "stove-ailyons-gso14", "b17b70d2": "speaker-ln716bt", "b50b83b6": "ext-jsb-4way",
    "bde96e30": "cam-narobstar-ptz", "d53af6bb": "cob-unit", "e5f466e0": "cob-unit",
    "d5a9cd05": "lamp-solar-shell", "d5d60ee7": "mic-foam", "d8a7e2c7": "torch-288",
    "d8b4197a": "speaker-ln1036bt", "dadb266e": "radio-ns1587bt", "db6aef5f": "cable-speaker",
    "db974094": "ext-babastra-4way", "e522faaf": "bulb-rechargeable-40w", "eb9b56df": "torch-721",
    "f0d2673e": "plug-travel", "f4720744": "kettle-ailyons", "faad9d8a": "ceiling-light-led",
}

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    counts: dict[str, int] = {}
    for f in sorted(RAW.glob("*.jpg")):
        pid = MAP.get(f.name[:8])
        if not pid:
            print("unmapped", f.name); continue
        counts[pid] = counts.get(pid, 0) + 1
        im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
        im.thumbnail((1000, 1000), Image.LANCZOS)
        im.save(OUT / f"{pid}-{counts[pid]}.webp", "WEBP", quality=78, method=6)
    print(len(counts), "products,", sum(counts.values()), "images")

if __name__ == "__main__":
    main()
