import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

// Import models
import User from './models/User.js';
import BusRoute from './models/BusRoute.js';
import Stop from './models/Stop.js';
import Section from './models/Section.js';

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await BusRoute.deleteMany({});
    await Stop.deleteMany({});
    await Section.deleteMany({});
    
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'admin',
      email: 'admin@busticket.com',
      password: adminPassword,
      role: 'admin'
    });

    // Create bus owner
    const busOwnerPassword = await bcrypt.hash('owner123', 10);
    const busOwner = await User.create({
      username: 'busowner1',
      email: 'owner@busticket.com',
      password: busOwnerPassword,
      role: 'bus_owner',
      busOwnerDetails: {
        companyName: 'Sri Lanka Transport Company',
        licenseNumber: 'LIC-2024-001',
        contactNumber: '+94771234567',
        address: 'Colombo, Sri Lanka'
      }
    });

    // Create conductor
    const conductorPassword = await bcrypt.hash('conductor123', 10);
    
    // Create sample route: Embilipitiya to Heen Iluk Hinna
    const sampleRoute = await BusRoute.create({
      routeName: 'Embilipitiya - Heen Iluk Hinna',
      routeNumber: 'RT-001',
      startPoint: 'Embilipitiya',
      endPoint: 'Heen Iluk Hinna',
      distance: 45,
      estimatedDuration: 90, // 1.5 hours
      createdBy: busOwner._id
    });

    // Create conductor with route assignment
    const conductor = await User.create({
      username: 'conductor1',
      email: 'conductor@busticket.com',
      password: conductorPassword,
      role: 'conductor',
      conductorDetails: {
        employeeId: 'EMP-001',
        busNumber: 'BUS-101',
        routeId: sampleRoute._id
      }
    });

    // Create sections for all categories
    const baseSectionsData = [
      { sectionNumber: 1, fare: 27 },
      { sectionNumber: 2, fare: 35 },
      { sectionNumber: 3, fare: 45 },
      { sectionNumber: 4, fare: 55 },
      { sectionNumber: 5, fare: 66 },
      { sectionNumber: 6, fare: 76 },
      { sectionNumber: 7, fare: 86 },
      { sectionNumber: 8, fare: 90 },
      { sectionNumber: 9, fare: 97 },
      { sectionNumber: 10, fare: 104 },
      { sectionNumber: 11, fare: 111 },
      { sectionNumber: 12, fare: 116 },
      { sectionNumber: 13, fare: 123 },
      { sectionNumber: 14, fare: 130 },
      { sectionNumber: 15, fare: 135 },
      { sectionNumber: 16, fare: 140 },
      { sectionNumber: 17, fare: 147 },
      { sectionNumber: 18, fare: 152 },
      { sectionNumber: 19, fare: 159 },
      { sectionNumber: 20, fare: 166 },
      { sectionNumber: 21, fare: 171 },
      { sectionNumber: 22, fare: 176 },
      { sectionNumber: 23, fare: 183 },
      { sectionNumber: 24, fare: 189 },
      { sectionNumber: 25, fare: 195 },
      { sectionNumber: 26, fare: 201 },
      { sectionNumber: 27, fare: 208 },
      { sectionNumber: 28, fare: 213 },
      { sectionNumber: 29, fare: 220 },
      { sectionNumber: 30, fare: 227 },
      { sectionNumber: 31, fare: 232 }
    ];

    // Create sections for each category
    const categories = [
      { name: 'normal', multiplier: 1.0 },
      { name: 'semi-luxury', multiplier: 1.3 },
      { name: 'luxury', multiplier: 1.6 },
      { name: 'super-luxury', multiplier: 2.0 }
    ];

    for (const category of categories) {
      for (const sectionData of baseSectionsData) {
        const adjustedFare = Math.round(sectionData.fare * category.multiplier);
        await Section.create({
          sectionNumber: sectionData.sectionNumber,
          fare: adjustedFare,
          category: category.name,
          description: `Section ${sectionData.sectionNumber} - Rs. ${adjustedFare} (${category.name})`
        });
      }
    }

    // Create stops based on your data
    const stopsData = [
      { code: '00', stopName: 'Embilipitiya', sectionNumber: 0, fare: 27.00, order: 0 },
      { code: '01', stopName: 'Udagama', sectionNumber: 1, fare: 35.00, order: 1 },
      { code: '02', stopName: 'Sampathwatta', sectionNumber: 2, fare: 45.00, order: 2 },
      { code: '03', stopName: 'Thelbaduara', sectionNumber: 3, fare: 45.00, order: 3 },
      { code: '04', stopName: '2 Kanuwa', sectionNumber: 4, fare: 55.00, order: 4 },
      { code: '05', stopName: '3 Kanuwa', sectionNumber: 5, fare: 66.00, order: 5 },
      { code: '06', stopName: '5 Kanuwa', sectionNumber: 6, fare: 76.00, order: 6 },
      { code: '07', stopName: 'Panamura', sectionNumber: 7, fare: 86.00, order: 7 },
      { code: '08', stopName: 'Heen Iluk Hinna', sectionNumber: 8, fare: 90.00, order: 8 }
    ];

    for (const stopData of stopsData) {
      await Stop.create({
        ...stopData,
        routeId: sampleRoute._id
      });
    }

    console.log('Sample data created successfully!');
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Admin:');
    console.log('  Email: admin@busticket.com');
    console.log('  Password: admin123');
    console.log('\nBus Owner:');
    console.log('  Email: owner@busticket.com');
    console.log('  Password: owner123');
    console.log('\nConductor:');
    console.log('  Email: conductor@busticket.com');
    console.log('  Password: conductor123');
    console.log('\n=== ROUTE DETAILS ===');
    console.log(`Route ID: ${sampleRoute._id}`);
    console.log('Route: Embilipitiya - Heen Iluk Hinna');
    console.log('Stops created: 9 stops (Section 0-8)');
    console.log('Sections created: 124 sections (31 sections × 4 categories)');
    console.log('Categories: Normal, Semi-luxury, Luxury, Super-luxury');
    console.log('Fare range: Rs. 27 - Rs. 464 (varies by category)');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
