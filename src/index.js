import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import dayjs from "dayjs"

const app = express()
const data = dayjs()
const hour = data.format('HH:mm:ss')
app.use(cors())
app.use(express.json())
dotenv.config()

let db
let participants
let messages

const mongoClient = new MongoClient(process.env.DATABASE_URL)
mongoClient.connect()
    .then(() => {
        db = mongoClient.db()
        participants = db.collection("participants")
        messages = db.collection("messages")
    })
    .catch(() => console.log(err.message))

app.post("/participants", (req, res) => {

    const name = req.body.name

    participants.insertOne({
        nome: name,
        lastStatus: Date.now()
    })

    messages.insertOne(
        {
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: hour
        }
    )
    res.sendStatus(201)
})

app.get("/participants", async (req, res) => {

    const participants = []
    const cursor = await db.collection('participants').find({});
    await cursor.forEach((doc) => participants.push(doc));
    res.send(participants)
})


const PORT = 5000
app.listen(PORT, () => console.log(`server running on port ${PORT}`))