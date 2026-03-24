require("dotenv").config()
const app = require('./src/app')
const connectToDb = require('./src/config/db')

;(async () => {
    await connectToDb()
    app.listen(3000, () => {
        console.log("running at 3000")
    })
})();