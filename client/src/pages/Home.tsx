import Hero from "@/components/Hero";
import FeaturedJuices from "@/components/FeaturedJuices";
import Benefits from "@/components/Benefits";
import SubscriptionForm from "@/components/SubscriptionForm";
import JuiceCategories from "@/components/JuiceCategories";

const Home = () => {
  return (
    <div>
      <Hero />
      <FeaturedJuices />
      <JuiceCategories />
      <Benefits />
      <SubscriptionForm />
    </div>
  );
};

export default Home;
