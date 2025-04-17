import Hero from "@/components/Hero";
import FeaturedJuices from "@/components/FeaturedJuices";
import Benefits from "@/components/Benefits";
import SubscriptionForm from "@/components/SubscriptionForm";
import Ingredients from "@/components/Ingredients";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import JuiceCategories from "@/components/JuiceCategories";

const Home = () => {
  return (
    <div>
      <Hero />
      <FeaturedJuices />
      <JuiceCategories />
      <Benefits />
      <SubscriptionForm />
      <Ingredients />
      <Testimonials />
      <Newsletter />
    </div>
  );
};

export default Home;
