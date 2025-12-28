export const CATEGORIES = [
  { id: 1, name: "Sport", description: "Vitesse et Adrénaline" },
  { id: 2, name: "SUV", description: "Puissance et Confort" },
  { id: 3, name: "Luxe", description: "Prestige Absolu" },
  { id: 4, name: "Urbaine", description: "Agilité en Ville" },
];

export const PROMOS = [
  { id: 1, title: "Weekend Turbo", discount: "-25%", car: "Catégorie Sport" },
  { id: 2, title: "Offre Rabat-VIP", discount: "-15%", car: "Berlines Luxe" },
  { id: 3, title: "Fidélité Gold", discount: "-30%", car: "Toute la flotte" },
];

export const TOP_CARS = [
  { id: 1, name: "Range Rover Stealth", price: "1200", image: "/cars/1.jpg" },
  { id: 2, name: "Porsche Taycan S", price: "2500", image: "/cars/2.jpg" },
  { id: 3, name: "Audi RS6 Avant", price: "1800", image: "/cars/3.jpg" },
];

export const MOCK_CARS = [
  {
    id: 1, brandId: 1, categoryId: 1, modele: "Taycan S", transmission: "Automatique", nombre_places: 4, prix_par_jour: 2500,
    images: ["/cars/2.jpg"],
    brand: { name: "Porsche" }, category: { name: "Sport" },
    variantes: [{ id: 101, type_carburant: "Électrique", ville: "Casablanca" }]
  },
  {
    id: 2, brandId: 2, categoryId: 2, modele: "Evoque Stealth", transmission: "Automatique", nombre_places: 5, prix_par_jour: 1200,
    images: ["/cars/1.jpg"],
    brand: { name: "Range Rover" }, category: { name: "SUV" },
    variantes: [{ id: 102, type_carburant: "Diesel", ville: "Rabat" }]
  }
];

export const MOCK_USER_BOOKINGS = [
  {
    id: 1024,
    date_debut: "2024-12-28T10:00:00Z",
    date_fin: "2024-12-30T10:00:00Z",
    lieu_prise_en_charge: "Casablanca Aéroport",
    prix_total: 5000.0,
    status_name: "EN_ATTENTE",
    varianteCar: { car: { brand: { name: "Porsche" }, modele: "Taycan S", images: [{ image_url: "/cars/2.jpg" }] } },
    invoices: []
  }
];

