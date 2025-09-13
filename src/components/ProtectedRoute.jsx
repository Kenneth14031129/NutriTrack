import { Navigate } from "react-router-dom";
import apiService from "../services/api";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = apiService.isAuthenticated();

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;