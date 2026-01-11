import { TravelSidebar } from "@/components/TravelSidebar";
import { MainContent } from "@/components/MainContent";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <TravelSidebar />
      <MainContent />
    </div>
  );
};

export default Index;
