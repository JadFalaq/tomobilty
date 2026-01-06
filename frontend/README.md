# Tomobila - Premium Car Rental Website

A modern, premium car rental website built with React, Framer Motion, and TailwindCSS.

## Features

- **Home Page**: Hero section with search functionality, category selection, featured cars, and promotions
- **Cars Catalog**: Browse and filter cars by category, transmission, price, seats, and fuel type
- **Reservations**: View and manage your bookings
- **Authentication**: Login and registration modals
- **Responsive Design**: Fully responsive with modern UI/UX

## Tech Stack

- React 18
- Vite (Build tool)
- Framer Motion (Animations)
- TailwindCSS (Styling)
- Lucide React (Icons)

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

Run the development server:
```bash
npm run dev
```

The website will open automatically at `http://localhost:3000`

### Build

Create a production build:
```bash
npm run build
```

### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

## Project Structure

```
tomobila/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles with TailwindCSS
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # TailwindCSS configuration
└── postcss.config.js    # PostCSS configuration
```

## Features Overview

### Home Page
- Hero section with animated text
- Search bar for car rental
- Category selection (Sport, SUV, Luxe, Urbaine)
- Featured cars showcase
- Promotional offers
- Loyalty program section

### Cars Page
- Category-based filtering
- Advanced filters (price, transmission, seats, fuel type)
- Car availability checking
- Booking modal with date selection

### Bookings Page
- View all reservations
- Booking status tracking
- Invoice download
- Support access

## Design System

- **Primary Color**: #ff003c (Red)
- **Background**: #000000 (Black)
- **Glass Effect**: Backdrop blur with transparency
- **Typography**: Bold, italic, uppercase styling
- **Animations**: Smooth transitions with Framer Motion

## Notes

This is a frontend-only implementation. For production use, you'll need to:
- Connect to a backend API
- Implement real authentication
- Add payment gateway integration
- Set up database for cars, bookings, and users
- Add proper form validation
- Implement real-time availability checking

## License

Private project for Tomobila
