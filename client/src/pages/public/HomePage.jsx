import Header from "../../components/layout/Header.jsx";
import Footer from "../../components/layout/Footer.jsx";
import ClassListPage from "./ClassListPage.jsx";

export default function HomePage() {
    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Header />
            <main className="flex-grow">
                <ClassListPage />
            </main>

            <Footer />
        </div>
    );
}
