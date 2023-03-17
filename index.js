const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DATABASE}:${process.env.DB_PASS}@cluster0.dzz2hu7.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




async function run() {
    await client.connect()

    const tweetCollection = client.db('tweets-app').collection('tweets')
    const usersCollection = client.db('tweets-app').collection('users')
    const userInfoCollection = client.db('tweets-app').collection('Information')



    app.get('/user', async (req, res) => {
        const tweets = await usersCollection.find().toArray();
        res.send(tweets)

    })

    app.put('/user/:email', async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
            $set: user,
        };
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKKEN, { expiresIn: '1d' })
        res.send({ result, token });
    });

    app.put('/user/admin/:email', async (req, res) => {
        const email = req.params.email;
        const filter = { email: email };
        const updateDoc = {
            $set: { role: 'admin' },
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
    })

    app.post('/tweet', async (req, res) => {
        const tweet = req.body;
        const result = await tweetCollection.insertOne(tweet);
        res.send(result);
    })

    app.get('/tweets', async (req, res) => {
        const user = req.params.email
        console.log(user);
        const tweets = await tweetCollection.find().toArray();
        res.send(tweets)
    })

    app.get('/tweets/:email', async (req, res) => {
        const user = req.params.email
        console.log(user);

        const tweets = await tweetCollection.find({ email: user }).toArray();
        res.send(tweets)

    })




    app.put('/like/:id', async (req, res) => {

        try {
            const id = req.params.id;
            const email = req.body
            // console.log(email.email);
            const filterPost = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $push: { likes: email.email }
            }
            const result = await tweetCollection.updateOne(filterPost, updateDoc, options)
            console.log(result);
            res.send(result)


        } catch (error) {
            // console.log(error);
            res.end(500).send("Server Error")
        }
    })




    app.delete('/deleteTweet/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id)
        const filter = { _id: new ObjectId(id) }
        const result = await tweetCollection.deleteOne(filter)
        res.send(result)
    })

    app.get('/admin/:email', async (req, res) => {

        const email = req.params.email;
        const user = await usersCollection.findOne({ email: email })
        const isAdmin = user?.role === "admin"
        // console.log(isAdmin);
        res.send({ admin: isAdmin })

    })

    app.post('/userinfo', async (req, res) => {
        const userInfo = req.body;
        const query = { email: userInfo.email }
        const users = await userInfoCollection.findOne(query)
        if (!users) {
            const result = await userInfoCollection.insertOne(userInfo)
            return res.send({ success: true, info: result })
        }
        else {
            return;
        }

    })
    app.put('/user/:email', async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
            $set: user,
        };
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.send({ result });
    });

}



run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('Tweet is run')
})

app.listen(port, () => {
    console.log(`Tweet app run on ${port}`);
})
