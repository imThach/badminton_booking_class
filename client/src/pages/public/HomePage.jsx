import Header from "../../components/layout/header.jsx";
import Footer from "../../components/layout/footer.jsx";
import ClassListPage from "./ClassListPage.jsx";

export default function HomePage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Thanh điều hướng */}
            <Header />
            <main className="flex-grow">
                <ClassListPage />
            </main>

            {/* Chân trang */}
            <Footer />
        </div>
    );
}