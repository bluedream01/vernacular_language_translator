import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from indicnlp.transliterate.unicode_transliterate import UnicodeIndicTransliterator

from translation.languages import INDICTRANS_LANG_MAP, SUPPORTED_LANG_CODES

MODEL_NAME = "ai4bharat/indictrans2-en-indic-dist-200M"

print("[INFO] Loading IndicTrans2 model... This may take time on first run.")

# ----------------------------
# Load tokenizer & model
# ----------------------------
tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)

model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True,
    torch_dtype=torch.float32
)

model.eval()


def translate_english(text: str, target_lang: str) -> str:
    """
    Translate English text into an Indian language (native script)
    """

    if target_lang not in SUPPORTED_LANG_CODES:
        raise ValueError(f"Unsupported language code: {target_lang}")

    # Source and target tags
    src_tag = INDICTRANS_LANG_MAP["en"]
    tgt_tag = INDICTRANS_LANG_MAP[target_lang]

    # Format input for IndicTrans2
    input_text = f"{src_tag} {tgt_tag} {text}"

    inputs = tokenizer(
        input_text,
        return_tensors="pt",
        truncation=True,
        max_length=1024
    )

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=1024,
            num_beams=1,
            do_sample=False,
            use_cache=False
        )

    decoded = tokenizer.decode(
        outputs[0],
        skip_special_tokens=True,
        clean_up_tokenization_spaces=True
    ).strip()



    if target_lang == "bn":
        decoded = UnicodeIndicTransliterator.transliterate(
            decoded,
            "hi",   
            "bn"    
        )
    if target_lang == "ta":
        decoded = UnicodeIndicTransliterator.transliterate(
            decoded,
            "hi",   
            "ta"   
        )
    if target_lang == "te":
        decoded = UnicodeIndicTransliterator.transliterate(
            decoded,
            "hi",   
            "te"   
        )
    if target_lang == "mr":
        decoded = UnicodeIndicTransliterator.transliterate(
            decoded,
            "hi",   
            "mr"   
        )

    return decoded