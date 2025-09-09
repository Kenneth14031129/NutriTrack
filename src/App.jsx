import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Coach from "./pages/Coach";
import MealPlanner from "./pages/MealPlanner";
import Scanner from "./pages/Scanner";
import Homepage from "./pages/Homepage";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Main Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Homepage Route */}
          <Route path="/homepage" element={<Homepage />} />

          {/* AI Coach Route */}
          <Route path="/ai-coach" element={<Coach />} />

          {/* Meal Planner Route */}
          <Route path="/meal-planner" element={<MealPlanner />} />

          {/* Scanner Route */}
          <Route path="/scanner" element={<Scanner />} />

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
