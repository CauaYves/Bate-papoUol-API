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

        await participants.insertOne({
            name: name,
            lastStatus: Date.now()
        })

        await messages.insertOne({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: hour
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
            time: hour,
        });
        res.sendStatus(201);
    } catch (err) {
        res.status(500).send(err.message)

    }

});

app.get("/messages", async (req, res) => {
    const messagesArray = [];
    const userName = req.headers.user;

    try {
        const cursor = await messages.find({}).toArray();

        messagesArray.push(...cursor.filter((doc) => {
            return doc.from === userName || doc.to === "Todos" || doc.to === userName;
        }));

        res.send(messagesArray);
    } catch (err) {
        res.status(500).send(err.message)
    }


});

app.post("/status/:id", async (req, res) => {
    
    const user = req.headers.user
    
    if (!user) return res.sendStatus(404)

    try {
        const filter = { name: user }
        const updateStatus = { $set: { lastStatus: Date.now() } }
        const result = await participants.findOneAndUpdate(filter, updateStatus);
        
        if(!result.lastErrorObject.updatedExisting) return res.sendStatus(404)

        res.sendStatus(200)
    } catch (err) {
        res.status(500).send(err.message)
    }

})

const PORT = 5000
app.listen(PORT, () => console.log(`server running on port ${PORT}`))