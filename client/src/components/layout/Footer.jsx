import { useI18n } from "../../i18n/I18nProvider.jsx";
import { Globe, Mail, Share2 } from "lucide-react";

export default function Footer() {
    const { t } = useI18n();

    return (
        <footer className="w-full mt-xl bg-surface-container pt-xl">
            <div className="max-w-container-max mx-auto mb-lg px-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
                <div className="lg:col-span-1">
                    <span className="text-headline-md font-black text-primary mb-4 block">
                        SmashCourts
                    </span>
                    <div className="flex gap-4 mt-6">
                        <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">
                            <Globe size={20} />
                        </a>
                        <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">
                            <Mail size={20} />
                        </a>
                        <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">
                            <Share2 size={20} />
                        </a>
                    </div>
                </div>

                <div>
                    <h4 className="text-primary font-bold text-title-sm mb-4">
                        {t('footer.quickLinks')}
                    </h4>
                    <div className="flex flex-col gap-2">
                        {[
                            { key: 'footer.privacy', label: t('footer.privacy') },
                            { key: 'footer.terms', label: t('footer.terms') },
                            { key: 'footer.faqs', label: t('footer.faqs') },
                            { key: 'footer.memberPortal', label: t('footer.memberPortal') }
                        ].map((link) => (
                            <a key={link.key} className="text-on-surface-variant text-body-md hover:text-primary transition-colors" href="#">
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-primary font-bold text-title-sm mb-4">
                        {t('footer.company')}
                    </h4>
                    <div className="flex flex-col gap-2">
                        {[
                            { key: 'footer.contact', label: t('footer.contact') },
                            { key: 'footer.careers', label: t('footer.careers') },
                            { key: 'footer.ourStory', label: t('footer.ourStory') },
                            { key: 'footer.sponsorships', label: t('footer.sponsorships') }
                        ].map((link) => (
                            <a key={link.key} className="text-on-surface-variant text-body-md hover:text-primary transition-colors" href="#">
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-primary font-bold text-title-sm mb-4">
                        {t('footer.newsletter')}
                    </h4>
                    <p className="text-on-surface-variant text-body-md mb-4">
                        {t('footer.newsletterPrompt')}
                    </p>
                    <form className="flex flex-col gap-2">
                        <input
                            className="bg-surface-container border border-outline-variant rounded-lg px-4 py-2 text-on-surface text-body-md focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant"
                            placeholder={t('footer.emailPlaceholder')}
                            type="email"
                        />
                        <button className="bg-primary text-on-primary font-bold py-2 rounded-lg hover:opacity-90 transition-all">
                            {t('footer.subscribe')}
                        </button>
                    </form>
                </div>
            </div>

            <div className="max-w-container-max mx-auto px-lg py-6 border-t border-outline-variant/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-on-surface-variant text-body-sm text-center md:text-left">
                    {t("footer.copyright")}
                </p>
            </div>
        </footer>
    );
}
