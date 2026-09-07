import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Files from "./pages/Files";
import Items from "./pages/Items";

export default function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/items" element={<Items />} />
                <Route path="/files" element={<Files />} />
            </Routes>
        </Layout>
    );
}
