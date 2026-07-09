import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header.jsx';
import Footer from '../../components/layout/Footer.jsx';
import ClassCard from '../../components/class/ClassCard.jsx';
import Button from '../../components/common/Button.jsx';
import { experienceApi } from '../../api/experienceApi.js';
import { broadcastInvalidateQueries } from '../../api/broadcastQueryClient.js';
import { queryKeys } from '../../api/queryKeys.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

export default function SavedClassesPage() {
    const { t } = useI18n();
    const navigate = useNavigate();
    const client = useQueryClient();

    const bookmarks = useQuery({
        queryKey: queryKeys.bookmarks,
        queryFn: experienceApi.getBookmarks,
    });

    const waitlist = useQuery({
        queryKey: queryKeys.waitlist,
        queryFn: experienceApi.getWaitlist,
    });

    const removeBookmark = useMutation({
        mutationFn: experienceApi.toggleBookmark,
        onSuccess: () => {
            client.invalidateQueries({ queryKey: queryKeys.bookmarks });
            broadcastInvalidateQueries(queryKeys.bookmarks);
        },
    });

    const leaveWaitlist = useMutation({
        mutationFn: experienceApi.leaveWaitlist,
        onSuccess: () => {
            client.invalidateQueries({ queryKey: queryKeys.waitlist });
            broadcastInvalidateQueries(queryKeys.waitlist);
            toast.success(t('myClasses.leftWaitlist'));
        },
    });

    const sections = [
        {
            title: t('myClasses.favoritesTab'),
            empty: t('myClasses.noFavorites'),
            items: bookmarks.data?.data?.bookmarks || [],
            action: (id) => removeBookmark.mutate(id),
            label: t('myClasses.removeFavorite'),
        },
        {
            title: t('myClasses.waitlistTab'),
            empty: t('myClasses.noWaitlist'),
            items: waitlist.data?.data?.entries || [],
            action: (id) => leaveWaitlist.mutate(id),
            label: t('myClasses.leaveWaitlist'),
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-surface">
            <Header />
            <main className="mx-auto w-full max-w-container-max flex-grow space-y-xl px-lg py-xl">
                <h1 className="text-headline-lg font-bold">{t('myClasses.savedTitle')}</h1>
                {sections.map((section) => (
                    <section key={section.title}>
                        <h2 className="mb-md text-title-lg font-bold">{section.title}</h2>
                        {section.items.length === 0 ? (
                            <p className="rounded-xl border bg-white p-lg text-on-surface-variant">
                                {section.empty}
                            </p>
                        ) : (
                            <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
                                {section.items.map((entry) => {
                                    const item = entry.class;
                                    if (!item) return null;
                                    return (
                                        <ClassCard
                                            key={entry._id}
                                            item={item}
                                            actionSlot={
                                                <div className="flex gap-sm">
                                                    <Button
                                                        className="flex-1"
                                                        onClick={() =>
                                                            navigate(`/classes/${item._id}`)
                                                        }
                                                    >
                                                        {t('common.viewDetails')}
                                                    </Button>
                                                    <Button
                                                        className="flex-1"
                                                        onClick={() =>
                                                            section.action(item._id)
                                                        }
                                                    >
                                                        {section.label}
                                                    </Button>
                                                </div>
                                            }
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </section>
                ))}
            </main>
            <Footer />
        </div>
    );
}
