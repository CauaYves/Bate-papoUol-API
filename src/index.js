import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"
import dayjs from "dayjs"

const app = express()   //variaveis
const data = dayjs()

app.use(cors())
app.use(express.json())
dotenv.config()
let userName

const mongoClient = new MongoClient(process.env.DATABASE_URL)   //conexão com o banco de dados
try {
    await mongoClient.connect()
    console.log("MongoDB connected!")
} catch (err) {
    console.log(err.message)
}

const db = mongoClient.db()     //coleções do banco
const participants = db.collection("participants")
const messages = db.collection("messages")


app.post("/participants", async (req, res) => {    //Rotas da API

    const { name } = req.body
    if (!name || !isNaN(name)) return res.sendStatus(422)

    try {

        const username = await participants.findOne({ name: name })
        if (username) return res.sendStatus(409)
        userName = name

        await participants.insertOne({
            name: name,
            lastStatus: Date.now()
        })

        await messages.insertOne({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: data.format('HH:mm:ss')
        })
        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }

})
app.get("/participants", async (req, res) => {

    try {

        const participantes = []
        const cursor = await participants.find({}).toArray();

        cursor.forEach((doc) => participantes.push(doc));
        res.send(participantes)

    } catch (err) {

        res.send(500).send(err.message)

    }


})
app.post("/messages", async (req, res) => {

    const { to, text, type } = req.body;
    const userName = req.headers.user;

    if (!to || !text || !userName || !type || (type !== "message" && type !== "status" && type !== "private_message")) {
        return res.sendStatus(422);
    }

    const userSearch = await participants.findOne({ name: userName });
    if (!userSearch) return res.sendStatus(422);

    try {
        await participants.findOne({ name: userName }, (err, foundUser) => {
            if (err) throw err;
            if (!foundUser) {
                return res.sendStatus(422);
            }
        });
        messages.insertOne({
            from: userName,
            to,
            text,
            type,
            time: data.format('HH:mm:ss'),
        });
        res.sendStatus(201);
    } catch (err) {
        res.status(500).send(err.message)

    }

});
app.get("/messages", async (req, res) => {
    const messagesArray = []
    const { user } = req.headers
    const { limit } = req.query

    if (!limit) {   //deve executar isso quando um limite não é especificado

        try {
            const cursorPartcipants = await participants.find({}).toArray()
            const cursorMsg = await messages.find({}).toArray()

            if (cursorMsg.length === 0 && cursorPartcipants.length > 0) {
                await messages.insertOne({
                    from: user,
                    to: "Todos",
                    text: "entra na sala...",
                    type: "status",
                    time: data.format('HH:mm:ss'),
                })
                res.sendStatus(200)
            }

            messagesArray.push(...cursorMsg.filter((doc) => {
                return doc.from === user || doc.to === "Todos" || doc.to === user || doc.type === "message";
            }));

            res.send(messagesArray);
        } catch (err) {
            res.status(500).send(err.message)
        }
    } else {    //isso é executado se houver um limite

        const msgLimit = Number(limit)

        if (!msgLimit || msgLimit <= 0) return res.sendStatus(422)

        try {
            const cursor = await messages.find({}).toArray();
            const messagesArray = []

            if (cursor.length === 0) res.sendStatus(422)

            for (let j = 0; j <= msgLimit - 1; j++) {
                const msg = cursor[j]

                if (msg.to === "Todos" || msg.from === user || msg.to === user || doc.type === "message") {
                    messagesArray.push(msg)
                }
            }

            res.send(messagesArray)
        } catch (err) {
            res.status(500).send(err.message)
        }

    }
})
app.post("/status", async (req, res) => {
    const userChat = req.headers.user
    if (!userChat) return res.sendStatus(404)

    try {
        const updateStatus = { $set: { lastStatus: Date.now() } }
        const result = await participants.findOneAndUpdate({ name: userChat }, updateStatus);
        if (!result.lastErrorObject.updatedExisting) return res.sendStatus(404)

        res.sendStatus(200)
    } catch (err) {
        res.status(500).send(err.message)
    }
})
function isOnline(search) {
    if (Date.now() - search.lastStatus > 10000) {
        return false
    }
    return true
}

async function killUsers() {
    const searchAllUser = await participants.find({}).toArray()
    for (const user of searchAllUser) {
        if (!isOnline(user)) {
            const id = user._id
            const filter = { _id: new ObjectId(id) }
            try {
                await participants.deleteOne(filter)
                await messages.insertOne({
                    from: userChat,
                    to: 'Todos',
                    text: 'sai da sala...',
                    type: 'status',
                    time: data.format('HH:mm:ss')
                })
            } catch (err) {
                console.log(err.message)
            }
        }
    }
}

setInterval(async () => await killUsers(), 15000)

const PORT = 5000
app.listen(PORT, () => console.log(`server running on port ${PORT}`))