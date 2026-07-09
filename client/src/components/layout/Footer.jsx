import { useI18n } from "../../i18n/I18nProvider.jsx";

export default function Footer() {
    const { t } = useI18n();

    return (
        <footer className="bg-background border-t border-outline-variant/30">
            <div className="w-full py-xl px-lg flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto gap-lg">
                <div className="flex flex-col items-center md:items-start gap-sm">
                    <span className="text-title-md font-bold text-primary">SmashCourts</span>
                    <p className="text-label-sm text-on-surface-variant text-center md:text-left">{t("footer.copyright")}</p>
                </div>
                <div className="flex gap-xl">
                    <a className="text-label-sm text-on-surface-variant hover:text-primary" href="#">{t("footer.privacy")}</a>
                    <a className="text-label-sm text-on-surface-variant hover:text-primary" href="#">{t("footer.terms")}</a>
                    <a className="text-label-sm text-on-surface-variant hover:text-primary" href="#">{t("footer.support")}</a>
                </div>
            </div>
        </footer>
    );
}
