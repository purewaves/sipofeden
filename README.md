# Sip of Eden - Juice Bar Management System

A modern web application for managing a juice bar business, featuring an admin dashboard, inventory management, and customer loyalty system.

## Features

- 🍹 Juice Management
  - Add, edit, and delete juice items
  - Image upload and storage
  - Featured items highlighting
  - Inventory tracking

- 👨‍💼 Admin Dashboard
  - Secure authentication
  - Real-time statistics
  - Order management
  - Customer insights

- 💳 Payment Integration
  - Stripe payment processing
  - Secure checkout
  - Order history

- 🎯 Loyalty Program
  - Customer points system
  - Rewards management
  - Activity tracking

- 📱 Progressive Web App
  - Offline capabilities
  - Push notifications
  - Mobile-friendly design

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express
- Database: MySQL
- Authentication: Session-based
- File Storage: Cloudinary
- Payments: Stripe
- AI Integration: OpenAI, Anthropic

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/purewaves/sipofeden.git
   cd sipofeden
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration values.

4. Set up the database:
   ```bash
   npm run migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## Environment Variables

See `.env.example` for all required environment variables and their descriptions.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- All sensitive data is stored in environment variables
- API keys and secrets are never committed to the repository
- Session management with secure cookies
- Input validation and sanitization
- Regular security updates

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@sipofeden.com or open an issue in the repository. 