import * as mediasoup from 'mediasoup';
import { config } from './mediasoup-config';
import { WebRtcTransport } from 'mediasoup/node/lib/WebRtcTransportTypes';
const createWorker = async() : Promise<mediasoup.types.Router<mediasoup.types.AppData>>=>{
    const {logLevel,rtMaxPort,rtcMinPot} = config.mediasoup.woker
    const {mediaCodecs} = config.mediasoup.router
    const worker = await mediasoup.createWorker({
        logLevel,
        rtcMaxPort : rtMaxPort,
        rtcMinPort : rtcMinPot,
        logTags : config.mediasoup.woker.logTags
    } as mediasoup.types.WorkerSettings<mediasoup.types.AppData>)
 
    worker.on('died', () => {
       console.error('MediaSoup worker has died');
     });

    const router = await worker.createRouter({
        mediaCodecs,
        
    })
    return router
}

const getRtpCodecCapability = (router : mediasoup.types.Router) : mediasoup.types.RtpCapabilities =>{
    const data = router.rtpCapabilities
    return data 
}

const createTransport = async (router : mediasoup.types.Router,onTransport : (data : TransportProps)=> void)  => {
     await router.createWebRtcTransport({
        listenIps : config.mediasoup.router.webRtcTransport.listenIps,
        enableTcp : true,
        preferUdp : true,
        enableUdp : true,

       
      }).then(transport=>{
     
                        onTransport({
                            trasport : transport,
                            params : {
                                id : transport!.id,
                                iceCandidates : transport.iceCandidates,
                                iceParameters : transport.iceParameters,
                                dtlsParameters : transport.dtlsParameters,
                                sctpParameters : transport.sctpParameters
                            }
                        })
    }).catch(error =>{
        console.log(error);
        
        
    })

    

    // return {
    //     transport : transport,
    //     params : {
    //         id : transport!.id,
    //         iceCandidates : transport.iceCandidates,
    //         iceParameters : transport.iceParameters,
    //         dtlsParameters : transport.dtlsParameters,
    //         sctpParameters : transport.sctpParameters
    //     }
    // }
}

const createProducer = async(router : mediasoup.types.Router)=>{
    const producer = await router
}

export interface TransportProps{
    trasport : mediasoup.types.Transport;
    params : any
}



export {createWorker,getRtpCodecCapability,createTransport}