
const mongoose=require('mongoose')  

const connectDB=async()=>
{
    try {
        await mongoose.connect(process.env.DB_URL)
        console.log('MongoDB Connected successfully')
    } catch (error) {
            console.error(error.message)   
            process.exit(1)
        }
}
export default connectDB