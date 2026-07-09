import { useI18n } from "../../i18n/I18nProvider.jsx";

export default function LanguageSwitcher() {
    const { language, setLanguage, t } = useI18n();

    return (
        <div className="inline-flex h-9 items-center rounded-lg border border-outline-variant bg-surface-container-lowest p-0.5" aria-label="Language">
            {[
                { code: "en", label: "EN", title: t("language.english") },
                { code: "vi", label: "VI", title: t("language.vietnamese") },
            ].map(({ code, label, title }) => (
                <button
                    aria-pressed={language === code}
                    className={`h-7 min-h-0 rounded-md px-sm text-label-xs font-bold transition-colors ${language === code
                        ? "bg-primary text-on-primary"
                        : "bg-transparent text-on-surface-variant hover:text-on-surface"
                    }`}
                    key={code}
                    onClick={() => setLanguage(code)}
                    title={title}
                    type="button"
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
