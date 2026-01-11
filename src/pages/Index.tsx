import { TravelSidebar } from "@/components/TravelSidebar";
import { MainContent } from "@/components/MainContent";

const Index = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <MainContent />
      <TravelSidebar />
    </div>
  );
};

export default Index;
