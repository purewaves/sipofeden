# Sip of Eden - Premium Juice E-commerce Platform

![Sip of Eden](https://i.imgur.com/OPnLcDQ.png)

A modern, full-stack e-commerce platform for a premium juice company, featuring responsive design, secure checkout, and admin dashboard.

## 🌟 Features

- **Responsive E-commerce Functionality**: Mobile-friendly shopping experience with product filtering and sorting
- **Secure Checkout Process**: Streamlined cart and checkout flow
- **Admin Dashboard**: Sales analytics, inventory management, and order processing
- **PWA Support**: Progressive Web App capabilities for mobile installation
- **SEO Optimized**: Structured data and optimized meta tags for better search engine visibility
- **Modern UI/UX**: Built with Tailwind CSS and Shadcn components

## 🔧 Tech Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn UI** components
- **Wouter** for routing
- **React Query** for data fetching
- **Zod** for validation

### Backend
- **Node.js** and Express
- **PostgreSQL** (Neon) for database
- **Drizzle ORM** for database operations
- **Session-based authentication**
- **RESTful API architecture**

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (or a Neon account)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/sipofeden.git
cd sipofeden
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory and add:
```
DATABASE_URL=postgresql://neondb_owner:password@ep-falling-lab-pooler.neon.tech/sipofeden?sslmode=require
SESSION_SECRET=your_session_secret
NODE_ENV=development
PORT=5000
```

4. Run database migrations
```bash
npm run db:push
```

5. Start the development server
```bash
npm run dev
```

## 📦 Project Structure

```
├── client/src        # Frontend React application
│   ├── components    # Reusable React components
│   ├── hooks         # Custom React hooks
│   ├── lib           # Utility functions and services
│   ├── pages         # Page components
│   └── ...
├── public            # Static assets
├── server            # Backend Express application
│   ├── migrations    # Database migration scripts
│   └── ...
├── shared            # Shared code between frontend and backend
│   └── schema.ts     # Database schema with Drizzle and Zod
└── ...
```

## 🔄 API Endpoints

### Products
- `GET /api/juices` - Get all juices
- `GET /api/juices/:id` - Get juice by ID
- `GET /api/juices/featured` - Get featured juices

### Cart
- `GET /api/cart/:sessionId` - Get cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart/clear/:sessionId` - Clear cart

### Orders
- `POST /api/orders` - Create an order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/status` - Update order status

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/profile` - Get admin profile
- `PUT /api/admin/profile` - Update admin profile
- `PUT /api/admin/password` - Update admin password

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Shadcn UI](https://ui.shadcn.com/) for components
- [Neon Database](https://neon.tech/) for serverless PostgreSQL
- [Vercel](https://vercel.com/) for deployment

## 📧 Contact

For questions or support, please email contact@sipofeden.com or open an issue on GitHub. 