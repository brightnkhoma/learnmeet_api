import express from 'express'
import http from 'http'
import socketIo, { Socket } from 'socket.io'
import mediasoup from 'mediasoup'
import { createTransport, createWorker } from './lib/mediasoup_api';
import cors from 'cors'


const app = express();
const corsOptions = {
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST'],       
  allowedHeaders: ['Content-Type', 'Authorization'], 
};

app.use(cors(corsOptions));

const server = http.createServer(app);
// @ts-ignore
const io = socketIo(server,{cors : corsOptions});


let mediasoupRouter : mediasoup.types.Router;
let mediasoupTransport : mediasoup.types.Transport;
let receiveTransport : mediasoup.types.Transport;
let producer : mediasoup.types.Producer;
let consumer : mediasoup.types.Consumer


// (async () => {
//    mediasoupRouter = await createWorker();
//   })();
  const initializeMediasoup = async () => {
    try {
      mediasoupRouter = await createWorker();
      console.log('Mediasoup worker and router initialized');
    } catch (error) {
      console.error('Failed to initialize mediasoup', error);
    }
  };
  (async()=>{
    await initializeMediasoup()
  })()
  // initializeMediasoup();
// MediaSoup server setup
// const mediasoupServer = require('./mediasoup-config');

// Express server setup
// app.use(express.static('public'));

io.on('connection', (socket : Socket) => {
    console.log('New client connected');

    socket.on("request-for-rtp-capabilities",({type,data},callback)=>{
      try {
        const response = {type,data :{routerRtpCapabilities : mediasoupRouter.rtpCapabilities}}
        callback(response)        
      } catch (error) {
        callback({type,data: {error}})        
      }
    })


    socket.on("request-for-create-send-transpot",async({type,data},callback)=>{
      try {
        await createTransport(mediasoupRouter,(transport)=>{
          mediasoupTransport = transport.trasport
          const response = {type,data : transport.params}
          callback(response)   
        })
             
      } catch (error) {
        console.log(error);
        
        callback({type,data: {error}})        
      }
    })
    socket.on("dtlsparameters",async(data,callback)=>{
      try {
        console.log(JSON.stringify(data));
        
        const dtlsparameters = data
        console.log("these are parameters");
        
        console.log(JSON.stringify(dtlsparameters));
        
        await mediasoupTransport.connect(dtlsparameters)
        callback()
        console.log("producing");
        
      } catch (error) {
        console.log(error);
        callback({error})
        
        
      }
    })

    socket.on('produce-data', async (data, callback) => {
      try {
          // Extract the parameters sent by the client
          const {
              transportId,
              sctpStreamParameters,
              label,
              protocol,
              appData,
          } = data;
  
          // Find the transport by ID
          // const transport = transports.get(transportId); // Assuming you maintain a `transports` map
          // if (!transport) throw new Error('Transport not found');
  
          // Create a DataProducer on the transport
          const dataProducer = await mediasoupTransport.produceData({
              sctpStreamParameters,
              label,
              protocol,
              appData,
          });
  
          // Return the producer ID to the client
          callback({ id: dataProducer.id });
  
          console.log(`DataProducer created: ${dataProducer.id}`);
      } catch (error : any) {
          console.error('Error creating DataProducer:', error);
          callback({ error: error.message });
      }
  });
    // socket.on("receiveTransport-dtlsparameters",async(data,callback)=>{
    //   try {
    //     console.log(JSON.stringify(data));
        
    //     const dtlsparameters = data.dtlsParameters
    //     console.log("dtlsParameters for receive transport");
    //     console.log(JSON.stringify({dtlsparameters}));
        
        
    //     await receiveTransport.connect({dtlsparameters})
    //     callback()
    //     console.log("consume - dtlspatarameters");
        
    //   } catch (error) {
    //     console.log(error);
    //     callback({error})
        
        
    //   }
    // })
    socket.on("receiveTransport-dtlsparameters", async (data, callback) => {
      try {
        console.log("Received data:", JSON.stringify(data));
    
        const dtlsParameters = data.dtlsParameters;
    
        console.log("dtlsParameters for receive transport:");
        console.log(JSON.stringify(dtlsParameters));
    
        await receiveTransport.connect({ dtlsParameters });
    
        callback({ success: true });
        console.log("Transport connected successfully.");
      } catch (error : any) {
        console.error("Error connecting transport:", error);
        callback({ error: error.message });
      }
    });
    
    socket.on("request-for-create-receive-transport",async(data,callback)=>{
       createTransport(mediasoupRouter,(transport)=>{
        receiveTransport = transport.trasport
        const response = {type :"",data : transport.params}
        callback(response)
       })
       
    })

    socket.on("produce", async (data, callback) => {
      try {
        // Create a producer on the server-side using the details sent by the client
        console.log("standimggggggggg");
        console.log(JSON.stringify(data));
        
        const {kind,rtpParameters,appData} = data
        
         await mediasoupTransport.produce({ kind, rtpParameters,appData }).then(myproducer=>{
            producer = myproducer
            console.log('Producer created on server');
            console.log(JSON.stringify(producer));
            
      
            // Respond to the client, confirming producer creation
            callback({type : "producer id",data :  { producerId: producer.id }});
         })
        
        // Store producer by its ID or any other necessary logic
       
      } catch (error : any) {
        console.error('Error creating producer on server:', error);
        callback({ success: false, error: error.message });
      }
    });

    socket.on("start-consuming",async(data,callback)=>{      
     if(!mediasoupRouter.canConsume({
      producerId : data.producerId,
      rtpCapabilities : data.rtpCapabilities
     })){
      console.log("can not consume");
      return
      

     }
     consumer =await receiveTransport.consume({
      producerId : data.producerId,
      rtpCapabilities : data.rtpCapabilities,
      paused : producer.kind == "video"
     })
     console.log("can consume");
     

      const response = {
        id : consumer.id,
        producerId : producer.id,
        kind : consumer.kind, 
        rtpParameters : consumer.rtpParameters,
        type : consumer.type,
        producerPaused : consumer.producerPaused
      }
      
      callback(response)
      socket.on("consume-resume", async () => {
        await consumer.resume();
        console.log("Consumer resumed");
      });
      console.log("consuming");
      
    })

    

   

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

//   const createWebRtcTransport = async (router) => {
//     const transport = await router.createWebRtcTransport({
//       listenIps: [{ ip: '0.0.0.0', announcedIp: 'http:localhost:3000' }],
//       enableUdp: true,
//       enableTcp: true,
//       preferUdp: true,
//     });

//     transport.on('dtlsstatechange', dtlsState => {
//       if (dtlsState === 'closed') {
//         transport.close();
//       }
//     });

//     transport.on('close', () => {
//       console.log('Transport closed');
//     });

//     return transport;
//   };

server.listen(4000, () => {
  console.log('Server is running on port 4000');
});