import { useLocation, useNavigate } from "react-router-dom";

export function useActivePath() {
  const location = useLocation();
  return location.pathname;
}

export function useGo() {
  const navigate = useNavigate();
  return (path) => navigate(path);
}
