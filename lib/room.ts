import mediasoup from 'mediasoup'
interface Room{
    rooms : Session[];
    removeRoom : (id : string) => void;
    addRoom : (session : Session) => void;
    getRoom : (id : string) => Session
}

interface Session{
    id : string;
    worker : mediasoup.types.Worker;
    router : mediasoup.types.Router;
}

export class MediaRoom implements Room{
    rooms: Session[] = [] 
    removeRoom = (id: string) => {
        const exists = this.rooms.find(x=> x.id == id)
        if (!exists) return
        const index = this.rooms.indexOf(exists)
        this.rooms.splice(index,1)
        }
    addRoom = (session: Session) => {
        const exists = this.rooms.find(x=> x.id == session.id)
        if (exists) return
        this.rooms.push(session)
    }

    getRoom = (id: string) : Session => {
        const session : Session | undefined = this.rooms.find(room => room.id == id)
        if(session)
            return session
        return {} as Session
    }


}