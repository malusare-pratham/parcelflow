/**
 * Seed script – creates demo admin, driver, and customer accounts
 * Run: node seed.js
 */

require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./models/User')
const DriverProfile = require('./models/DriverProfile')
const Trip = require('./models/Trip')

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('🌱 Connected to MongoDB')

  // Clear existing seed data
  await User.deleteMany({ phone: { $in: ['0000000000', '9999900000', '8888800000'] } })
  console.log('🗑️  Cleared old seed data')

  // Admin
  const admin = await User.create({
    name: 'Super Admin',
    phone: '0000000000',
    password: 'admin123',
    role: 'admin',
    isVerified: true,
  })
  console.log(`✅ Admin created: phone=0000000000 / password=admin123`)

  // Driver
  const driver = await User.create({
    name: 'Ravi Kumar',
    phone: '9999900000',
    password: 'driver123',
    role: 'driver',
    isVerified: true,
  })
  await DriverProfile.create({
    userId: driver._id,
    vehicleNumber: 'MH12AB1234',
    vehicleType: 'van',
    verificationStatus: 'approved',
  })
  // Create a sample approved trip
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  await Trip.create({
    driverId: driver._id,
    from: 'Pune',
    to: 'Mumbai',
    pickupLocation: 'Swargate, Pune',
    dropLocation: 'Dadar, Mumbai',
    date: tomorrow,
    time: '09:00',
    arrivalTime: '12:00',
    capacity: 100,
    availableSlots: 100,
    pricePerKg: 250,
    // backward-compat
    pricePerSlot: 250,
    status: 'approved',
    notes: 'Express route via expressway. Fragile items handled carefully.',
  })
  console.log(`✅ Driver created: phone=9999900000 / password=driver123`)

  // Customer
  await User.create({
    name: 'Priya Sharma',
    phone: '8888800000',
    password: 'customer123',
    role: 'customer',
  })
  console.log(`✅ Customer created: phone=8888800000 / password=customer123`)

  console.log('\n🚀 Seed complete! You can now login with the above credentials.')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
