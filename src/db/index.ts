import { DB as Database} from "nibble-db";
import { Client } from "./Client";
import { AppConfig } from "./AppConfig";

export class DB {
    async connect(){
        const db = await Database.create("default");
        await this.initCollections(db);
        return db;
    }

    private async initCollections(db: Database){
        await Client.init(db);
        await AppConfig.init(db);
    }
}