import { Airport } from '@/types';

// ============================================================
// Airport Database — International airports
// ============================================================

export const AIRPORTS: Airport[] = [
  { code: 'DEL', city: 'New Delhi', country: 'India', name: 'Indira Gandhi International Airport' },
  { code: 'BOM', city: 'Mumbai', country: 'India', name: 'Chhatrapati Shivaji Maharaj International Airport' },
  { code: 'BLR', city: 'Bangalore', country: 'India', name: 'Kempegowda International Airport' },
  { code: 'MAA', city: 'Chennai', country: 'India', name: 'Chennai International Airport' },
  { code: 'CCU', city: 'Kolkata', country: 'India', name: 'Netaji Subhas Chandra Bose International Airport' },
  { code: 'HYD', city: 'Hyderabad', country: 'India', name: 'Rajiv Gandhi International Airport' },
  { code: 'DXB', city: 'Dubai', country: 'UAE', name: 'Dubai International Airport' },
  { code: 'LHR', city: 'London', country: 'United Kingdom', name: 'Heathrow Airport' },
  { code: 'JFK', city: 'New York', country: 'United States', name: 'John F. Kennedy International Airport' },
  { code: 'SIN', city: 'Singapore', country: 'Singapore', name: 'Changi Airport' },
  { code: 'SYD', city: 'Sydney', country: 'Australia', name: 'Sydney Kingsford Smith Airport' },
  { code: 'BKK', city: 'Bangkok', country: 'Thailand', name: 'Suvarnabhumi Airport' },
  { code: 'NRT', city: 'Tokyo', country: 'Japan', name: 'Narita International Airport' },
  { code: 'ICN', city: 'Seoul', country: 'South Korea', name: 'Incheon International Airport' },
  { code: 'CDG', city: 'Paris', country: 'France', name: 'Charles de Gaulle Airport' },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany', name: 'Frankfurt Airport' },
  { code: 'LAX', city: 'Los Angeles', country: 'United States', name: 'Los Angeles International Airport' },
  { code: 'ORD', city: 'Chicago', country: 'United States', name: 'O\'Hare International Airport' },
  { code: 'YYZ', city: 'Toronto', country: 'Canada', name: 'Toronto Pearson International Airport' },
  { code: 'MEL', city: 'Melbourne', country: 'Australia', name: 'Melbourne Airport' },
];

// ============================================================
// Nationality list for passenger forms
// ============================================================

export const NATIONALITIES = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Argentine',
  'Armenian', 'Australian', 'Austrian', 'Azerbaijani', 'Bahamian', 'Bahraini',
  'Bangladeshi', 'Barbadian', 'Belarusian', 'Belgian', 'Belizean', 'Beninese',
  'Bhutanese', 'Bolivian', 'Bosnian', 'Brazilian', 'British', 'Bruneian',
  'Bulgarian', 'Burkinabe', 'Burmese', 'Burundian', 'Cambodian', 'Cameroonian',
  'Canadian', 'Central African', 'Chadian', 'Chilean', 'Chinese', 'Colombian',
  'Comoran', 'Congolese', 'Costa Rican', 'Croatian', 'Cuban', 'Cypriot', 'Czech',
  'Danish', 'Djiboutian', 'Dominican', 'Dutch', 'Ecuadorian', 'Egyptian', 'Emirati',
  'Equatorial Guinean', 'Eritrean', 'Estonian', 'Ethiopian', 'Fijian', 'Filipino',
  'Finnish', 'French', 'Gabonese', 'Gambian', 'Georgian', 'German', 'Ghanaian',
  'Greek', 'Grenadian', 'Guatemalan', 'Guinean', 'Guyanese', 'Haitian', 'Honduran',
  'Hungarian', 'Icelandic', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish',
  'Israeli', 'Italian', 'Ivorian', 'Jamaican', 'Japanese', 'Jordanian', 'Kazakh',
  'Kenyan', 'Kuwaiti', 'Kyrgyz', 'Lao', 'Latvian', 'Lebanese', 'Liberian', 'Libyan',
  'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malagasy', 'Malawian', 'Malaysian',
  'Maldivian', 'Malian', 'Maltese', 'Mauritanian', 'Mauritian', 'Mexican',
  'Moldovan', 'Monacan', 'Mongolian', 'Montenegrin', 'Moroccan', 'Mozambican',
  'Namibian', 'Nepalese', 'New Zealand', 'Nicaraguan', 'Nigerian', 'North Korean',
  'Norwegian', 'Omani', 'Pakistani', 'Panamanian', 'Paraguayan', 'Peruvian',
  'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Rwandan', 'Saudi',
  'Senegalese', 'Serbian', 'Sierra Leonean', 'Singaporean', 'Slovak', 'Slovenian',
  'Somali', 'South African', 'South Korean', 'Spanish', 'Sri Lankan', 'Sudanese',
  'Surinamese', 'Swedish', 'Swiss', 'Syrian', 'Taiwanese', 'Tajik', 'Tanzanian',
  'Thai', 'Togolese', 'Trinidadian', 'Tunisian', 'Turkish', 'Turkmen', 'Ugandan',
  'Ukrainian', 'Uruguayan', 'Uzbek', 'Venezuelan', 'Vietnamese', 'Yemeni',
  'Zambian', 'Zimbabwean',
];

// ============================================================
// Seat configuration
// ============================================================

export const SEAT_CONFIG = {
  first: {
    rows: [1, 2],
    seats: ['A', 'B', 'E', 'F'],
    label: 'First Class',
    color: 'from-amber-500 to-yellow-400',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/40',
  },
  business: {
    rows: [3, 4, 5, 6, 7],
    seats: ['A', 'B', 'C', 'D', 'E', 'F'],
    label: 'Business Class',
    color: 'from-violet-500 to-purple-400',
    bgColor: 'bg-violet-500/20',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/40',
  },
  economy: {
    rows: Array.from({ length: 18 }, (_, i) => i + 8),
    seats: ['A', 'B', 'C', 'D', 'E', 'F'],
    label: 'Economy Class',
    color: 'from-sky-500 to-cyan-400',
    bgColor: 'bg-sky-500/20',
    textColor: 'text-sky-400',
    borderColor: 'border-sky-500/40',
  },
} as const;

// ============================================================
// Airlines
// ============================================================

export const AIRLINES: Record<string, { name: string; logo: string }> = {
  'SkyWing Airlines': { name: 'SkyWing Airlines', logo: '✈️' },
  'Atlas Airways': { name: 'Atlas Airways', logo: '🌐' },
  'Horizon Air': { name: 'Horizon Air', logo: '🌅' },
  'Zenith Airlines': { name: 'Zenith Airlines', logo: '⭐' },
};

// ============================================================
// Status config
// ============================================================

export const BOOKING_STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmed',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    icon: '✓',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-500/20 text-red-400 border-red-500/40',
    icon: '✕',
  },
  rescheduled: {
    label: 'Rescheduled',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    icon: '↻',
  },
} as const;
