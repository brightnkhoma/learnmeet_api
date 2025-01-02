import { RtpCodecCapability, TransportListenInfo, WorkerLogTag } from 'mediasoup/node/lib/types'
import os from 'os'

export const config = {
    listenIp : "0.0.0.0",
    listenPort : 3016,

    mediasoup : {
        numWorkers : Object.keys(os.cpus()).length,
        woker : {
            rtcMinPot : 9000,
            rtMaxPort : 9100,
            logLevel : 'debug',
            logTags : [
                "info",
                'ice',
                'dtls',
                'rtp',
                'srtp',
                'rtcp'
            ] as WorkerLogTag[]
        },
        router : {
            mediaCodecs : [
                {
                    kind : "audio",
                    mimeType : "audio/opus",
                    clockRate : 48000,
                    channels : 2
                },
                {
                    kind : "video",
                    mimeType : "video/VP8",
                    clockRate : 90000,
                    parameters : {'x-google-start-bitrate' : 1000}
                }
            ] as RtpCodecCapability[],
            webRtcTransport : {
                listenIps : [
                    {
                        ip : '0.0.0.0',
                        announcedIp : "102.70.12.201"
                    }
                ] as TransportListenInfo[],
                maxIncomeBitrate : 1500000,
                initialAvailableOutgoingBitrate : 1000000
            }
        }
    }
} as const