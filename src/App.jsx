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
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import apiService from "./services/api";

function App() {
  const isAuthenticated = apiService.isAuthenticated();

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Main Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/homepage"
            element={
              <ProtectedRoute>
                <Homepage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-coach"
            element={
              <ProtectedRoute>
                <Coach />
              </ProtectedRoute>
            }
          />

          <Route
            path="/meal-planner"
            element={
              <ProtectedRoute>
                <MealPlanner />
              </ProtectedRoute>
            }
          />

          <Route
            path="/scanner"
            element={
              <ProtectedRoute>
                <Scanner />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Default route - redirect based on authentication */}
          <Route
            path="/"
            element={
              isAuthenticated ?
                <Navigate to="/homepage" replace /> :
                <Navigate to="/login" replace />
            }
          />

          {/* Catch all unknown routes - redirect based on authentication */}
          <Route
            path="*"
            element={
              isAuthenticated ?
                <Navigate to="/homepage" replace /> :
                <Navigate to="/login" replace />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
