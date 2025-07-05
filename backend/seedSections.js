import mongoose from 'mongoose';
import Section from './models/Section.js';

// Sample data for testing the new fare calculation system
const sampleSections = [
  // Normal category sections
  { sectionNumber: 1, fare: 40, category: 'normal', description: '1 section journey' },
  { sectionNumber: 2, fare: 55, category: 'normal', description: '2 sections journey' },
  { sectionNumber: 3, fare: 70, category: 'normal', description: '3 sections journey' },
  { sectionNumber: 4, fare: 85, category: 'normal', description: '4 sections journey' },
  { sectionNumber: 5, fare: 100, category: 'normal', description: '5 sections journey' },
  { sectionNumber: 6, fare: 115, category: 'normal', description: '6 sections journey' },
  { sectionNumber: 7, fare: 130, category: 'normal', description: '7 sections journey' },
  { sectionNumber: 8, fare: 145, category: 'normal', description: '8 sections journey' },

  // Semi-luxury category sections (1.3x multiplier)
  { sectionNumber: 1, fare: 52, category: 'semi-luxury', description: '1 section journey' },
  { sectionNumber: 2, fare: 72, category: 'semi-luxury', description: '2 sections journey' },
  { sectionNumber: 3, fare: 91, category: 'semi-luxury', description: '3 sections journey' },
  { sectionNumber: 4, fare: 111, category: 'semi-luxury', description: '4 sections journey' },
  { sectionNumber: 5, fare: 130, category: 'semi-luxury', description: '5 sections journey' },
  { sectionNumber: 6, fare: 150, category: 'semi-luxury', description: '6 sections journey' },
  { sectionNumber: 7, fare: 169, category: 'semi-luxury', description: '7 sections journey' },
  { sectionNumber: 8, fare: 189, category: 'semi-luxury', description: '8 sections journey' },

  // Luxury category sections (1.6x multiplier)
  { sectionNumber: 1, fare: 64, category: 'luxury', description: '1 section journey' },
  { sectionNumber: 2, fare: 88, category: 'luxury', description: '2 sections journey' },
  { sectionNumber: 3, fare: 112, category: 'luxury', description: '3 sections journey' },
  { sectionNumber: 4, fare: 136, category: 'luxury', description: '4 sections journey' },
  { sectionNumber: 5, fare: 160, category: 'luxury', description: '5 sections journey' },
  { sectionNumber: 6, fare: 184, category: 'luxury', description: '6 sections journey' },
  { sectionNumber: 7, fare: 208, category: 'luxury', description: '7 sections journey' },
  { sectionNumber: 8, fare: 232, category: 'luxury', description: '8 sections journey' },

  // Super-luxury category sections (2.0x multiplier)
  { sectionNumber: 1, fare: 80, category: 'super-luxury', description: '1 section journey' },
  { sectionNumber: 2, fare: 110, category: 'super-luxury', description: '2 sections journey' },
  { sectionNumber: 3, fare: 140, category: 'super-luxury', description: '3 sections journey' },
  { sectionNumber: 4, fare: 170, category: 'super-luxury', description: '4 sections journey' },
  { sectionNumber: 5, fare: 200, category: 'super-luxury', description: '5 sections journey' },
  { sectionNumber: 6, fare: 230, category: 'super-luxury', description: '6 sections journey' },
  { sectionNumber: 7, fare: 260, category: 'super-luxury', description: '7 sections journey' },
  { sectionNumber: 8, fare: 290, category: 'super-luxury', description: '8 sections journey' },
];

const seedSections = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/busticket');
    console.log('Connected to MongoDB');

    // Clear existing sections
    await Section.deleteMany({});
    console.log('Cleared existing sections');

    // Insert sample sections
    await Section.insertMany(sampleSections);
    console.log('Sample sections inserted successfully');

    console.log('✅ Section seeding completed!');
    
    // Test fare calculation examples
    console.log('\n📊 Fare calculation examples:');
    console.log('Normal bus, Section 2 to Section 8 (6 sections): ₹115');
    console.log('Luxury bus, Section 0 to Section 5 (5 sections): ₹160');
    console.log('Semi-luxury bus, Section 1 to Section 4 (3 sections): ₹91');
    
  } catch (error) {
    console.error('Error seeding sections:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedSections();
