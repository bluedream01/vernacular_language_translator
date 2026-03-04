from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate


LANG_MAP = {
    "bn": sanscript.BENGALI,
    "hi": sanscript.DEVANAGARI,
    "bho": sanscript.DEVANAGARI,  
    "mr": sanscript.DEVANAGARI,    
    "ta": sanscript.TAMIL,
    "te": sanscript.TELUGU,
    "ml": sanscript.MALAYALAM,
    "kn": sanscript.KANNADA,
    "gu": sanscript.GUJARATI,
    "or": sanscript.ORIYA,
}


def romanize_text(text: str, lang: str) -> str:
    if lang not in LANG_MAP:
        return text
    return transliterate(text, LANG_MAP[lang], sanscript.ITRANS)
