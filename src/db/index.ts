import { DB as Database} from "nibble-db";
import { Client } from "./Client";

export class DB {
    async connect(){
        const db = await Database.create("default");
        await this.initCollections(db);
        return db;
    }

    private async initCollections(db: Database){
        await Client.init(db);
    }
}