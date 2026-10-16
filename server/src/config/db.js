import mongoose from 'mongoose'

export async function connectDB(uri = process.env.MONGODB_URI) {
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  return mongoose.connection
}
