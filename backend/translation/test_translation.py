import sys
import os

# --------------------------------------------------
# Ensure project root is on Python path
# --------------------------------------------------
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from translation.translator import translate_english
from translation.languages import LANGUAGE_NAMES

# --------------------------------------------------
# Test sentence
# --------------------------------------------------
text = "How are you? I am fine."

print("\n================ TRANSLATION TEST ================\n")
print("ENGLISH :", text)
print("-" * 50)

# --------------------------------------------------
# Languages to test
# --------------------------------------------------
test_languages = ["bn", "hi", "ta"]

for lang in test_languages:
    translated = translate_english(text, lang)
    print(f"{LANGUAGE_NAMES[lang].upper():8} :", translated)

print("\n=================================================\n")
