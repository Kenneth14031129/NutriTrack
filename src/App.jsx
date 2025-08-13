import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import FoodSearch from "./pages/FoodSearch/FoodSearch";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Main Login Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/food-search" element={<FoodSearch />} />

          {/* Default route redirects to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Catch all unknown routes and redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
