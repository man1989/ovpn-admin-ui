import { DB } from "nibble-db"

type Config = {
    name: string,
    value: string
}


export class AppConfig {
    private static _dbCollection =  {} as any;
    private _data: Config & {_id?: string};

    constructor(data: Config){
        this._data = data;
    }

    async save(){
        if(this._data._id) {
            await AppConfig._dbCollection.update({ name: DataView.name }, this._data);    
        } else {
            await AppConfig._dbCollection.insert(this._data);
        }
    }

    static async init(db: DB) {
        this._dbCollection = await db.useCollection<Config>("app_config");
    }

    static async add(client: Config){
        await this._dbCollection.insert(client)
    }

    static async removeByName(name: Pick<Config, "name">) {
        await this._dbCollection.delete({name: name})
    }

    static async update(client: Partial<Config>){
        await this._dbCollection.update(client, client);
    }


    static async findByName(name: Config["name"]): Promise<string | null> {
        const results = await this._dbCollection.find({ name: name })
        if(results && Array.isArray(results) && results.length) {
            return results[0].value;
        }
        return null;
    }

    static async find(query: any) {
        const results = await this._dbCollection.find(query);
        if(results && Array.isArray(results) && results.length) {
            return results.map((data)=> new AppConfig(data))
        }
        return [];
    }

    async toJSON(){
        return this._data;
    }
}