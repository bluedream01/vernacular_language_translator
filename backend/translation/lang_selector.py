from translation.languages import LANGUAGE_NAMES


def choose_language():
    print("\nChoose target language:\n")

    lang_codes = list(LANGUAGE_NAMES.keys())

    for idx, code in enumerate(lang_codes, start=1):
        print(f"{idx}. {LANGUAGE_NAMES[code]}")

    while True:
        try:
            choice = int(input("\nEnter choice number: ").strip())
            if 1 <= choice <= len(lang_codes):
                return lang_codes[choice - 1]
            else:
                print("❌ Invalid choice. Try again.")
        except ValueError:
            print("❌ Please enter a valid number.")