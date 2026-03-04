from indicnlp.normalize.indic_normalize import IndicNormalizerFactory

def normalize_script(text: str, lang: str) -> str:
    factory = IndicNormalizerFactory()
    normalizer = factory.get_normalizer(lang)
    return normalizer.normalize(text)