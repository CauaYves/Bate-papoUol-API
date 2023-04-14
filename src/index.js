import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import dayjs from "dayjs"

const app = express()   //variaveis
const data = dayjs()
const hour = data.format('HH:mm:ss')

app.use(cors())
app.use(express.json())
dotenv.config()

let db
let participants
let messages

const mongoClient = new MongoClient(process.env.DATABASE_URL)   //conexão com o banco de dados
mongoClient.connect()
    .then(() => {
        db = mongoClient.db()
        participants = db.collection("participants")
        messages = db.collection("messages")
    })
    .catch(() => console.log(err.message))

app.post("/participants", async (req, res) => {    //Rotas da API

    const { name } = req.body

    if (!name || !isNaN(name)) return res.sendStatus(422)

    const username = await participants.findOne({ name: name })

    if (username) return res.sendStatus(409)

    participants.insertOne({
        name: name,
        lastStatus: Date.now()
    })

    messages.insertOne({
        from: name,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: hour
    })
    res.sendStatus(201)
})

app.get("/participants", async (req, res) => {
    const participantes = []
    const cursor = await participants.find({});
    await cursor.forEach((doc) => participantes.push(doc));
    res.send(participantes)
})

app.post("/messages",async (req, res) => {

    const { to, text, type, user } = req.body
    const userSearch = await participants.find({name: user})
    if(!userSearch) return res.sendStatus(422)
    if (!to || !text || !type || !user ) return res.sendStatus(422)

        messages.insertOne({
            from: req.headers.user, //achar o usuario que mandou a mensagem pelo headers
            to,
            text,
            type,
            time: hour,
        })
    res.sendStatus(201)

})

app.get("/messages", async (req, res) => {

    const cursor = await db.collection('messages').find({})
    const messages = []
    const user = req.headers.user
    const { from, to } = doc

    await cursor.forEach((doc) => {
        if (from === user || to === "Todos" || to === user) {
            messages.push(doc)
        }
    })

    res.send(messages)

})

app.post("/status", (req, res) => {

    const user = req.headers.user


    res.send(user)
})

const PORT = 5000
app.listen(PORT, () => console.log(`server running on port ${PORT}`))