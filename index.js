const app = require('express')();
const port = process.env.PORT || 3001;
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const router = require('./router');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const cors = require('cors')
const socketsLogic = require('./services/sockets_logic.js');


mongoose.connect('mongodb://localhost/TetrisPlayers')

app.use(cors());
app.use(bodyParser.json({type: '*/*'}));
router(app);

require('./services/sockets_logic').socketHandler(io);



http.listen(port, () => console.log(`Listening on port ${port}`));
