import Header from "../../components/layout/header.jsx";
import Footer from "../../components/layout/footer.jsx";
import { useAuth } from "../../auth/AuthProvider.jsx";

export default function MyClassesPage() {
    const { user } = useAuth();

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-grow px-lg py-xl">
                <section className="mx-auto max-w-container-max rounded-xl border border-outline-variant bg-surface-container-lowest p-xl shadow-sm">
                    <p className="mb-sm text-label-sm font-semibold uppercase tracking-[0.14em] text-primary">
                        My classes
                    </p>
                    <h1 className="mb-sm text-headline-lg font-semibold text-on-surface">
                        Welcome{user?.name ? `, ${user.name}` : ""}
                    </h1>
                    <p className="text-body-md text-on-surface-variant">
                        Your enrolled badminton classes will appear here.
                    </p>
                </section>
            </main>
            <Footer />
        </div>
    );
}
