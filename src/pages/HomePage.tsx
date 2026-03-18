import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, Upload, Sparkles } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            backgroundImage: "var(--gradient-hero)",
          }}
        />
        
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center animate-fade-in">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Analytics</span>
            </div>

            {/* Main Heading */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              AI-Powered Smart Dashboard Generator
            </h1>

            {/* Subtitle */}
            <p className="mb-10 text-lg text-muted-foreground sm:text-xl md:text-2xl">
              Upload your dataset → Auto Clean → Visualize Instantly
            </p>

            {/* CTA Button */}
            <Button
              onClick={() => navigate("/upload")}
              size="lg"
              className="group h-14 gap-2 bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary-dark hover:shadow-xl"
            >
              <Upload className="h-5 w-5 transition-transform group-hover:-translate-y-1" />
              Upload Dataset
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-3 animate-slide-up">
            <FeatureCard
              icon={<Upload className="h-6 w-6" />}
              title="Easy Upload"
              description="Support for CSV, XLSX, and JSON file formats"
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Auto Cleaning"
              description="AI automatically cleans and prepares your data"
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Instant Visualization"
              description="Beautiful dashboards powered by Tableau"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 shadow-md transition-all hover:scale-105 hover:shadow-xl">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-card-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default HomePage;
