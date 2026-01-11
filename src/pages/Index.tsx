import { TravelSidebar } from "@/components/TravelSidebar";
import { MainContent } from "@/components/MainContent";
import { useGenerateItinerary } from "@/hooks/useGenerateItinerary";

const Index = () => {
  const { generateItinerary, isLoading, error, itinerary, resetItinerary } = useGenerateItinerary();

  return (
    <div className="flex min-h-screen bg-background">
      <MainContent 
        itinerary={itinerary} 
        isLoading={isLoading} 
        error={error}
        onReset={resetItinerary}
      />
      <TravelSidebar 
        onGenerate={generateItinerary} 
        isLoading={isLoading} 
      />
    </div>
  );
};

export default Index;
