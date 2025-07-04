const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const BusRoute = require('./models/BusRoute');
const Stop = require('./models/Stop');
const Section = require('./models/Section');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
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

    // Create sections based on your data
    const sectionsData = [
      { sectionNumber: 1, fare: 27 },
      { sectionNumber: 2, fare: 35 },
      { sectionNumber: 3, fare: 45 },
      { sectionNumber: 4, fare: 55 },
      { sectionNumber: 5, fare: 66 },
      { sectionNumber: 6, fare: 76 },
      { sectionNumber: 7, fare: 86 },
      { sectionNumber: 8, fare: 90 }
    ];

    for (const sectionData of sectionsData) {
      await Section.create({
        ...sectionData,
        routeId: sampleRoute._id,
        description: `Section ${sectionData.sectionNumber} - Rs. ${sectionData.fare}`
      });
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
    console.log('Sections created: 8 sections with fares');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
