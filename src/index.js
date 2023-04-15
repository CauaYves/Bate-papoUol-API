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
    // { from: 'xxx', to: 'Todos', text: 'entra na sala...', type: 'status', time: 'HH:mm:ss' }
    res.sendStatus(201)
})

app.get("/participants", async (req, res) => {
    const participantes = []
    const cursor = await participants.find({});
    cursor.forEach((doc) => participantes.push(doc));
    res.send(participantes)
})

app.post("/messages", async (req, res) => {
    const { to, text, type } = req.body;
    const userName = req.headers.user;

    await participants.findOne({ name: userName }, (err, foundUser) => {
        if (err) throw err;
        if (!foundUser) {
            return res.sendStatus(422);
        }
    });

    if (!to || !text || !userName || !type || (type !== "message" && type !== "status" && type !== "private_message")) {
        return res.sendStatus(422);
    }

    const userSearch = await participants.findOne({ name: userName });
    if (!userSearch) return res.sendStatus(422);

    messages.insertOne({
        from: userName,
        to,
        text,
        type,
        time: hour,
    });
    res.sendStatus(201);
});

app.get("/messages", async (req, res) => {
    const messagesArray = [];
    const userName = req.headers.user;

    const cursor = await messages.find({}).toArray();

    messagesArray.push(...cursor.filter((doc) => {
        return doc.from === userName || doc.to === "Todos" || doc.to === userName;
    }));

    res.send(messagesArray);
});


app.post("/status", (req, res) => {

    const user = req.headers.user

    res.send(user)
})

const PORT = 5000
app.listen(PORT, () => console.log(`server running on port ${PORT}`))