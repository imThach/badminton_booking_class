import { useRef, useState } from 'react';
import { BookOpen, CalendarDays, ImagePlus, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../common/Button.jsx';
import { coachesApi } from '../../api/coachesApi.js';
import { useI18n } from '../../i18n/I18nProvider.jsx';

const emptyForm = { name: '', photo: '', bio: '', isActive: true };

export default function CoachManagement({ coaches, isLoading, onSave, onDelete, isSaving }) {
    const { language, t } = useI18n();
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const photoInputRef = useRef(null);

    const open = (coach = null) => {
        setEditing(coach || {});
        setForm(coach ? { name: coach.name || '', photo: coach.photo || '', bio: coach.bio || '', isActive: coach.isActive !== false } : emptyForm);
    };

    const close = () => { setEditing(null); setForm(emptyForm); };

    const uploadPhoto = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast.error(t('coach.photoType'));
        if (file.size > 3 * 1024 * 1024) return toast.error(t('coach.photoSize'));
        setIsUploadingPhoto(true);
        try {
            const response = await coachesApi.uploadPhoto(file);
            setForm((current) => ({ ...current, photo: response.data.photo }));
            toast.success(t('coach.photoUploaded'));
        } catch (error) {
            toast.error(error.response?.data?.message || t('coach.photoUploadError'));
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const submit = async (event) => {
        event.preventDefault();
        const name = form.name.trim();
        if (name.length < 2 || name.length > 100) return toast.error(t('coach.nameInvalid'));
        if (form.bio.trim().length > 2000) return toast.error(t('coach.bioInvalid'));
        await onSave(editing?._id, { ...form, name, photo: form.photo.trim(), bio: form.bio.trim() });
        close();
    };

    const inputClass = 'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-on-surface outline-none focus:border-primary';
    const formatDate = value => value ? new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium' }).format(new Date(value)) : '-';

    if (isLoading) return <p className="p-lg text-on-surface-variant">{t('coach.loading')}</p>;

    return <div className="space-y-lg">
        <div className="flex justify-end"><Button className="min-h-11 px-md py-md text-body-md" onClick={() => open()}><Plus size={18} /> {t('coach.add')}</Button></div>
        {coaches.length === 0 ? <div className="rounded-xl border border-dashed border-outline-variant p-xl text-center text-on-surface-variant">{t('coach.empty')}</div> :
            <div className="grid gap-lg md:grid-cols-2 xl:grid-cols-3">{coaches.map((coach) => {
                const assignedClasses = coach.assignedClasses || [];
                const classCount = assignedClasses.length;
                return <article key={coach._id} className="group overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="relative h-24 bg-gradient-to-br from-primary via-primary/90 to-primary-container">
                        <div className="absolute right-md top-md flex gap-xs">
                            <button aria-label={t('coach.editAria', { name: coach.name })} className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-on-surface shadow-sm transition hover:bg-white hover:text-primary" onClick={() => open(coach)} type="button"><Pencil size={16} /></button>
                            <button aria-label={t('coach.deleteAria', { name: coach.name })} className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-on-surface-variant shadow-sm transition hover:bg-error-container hover:text-error" onClick={() => onDelete(coach)} type="button"><Trash2 size={16} /></button>
                        </div>
                    </div>
                    <div className="relative px-lg pb-lg">
                        <div className="-mt-11 mb-md flex items-end justify-between gap-md">
                            {coach.photo ? <img src={coach.photo} alt={coach.name} className="h-24 w-24 rounded-2xl border-4 border-surface-container-lowest object-cover shadow-md" /> : <div className="grid h-24 w-24 rounded-2xl border-4 border-surface-container-lowest bg-primary-container text-headline-lg font-bold text-on-primary-container shadow-md">{coach.name?.charAt(0)?.toUpperCase()}</div>}
                            <span className={`${coach.isActive ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'} mb-xs inline-flex items-center gap-xs rounded-full px-sm py-xs text-label-xs font-bold`}><span className={`${coach.isActive ? 'bg-primary' : 'bg-outline'} h-2 w-2 rounded-full`} />{coach.isActive ? t('coach.active') : t('coach.inactive')}</span>
                        </div>

                        <h3 className="text-title-lg font-bold text-on-surface">{coach.name}</h3>
                        <p className="mt-xs min-h-10 line-clamp-2 text-body-sm leading-relaxed text-on-surface-variant">{coach.bio || t('coach.noBio')}</p>

                        <div className="mt-md rounded-xl bg-surface-container-low p-md">
                            <div className="mb-sm flex items-center justify-between"><span className="flex items-center gap-xs text-label-sm font-semibold text-on-surface"><BookOpen size={16} className="text-primary" />{t('coach.workload')}</span><strong className={classCount >= 2 ? 'text-error' : 'text-primary'}>{classCount}/2</strong></div>
                            <div className="h-2 overflow-hidden rounded-full bg-surface-container-high"><div className={`${classCount >= 2 ? 'bg-error' : 'bg-primary'} h-full rounded-full transition-all`} style={{ width: `${Math.min(classCount / 2 * 100, 100)}%` }} /></div>
                        </div>

                        <div className="mt-md space-y-sm">
                            {assignedClasses.map(item => <div className="rounded-xl border border-outline-variant/70 p-sm" key={item._id}>
                                <p className="truncate text-label-sm font-bold text-on-surface">{item.title}</p>
                                <p className="mt-xs flex items-start gap-xs text-label-xs text-on-surface-variant"><CalendarDays size={14} className="mt-0.5 shrink-0 text-primary" /><span>{formatDate(item.startDate)} - {formatDate(item.endDate)}</span></p>
                                <p className="mt-xs truncate text-label-xs text-on-surface-variant">{item.schedule}</p>
                            </div>)}
                            {!assignedClasses.length && <div className="rounded-xl border border-dashed border-outline-variant p-md text-center text-label-sm text-on-surface-variant">{t('coach.noActiveClasses')}</div>}
                        </div>
                    </div>
                </article>;
            })}</div>}
        {editing && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-on-surface/40 px-md py-lg backdrop-blur-sm"><form onSubmit={submit} className="mx-auto w-full max-w-[640px] flex-none space-y-md rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-xl sm:p-xl">
            <div className="flex items-center justify-between"><h2 className="text-headline-md font-semibold text-on-surface">{editing._id ? t('coach.edit') : t('coach.add')}</h2><button type="button" onClick={close}><X className="text-on-surface-variant" /></button></div>
            <input className={inputClass} minLength="2" maxLength="100" required placeholder={t('coach.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div>
                <input ref={photoInputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} />
                <button type="button" disabled={isUploadingPhoto} onClick={() => photoInputRef.current?.click()} className="flex w-full items-center gap-md rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-md text-left transition-colors hover:border-primary disabled:cursor-wait">
                    {form.photo ? <img src={form.photo} alt={t('coach.previewAlt')} className="h-20 w-20 shrink-0 rounded-lg object-cover" /> : <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><ImagePlus size={28} /></span>}
                    <span className="min-w-0 text-on-surface"><span className="flex items-center gap-xs font-semibold">{isUploadingPhoto && <Loader2 size={17} className="animate-spin" />}{isUploadingPhoto ? t('coach.uploadingPhoto') : form.photo ? t('coach.changePhoto') : t('coach.uploadPhoto')}</span><span className="mt-xs block text-body-sm text-on-surface-variant">{t('coach.photoHint')}</span></span>
                </button>
            </div>
            <textarea className={`${inputClass} min-h-28`} maxLength="2000" placeholder={t('coach.bio')} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            <label className="flex items-center gap-sm text-on-surface"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> {t('coach.active')}</label>
            <div className="flex justify-end gap-sm"><Button type="button" variant="secondary" disabled={isUploadingPhoto} onClick={close}>{t('common.cancel')}</Button><Button disabled={isSaving || isUploadingPhoto} type="submit">{isSaving ? t('common.saving') : t('coach.save')}</Button></div>
        </form></div>}
    </div>;
}
