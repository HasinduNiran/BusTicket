import mongoose from 'mongoose';
import RouteSection from './models/RouteSection.js';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bus_ticket';

const testFareCalculation = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test 1: Check RouteSection data for normal category
    console.log('\n=== Testing RouteSection Data ===');
    
    const routeSections = await RouteSection.find({ 
      category: 'normal',
      isActive: true 
    }).sort({ sectionNumber: 1 }).limit(10);

    console.log(`Found ${routeSections.length} route sections for normal category:`);
    routeSections.forEach(section => {
      console.log(`Section ${section.sectionNumber}: ${section.stopName} - Fare: Rs.${section.fare}`);
    });

    // Test 2: Calculate fare between sections
    if (routeSections.length >= 2) {
      const fromSection = routeSections[0];
      const toSection = routeSections[routeSections.length - 1];
      const calculatedFare = Math.abs(toSection.fare - fromSection.fare);
      const sectionCount = Math.abs(toSection.sectionNumber - fromSection.sectionNumber);
      
      console.log(`\n=== Fare Calculation Test ===`);
      console.log(`From: Section ${fromSection.sectionNumber} (${fromSection.stopName}) - Fare: Rs.${fromSection.fare}`);
      console.log(`To: Section ${toSection.sectionNumber} (${toSection.stopName}) - Fare: Rs.${toSection.fare}`);
      console.log(`Section Count: ${sectionCount}`);
      console.log(`Calculated Fare: Rs.${calculatedFare}`);
    }

    // Test 3: Check categories available
    console.log('\n=== Available Categories ===');
    const categories = await RouteSection.distinct('category');
    console.log('Categories:', categories);

    for (const category of categories) {
      const count = await RouteSection.countDocuments({ category, isActive: true });
      console.log(`${category}: ${count} sections`);
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

testFareCalculation();
