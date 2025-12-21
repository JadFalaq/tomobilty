// Service de données mock pour tester sans base de données
const mockUsers = [
  {
    id: 1,
    nom: "Alami",
    prenom: "Ahmed",
    email: "ahmed.alami@email.com",
    role: "CLIENT",
    email_verified: true,
    phone_verified: false
  },
  {
    id: 2,
    nom: "Benali",
    prenom: "Fatima",
    email: "fatima.benali@email.com",
    role: "ADMIN",
    email_verified: true,
    phone_verified: true
  }
];

const mockCars = [
  {
    id: 1,
    brand: { name: "Dacia" },
    modele: "Logan",
    annee: 2022,
    couleur: "Blanc",
    prix_par_jour: 250,
    disponible: true,
    statut: "DISPONIBLE",
    ville: "Casablanca",
    images: [
      { image_url: "/images/dacia-logan.jpg", is_primary: true }
    ]
  },
  {
    id: 2,
    brand: { name: "Renault" },
    modele: "Clio",
    annee: 2023,
    couleur: "Rouge",
    prix_par_jour: 300,
    disponible: true,
    statut: "DISPONIBLE",
    ville: "Rabat",
    images: [
      { image_url: "/images/renault-clio.jpg", is_primary: true }
    ]
  }
];

const mockBookings = [
  {
    id: 1,
    user_id: 1,
    car_id: 1,
    date_debut: new Date('2024-01-15'),
    date_fin: new Date('2024-01-20'),
    prix_total: 1250,
    status: { name: "CONFIRMED" },
    car: mockCars[0],
    user: mockUsers[0]
  }
];

const mockLoyaltyAccount = {
  id: 1,
  user_id: 1,
  points_balance: 125,
  tier: {
    name: "Argent",
    discount_percent: 5
  }
};

// Mock functions
const getMockUsers = () => mockUsers;
const getMockCars = () => mockCars;
const getMockBookings = () => mockBookings;
const getMockLoyaltyAccount = (userId) => mockLoyaltyAccount;

const searchMockCars = (filters = {}) => {
  let results = [...mockCars];
  
  if (filters.ville) {
    results = results.filter(car => 
      car.ville.toLowerCase().includes(filters.ville.toLowerCase())
    );
  }
  
  if (filters.prix_max) {
    results = results.filter(car => car.prix_par_jour <= filters.prix_max);
  }
  
  return results;
};

const getMockCarById = (id) => {
  return mockCars.find(car => car.id === parseInt(id));
};

const createMockBooking = (bookingData) => {
  const newBooking = {
    id: mockBookings.length + 1,
    ...bookingData,
    status: { name: "PENDING" },
    date_creation: new Date()
  };
  mockBookings.push(newBooking);
  return newBooking;
};

module.exports = {
  getMockUsers,
  getMockCars,
  getMockBookings,
  getMockLoyaltyAccount,
  searchMockCars,
  getMockCarById,
  createMockBooking
};
