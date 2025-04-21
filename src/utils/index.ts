import { stat } from "fs/promises"

export async function pathExists(filePath: string) {
    try {
        await stat(filePath)
        return true
    }catch(err) {
        return false
    }
}
