import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import InputBarang from "./pages/InputBarang";
import ImportData from "./pages/ImportData"; // Pastikan import ini ada
import Layout from "./components/Layout";

function App() {
  return (
    <BrowserRouter>
      {/* Layout MEMBUNGKUS Routes, bukan sebaliknya */}
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/input" element={<InputBarang />} />
          <Route path="/import" element={<ImportData />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;