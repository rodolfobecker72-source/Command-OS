import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { APP_PAGES } from "@/config/pages";

const Index = () => {
  const { hasPageAccess } = useAuth();
  
  // Redirect to the first accessible page
  const firstAccessible = APP_PAGES.find(p => hasPageAccess(p.key));
  const target = firstAccessible?.href || "/clientes";
  
  return <Navigate to={target} replace />;
};

export default Index;
