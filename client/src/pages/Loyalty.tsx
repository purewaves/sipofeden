import { Helmet } from 'react-helmet';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import LoyaltyDashboard from '../components/loyalty/LoyaltyDashboard';

const Loyalty = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Loyalty Program | Sip of Eden</title>
        <meta name="description" content="Join the Sip of Eden loyalty program and earn rewards with every purchase." />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow bg-gradient-to-b from-orange-50 to-white">
        <LoyaltyDashboard />
      </main>
      
      <Footer />
    </div>
  );
};

export default Loyalty;