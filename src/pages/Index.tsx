import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    window.location.replace("/");
  }, []);
  return null;
};

export default Index;
