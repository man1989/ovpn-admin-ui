import { DB } from "nibble-db"
// import { DB } from "nibble-db";

type ClientType = {
    id: string,
    name: string,
    status?: string,
    expiryDate?: string,
    issuedDate?: string,
    revokedAt?: string,
    certPath?: string
}


export class Client {
    private static _dbCollection =  {} as any;
    private _data: ClientType & {_id?: string};

    constructor(data: ClientType){
        this._data = data;
    }

    async save(){
        if(this._data._id) {
            await Client._dbCollection.update({ id: this._data.id }, this._data);    
        } else {
            await Client._dbCollection.insert(this._data);
        }
    }

    static async init(db: DB) {
        this._dbCollection = await db.useCollection<ClientType>("client");
    }

    static async add(client: ClientType){
        await this._dbCollection.insert(client)
    }

    static async removeById(clientId: Pick<ClientType, "id">) {
        await this._dbCollection.delete({id: clientId})
    }

    static async update(client: Partial<ClientType>){
        await this._dbCollection.update(client, client);
    }

    static async findById(id: ClientType["id"]) {
        const results = await this._dbCollection.find({ id })
        if(results && Array.isArray(results) && results.length) {
            return results[0]
        }
        return null;
    }

    static async findByName(name: ClientType["name"]): Promise<ClientType | null> {
        const results = await this._dbCollection.find({ name: name })
        if(results && Array.isArray(results) && results.length) {
            return results[0]
        }
        return null;
    }


    static async find(query: any) {
        const results = await this._dbCollection.find(query);
        if(results && Array.isArray(results) && results.length) {
            return results.map((data)=> new Client(data))
        }
        return [];
    }

    async toJSON(){
        return this._data;
    }
}